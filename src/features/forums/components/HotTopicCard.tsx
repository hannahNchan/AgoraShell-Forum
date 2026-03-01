import { Link } from 'react-router-dom'
import { Star, MessageCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type HotTopic } from '../hooks/useHotTopics'

const MEDALS = ['🥇', '🥈', '🥉']

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
        <span className="text-lg">{MEDALS[rank - 1]}</span>
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

export default HotTopicCard
