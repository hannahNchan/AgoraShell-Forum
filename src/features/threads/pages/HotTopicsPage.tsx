import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Star, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'

interface HotTopic {
  id: string
  title: string
  content: string
  stars_count: number
  replies_count: number
  created_at: string
  channel_id: string
  author: {
    id: string
    username: string
    avatar_url: string | null
  }
  score: number
  thumbnail: string | null
}

const extractThumbnail = (html: string): string | null => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : null
}

const Avatar = ({ profile }: { profile: { username: string; avatar_url: string | null } }) => (
  <div className="w-7 h-7 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-xs overflow-hidden">
    {profile.avatar_url ? (
      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
    ) : (
      profile.username.charAt(0).toUpperCase()
    )}
  </div>
)

const HotTopicCard = ({ topic, rank }: { topic: HotTopic; rank: number }) => (
  <Link
    to={`/channels/${topic.channel_id}/topics/${topic.id}`}
    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
  >
    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
      {rank <= 3 ? (
        <span className="text-lg">{['🥇', '🥈', '🥉'][rank - 1]}</span>
      ) : (
        <span className="text-sm font-bold text-slate-300">#{rank}</span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar profile={topic.author} />
        <span className="text-xs text-slate-500 font-medium">{topic.author.username}</span>
        <span className="text-slate-300 text-xs">·</span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={10} />
          {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-800 leading-snug truncate group-hover:text-indigo-600 transition-colors">
        {topic.title}
      </p>

      <div className="flex items-center gap-3 mt-2">
        <span className="flex items-center gap-1 text-xs text-amber-500">
          <Star size={11} fill="currentColor" />
          {topic.stars_count}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <MessageCircle size={11} />
          {topic.replies_count}
        </span>
      </div>
    </div>

    {topic.thumbnail && (
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
        <img
          src={topic.thumbnail}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
    )}
  </Link>
)

const HotTopicsPage = () => {
  const [topics, setTopics] = useState<HotTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('topics')
        .select('id, title, content, stars_count, replies_count, created_at, channel_id, author:profiles(id, username, avatar_url)')
        .order('stars_count', { ascending: false })
        .limit(50)

      if (error || !data) {
        setLoading(false)
        return
      }

      const scored = (data as any[])
        .map((t) => ({
          ...t,
          author: Array.isArray(t.author) ? t.author[0] : t.author,
          score: (t.stars_count * 2) + t.replies_count,
          thumbnail: extractThumbnail(t.content),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      setTopics(scored)
      setLoading(false)
    }

    fetch()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
          <Flame size={20} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hot Topics</h1>
          <p className="text-xs text-slate-400">Los temas con más actividad de la comunidad</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Aún no hay temas con actividad suficiente.
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, i) => (
            <HotTopicCard key={topic.id} topic={topic} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default HotTopicsPage
