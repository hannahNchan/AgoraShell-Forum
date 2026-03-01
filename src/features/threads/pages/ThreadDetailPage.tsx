import { useCodeCollapse } from '../../../hooks/useCodeCollapse'
import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Star, Clock, Smile, Send, Trash2, MessageCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import EmojiPicker from 'emoji-picker-react'
import { selectProfile } from '../../auth/store/authSelectors'
import { type AppDispatch, type RootState } from '../../../store'
import { incrementRepliesCount, fetchTopicById, toggleStar, decrementRepliesCount } from '../store/threadsSlice'
import { fetchRepliesByTopic, createReply, toggleReaction, groupReactions, addReplyRealtime, deleteReply, deleteReplyRealtime } from '../../posts/store/postsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { useRole } from '../../auth/hooks/useRole'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import { type Reply } from '../../../types'
import { useConfirm } from '../../../hooks/useConfirm'
import { useHighlightCode } from '../../../hooks/useHighlightCode'

const Avatar = ({ profile, size = 'md' }: { profile: any; size?: 'sm' | 'md' }) => {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${s} rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold overflow-hidden`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        profile?.username?.charAt(0).toUpperCase() || '?'
      )}
    </div>
  )
}

interface ReplyCardProps {
  reply: Reply
  topicId: string
  depth?: number
}

const ReplyCard = ({ reply, topicId, depth = 0 }: ReplyCardProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator, isBanned } = useRole()
  const canDelete = isModerator || profile?.id === reply.author_id
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReplyEditor, setShowReplyEditor] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const linesRef = useRef<any[]>([])
  const replyContentRef = useRef<HTMLDivElement>(null)
  useHighlightCode(replyContentRef)
  useCodeCollapse(replyContentRef)
  const { confirm } = useConfirm()

  const reactionGroups = groupReactions(reply.reactions || [], user?.id)

  const scrollHandlerRef = useRef<(() => void) | null>(null)

  const handleReposition = () => {
    const timers = [50, 100, 200, 350].map((delay) =>
      setTimeout(() => {
        linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
      }, delay)
    )
    repositionTimersRef.current = timers
  }
  window.addEventListener('reply-editor-toggle', handleReposition)
  const repositionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])


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
              path: 'grid',
              startSocket: 'bottom',
              endSocket: 'left',
              color: '#cbd5e1',
              size: 2,
              startPlug: 'behind',
              endPlug: 'arrow2',
            })
            linesRef.current.push(line)
          } catch (_) { }
        })

        const handleScroll = () => {
          linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
        }
        scrollHandlerRef.current = handleScroll
        window.addEventListener('scroll', handleScroll, true)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current, true)
      }
      window.removeEventListener('reply-editor-toggle', handleReposition)
      repositionTimersRef.current.forEach(clearTimeout)
      linesRef.current.forEach((l) => { try { l.remove() } catch (_) { } })
      linesRef.current = []
    }
  }, [reply.children?.length, reply.id])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [reply.children?.length])

  const handleReaction = (emoji: string) => {
    if (!isAuthenticated) return
    dispatch(toggleReaction({ replyId: reply.id, emoji }))
    setShowEmojiPicker(false)
  }

  const handleSubmitReply = async () => {
    if (!replyContent || replyContent === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createReply({ topicId, content: replyContent, parentId: reply.id })).unwrap()
      setReplyContent('')
      setShowReplyEditor(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async () => {
    const ok = await confirm('Eliminar respuesta', '¿Seguro que quieres eliminar esta respuesta?')
    if (!ok) return
    dispatch(deleteReply({ replyId: reply.id, topicId }))
  }

  const isNested = depth > 0

  return (
    <div ref={containerRef} className={isNested ? 'relative pl-5' : ''}>
      <div className="flex items-start gap-3">
        <div id={`avatar-${reply.id}`} style={{ flexShrink: 0 }}>
          <Avatar profile={reply.author} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-800">{reply.author?.username}</span>
              {reply.author?.role && reply.author.role !== 'user' && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium capitalize">
                  {reply.author.role}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={11} />
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>

            <div
              ref={replyContentRef}
              className="prose prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: reply.content }}
            />

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {reactionGroups.map((group) => (
                <button
                  key={group.emoji}
                  onClick={() => handleReaction(group.emoji)}
                  title={`${group.count} reacciones`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${group.reacted
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <span>{group.emoji}</span>
                  <span className="text-xs font-medium">{group.count}</span>
                </button>
              ))}

              {isAuthenticated && !isBanned && (
                <button
                  onClick={() => {
                    const next = !showReplyEditor
                    setShowReplyEditor(next)
                    window.dispatchEvent(new CustomEvent('reply-editor-toggle'))
                  }}
                  className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-300 transition-colors text-xs"
                >
                  <MessageCircle size={13} />
                  <span>Responder</span>
                </button>
              )}

              {canDelete && isAuthenticated && (
                <button
                  onClick={handleDeleteReply}
                  className="hover:cursor-pointer ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                  title="Eliminar respuesta"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-sm"
                  >
                    <Smile size={13} />
                    <span className="text-xs">+</span>
                  </button>
                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                      <div className="absolute bottom-8 left-0 z-20 shadow-xl rounded-xl overflow-hidden">
                        <EmojiPicker
                          onEmojiClick={(e) => handleReaction(e.emoji)}
                          width={300}
                          height={350}
                          searchDisabled
                          skinTonesDisabled
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {showReplyEditor && (
            <div className="mt-2 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <RichTextEditor
                onChange={setReplyContent}
                placeholder={`Respondiendo a ${reply.author?.username}...`}
                minHeight="100px"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowReplyEditor(false); setReplyContent('') }}
                  className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={submitting || !replyContent || replyContent === '<p></p>'}
                  className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Spinner size="sm" /> : <Send size={13} />}
                  Responder
                </button>
              </div>
            </div>
          )}

          {reply.children && reply.children.length > 0 && (
            <div className="mt-2 space-y-2">
              {reply.children.map((child) => (
                <ReplyCard key={child.id} reply={child} topicId={topicId} depth={depth + 1} />
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
  const { isBanned } = useRole()
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const topicContentRef = useRef<HTMLDivElement>(null)
  useHighlightCode(topicContentRef)
  useCodeCollapse(topicContentRef)
  const topic = useSelector((state: RootState) => state.topics.currentTopic)
  const topicLoading = useSelector((state: RootState) => state.topics.loading)
  const replies = useSelector((state: RootState) => state.posts.items)
  const repliesLoading = useSelector((state: RootState) => state.posts.loading)

  useEffect(() => {
    if (!topicId) return
    dispatch(fetchTopicById(topicId))
    dispatch(fetchRepliesByTopic(topicId))

    const channel = supabase
      .channel(`replies:${topicId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
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
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
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

  if (topicLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!topic) return <div className="text-center py-16 text-slate-400">Tema no encontrado</div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <Avatar profile={topic.author} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{topic.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-medium text-slate-500">{topic.author?.username}</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {format(new Date(topic.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
              </span>
            </div>
          </div>

          <button
            onClick={handleStar}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${topic.is_starred
              ? 'bg-amber-50 border-amber-300 text-amber-600'
              : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500'
              } disabled:cursor-not-allowed`}
          >
            <Star size={15} fill={topic.is_starred ? 'currentColor' : 'none'} />
            <span className="font-medium">{topic.stars_count}</span>
          </button>
        </div>

        <div
          ref={topicContentRef}
          className="prose prose-sm max-w-none mt-5 text-slate-700"
          dangerouslySetInnerHTML={{ __html: topic.content }}
        />
      </div>

      <div className="flex items-center gap-2 text-slate-500 pt-2 text-sm font-medium">
        {topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}
      </div>

      {repliesLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} topicId={topicId!} depth={0} />
          ))}
          {replies.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nadie ha respondido todavía. ¡Sé el primero!
            </div>
          )}
        </div>
      )}

      {isAuthenticated ? (
        isBanned ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center text-sm text-red-500">
            Tu cuenta ha sido suspendida y no puedes publicar contenido.
          </div>
        ) : (
          <form onSubmit={handleSubmitReply} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Agregar respuesta</h3>
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
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-500">
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Inicia sesión</Link> para responder
        </div>
      )}
    </div>
  )
}

export default ThreadDetailPage
