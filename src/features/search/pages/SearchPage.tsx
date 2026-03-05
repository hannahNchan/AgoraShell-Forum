import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Hash, FileText, MessageSquare, Search } from 'lucide-react'
import { supabase } from '../../../services/supabase'

interface ChannelResult { id: string; name: string; description: string | null; icon: string }
interface TopicResult { id: string; title: string; channel_id: string; created_at: string }
interface ReplyResult { id: string; content: string; topic_id: string; created_at: string }

const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const [channels, setChannels] = useState<ChannelResult[]>([])
  const [topics, setTopics] = useState<TopicResult[]>([])
  const [replies, setReplies] = useState<ReplyResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) return
    const run = async () => {
      setLoading(true)
      const pattern = `%${q.trim()}%`

      const [c, t, r] = await Promise.all([
        supabase.from('channels').select('id, name, description, icon').ilike('name', pattern).limit(10),
        supabase.from('topics').select('id, title, channel_id, created_at').ilike('title', pattern).limit(10),
        supabase.from('replies').select('id, content, topic_id, created_at').ilike('content', pattern).limit(10),
      ])

      setChannels(c.data ?? [])
      setTopics(t.data ?? [])
      setReplies(r.data ?? [])
      setLoading(false)
    }
    run()
  }, [q])

  const total = channels.length + topics.length + replies.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Search size={22} />
          Resultados para "{q}"
        </h1>
        {!loading && <p className="text-slate-500 text-sm mt-1">{total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>}
      </div>

      {loading && <p className="text-slate-400 text-sm">Buscando...</p>}

      {!loading && total === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin resultados</p>
          <p className="text-sm mt-1">Intenta con otras palabras</p>
        </div>
      )}

      {channels.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            <Hash size={14} />
            Canales
          </h2>
          <div className="grid gap-2">
            {channels.map((c) => (
              <Link
                key={c.id}
                to={`/channels/${c.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm hover:cursor-pointer transition-all flex items-center gap-3"
              >
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topics.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            <FileText size={14} />
            Topics
          </h2>
          <div className="grid gap-2">
            {topics.map((t) => (
              <Link
                key={t.id}
                to={`/channels/${t.channel_id}/topics/${t.id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm hover:cursor-pointer transition-all"
              >
                <p className="font-semibold text-slate-800">{t.title}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {replies.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            <MessageSquare size={14} />
            Replies
          </h2>
          <div className="grid gap-2">
            {replies.map((r) => (
              <Link
                key={r.id}
                to={`/channels/topics/${r.topic_id}`}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm hover:cursor-pointer transition-all"
              >
                <p className="text-sm text-slate-700 line-clamp-2">{r.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default SearchPage
