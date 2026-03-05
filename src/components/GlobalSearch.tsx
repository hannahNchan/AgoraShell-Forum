import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, FileText, X } from 'lucide-react'
import { supabase } from '../services/supabase'

interface SearchResult {
  id: string
  title: string
  type: 'channel' | 'topic' | 'reply'
  channelId?: string
  topicId?: string
}

const GlobalSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const q = `%${query.trim()}%`

      const [channelsRes, topicsRes] = await Promise.all([
        supabase.from('channels').select('id, name').ilike('name', q).limit(3),
        supabase.from('topics').select('id, title, channel_id').or(`title.ilike.${q},content.ilike.${q}`).limit(5),
      ])

      const combined: SearchResult[] = [
        ...(channelsRes.data ?? []).map((c) => ({ id: c.id, title: c.name, type: 'channel' as const })),
        ...(topicsRes.data ?? []).map((t) => ({ id: t.id, title: t.title, type: 'topic' as const, channelId: t.channel_id })),
      ]

      setResults(combined)
      setOpen(true)
      setLoading(false)
    }, 300)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    if (result.type === 'channel') {
      navigate(`/channels/${result.id}`)
    } else if (result.type === 'topic') {
      navigate(`/channels/${result.channelId}/topics/${result.id}`)
    }
    setQuery('')
  }

  const handleSearchPage = () => {
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchPage()
    if (e.key === 'Escape') setOpen(false)
  }

  const channels = results.filter((r) => r.type === 'channel')
  const topics = results.filter((r) => r.type === 'topic')

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'channel') return <Hash size={13} className="text-indigo-400 shrink-0" />
    return <FileText size={13} className="text-emerald-400 shrink-0" />
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <style>{`
        @keyframes neon-spin {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .neon-border {
          border-radius: 8px;
          padding: 1.5px;
          background: linear-gradient(270deg, #55cdfc, #f7a8b8, #3b82f6, #f7a8b8, #55cdfc);
          background-size: 300% 300%;
          animation: neon-spin 3s ease infinite;
        }
        .neon-inner {
          border-radius: 6px;
          background: white;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
        }
      `}</style>

      <div className="neon-border">
        <div className="neon-inner">
          <img src="/agorashell.svg" alt="" className="h-5 w-auto shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Buscar canales, topics..."
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
              className="text-slate-400 hover:text-slate-600 hover:cursor-pointer transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          ) : (
            <Search size={14} className="text-slate-400 shrink-0" />
          )}
        </div>
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">Sin resultados para "{query}"</div>
          ) : (
            <>
              <button
                onClick={handleSearchPage}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 hover:cursor-pointer transition-colors border-b border-slate-100"
              >
                <Search size={14} />
                <span>Ver todos los resultados de <strong>"{query}"</strong></span>
              </button>

              {channels.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Canales</p>
                  {channels.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:cursor-pointer transition-colors text-left"
                    >
                      {typeIcon(r.type)}
                      <span className="truncate">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {topics.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Topics</p>
                  {topics.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:cursor-pointer transition-colors text-left"
                    >
                      {typeIcon(r.type)}
                      <span className="truncate">{r.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
