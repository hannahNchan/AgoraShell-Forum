import { useRef, useEffect } from 'react'
import { Clock, Smile, Send, Trash2, MessageCircle, Pencil, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import EmojiPicker from 'emoji-picker-react'
import { groupReactions } from '../../posts/store/postsSlice'
import { useHighlightCode } from '../../../hooks/useHighlightCode'
import { useCodeCollapse } from '../../../hooks/useCodeCollapse'
import { useReply } from '../hooks/useReply'
import ReplyBottomSheet from './ReplyBottomSheet'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import Spinner from '../../../components/shared/Spinner'
import { type Reply } from '../../../types'

interface AvatarProps {
  profile: any
  id?: string
}

export const Avatar = ({ profile, id }: AvatarProps) => (
  <div
    id={id}
    className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm overflow-hidden"
  >
    {profile?.avatar_url ? (
      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
    ) : (
      profile?.username?.charAt(0).toUpperCase() || '?'
    )}
  </div>
)

interface ReplyCardProps {
  reply: Reply
  topicId: string
  topicClosed: boolean
  depth?: number
}

const ReplyCard = ({ reply, topicId, topicClosed, depth = 0 }: ReplyCardProps) => {
  const replyContentRef = useRef<HTMLDivElement>(null)
  const linesRef = useRef<any[]>([])
  const scrollHandlerRef = useRef<(() => void) | null>(null)
  const repositionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  useHighlightCode(replyContentRef)
  useCodeCollapse(replyContentRef)

  const handleReposition = () => {
    const timers = [50, 100, 200, 350].map((delay) =>
      setTimeout(() => {
        linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
      }, delay)
    )
    repositionTimersRef.current = timers
  }

  useEffect(() => {
    window.addEventListener('reply-editor-toggle', handleReposition)
    if (!reply.children?.length) return
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        linesRef.current.forEach((l) => { try { l.remove() } catch (_) { } })
        linesRef.current = []
        const LL = (window as any).LeaderLine
        const parentEl = document.getElementById(`avatar-${reply.id}`)
        if (!parentEl || !LL) return
        reply.children!.forEach((child) => {
          const childEl = document.getElementById(`avatar-${child.id}`)
          if (!childEl) return
          try {
            const line = new LL(parentEl, childEl, {
              path: 'grid',
              startSocket: 'bottom',
              endSocket: 'left',
              color: '#cbd5e1',
              size: 2,
              startPlug: 'behind',
              endPlug: 'arrow2',
            })
            linesRef.current.push(line)
          } catch (_) { }
        })
        const handleScroll = () => {
          linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
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
      linesRef.current.forEach((l) => { try { l.remove() } catch (_) { } })
      linesRef.current = []
    }
  }, [reply.children?.length, reply.id])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(() => {
      linesRef.current.forEach((l) => { try { l.position() } catch (_) { } })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [reply.children?.length])

  const {
    user,
    isAuthenticated,
    isBanned,
    canDelete,
    canEdit,
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

  return (
    <div ref={containerRef} className={depth > 0 ? 'relative pl-0 md:pl-5' : ''}>
      <div className="flex items-start gap-1">
        <Avatar profile={reply.author} id={`avatar-${reply.id}`} />
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{reply.author?.username}</span>
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
              <div ref={replyContentRef} className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: reply.content }} />
            )}

            {!isEditing && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {reactionGroups.map((group) => (
                  <button
                    key={group.emoji}
                    onClick={() => handleReaction(group.emoji)}
                    title={`${group.count} reacciones`}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${group.reacted
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                  >
                    <span>{group.emoji}</span>
                    <span className="text-xs font-medium">{group.count}</span>
                  </button>
                ))}

                {isAuthenticated && !isBanned && !topicClosed && (
                  <button
                    onClick={handleReplyClick}
                    className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-500 hover:border-indigo-300 transition-colors text-xs"
                  >
                    <MessageCircle size={13} />
                    <span>Responder</span>
                  </button>
                )}

                {canEdit && isAuthenticated && !isBanned && (
                  <button
                    onClick={startEditing}
                    className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-500 hover:border-indigo-300 transition-colors text-xs"
                  >
                    <Pencil size={12} />
                    <span>Editar</span>
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

                {isAuthenticated && (
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hover:cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors text-sm"
                    >
                      <Smile size={13} />
                      <span className="text-xs">+</span>
                    </button>
                    {showEmojiPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                        <div className="absolute bottom-8 left-0 z-20 shadow-xl rounded-xl overflow-hidden">
                          <EmojiPicker onEmojiClick={(e) => handleReaction(e.emoji)} width={300} height={350} searchDisabled skinTonesDisabled />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {showReplyEditor && (
            <div className="mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <RichTextEditor onChange={setReplyContent} placeholder={`Respondiendo a ${reply.author?.username}...`} minHeight="100px" />
              <div className="flex justify-end gap-2">
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
            replyingTo={reply.author?.username || ''}
            submitting={submitting}
          />

          {reply.children && reply.children.length > 0 && (
            <div className="mt-4 space-y-2">
              {reply.children.map((child) => (
                <ReplyCard key={child.id} reply={child} topicId={topicId} topicClosed={topicClosed} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReplyCard
