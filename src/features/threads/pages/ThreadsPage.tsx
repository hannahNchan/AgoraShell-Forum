import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, MessageSquare, Tag as TagIcon, X } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useRole } from '../../auth/hooks/useRole'
import { useChannel } from '../hooks/useChannel'
import CreateTopicModal from '../components/CreateTopicModal'
import ChannelTopicCard from '../components/ChannelTopicCard'
import Spinner from '../../../components/shared/Spinner'
import { type Tag } from '../../../types'

const ThreadsPage = () => {
  const { channelId } = useParams<{ channelId: string }>()
  const { isAuthenticated } = useAuth()
  const { isBanned } = useRole()
  const [showCreate, setShowCreate] = useState(false)

  const {
    topics, loading, loadingMore, hasMore,
    maxTags, currentChannel, channelTags, activeTags,
    loaderRef, handleTagFilter, clearTagFilters,
  } = useChannel(channelId)

  const pinnedTopics = topics.filter((t) => t.is_pinned)
  const normalTopics = topics.filter((t) => !t.is_pinned)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentChannel?.icon}</span>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentChannel?.name || 'Canal'}</h1>
          </div>
          {currentChannel?.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{currentChannel.description}</p>
          )}
        </div>
        {isAuthenticated && !isBanned && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex hover:cursor-pointer items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            Nuevo tema
          </button>
        )}
      </div>

      {channelTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <TagIcon size={12} />
            Filtrar:
          </span>
          {channelTags.map((tag: Tag) => {
            const isActive = activeTags.some((t) => t.id === tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => handleTagFilter(tag)}
                className={`hover:cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  }`}
              >
                <TagIcon size={9} />
                {tag.name}
                {isActive && <X size={11} className="ml-0.5" />}
              </button>
            )
          })}
          {activeTags.length > 0 && (
            <button
              onClick={clearTagFilters}
              className="hover:cursor-pointer text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {activeTags.length > 0
              ? `No hay temas con ${activeTags.length === 1 ? `el tag "${activeTags[0].name}"` : 'esos tags'}`
              : 'Nadie ha publicado aún'}
          </p>
          {isAuthenticated && !isBanned && activeTags.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-indigo-600 text-sm font-medium hover:underline hover:cursor-pointer"
            >
              Sé el primero en publicar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {pinnedTopics.length > 0 && (
            <>
              {pinnedTopics.map((topic) => (
                <ChannelTopicCard key={topic.id} topic={topic} maxTags={maxTags} />
              ))}
              {normalTopics.length > 0 && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Todos los temas</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
            </>
          )}
          {normalTopics.map((topic) => (
            <ChannelTopicCard key={topic.id} topic={topic} maxTags={maxTags} />
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

      {showCreate && channelId && (
        <CreateTopicModal channelId={channelId} onClose={() => setShowCreate(false)} maxTags={maxTags} />
      )}
    </div>
  )
}

export default ThreadsPage
