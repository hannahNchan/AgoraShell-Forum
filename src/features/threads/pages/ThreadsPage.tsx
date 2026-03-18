import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Star, MessageSquare, Clock, X, ChevronDown, ChevronUp, Trash2, Pencil, Check, Tag as TagIcon, Pin, PinOff, Lock, LockOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch, type RootState } from '../../../store'
import { useRole } from '../../auth/hooks/useRole'
import { selectProfile } from '../../auth/store/authSelectors'
import { fetchTopicsByChannel, fetchMoreTopics, createTopic, toggleStar, setRepliesCount, deleteTopic, updateTopic, pinTopic, closeTopic } from '../store/threadsSlice'
import { fetchSettings } from '../../tags/store/tagsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import TagInput from '../../tags/components/TagInput'
import { supabase } from '../../../services/supabase'
import { useConfirm } from '../../../hooks/useConfirm'
import { type Tag } from '../../../types'

const CreateTopicModal = ({ channelId, onClose, maxTags }: { channelId: string; onClose: () => void; maxTags: number }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createTopic({
        channel_id: channelId,
        title: title.trim(),
        content,
        tagIds: selectedTags.map((t) => t.id),
      })).unwrap()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-10 pb-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Nuevo tema</h3>
          <button onClick={onClose} className="hover:cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Sobre qué quieres hablar?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
            <RichTextEditor
              onChange={setContent}
              placeholder="Escribe el contenido de tu tema..."
              minHeight="200px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <TagInput selected={selectedTags} onChange={setSelectedTags} maxTags={maxTags} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:cursor-pointer"
            >
              {submitting ? <Spinner size="sm" /> : 'Publicar tema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditTopicModalProps {
  topic: any
  onClose: () => void
  maxTags: number
}

const EditTopicModal = ({ topic, onClose, maxTags }: EditTopicModalProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [title, setTitle] = useState(topic.title)
  const [content, setContent] = useState(topic.content)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(topic.tags || [])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(updateTopic({
        topicId: topic.id,
        title: title.trim(),
        content,
        tagIds: selectedTags.map((t) => t.id),
      })).unwrap()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-10 pb-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Editar tema</h3>
          <button onClick={onClose} className="hover:cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Sobre qué quieres hablar?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
            <RichTextEditor
              key={`edit-${topic.id}`}
              onChange={setContent}
              content={topic.content}
              placeholder="Edita el contenido de tu tema..."
              minHeight="200px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
            <TagInput selected={selectedTags} onChange={setSelectedTags} maxTags={maxTags} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:cursor-pointer"
            >
              {submitting ? <Spinner size="sm" /> : (
                <>
                  <Check size={15} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TopicCard = ({ topic, maxTags }: { topic: any; maxTags: number }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator, isBanned } = useRole()
  const canDelete = isModerator || profile?.id === topic.author_id
  const canEdit = profile?.id === topic.author_id
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { confirm } = useConfirm()

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: topic.is_starred }))
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!expanded && !fetched) {
      setLoadingReplies(true)
      const { data } = await supabase
        .from('replies')
        .select('id, content, created_at, author:profiles(username, avatar_url)')
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: true })
        .limit(5)
      setReplies(data || [])
      setFetched(true)
      setLoadingReplies(false)
    }
    setExpanded(!expanded)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await confirm('Eliminar tema', '¿Eliminar este tema? Esta acción no se puede deshacer.')
    if (!ok) return
    dispatch(deleteTopic(topic.id))
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowEditModal(true)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(closeTopic({ topicId: topic.id, isClosed: topic.is_closed }))
  }

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(pinTopic({ topicId: topic.id, isPinned: topic.is_pinned }))
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const wasEdited = topic.updated_at && topic.updated_at !== topic.created_at

  return (
    <>
      <div className={`rounded-xl border hover:shadow-sm transition-all overflow-hidden ${topic.is_pinned
        ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900'
        : topic.is_closed
          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700'
        }`}>
        {topic.is_pinned && (
          <div className="flex items-center gap-1.5 px-5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <Pin size={11} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Tema fijado</span>
          </div>
        )}
        {topic.is_closed && (
          <div className="flex items-center gap-1.5 px-5 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <Lock size={11} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tema cerrado — no se aceptan más respuestas</span>
          </div>
        )}

        <div className="flex items-start gap-4 p-5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0 overflow-hidden">
            {topic.author?.avatar_url ? (
              <img src={topic.author.avatar_url} alt="" className="w-9 h-9 object-cover" />
            ) : (
              topic.author?.username?.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:w-full">


            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-end md:items-center gap-3 -mt-2 mb-2 md:mt-1 text-xs text-slate-400 order-first md:order-2">
                <span className="font-medium text-slate-500 dark:text-slate-400">{topic.author?.username}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
                </span>
                {wasEdited && <span className="italic text-slate-300 dark:text-slate-600">editado</span>}
              </div>
              <Link
                to={`topics/${topic.id}`}
                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight block order-2 md:order-first"
              >
                {topic.title}
              </Link>
              {topic.tags && topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 order-3">
                  {topic.tags.map((tag: Tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:cursor-pointer inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                      <TagIcon size={9} />
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-start md:items-center gap-2 md:gap-4 text-slate-400 shrink-0 md:self-stretch md:justify-between">
              <div className="flex flex-row gap-4 self-end">
                <button
                  onClick={handleStar}
                  className={`hover:cursor-pointer flex items-center gap-1 text-xs transition-colors ${topic.is_starred ? 'text-amber-500' : 'hover:text-amber-500'}`}
                >
                  <Star size={14} fill={topic.is_starred ? 'currentColor' : 'none'} />
                  <span>{topic.stars_count}</span>
                </button>
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <MessageSquare size={14} />
                  <span>{topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isModerator && isAuthenticated && (
                  <button
                    onClick={handleClose}
                    title={topic.is_closed ? 'Reabrir tema' : 'Cerrar tema'}
                    className={`hover:cursor-pointer px-2 py-1 rounded-sm flex items-center gap-1 text-xs transition-colors ${topic.is_closed
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                  >
                    {topic.is_closed ? <LockOpen size={14} /> : <Lock size={14} />}
                    {topic.is_closed ? 'Reabrir' : 'Cerrar'}
                  </button>
                )}
                {isModerator && isAuthenticated && (
                  <button
                    onClick={handlePin}
                    title={topic.is_pinned ? 'Desfijar tema' : 'Fijar tema'}
                    className={`hover:cursor-pointer px-2 py-1 rounded-sm flex items-center gap-1 text-xs transition-colors ${topic.is_pinned
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                  >
                    {topic.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {topic.is_pinned ? 'Desfijar' : 'Fijar'}
                  </button>
                )}
                {canEdit && isAuthenticated && !isBanned && (
                  <button
                    onClick={handleEditClick}
                    className="hover:cursor-pointer px-2 py-1 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                )}
                {canDelete && isAuthenticated && (
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 rounded-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 hover:cursor-pointer flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {topic.replies_count > 0 && (
          <button
            onClick={handleToggle}
            className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium hover:cursor-pointer border-t transition-colors ${expanded
              ? 'border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
              : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Ocultar respuestas' : `Previsualizar ${topic.replies_count === 1 ? 'respuesta' : 'respuestas'}`}
          </button>
        )}

        {expanded && (
          <div className="border-t border-slate-100 dark:border-slate-700 ml-[52px] mr-4 mb-4">
            {loadingReplies ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Sin respuestas aún.</p>
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5 pt-3 pb-2">
                  <div className="flex -space-x-2">
                    {replies
                      .filter((r: any, idx: number, arr: any[]) =>
                        arr.findIndex((x: any) => x.author?.username === r.author?.username) === idx
                      )
                      .slice(0, 4)
                      .map((r: any) => (
                        <div
                          key={r.author?.username}
                          className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] overflow-hidden shrink-0"
                        >
                          {r.author?.avatar_url ? (
                            <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            r.author?.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                  </div>
                  <span className="text-xs text-slate-400 ml-1">
                    {topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </div>
                <div className="space-y-2 pb-2">
                  {replies.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] overflow-hidden mt-0.5">
                        {r.author?.avatar_url ? (
                          <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          r.author?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{r.author?.username} </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {stripHtml(r.content).slice(0, 80)}{stripHtml(r.content).length > 80 ? '…' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {topic.replies_count > 5 && (
                  <Link
                    to={`topics/${topic.id}`}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline pb-2 block"
                  >
                    Ver las {topic.replies_count - 5} respuestas restantes →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTopicModal topic={topic} onClose={() => setShowEditModal(false)} maxTags={maxTags} />
      )}
    </>
  )
}

export const ThreadsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const { isBanned } = useRole()
  const [showCreate, setShowCreate] = useState(false)
  const [channelTags, setChannelTags] = useState<Tag[]>([])
  const [activeTags, setActiveTags] = useState<Tag[]>([])
  const pageRef = useRef(1)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  const { items: topics, loading, loadingMore, hasMore } = useSelector((state: RootState) => state.topics)
  const maxTags = useSelector((state: RootState) => state.tags.settings?.max_tags_per_topic ?? 3)
  const currentChannel = useSelector((state: RootState) =>
    state.channels.items.find((c) => c.id === channelId)
  )

  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (!channelId) return
    const loadChannelTags = async () => {
      const { data } = await supabase
        .from('topic_tags')
        .select('tag:tags(*)')
        .in('topic_id',
          (await supabase.from('topics').select('id').eq('channel_id', channelId)).data?.map((t: any) => t.id) || []
        )
      const unique = new Map<string, Tag>()
        ; (data || []).forEach((row: any) => {
          if (row.tag) unique.set(row.tag.id, row.tag)
        })
      setChannelTags(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name)))
    }
    loadChannelTags()
  }, [channelId])

  useEffect(() => {
    if (!channelId) return

    const slugs = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const resolved = slugs.map((s) => channelTags.find((t) => t.slug === s)).filter(Boolean) as Tag[]
    setActiveTags(resolved)
    pageRef.current = 1

    const runFetch = async () => {
      if (resolved.length === 0) {
        dispatch(fetchTopicsByChannel({ channelId }))
        return
      }
      if (resolved.length === 1) {
        dispatch(fetchTopicsByChannel({ channelId, tagId: resolved[0].id }))
        return
      }
      const sets = await Promise.all(
        resolved.map(async (tag) => {
          const { data } = await supabase.from('topic_tags').select('topic_id').eq('tag_id', tag.id)
          return new Set((data || []).map((r: any) => r.topic_id as string))
        })
      )
      const intersection = [...sets[0]].filter((id) => sets.every((s) => s.has(id)))
      dispatch(fetchTopicsByChannel({ channelId, tagIds: intersection }))
    }

    runFetch()

    const realtimeChannel = supabase
      .channel(`replies-count:${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' },
        async (payload) => {
          const topicId = payload.new.topic_id
          const { data } = await supabase.from('topics').select('replies_count').eq('id', topicId).single()
          if (data) dispatch(setRepliesCount({ topicId, count: data.replies_count }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(realtimeChannel) }
  }, [channelId, searchParams, channelTags, dispatch])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const scrollRoot = document.getElementById('main-scroll')
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !loadingMoreRef.current && hasMoreRef.current && channelId) {
          const tagId = activeTags.length === 1 ? activeTags[0].id : undefined
          dispatch(fetchMoreTopics({ channelId, page: pageRef.current, tagId }))
          pageRef.current += 1
        }
      },
      { root: scrollRoot, threshold: 0.1 }
    )
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [channelId, activeTags, dispatch])

  const handleTagFilter = (tag: Tag) => {
    const isActive = activeTags.some((t) => t.id === tag.id)
    const next = isActive ? activeTags.filter((t) => t.id !== tag.id) : [...activeTags, tag]
    if (next.length === 0) {
      setSearchParams({})
    } else {
      setSearchParams({ tags: next.map((t) => t.slug).join(',') })
    }
  }

  const pinnedTopics = topics.filter((t) => t.is_pinned)
  const normalTopics = topics.filter((t) => !t.is_pinned)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentChannel?.icon}</span>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentChannel?.name || 'Canal'}</h1>
          </div>
          {currentChannel?.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{currentChannel.description}</p>
          )}
        </div>
        {isAuthenticated && !isBanned && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex hover:cursor-pointer items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Nuevo tema
          </button>
        )}
      </div>

      {channelTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <TagIcon size={12} />
            Filtrar:
          </span>
          {channelTags.map((tag) => {
            const isActive = activeTags.some((t) => t.id === tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => handleTagFilter(tag)}
                className={`hover:cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  }`}
              >
                <TagIcon size={9} />
                {tag.name}
                {isActive && <X size={11} className="ml-0.5" />}
              </button>
            )
          })}
          {activeTags.length > 0 && (
            <button
              onClick={() => setSearchParams({})}
              className="hover:cursor-pointer text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {activeTags.length > 0
              ? `No hay temas con ${activeTags.length === 1 ? `el tag "${activeTags[0].name}"` : 'esos tags'}`
              : 'Nadie ha publicado aún'}
          </p>
          {isAuthenticated && !isBanned && activeTags.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-indigo-600 text-sm font-medium hover:underline hover:cursor-pointer"
            >
              Sé el primero en publicar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {pinnedTopics.length > 0 && (
            <>
              {pinnedTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} maxTags={maxTags} />
              ))}
              {normalTopics.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Todos los temas</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
            </>
          )}
          {normalTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} maxTags={maxTags} />
          ))}
        </div>
      )}

      <div ref={loaderRef} className="flex flex-col items-center py-3 gap-3">
        {loadingMore && (
          <>
            <img src="/images/big_logo.svg" alt="Cargando" className="w-64 animate-pulse" />
            <span className="text-base text-slate-400">Cargando más temas...</span>
          </>
        )}
        {!hasMore && topics.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <img src="/images/big_logo.svg" alt="" className="w-10 h-10 opacity-20" />
            <span className="text-xs text-slate-400">No hay más temas</span>
          </div>
        )}
      </div>

      {showCreate && channelId && (
        <CreateTopicModal channelId={channelId} onClose={() => setShowCreate(false)} maxTags={maxTags} />
      )}
    </div>
  )
}

export default ThreadsPage
