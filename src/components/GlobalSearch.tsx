import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Hash, FileText, X, Tag } from 'lucide-react'
import { supabase } from '../services/supabase'

interface SearchResult {
  id: string
  title: string
  type: 'channel' | 'topic' | 'tag'
  channelId?: string
  slug?: string
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

      const isTagSearch = query.trim().startsWith('#')
      const cleanQuery = isTagSearch ? query.trim().slice(1) : query.trim()

      if (!cleanQuery) {
        setResults([])
        setOpen(true)
        setLoading(false)
        return
      }

      if (isTagSearch) {
        const { data } = await supabase
          .from('tags')
          .select('id, name, slug')
          .ilike('name', `%${cleanQuery}%`)
          .limit(8)

        setResults(
          (data ?? []).map((t) => ({
            id: t.id,
            title: t.name,
            type: 'tag' as const,
            slug: t.slug,
          }))
        )
      } else {
        const q = `%${cleanQuery}%`
        const [channelsRes, topicsRes] = await Promise.all([
          supabase.from('channels').select('id, name').ilike('name', q).limit(3),
          supabase.from('topics').select('id, title, channel_id').or(`title.ilike.${q},content.ilike.${q}`).limit(5),
        ])

        setResults([
          ...(channelsRes.data ?? []).map((c) => ({ id: c.id, title: c.name, type: 'channel' as const })),
          ...(topicsRes.data ?? []).map((t) => ({ id: t.id, title: t.title, type: 'topic' as const, channelId: t.channel_id })),
        ])
      }

      setOpen(true)
      setLoading(false)
    }, 300)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    if (result.type === 'channel') navigate(`/channels/${result.id}`)
    else if (result.type === 'topic') navigate(`/channels/${result.channelId}/topics/${result.id}`)
    else if (result.type === 'tag') navigate(`/tags/${result.slug}`)
  }

  const handleSearchPage = () => {
    if (!query.trim()) return
    const isTagSearch = query.trim().startsWith('#')
    if (isTagSearch) {
      const slug = query.trim().slice(1).toLowerCase().replace(/\s+/g, '-')
      navigate(`/tags/${slug}`)
    } else {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchPage()
    if (e.key === 'Escape') setOpen(false)
  }

  const isTagSearch = query.trim().startsWith('#')
  const channels = results.filter((r) => r.type === 'channel')
  const topics = results.filter((r) => r.type === 'topic')
  const tags = results.filter((r) => r.type === 'tag')

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'channel') return <Hash size={13} className="text-indigo-400 shrink-0" />
    if (type === 'tag') return <Tag size={13} className="text-violet-400 shrink-0" />
    return <FileText size={13} className="text-emerald-400 shrink-0" />
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="neon-border">
        <div className="neon-inner dark:bg-slate-400 bg-white">
          <img src="/agorashell.svg" alt="" className="h-8 w-auto shrink-0 opacity-80" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Buscar canales, topics, #tags..."
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-700 dark:placeholder-slate-800 placeholder-slate-400 outline-none"
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
                {isTagSearch ? <Tag size={14} /> : <Search size={14} />}
                <span>Ver todos los resultados de <strong>"{query}"</strong></span>
              </button>

              {tags.length > 0 && (
                <div>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tags</p>
                  {tags.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:cursor-pointer transition-colors text-left"
                    >
                      {typeIcon(r.type)}
                      <span className="truncate">#{r.title}</span>
                    </button>
                  ))}
                </div>
              )}

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
