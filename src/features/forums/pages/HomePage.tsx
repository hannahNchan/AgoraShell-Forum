import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Flame, TrendingUp, Clock, Star, Zap, MessageSquare } from 'lucide-react'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchFeed, fetchMoreFeed, setFilter, type FeedFilter } from '../store/feedSlice'
import FeedTopicCard from '../components/FeedTopicCard'
import HotTopicCard from '../components/HotTopicCard'
import { useHotTopics } from '../hooks/useHotTopics'
import Spinner from '../../../components/shared/Spinner'

const FILTERS: { key: FeedFilter; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'best', label: 'Mejor valorados', icon: <Star size={14} />, description: 'Los más populares de todos los tiempos' },
  { key: 'hot', label: 'Hot', icon: <Flame size={14} />, description: 'Actividad en las últimas 48h' },
  { key: 'new', label: 'Nuevos', icon: <Clock size={14} />, description: 'Los más recientes' },
  { key: 'top', label: 'Top', icon: <TrendingUp size={14} />, description: 'Más estrellas de todos los tiempos' },
  { key: 'rising', label: 'Rising', icon: <Zap size={14} />, description: 'Subiendo en la última semana' },
]

export const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, filter, loading, loadingMore, hasMore } = useSelector((state: RootState) => state.feed)
  const { hotTopics } = useHotTopics(5)
  const loaderRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const lastScrollY = useRef(0)
  const [filtersVisible, setFiltersVisible] = useState(true)

  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  useEffect(() => {
    pageRef.current = 1
    dispatch(fetchFeed(filter))
  }, [filter, dispatch])

  useEffect(() => {
    const scrollRoot = document.getElementById('main-scroll')
    if (!scrollRoot) return

    const handleScroll = () => {
      const currentY = scrollRoot.scrollTop
      const diff = currentY - lastScrollY.current
      if (diff > 8) {
        setFiltersVisible(false)
      } else if (diff < -8) {
        setFiltersVisible(true)
      }
      lastScrollY.current = currentY
    }

    scrollRoot.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollRoot.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const scrollRoot = document.getElementById('main-scroll')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreRef.current && hasMoreRef.current) {
          dispatch(fetchMoreFeed({ filter, page: pageRef.current }))
          pageRef.current += 1
        }
      },
      { root: scrollRoot, threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filter, dispatch])

  const handleFilter = (f: FeedFilter) => {
    if (f === filter) return
    pageRef.current = 1
    dispatch(setFilter(f))
  }

  const activeFilter = FILTERS.find((f) => f.key === filter)!

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-gray-300">Feed</h1>
        <p className="text-slate-500 text-sm mt-0.5">{activeFilter.description}</p>
      </div>

      <div
        className={`md:hidden sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-slate-100 dark:border-slate-700 transition-all duration-300 ${filtersVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {FILTERS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:cursor-pointer shrink-0 ${filter === key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600'
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:cursor-pointer ${filter === key
              ? 'bg-indigo-600 dark:bg-indigo-900 dark:hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
              : 'bg-white dark:bg-indigo-300 dark:hover:bg-indigo-500 dark:text-indigo-700 dark:hover:text-indigo-200 border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay temas en este filtro todavía</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((topic) => (
                <FeedTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          )}

          <div ref={loaderRef} className="flex flex-col items-center py-6 gap-3">
            {loadingMore && (
              <>
                <img src="/images/big_logo.svg" alt="Cargando" className="w-48 animate-pulse" />
                <span className="text-xs text-slate-400">Cargando más temas...</span>
              </>
            )}
            {!hasMore && items.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <img src="/images/big_logo.svg" alt="" className="w-10 h-10 opacity-20" />
                <span className="text-xs text-slate-400">No hay más temas</span>
              </div>
            )}
          </div>
        </div>

        {hotTopics.length > 0 && (
          <div className="space-y-3 w-full hidden md:block md:w-1/3 lg:w-1/3 bg-slate-300 dark:bg-slate-700 p-4 rounded-xl self-start sticky top-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <h3 className="font-semibold text-slate-700 text-sm dark:text-slate-300">Hot Topics</h3>
              </div>
              <Link to="/hot" className="text-xs dark:text-orange-400 dark:hover:text-orange-500 text-orange-500 hover:text-orange-600 hover:cursor-pointer font-medium transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="space-y-2">
              {hotTopics.map((topic, i) => (
                <HotTopicCard key={topic.id} topic={topic} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
