import { useCodeCollapse } from '../../../hooks/useCodeCollapse'
import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Star, Clock, Smile, Send, Trash2, MessageCircle, X, Pencil, Check, Tag as TagIcon, Lock, LockOpen } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmojiPicker from 'emoji-picker-react'
import { selectProfile } from '../../auth/store/authSelectors'
import { type AppDispatch, type RootState } from '../../../store'
import { incrementRepliesCount, fetchTopicById, toggleStar, decrementRepliesCount, updateTopic, closeTopic } from '../store/threadsSlice'
import { fetchRepliesByTopic, createReply, toggleReaction, groupReactions, addReplyRealtime, deleteReply, deleteReplyRealtime, updateReply } from '../../posts/store/postsSlice'
import { fetchSettings } from '../../tags/store/tagsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { useRole } from '../../auth/hooks/useRole'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import TagInput from '../../tags/components/TagInput'
import { type Reply, type Tag } from '../../../types'
import { useConfirm } from '../../../hooks/useConfirm'
import { useHighlightCode } from '../../../hooks/useHighlightCode'

const Avatar = ({ profile, size = 'md' }: { profile: any; size?: 'sm' | 'md' }) => {
  const s = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm'
  return (
    <div className={`${s} rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold overflow-hidden`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        profile?.username?.charAt(0).toUpperCase() || '?'
      )}
    </div>
  )
}

interface ReplyBottomSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (content: string) => Promise<void>
  replyingTo: string
  submitting: boolean
}

const ReplyBottomSheet = ({ open, onClose, onSubmit, replyingTo, submitting }: ReplyBottomSheetProps) => {
  const [content, setContent] = useState('')

  useEffect(() => { if (!open) setContent('') }, [open])
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Respondiendo a <span className="text-indigo-600 dark:text-indigo-400">@{replyingTo}</span>
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          <RichTextEditor onChange={setContent} placeholder={`Respondiendo a ${replyingTo}...`} minHeight="140px" />
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(content)}
            disabled={submitting || !content || content === '<p></p>'}
            className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? <Spinner size="sm" /> : <Send size={13} />}
            Responder
          </button>
        </div>
      </div>
    </>
  )
}

interface ReplyCardProps {
  reply: Reply
  topicId: string
  topicClosed: boolean
  depth?: number
}

const ReplyCard = ({ reply, topicId, topicClosed, depth = 0 }: ReplyCardProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator, isBanned } = useRole()
  const canDelete = isModerator || profile?.id === reply.author_id
  const canEdit = profile?.id === reply.author_id
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReplyEditor, setShowReplyEditor] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const linesRef = useRef<any[]>([])
  const replyContentRef = useRef<HTMLDivElement>(null)
  useHighlightCode(replyContentRef)
  useCodeCollapse(replyContentRef)
  const { confirm } = useConfirm()

  const reactionGroups = groupReactions(reply.reactions || [], user?.id)
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const repositionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleReposition = () => {
    const timers = [50, 100, 200, 350].map((delay) =>
      setTimeout(() => { linesRef.current.forEach((l) => { try { l.position() } catch (_) { } }) }, delay)
    )
    repositionTimersRef.current = timers
  }
  window.addEventListener('reply-editor-toggle', handleReposition)

  useEffect(() => {
    if (!reply.children?.length) return
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        linesRef.current.forEach((l) => { try { l.remove() } catch (_) { } })
        linesRef.current = []
        const LL = (window as any).LeaderLine
        const parentEl = document.getElementById(`avatar-${reply.id}`)
        if (!parentEl || !LL) return
        reply.children!.forEach((child) => {
          const childEl = document.getElementById(`avatar-${child.id}`)
          if (!childEl) return
          try {
            const line = new LL(parentEl, childEl, {
              path: 'grid', startSocket: 'bottom', endSocket: 'left',
              color: '#cbd5e1', size: 1, startPlug: 'behind', endPlug: 'arrow2', endSocketGravity: 8,
            })
            linesRef.current.push(line)
          } catch (_) { }
        })
        const handleScroll = () => { linesRef.current.forEach((l) => { try { l.position() } catch (_) { } }) }
        scrollHandlerRef.current = handleScroll
        window.addEventListener('scroll', handleScroll, true)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      if (scrollHandlerRef.current) window.removeEventListener('scroll', scrollHandlerRef.current, true)
      window.removeEventListener('reply-editor-toggle', handleReposition)
      repositionTimersRef.current.forEach(clearTimeout)
      linesRef.current.forEach((l) => { try { l.remove() } catch (_) { } })
      linesRef.current = []
    }
  }, [reply.children?.length, reply.id])

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => { linesRef.current.forEach((l) => { try { l.position() } catch (_) { } }) })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [reply.children?.length])

  const handleReaction = (emoji: string) => {
    if (!isAuthenticated) return
    dispatch(toggleReaction({ replyId: reply.id, emoji }))
    setShowEmojiPicker(false)
  }

  const handleReplyClick = () => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setShowBottomSheet(true)
    } else {
      setShowReplyEditor(!showReplyEditor)
      window.dispatchEvent(new CustomEvent('reply-editor-toggle'))
    }
  }

  const handleSubmitReply = async (content: string) => {
    if (!content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createReply({ topicId, content, parentId: reply.id })).unwrap()
      setReplyContent('')
      setShowReplyEditor(false)
      setShowBottomSheet(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async () => {
    const ok = await confirm('Eliminar respuesta', '¿Seguro que quieres eliminar esta respuesta?')
    if (!ok) return
    dispatch(deleteReply({ replyId: reply.id, topicId }))
  }

  const handleSaveEdit = async () => {
    if (!editContent || editContent === '<p></p>') return
    setSavingEdit(true)
    try {
      await dispatch(updateReply({ replyId: reply.id, content: editContent })).unwrap()
      setIsEditing(false)
      setEditContent('')
    } finally {
      setSavingEdit(false)
    }
  }

  const wasEdited = reply.updated_at && reply.updated_at !== reply.created_at

  return (
    <div ref={containerRef} className={depth > 0 ? 'relative pl-0 md:pl-5' : ''}>
      <div className="flex items-start gap-1">
        <div id={`avatar-${reply.id}`} style={{ flexShrink: 0 }}>
          <Avatar profile={reply.author} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-600 border border-slate-100 dark:border-slate-600 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{reply.author?.username}</span>
              {reply.author?.role && reply.author.role !== 'user' && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium capitalize">
                  {reply.author.role}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={11} />
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: es })}
              </span>
              {wasEdited && <span className="text-xs text-slate-300 dark:text-slate-600 italic">editado</span>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <RichTextEditor
                  key={`edit-reply-${reply.id}`}
                  onChange={setEditContent}
                  content={reply.content}
                  placeholder="Edita tu respuesta..."
                  minHeight="100px"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent('') }}
                    className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editContent || editContent === '<p></p>'}
                    className="hover:cursor-pointer flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? <Spinner size="sm" /> : <Check size={13} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div ref={replyContentRef} className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: reply.content }} />
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {reactionGroups.map((group) => (
                  <button
                    key={group.emoji}
                    onClick={() => handleReaction(group.emoji)}
                    title={`${group.count} reacciones`}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${group.reacted
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                  >
                    <span>{group.emoji}</span>
                    <span className="text-xs font-medium">{group.count}</span>
                  </button>
                ))}

                {isAuthenticated && !isBanned && !topicClosed && (
                  <button
                    onClick={handleReplyClick}
                    className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:bg-slate-700 dark:border-slate-800 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-500 hover:border-indigo-300 transition-colors text-xs"
                  >
                    <MessageCircle size={13} />
                    <span>Responder</span>
                  </button>
                )}

                {canEdit && isAuthenticated && !isBanned && (
                  <button
                    onClick={() => { setEditContent(reply.content); setIsEditing(true) }}
                    className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:bg-slate-700 dark:border-slate-800 text-slate-400 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-500 hover:border-indigo-300 transition-colors text-xs"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                )}

                {canDelete && isAuthenticated && (
                  <button
                    onClick={handleDeleteReply}
                    className="hover:cursor-pointer ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                {isAuthenticated && (
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-900 text-slate-400 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-100 transition-colors text-sm"
                    >
                      <Smile size={13} />
                      <span className="text-xs">+</span>
                    </button>
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-8 left-0 z-20 shadow-xl rounded-xl overflow-hidden">
                          <EmojiPicker onEmojiClick={(e) => handleReaction(e.emoji)} width={300} height={350} searchDisabled skinTonesDisabled />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {showReplyEditor && (
            <div className="mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <RichTextEditor onChange={setReplyContent} placeholder={`Respondiendo a ${reply.author?.username}...`} minHeight="100px" />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowReplyEditor(false); setReplyContent('') }}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors hover:cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSubmitReply(replyContent)}
                  disabled={submitting || !replyContent || replyContent === '<p></p>'}
                  className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Spinner size="sm" /> : <Send size={13} />}
                  Responder
                </button>
              </div>
            </div>
          )}

          <ReplyBottomSheet
            open={showBottomSheet}
            onClose={() => setShowBottomSheet(false)}
            onSubmit={handleSubmitReply}
            replyingTo={reply.author?.username || ''}
            submitting={submitting}
          />

          {reply.children && reply.children.length > 0 && (
            <div className="mt-4 space-y-2">
              {reply.children.map((child) => (
                <ReplyCard key={child.id} reply={child} topicId={topicId} topicClosed={topicClosed} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ThreadDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const { isBanned, isModerator } = useRole()
  const profile = useSelector(selectProfile)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditingTopic, setIsEditingTopic] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState<Tag[]>([])
  const [savingTopicEdit, setSavingTopicEdit] = useState(false)
  const topicContentRef = useRef<HTMLDivElement>(null)
  useHighlightCode(topicContentRef)
  useCodeCollapse(topicContentRef)
  const topic = useSelector((state: RootState) => state.topics.currentTopic)
  const topicLoading = useSelector((state: RootState) => state.topics.loading)
  const replies = useSelector((state: RootState) => state.posts.items)
  const repliesLoading = useSelector((state: RootState) => state.posts.loading)
  const maxTags = useSelector((state: RootState) => state.tags.settings?.max_tags_per_topic ?? 3)

  const canEditTopic = topic && profile?.id === topic.author_id
  const isClosed = topic?.is_closed ?? false

  useEffect(() => { dispatch(fetchSettings()) }, [dispatch])

  useEffect(() => {
    if (!topicId) return
    dispatch(fetchTopicById(topicId))
    dispatch(fetchRepliesByTopic(topicId))

    const channel = supabase
      .channel(`replies:${topicId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
        async (payload) => {
          const { data } = await supabase
            .from('replies')
            .select('*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            dispatch(addReplyRealtime(data as Reply))
            dispatch(incrementRepliesCount(topicId!))
          }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
        (payload) => {
          dispatch(deleteReplyRealtime(payload.old.id))
          dispatch(decrementRepliesCount(topicId!))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [topicId, dispatch])

  const handleStar = () => {
    if (!isAuthenticated || !topic) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: topic.is_starred ?? false }))
  }

  const handleClose = () => {
    if (!topic) return
    dispatch(closeTopic({ topicId: topic.id, isClosed: isClosed }))
  }

  const handleStartEditTopic = () => {
    if (!topic) return
    setEditTitle(topic.title)
    setEditContent(topic.content)
    setEditTags(topic.tags || [])
    setIsEditingTopic(true)
  }

  const handleSaveTopicEdit = async () => {
    if (!topic || !editTitle.trim() || !editContent || editContent === '<p></p>') return
    setSavingTopicEdit(true)
    try {
      await dispatch(updateTopic({
        topicId: topic.id,
        title: editTitle.trim(),
        content: editContent,
        tagIds: editTags.map((t) => t.id),
      })).unwrap()
      setIsEditingTopic(false)
    } finally {
      setSavingTopicEdit(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent || replyContent === '<p></p>' || !topicId) return
    setSubmitting(true)
    try {
      await dispatch(createReply({ topicId, content: replyContent })).unwrap()
      setReplyContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const topicWasEdited = topic && topic.updated_at && topic.updated_at !== topic.created_at

  if (topicLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!topic) return <div className="text-center py-16 text-slate-400">Tema no encontrado</div>

  return (
    <div className="space-y-4">
      <div className={`bg-white dark:bg-slate-800 rounded-xl border p-6 ${isClosed ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-700'}`}>
        {isClosed && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <Lock size={13} className="text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Este tema está cerrado — no se aceptan más respuestas</span>
            {isModerator && (
              <button
                onClick={handleClose}
                className="hover:cursor-pointer ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <LockOpen size={13} />
                Reabrir
              </button>
            )}
          </div>
        )}

        <div className="flex items-start gap-4">
          <Avatar profile={topic.author} size="md" />
          <div className="flex-1 min-w-0">
            {isEditingTopic ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{topic.title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-medium text-slate-500 dark:text-slate-400">{topic.author?.username}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {format(new Date(topic.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
              </span>
              {topicWasEdited && <span className="italic text-slate-300 dark:text-slate-600">editado</span>}
            </div>

            {!isEditingTopic && topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topic.tags.map((tag: Tag) => (
                  <Link
                    key={tag.id}
                    to={`/tags/${tag.slug}`}
                    className="hover:cursor-pointer inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
                  >
                    <TagIcon size={10} />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isModerator && isAuthenticated && !isEditingTopic && (
              <button
                onClick={handleClose}
                title={isClosed ? 'Reabrir tema' : 'Cerrar tema'}
                className={`hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${isClosed
                  ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-300 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {isClosed ? <LockOpen size={14} /> : <Lock size={14} />}
                <span className="hidden sm:inline">{isClosed ? 'Reabrir' : 'Cerrar'}</span>
              </button>
            )}
            {canEditTopic && isAuthenticated && !isBanned && !isEditingTopic && (
              <button
                onClick={handleStartEditTopic}
                className="hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <button
              onClick={handleStar}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${topic.is_starred
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-amber-300 hover:text-amber-500'
                } disabled:cursor-not-allowed`}
            >
              <Star size={15} fill={topic.is_starred ? 'currentColor' : 'none'} />
              <span className="font-medium">{topic.stars_count}</span>
            </button>
          </div>
        </div>

        {isEditingTopic ? (
          <div className="mt-4 space-y-3">
            <RichTextEditor
              key="edit-topic"
              onChange={setEditContent}
              content={topic.content}
              placeholder="Edita el contenido del tema..."
              minHeight="200px"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
              <TagInput selected={editTags} onChange={setEditTags} maxTags={maxTags} />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingTopic(false)}
                className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTopicEdit}
                disabled={savingTopicEdit || !editTitle.trim() || !editContent || editContent === '<p></p>'}
                className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingTopicEdit ? <Spinner size="sm" /> : <Check size={14} />}
                Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          <div ref={topicContentRef} className="prose prose-sm max-w-none mt-5 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: topic.content }} />
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 pt-2 text-sm font-medium">
        {topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}
      </div>

      {repliesLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} topicId={topicId!} topicClosed={isClosed} depth={0} />
          ))}
          {replies.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nadie ha respondido todavía. ¡Sé el primero!</div>
          )}
        </div>
      )}

      {isClosed ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-center flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Lock size={15} className="text-slate-400" />
          Este tema está cerrado y no acepta más respuestas.
        </div>
      ) : isAuthenticated ? (
        isBanned ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-5 text-center text-sm text-red-500 dark:text-red-400">
            Tu cuenta ha sido suspendida y no puedes publicar contenido.
          </div>
        ) : (
          <form onSubmit={handleSubmitReply} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agregar respuesta</h3>
            <RichTextEditor
              key={submitting ? 'submitting' : 'idle'}
              onChange={setReplyContent}
              placeholder="Escribe tu respuesta..."
              minHeight="120px"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !replyContent || replyContent === '<p></p>'}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <Spinner size="sm" /> : <Send size={14} />}
                Responder
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Inicia sesión</Link> para responder
        </div>
      )}
    </div>
  )
}

export default ThreadDetailPage
