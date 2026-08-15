import { useCallback, useRef, useEffect, useState } from 'react'
import { Clock, Smile, Send, Trash2, MessageCircle, Pencil, Check, Flag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import EmojiPicker from 'emoji-picker-react'
import { groupReactions } from '../../posts/store/postsSlice'
import { useHighlightCode } from '../../../hooks/useHighlightCode'
import { useCodeCollapse } from '../../../hooks/useCodeCollapse'
import { useReply } from '../hooks/useReply'
import ReplyBottomSheet from './ReplyBottomSheet'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import Spinner from '../../../components/shared/Spinner'
import { type Profile, type Reply, type TopicRule } from '../../../types'
import ReportModal from '../../reports/components/ReportModal'
import UserLink from '../../../components/shared/UserLink'
import ReputationBadge from '../../reputation/components/ReputationBadge'
import TopicRulesReminder from './TopicRulesReminder'
import { getAvatarInitial, getDisplayUsername } from '../../../services/deletedUser'

interface AvatarProps {
  profile?: Profile | null
  id?: string
}

interface LeaderLineInstance {
  position: () => void
  remove: () => void
}

type LeaderLineConstructor = new (
  startElement: HTMLElement,
  endElement: HTMLElement,
  options: Record<string, unknown>
) => LeaderLineInstance

export const Avatar = ({ profile, id }: AvatarProps) => (
  <div
    id={id}
    className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm overflow-hidden"
  >
    {profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
    ) : (
      getAvatarInitial(profile)
    )}
  </div>
)

interface ReplyCardProps {
  reply: Reply
  topicId: string
  topicClosed: boolean
  topicRules?: TopicRule[]
  onOpenRules?: () => void
  depth?: number
  maxDepth?: number
}

const ReplyCard = ({ reply, topicId, topicClosed, topicRules = [], onOpenRules, depth = 0, maxDepth = 5 }: ReplyCardProps) => {
  const replyContentRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<LeaderLineInstance[]>([])
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const repositionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const navigate = useNavigate()
  useHighlightCode(replyContentRef)
  useCodeCollapse(replyContentRef)

  const positionLines = useCallback(() => {
    linesRef.current.forEach((line) => {
      try {
        line.position()
      } catch {
        return
      }
    })
  }, [])

  const removeLines = useCallback(() => {
    linesRef.current.forEach((line) => {
      try {
        line.remove()
      } catch {
        return
      }
    })
    linesRef.current = []
  }, [])

  const handleReposition = useCallback(() => {
    const timers = [50, 100, 200, 350].map((delay) =>
      setTimeout(() => {
        positionLines()
      }, delay)
    )
    repositionTimersRef.current = timers
  }, [positionLines])

  useEffect(() => {
    window.addEventListener('reply-editor-toggle', handleReposition)
    if (!reply.children?.length || window.matchMedia('(max-width: 767px)').matches) {
      return () => {
        window.removeEventListener('reply-editor-toggle', handleReposition)
        repositionTimersRef.current.forEach(clearTimeout)
      }
    }
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        removeLines()
        const LL = (window as Window & { LeaderLine?: LeaderLineConstructor }).LeaderLine
        const parentEl = document.getElementById(`avatar-${reply.id}`)
        if (!parentEl || !LL) return
        reply.children!.forEach((child) => {
          const childEl = document.getElementById(`avatar-${child.id}`)
          if (!childEl) return
          try {
            const line = new LL(parentEl, childEl, {
              path: 'grid', startSocket: 'bottom', endSocket: 'left',
              color: '#cbd5e1', size: 1, startPlug: 'behind', endPlug: 'arrow2', endSocketGravity: 8,
            })
            linesRef.current.push(line)
          } catch {
            return
          }
        })
        const handleScroll = () => {
          positionLines()
        }
        scrollHandlerRef.current = handleScroll
        window.addEventListener('scroll', handleScroll, true)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current, true)
      }
      window.removeEventListener('reply-editor-toggle', handleReposition)
      repositionTimersRef.current.forEach(clearTimeout)
      removeLines()
    }
  }, [handleReposition, positionLines, removeLines, reply.children, reply.id])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      positionLines()
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [positionLines, reply.children?.length])

  const {
    user,
    isAuthenticated,
    foroBloqueado,
    canDelete,
    canEdit,
    canReply,
    canReact,
    canReport,
    showReplyEditor,
    showBottomSheet,
    setShowBottomSheet,
    replyContent,
    setReplyContent,
    submitting,
    isEditing,
    editContent,
    savingEdit,
    showEmojiPicker,
    setShowEmojiPicker,
    handleReplyClick,
    handleSubmitReply,
    handleDeleteReply,
    handleSaveEdit,
    setEditContent,
    handleReaction,
    startEditing,
    cancelEditing,
  } = useReply(reply, topicId)

  const reactionGroups = groupReactions(reply.reactions || [], user?.id)
  const wasEdited = reply.updated_at && reply.updated_at !== reply.created_at
  const hasChildren = reply.children && reply.children.length > 0
  const depthExceeded = depth >= maxDepth
  const reportOptions = [
    {
      type: 'reply' as const,
      label: 'Respuesta',
      targetTopicId: topicId,
      targetReplyId: reply.id,
      reportedUserId: reply.author_id,
    },
    ...(reply.author_id ? [{
      type: 'user' as const,
      label: 'Autor',
      targetUserId: reply.author_id,
      reportedUserId: reply.author_id,
    }] : []),
  ]

  return (
    <div ref={containerRef} className={depth > 0 ? 'relative border-l border-slate-200 pl-3 dark:border-slate-800 md:pl-5' : 'relative'}>
      <div className="flex min-w-0 items-start gap-2 border-t border-slate-200/80 py-3 first:border-t-0 dark:border-slate-800 md:gap-3">
        <Avatar profile={reply.author} id={`avatar-${reply.id}`} />
        <div className="flex-1 min-w-0">
          <div className="px-0 py-0">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <UserLink profile={reply.author} className="min-w-0 text-sm font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400" />
              <ReputationBadge userId={reply.author?.id} compact />
              {reply.author?.role && reply.author.role !== 'user' && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-medium capitalize">
                  {reply.author.role}
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={11} />
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: es })}
              </span>
              {wasEdited && <span className="text-xs text-slate-300 dark:text-slate-600 italic">editado</span>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <RichTextEditor
                  key={`edit-reply-${reply.id}`}
                  onChange={setEditContent}
                  content={reply.content}
                  placeholder="Edita tu respuesta..."
                  minHeight="100px"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={cancelEditing}
                    className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit || !editContent || editContent === '<p></p>'}
                    className="hover:cursor-pointer flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? <Spinner size="sm" /> : <Check size={13} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div ref={replyContentRef} className="prose prose-sm max-w-none overflow-hidden break-words text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: reply.content }} />
            )}

            {!isEditing && (
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
                {reactionGroups.map((group) => (
                  <button
                    key={group.emoji}
                    onClick={() => handleReaction(group.emoji)}
                    title={`${group.count} reacciones`}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors ${group.reacted
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 bg-transparent text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
                      }`}
                  >
                    <span>{group.emoji}</span>
                    <span className="text-xs font-medium">{group.count}</span>
                  </button>
                ))}

                {isAuthenticated && canReply && !topicClosed && !foroBloqueado && (
                  <button
                    onClick={handleReplyClick}
                    className="hover:cursor-pointer flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-indigo-300 hover:bg-slate-100 hover:text-indigo-500 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-900"
                  >
                    <MessageCircle size={13} />
                    <span>Responder</span>
                  </button>
                )}

                {canEdit && isAuthenticated && (
                  <button
                    onClick={startEditing}
                    className="hover:cursor-pointer flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-indigo-300 hover:bg-slate-100 hover:text-indigo-500 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-900"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
                  </button>
                )}

                {isAuthenticated && canReport && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="hover:cursor-pointer flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-red-300 hover:bg-slate-100 hover:text-red-500 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-900"
                  >
                    <Flag size={12} />
                    <span>Reportar</span>
                  </button>
                )}

                {canDelete && isAuthenticated && (
                  <button
                    onClick={handleDeleteReply}
                    className="hover:cursor-pointer ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}

                {isAuthenticated && canReact && (
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hover:cursor-pointer flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-900"
                    >
                      <Smile size={13} />
                      <span className="text-xs">+</span>
                    </button>
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-8 right-0 z-20 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl shadow-xl sm:left-0 sm:right-auto">
                          <EmojiPicker onEmojiClick={(e) => handleReaction(e.emoji)} width="min(300px, calc(100vw - 2rem))" height={350} searchDisabled skinTonesDisabled />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {showReplyEditor && (
            <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 md:p-4">
              {onOpenRules && <TopicRulesReminder rules={topicRules} onOpen={onOpenRules} />}
              <RichTextEditor onChange={setReplyContent} placeholder={`Respondiendo a ${getDisplayUsername(reply.author)}...`} minHeight="100px" />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => { setShowBottomSheet(false); setReplyContent('') }}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors hover:cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSubmitReply(replyContent)}
                  disabled={submitting || !replyContent || replyContent === '<p></p>'}
                  className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Spinner size="sm" /> : <Send size={13} />}
                  Responder
                </button>
              </div>
            </div>
          )}

          <ReplyBottomSheet
            open={showBottomSheet}
            onClose={() => setShowBottomSheet(false)}
            onSubmit={handleSubmitReply}
            replyingTo={getDisplayUsername(reply.author)}
            submitting={submitting}
            topicRules={topicRules}
            onOpenRules={onOpenRules}
          />

          <ReportModal
            open={reportOpen}
            onClose={() => setReportOpen(false)}
            title="Reportar respuesta"
            author={reply.author}
            options={reportOptions}
          />

          {hasChildren && !depthExceeded && (
            <div className="mt-4 space-y-2">
              {reply.children!.map((child) => (
                <ReplyCard
                  key={child.id}
                  reply={child}
                  topicId={topicId}
                  topicClosed={topicClosed}
                  topicRules={topicRules}
                  onOpenRules={onOpenRules}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </div>
          )}

          {hasChildren && depthExceeded && (
            <button
              onClick={() => navigate(`/channels/topics/${topicId}/thread/${reply.children![0].id}`)}
              className="mt-3 flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:cursor-pointer transition-colors"
            >
              <MessageCircle size={13} />
              Seguir viendo este hilo →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReplyCard
