import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Trash2, Star, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch } from '../../../store'
import { toggleStar, deleteTopic } from '../store/threadsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { selectProfile } from '../../auth/store/authSelectors'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import { type Topic } from '../../../types'
import { useRole } from '../../auth/hooks/useRole'
import { useConfirm } from '../../../hooks/useConfirm'

interface TopicCardProps {
  topic: Topic
}

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const TopicCard = ({ topic }: TopicCardProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator } = useRole()
  const canDelete = isModerator || profile?.id === topic.author_id
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [fetched, setFetched] = useState(false)
  const { confirm } = useConfirm()

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: topic.is_starred ?? false }))
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

  const handleDeleteTopic = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await confirm('Eliminar tema', '¿Eliminar este tema? Esta acción no se puede deshacer.')
    if (!ok) return
    dispatch(deleteTopic(topic.id))
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

        {canDelete && isAuthenticated && (
          <button
            onClick={handleDeleteTopic}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
            title="Eliminar topic"
          >
            <Trash2 size={14} />
          </button>
        )}

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
          className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium border-t transition-colors hover:cursor-pointer ${expanded
            ? 'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? 'Ocultar respuestas' : `Ver ${topic.replies_count} ${topic.replies_count === 1 ? 'respuesta' : 'respuestas'}`}
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
                  {replies.slice(0, 4).map((r: any) => (
                    <div
                      key={r.id}
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

export default TopicCard
