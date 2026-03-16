import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Tag as TagIcon, Clock, Star, MessageSquare, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import { type Tag, type Topic, type Channel } from '../../../types'

interface TopicWithChannel extends Topic {
  channel: Channel
  tags: Tag[]
}

const PAGE_SIZE = 20

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const [tag, setTag] = useState<Tag | null>(null)
  const [topics, setTopics] = useState<TopicWithChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const pageRef = useRef(0)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  const fetchTopicsForTag = async (tagId: string, page: number) => {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('topic_tags')
      .select(`
        topic:topics(
          *,
          author:profiles(id, username, avatar_url, role),
          channel:channels(id, name, slug, icon),
          tags:topic_tags(tag:tags(*))
        )
      `)
      .eq('tag_id', tagId)
      .order('created_at', { ascending: false, referencedTable: 'topics' })
      .range(from, to)
    if (error) return []
    return (data || [])
      .map((row: any) => ({
        ...row.topic,
        tags: (row.topic?.tags || []).map((tt: any) => tt.tag).filter(Boolean),
      }))
      .filter(Boolean) as TopicWithChannel[]
  }

  useEffect(() => {
    if (!slug) return
    const init = async () => {
      setLoading(true)
      const { data: tagData } = await supabase.from('tags').select('*').eq('slug', slug).single()
      if (!tagData) { setLoading(false); return }
      setTag(tagData)
      const { count } = await supabase
        .from('topic_tags')
        .select('*', { count: 'exact', head: true })
        .eq('tag_id', tagData.id)
      setTotalCount(count || 0)
      const results = await fetchTopicsForTag(tagData.id, 0)
      setTopics(results)
      setHasMore(results.length === PAGE_SIZE)
      pageRef.current = 1
      setLoading(false)
    }
    init()
  }, [slug])

  useEffect(() => {
    const el = loaderRef.current
    if (!el || !tag) return
    const scrollRoot = document.getElementById('main-scroll')
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !loadingMoreRef.current && hasMoreRef.current) {
          loadingMoreRef.current = true
          setLoadingMore(true)
          const more = await fetchTopicsForTag(tag.id, pageRef.current)
          setTopics((prev) => {
            const ids = new Set(prev.map((t) => t.id))
            return [...prev, ...more.filter((t) => !ids.has(t.id))]
          })
          setHasMore(more.length === PAGE_SIZE)
          pageRef.current += 1
          setLoadingMore(false)
          loadingMoreRef.current = false
        }
      },
      { root: scrollRoot, threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [tag])

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  if (!tag) return (
    <div className="text-center py-16 text-slate-400">Tag no encontrado</div>
  )

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors hover:cursor-pointer mb-4"
        >
          <ArrowLeft size={15} />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <TagIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">#{tag.name}</h1>
            <p className="text-sm text-slate-400">
              {totalCount} {totalCount === 1 ? 'tema' : 'temas'} con este tag
            </p>
          </div>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <TagIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay temas con este tag todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-xs shrink-0 overflow-hidden">
                  {topic.author?.avatar_url ? (
                    <img src={topic.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    topic.author?.username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Link
                      to={`/channels/${topic.channel?.id}`}
                      className="text-xs font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span>{topic.channel?.icon}</span>
                      {topic.channel?.name}
                    </Link>
                  </div>

                  <Link
                    to={`/channels/${topic.channel?.id}/topics/${topic.id}`}
                    className="font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm leading-snug hover:cursor-pointer block"
                  >
                    {topic.title}
                  </Link>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium">{topic.author?.username}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Star size={11} />
                      {topic.stars_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <MessageSquare size={11} />
                      {topic.replies_count}
                    </span>
                  </div>

                  {topic.tags && topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {topic.tags.map((t) => (
                        <Link
                          key={t.id}
                          to={`/tags/${t.slug}`}
                          className={`hover:cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${t.slug === slug
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                            }`}
                        >
                          <TagIcon size={9} />
                          {t.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
    </div>
  )
}

export default TagPage
