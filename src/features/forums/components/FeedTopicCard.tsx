import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Star, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch } from '../../../store'
import { toggleStar } from '../../threads/store/threadsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import { type Topic } from '../../../types'
import ImageCarousel from '../../threads/components/ImageCarousel'

interface FeedTopicCardProps {
  topic: Topic
}

const extractImages = (html: string): string[] => {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)]
  return matches.map((m) => m[1])
}

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const FeedTopicCard = ({ topic }: FeedTopicCardProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [fetched, setFetched] = useState(false)

  const images = extractImages(topic.content)
  const preview = stripHtml(topic.content).slice(0, 120)

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: !!topic.is_starred }))
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
        .limit(3)
      setReplies(data || [])
      setFetched(true)
      setLoadingReplies(false)
    }
    setExpanded(!expanded)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-400 hover:shadow-sm transition-all overflow-hidden">
      {images.length > 0 && (
        <ImageCarousel images={images} linkTo={`/channels/${topic.channel_id}/topics/${topic.id}`} />
      )}

      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0 overflow-hidden">
            {topic.author?.avatar_url ? (
              <img src={topic.author.avatar_url} alt="" className="w-9 h-9 object-cover" />
            ) : (
              topic.author?.username?.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{topic.author?.username}</span>
              {topic.channel && (
                <Link
                  to={`/channels/${topic.channel.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:cursor-pointer transition-colors font-medium"
                >
                  <span>{topic.channel.icon}</span>
                  <span>{topic.channel.name}</span>
                </Link>
              )}
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} />
                {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>

            <Link
              to={`/channels/${topic.channel_id}/topics/${topic.id}`}
              className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight block text-base"
            >
              {topic.title}
            </Link>

            {preview && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {preview}{stripHtml(topic.content).length > 120 ? '…' : ''}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleStar}
                className={`flex items-center gap-1.5 text-xs transition-colors hover:cursor-pointer ${topic.is_starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
              >
                <Star size={14} fill={topic.is_starred ? 'currentColor' : 'none'} />
                <span>{topic.stars_count}</span>
              </button>
              <button
                onClick={handleToggle}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:cursor-pointer transition-colors"
              >
                <MessageSquare size={14} />
                <span>{topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}</span>
                {topic.replies_count > 0 && (
                  expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {topic.replies_count > 0 && expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 pb-4 pt-3">
          {loadingReplies ? (
            <div className="flex justify-center py-2"><Spinner size="sm" /></div>
          ) : (
            <div className="space-y-3">
              {replies.map((r: any) => (
                <div key={r.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] overflow-hidden mt-0.5">
                    {r.author?.avatar_url ? (
                      <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      r.author?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{r.author?.username} </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {stripHtml(r.content).slice(0, 100)}{stripHtml(r.content).length > 100 ? '…' : ''}
                    </span>
                  </div>
                </div>
              ))}
              {topic.replies_count > 3 && (
                <Link
                  to={`/channels/${topic.channel_id}/topics/${topic.id}`}
                  className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline hover:cursor-pointer block"
                >
                  Ver las {topic.replies_count - 3} respuestas restantes →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FeedTopicCard
