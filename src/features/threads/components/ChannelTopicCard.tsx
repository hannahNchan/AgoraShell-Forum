import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Star, MessageSquare, Clock, ChevronDown, ChevronUp, Trash2, Pencil, Tag as TagIcon, Pin, PinOff, Lock, LockOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch } from '../../../store'
import { useRole } from '../../auth/hooks/useRole'
import { useAuth } from '../../auth/hooks/useAuth'
import { selectProfile } from '../../auth/store/authSelectors'
import { toggleStar, deleteTopic, pinTopic, closeTopic } from '../store/threadsSlice'
import { useConfirm } from '../../../hooks/useConfirm'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'
import EditTopicModal from './EditTopicModal'
import { type Tag } from '../../../types'
import ImageCarousel from './ImageCarousel'

const stripHtml = (html: string) => {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const extractImages = (html: string): string[] => {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)]
  return matches.map((m) => m[1])
}

interface ChannelTopicCardProps {
  topic: any
  maxTags: number
}

const ChannelTopicCard = ({ topic, maxTags }: ChannelTopicCardProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator, isBanned } = useRole()
  const { confirm } = useConfirm()

  const canDelete = isModerator || profile?.id === topic.author_id
  const canEdit = profile?.id === topic.author_id

  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const wasEdited = topic.updated_at && topic.updated_at !== topic.created_at
  const images = extractImages(topic.content)

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: topic.is_starred }))
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    const ok = await confirm('Eliminar tema', '¿Eliminar este tema? Esta acción no se puede deshacer.')
    if (!ok) return
    dispatch(deleteTopic(topic.id))
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    dispatch(closeTopic({ topicId: topic.id, isClosed: topic.is_closed }))
  }

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    dispatch(pinTopic({ topicId: topic.id, isPinned: topic.is_pinned }))
  }

  return (
    <>
      <div className={`rounded-xl border hover:shadow-sm transition-all overflow-hidden ${topic.is_pinned
        ? 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900'
        : topic.is_closed
          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700'
        }`}>
        {topic.is_pinned && (
          <div className="flex items-center gap-1.5 px-5 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <Pin size={11} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Tema fijado</span>
          </div>
        )}
        {topic.is_closed && (
          <div className="flex items-center gap-1.5 px-5 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <Lock size={11} className="text-red-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tema cerrado — no se aceptan más respuestas</span>
          </div>
        )}

        {images.length > 0 && (
          <ImageCarousel images={images} linkTo={`topics/${topic.id}`} />
        )}

        <div className="flex items-start gap-4 p-5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0 overflow-hidden">
            {topic.author?.avatar_url ? (
              <img src={topic.author.avatar_url} alt="" className="w-9 h-9 object-cover" />
            ) : (
              topic.author?.username?.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:w-full">
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-end md:justify-start md:items-center gap-3 md:py-2 -mt-2 mb-2 md:mb-0 md:mt-1 text-xs text-slate-400 order-first md:order-3">
                <span className="font-medium text-slate-500 dark:text-slate-400">{topic.author?.username}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true, locale: es })}
                </span>
                {wasEdited && <span className="italic text-slate-300 dark:text-slate-600">editado</span>}
              </div>
              <Link
                to={`topics/${topic.id}`}
                className="md:pb-4 font-semibold text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-tight block order-2 md:order-first"
              >
                {topic.title}
              </Link>
              {topic.tags && topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 order-3 md:order-2">
                  {topic.tags.map((tag: Tag) => (
                    <Link
                      key={tag.id}
                      to={`/tags/${tag.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:cursor-pointer inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
                    >
                      <TagIcon size={9} />
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-start md:items-center gap-2 md:gap-4 text-slate-400 shrink-0 md:self-stretch md:justify-between">
              <div className="flex flex-row gap-4 self-end">
                <button
                  onClick={handleStar}
                  className={`hover:cursor-pointer flex items-center gap-1 text-xs transition-colors ${topic.is_starred ? 'text-amber-500' : 'hover:text-amber-500'}`}
                >
                  <Star size={14} fill={topic.is_starred ? 'currentColor' : 'none'} />
                  <span>{topic.stars_count}</span>
                </button>
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <MessageSquare size={14} />
                  <span>{topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isModerator && isAuthenticated && (
                  <button
                    onClick={handleClose}
                    title={topic.is_closed ? 'Reabrir tema' : 'Cerrar tema'}
                    className={`hover:cursor-pointer px-2 py-1 rounded-sm flex items-center gap-1 text-xs transition-colors ${topic.is_closed
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                  >
                    {topic.is_closed ? <LockOpen size={14} /> : <Lock size={14} />}
                    {topic.is_closed ? 'Reabrir' : 'Cerrar'}
                  </button>
                )}
                {isModerator && isAuthenticated && (
                  <button
                    onClick={handlePin}
                    title={topic.is_pinned ? 'Desfijar tema' : 'Fijar tema'}
                    className={`hover:cursor-pointer px-2 py-1 rounded-sm flex items-center gap-1 text-xs transition-colors ${topic.is_pinned
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                  >
                    {topic.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    {topic.is_pinned ? 'Desfijar' : 'Fijar'}
                  </button>
                )}
                {canEdit && isAuthenticated && !isBanned && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditModal(true) }}
                    className="hover:cursor-pointer px-2 py-1 rounded-sm bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                )}
                {canDelete && isAuthenticated && (
                  <button
                    onClick={handleDelete}
                    className="px-2 py-1 rounded-sm bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 hover:cursor-pointer flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {topic.replies_count > 0 && (
          <button
            onClick={handleToggle}
            className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-medium hover:cursor-pointer border-t transition-colors ${expanded
              ? 'border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
              : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Ocultar respuestas' : `Previsualizar ${topic.replies_count === 1 ? 'respuesta' : 'respuestas'}`}
          </button>
        )}

        {expanded && (
          <div className="border-t border-slate-100 dark:border-slate-700 ml-[52px] mr-4 mb-4">
            {loadingReplies ? (
              <div className="flex justify-center py-4"><Spinner size="sm" /></div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Sin respuestas aún.</p>
            ) : (
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center gap-1.5 pt-3 pb-2">
                  <div className="flex -space-x-2">
                    {replies
                      .filter((r: any, idx: number, arr: any[]) =>
                        arr.findIndex((x: any) => x.author?.username === r.author?.username) === idx
                      )
                      .slice(0, 4)
                      .map((r: any) => (
                        <div
                          key={r.author?.username}
                          className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-slate-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] overflow-hidden shrink-0"
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
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] overflow-hidden mt-0.5">
                        {r.author?.avatar_url ? (
                          <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          r.author?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{r.author?.username} </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {stripHtml(r.content).slice(0, 80)}{stripHtml(r.content).length > 80 ? '…' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {topic.replies_count > 5 && (
                  <Link
                    to={`topics/${topic.id}`}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline pb-2 block"
                  >
                    Ver las {topic.replies_count - 5} respuestas restantes →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <EditTopicModal topic={topic} onClose={() => setShowEditModal(false)} maxTags={maxTags} />
      )}
    </>
  )
}

export default ChannelTopicCard
