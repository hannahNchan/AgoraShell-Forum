import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Award, Clock, FileText, MessageSquare, Shield, Sparkles, Star, TrendingUp } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Spinner from '../../../components/shared/Spinner'
import { supabase } from '../../../services/supabase'
import { type Profile } from '../../../types'
import { type ReputationSummary, getNextReputationLevel, getReputationProgress } from '../../reputation/reputation'
import ReputationBadge from '../../reputation/components/ReputationBadge'

type ProfileTopic = {
  id: string
  channel_id: string
  title: string
  content: string
  author_id: string
  stars_count: number
  replies_count: number
  created_at: string
  updated_at: string
  is_pinned?: boolean
  is_closed?: boolean
  channel?: { id: string; name: string; icon: string } | null
}

type ProfileReply = {
  id: string
  topic_id: string
  parent_id: string | null
  content: string
  author_id: string
  created_at: string
  updated_at: string
  topic?: {
    id: string
    title: string
    channel_id: string
    channel?: { id: string; name: string; icon: string } | null
  } | null
}

type MaybeArray<T> = T | T[] | null | undefined

const one = <T,>(value: MaybeArray<T>): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null

type ActivityItem =
  | { type: 'topic'; id: string; created_at: string; topic: ProfileTopic }
  | { type: 'reply'; id: string; created_at: string; reply: ProfileReply }

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const activityTime = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true, locale: es })

const UserProfilePage = () => {
  const { username } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [topics, setTopics] = useState<ProfileTopic[]>([])
  const [replies, setReplies] = useState<ProfileReply[]>([])
  const [reputation, setReputation] = useState<ReputationSummary | null>(null)
  const [badges, setBadges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'activity' | 'topics' | 'replies'>('activity')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!username) return
      setLoading(true)
      setError(null)

      try {
        const cleanUsername = decodeURIComponent(username)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio, role, role_id, suspended_until, suspension_reason, banned_reason, created_at')
          .ilike('username', cleanUsername)
          .single()
        if (profileError) throw profileError

        const [topicsResult, repliesResult, reputationResult, badgesResult] = await Promise.all([
          supabase
            .from('topics')
            .select('id, channel_id, title, content, author_id, stars_count, replies_count, created_at, updated_at, is_pinned, is_closed, channel:channels(id, name, icon)')
            .eq('author_id', profileData.id)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('replies')
            .select('id, topic_id, parent_id, content, author_id, created_at, updated_at, topic:topics(id, title, channel_id, channel:channels(id, name, icon))')
            .eq('author_id', profileData.id)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('user_reputation_scores')
            .select('*')
            .eq('user_id', profileData.id)
            .maybeSingle(),
          supabase
            .from('user_reputation_badges')
            .select('badges')
            .eq('user_id', profileData.id)
            .maybeSingle(),
        ])

        if (topicsResult.error) throw topicsResult.error
        if (repliesResult.error) throw repliesResult.error
        if (reputationResult.error) throw reputationResult.error
        if (badgesResult.error) throw badgesResult.error

        if (!cancelled) {
          setProfile(profileData as Profile)
          setReputation(reputationResult.data as ReputationSummary | null)
          setBadges(((badgesResult.data as { badges?: string[] } | null)?.badges ?? []))
          setTopics(((topicsResult.data ?? []) as Array<Omit<ProfileTopic, 'channel'> & { channel?: MaybeArray<ProfileTopic['channel']> }>).map((topic) => ({
            ...topic,
            channel: one(topic.channel),
          })))
          setReplies(((repliesResult.data ?? []) as Array<Omit<ProfileReply, 'topic'> & {
            topic?: MaybeArray<Omit<NonNullable<ProfileReply['topic']>, 'channel'> & { channel?: MaybeArray<NonNullable<ProfileReply['topic']>['channel']> }>
          }>).map((reply) => ({
            ...reply,
            topic: one(reply.topic)
              ? {
                ...one(reply.topic)!,
                channel: one(one(reply.topic)?.channel),
              }
              : null,
          })))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => { cancelled = true }
  }, [username])

  const activity = useMemo<ActivityItem[]>(() => {
    const topicItems = topics.map((topic) => ({ type: 'topic' as const, id: `topic-${topic.id}`, created_at: topic.created_at, topic }))
    const replyItems = replies.map((reply) => ({ type: 'reply' as const, id: `reply-${reply.id}`, created_at: reply.created_at, reply }))
    return [...topicItems, ...replyItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)
  }, [replies, topics])

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Perfil no encontrado</p>
        <p className="mt-1 text-sm text-slate-400">{error ?? 'Ese usuario no existe o cambió su username.'}</p>
      </div>
    )
  }

  const totalStars = topics.reduce((sum, topic) => sum + (topic.stars_count ?? 0), 0)
  const joinedAt = profile.created_at ? format(new Date(profile.created_at), "d MMM yyyy", { locale: es }) : 'Sin fecha'
  const isRestricted = profile.role === 'banned' || !!profile.banned_reason || (!!profile.suspended_until && new Date(profile.suspended_until) > new Date())
  const shellScore = reputation?.shell_score ?? 0
  const nextLevel = getNextReputationLevel(shellScore)
  const progress = getReputationProgress(shellScore)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-400" />
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-700 dark:border-slate-800 dark:bg-indigo-900 dark:text-indigo-200">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-extrabold text-slate-800 dark:text-slate-100">{profile.username}</h1>
                  {profile.role && profile.role !== 'user' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold capitalize text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      <Shield size={11} />
                      {profile.role}
                    </span>
                  )}
                  <ReputationBadge summary={reputation} />
                </div>
                <p className="text-xs text-slate-400">Miembro desde {joinedAt}</p>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">{profile.bio}</p>
          )}

          {isRestricted && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
              Esta cuenta tiene una restricción activa.
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-100 px-3 py-3 text-center dark:border-slate-700">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{topics.length}</p>
              <p className="text-xs text-slate-400">Temas</p>
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-3 text-center dark:border-slate-700">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{replies.length}</p>
              <p className="text-xs text-slate-400">Replies</p>
            </div>
            <div className="rounded-lg border border-slate-100 px-3 py-3 text-center dark:border-slate-700">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalStars}</p>
              <p className="text-xs text-slate-400">Estrellas</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-200">
                  <TrendingUp size={16} />
                  Reputación Shell
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{shellScore}</span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">{reputation?.level_name ?? 'Visitante'} · {reputation?.level_range ?? '0 - 49'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-64">
                <MiniStat label="Estrellas recibidas" value={reputation?.stars_received ?? 0} />
                <MiniStat label="Reacciones" value={reputation?.reply_reactions_received ?? 0} />
                <MiniStat label="Temas" value={reputation?.topics_created ?? topics.length} />
                <MiniStat label="Replies" value={reputation?.replies_created ?? replies.length} />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-slate-800">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {nextLevel ? `${Math.max(0, nextLevel.min - shellScore)} puntos para ${nextLevel.name}` : 'Nivel máximo alcanzado'}
              </p>
            </div>

            {badges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <Award size={12} />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-10 -mx-4 border-b border-slate-100 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:static sm:mx-0 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:dark:border-slate-700 sm:dark:bg-slate-800">
        <div className="grid grid-cols-3 gap-1">
          {[
            { key: 'activity', label: 'Actividad', icon: <Sparkles size={14} /> },
            { key: 'topics', label: 'Temas', icon: <FileText size={14} /> },
            { key: 'replies', label: 'Replies', icon: <MessageSquare size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'activity' && (
        <div className="space-y-2">
          {activity.length === 0 ? <EmptyState text="Este usuario todavía no tiene actividad pública." /> : activity.map((item) => (
            item.type === 'topic' ? <TopicActivity key={item.id} topic={item.topic} /> : <ReplyActivity key={item.id} reply={item.reply} />
          ))}
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-2">
          {topics.length === 0 ? <EmptyState text="Este usuario todavía no ha creado temas." /> : topics.map((topic) => <TopicActivity key={topic.id} topic={topic} />)}
        </div>
      )}

      {activeTab === 'replies' && (
        <div className="space-y-2">
          {replies.length === 0 ? <EmptyState text="Este usuario todavía no ha publicado replies." /> : replies.map((reply) => <ReplyActivity key={reply.id} reply={reply} />)}
        </div>
      )}
    </div>
  )
}

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
    {text}
  </div>
)

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-indigo-100 bg-white px-2 py-2 dark:border-indigo-900/60 dark:bg-slate-800">
    <p className="font-bold text-slate-800 dark:text-slate-100">{value}</p>
    <p className="text-slate-400">{label}</p>
  </div>
)

const TopicActivity = ({ topic }: { topic: ProfileTopic }) => (
  <Link
    to={`/channels/${topic.channel_id}/topics/${topic.id}`}
    className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Tema</p>
        <h2 className="mt-1 line-clamp-2 font-semibold text-slate-800 dark:text-slate-100">{topic.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{stripHtml(topic.content)}</p>
      </div>
      <div className="shrink-0 text-right text-xs text-slate-400">{activityTime(topic.created_at)}</div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
      {topic.channel && <span>{topic.channel.icon} {topic.channel.name}</span>}
      <span className="inline-flex items-center gap-1"><Star size={12} />{topic.stars_count}</span>
      <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{topic.replies_count}</span>
    </div>
  </Link>
)

const ReplyActivity = ({ reply }: { reply: ProfileReply }) => {
  const replyPath = reply.topic?.channel_id
    ? `/channels/${reply.topic.channel_id}/topics/${reply.topic_id}`
    : `/channels/topics/${reply.topic_id}/thread/${reply.id}`

  return (
    <Link
      to={replyPath}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Reply</p>
          <h2 className="mt-1 line-clamp-1 font-semibold text-slate-800 dark:text-slate-100">{reply.topic?.title ?? 'Tema eliminado'}</h2>
          <p className="mt-1 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{stripHtml(reply.content)}</p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-400">{activityTime(reply.created_at)}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {reply.topic?.channel && <span>{reply.topic.channel.icon} {reply.topic.channel.name}</span>}
        <span className="inline-flex items-center gap-1"><Clock size={12} />{activityTime(reply.created_at)}</span>
      </div>
    </Link>
  )
}

export default UserProfilePage
