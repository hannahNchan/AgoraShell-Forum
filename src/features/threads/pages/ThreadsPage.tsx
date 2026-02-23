import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, Star, MessageSquare, Clock, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchTopicsByChannel, createTopic, toggleStar, setRepliesCount } from '../store/threadsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import { supabase } from '../../../services/supabase'

const CreateTopicModal = ({ channelId, onClose }: { channelId: string; onClose: () => void }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createTopic({ channel_id: channelId, title: title.trim(), content })).unwrap()
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : 'Publicar tema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TopicCard = ({ topic }: { topic: any }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [fetched, setFetched] = useState(false)

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

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0 overflow-hidden">
          {topic.author?.avatar_url ? (
            <img src={topic.author.avatar_url} alt="" className="w-9 h-9 object-cover" />
          ) : (
            topic.author?.username?.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <Link
            to={`topics/${topic.id}`}
            className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors leading-tight block"
          >
            {topic.title}
          </Link>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            <span className="font-medium text-slate-500">{topic.author?.username}</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 flex-shrink-0">
          <button
            onClick={handleStar}
            className={`flex items-center gap-1 text-xs transition-colors ${topic.is_starred ? 'text-amber-500' : 'hover:text-amber-500'}`}
          >
            <Star size={14} fill={topic.is_starred ? 'currentColor' : 'none'} />
            <span>{topic.stars_count}</span>
          </button>

          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare size={14} />
            <span>{topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}</span>
          </span>
        </div>
      </div>

      {topic.replies_count > 0 && (
        <button
          onClick={handleToggle}
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium hover:cursor-pointer border-t transition-colors ${expanded
            ? 'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Ocultar respuestas' : `Previsualizar ${topic.replies_count === 1 ? 'respuesta' : 'respuestas'}`}
        </button>
      )}

      {expanded && (
        <div className="border-t border-slate-100 ml-[52px] mr-4 mb-4">
          {loadingReplies ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Sin respuestas aún.</p>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
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
                        className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-700 font-semibold text-[10px] overflow-hidden flex-shrink-0"
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
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-[10px] overflow-hidden mt-0.5">
                      {r.author?.avatar_url ? (
                        <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        r.author?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-600">{r.author?.username} </span>
                      <span className="text-xs text-slate-400">
                        {stripHtml(r.content).slice(0, 80)}{stripHtml(r.content).length > 80 ? '…' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {topic.replies_count > 5 && (
                <Link
                  to={`topics/${topic.id}`}
                  className="text-xs text-indigo-500 hover:underline pb-2 block"
                >
                  Ver las {topic.replies_count - 5} respuestas restantes →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const ThreadsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const [showCreate, setShowCreate] = useState(false)

  const { items: topics, loading } = useSelector((state: RootState) => state.topics)
  const currentChannel = useSelector((state: RootState) =>
    state.channels.items.find((c) => c.id === channelId)
  )

  useEffect(() => {
    if (!channelId) return

    dispatch(fetchTopicsByChannel(channelId))

    const realtimeChannel = supabase
      .channel(`replies-count:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'replies' },
        async (payload) => {
          const topicId = payload.new.topic_id
          const { data } = await supabase
            .from('topics')
            .select('replies_count')
            .eq('id', topicId)
            .single()
          if (data) dispatch(setRepliesCount({ topicId, count: data.replies_count }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(realtimeChannel) }
  }, [channelId, dispatch])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentChannel?.icon}</span>
            <h1 className="text-2xl font-bold text-slate-800">{currentChannel?.name || 'Canal'}</h1>
          </div>
          {currentChannel?.description && (
            <p className="text-slate-500 text-sm mt-1">{currentChannel.description}</p>
          )}
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Plus size={16} />
            Nuevo tema
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nadie ha publicado aún</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
            >
              Sé el primero en publicar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {showCreate && channelId && (
        <CreateTopicModal channelId={channelId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}

export default ThreadsPage
