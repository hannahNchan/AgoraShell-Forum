import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Lock, Send } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useRole } from '../../auth/hooks/useRole'
import { selectProfile } from '../../auth/store/authSelectors'
import { useTopicDetail } from '../hooks/useTopicDetail'
import { createReply } from '../../posts/store/postsSlice'
import { type AppDispatch } from '../../../store'
import TopicHeader from '../components/TopicHeader'
import ReplyCard from '../components/ReplyCard'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'

const ThreadDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useAuth()
  const { isBanned, isModerator } = useRole()
  const profile = useSelector(selectProfile)

  const { topic, topicLoading, replies, repliesLoading, maxTags, handleStar, handleClose, handleSaveEdit } = useTopicDetail(topicId)

  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isClosed = topic?.is_closed ?? false
  const canEditTopic = !!(topic && profile?.id === topic.author_id)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent || replyContent === '<p></p>' || !topicId) return
    setSubmitting(true)
    try {
      await dispatch(createReply({ topicId, content: replyContent })).unwrap()
      setReplyContent('')
    } finally {
      setSubmitting(false)
    }
  }

  if (topicLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!topic) return <div className="text-center py-16 text-slate-400">Tema no encontrado</div>

  return (
    <div className="space-y-4">
      <TopicHeader
        topic={topic}
        isClosed={isClosed}
        isModerator={isModerator}
        isAuthenticated={isAuthenticated}
        isBanned={isBanned}
        canEdit={canEditTopic}
        maxTags={maxTags}
        onStar={handleStar}
        onClose={handleClose}
        onSaveEdit={handleSaveEdit}
      />

      {!isClosed && (
        <div className="text-slate-500 dark:text-slate-400 pt-2 text-sm font-medium">
          {topic.replies_count} {topic.replies_count === 1 ? 'respuesta' : 'respuestas'}
        </div>
      )}

      {repliesLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {replies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} topicId={topicId!} topicClosed={isClosed} depth={0} />
          ))}
          {!isClosed && replies.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nadie ha respondido todavía. ¡Sé el primero!</div>
          )}
        </div>
      )}

      {isClosed ? (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-center flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Lock size={15} className="text-slate-400" />
          Este tema está cerrado y no acepta más respuestas.
        </div>
      ) : isAuthenticated ? (
        isBanned ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-5 text-center text-sm text-red-500 dark:text-red-400">
            Tu cuenta ha sido suspendida y no puedes publicar contenido.
          </div>
        ) : (
          <form onSubmit={handleSubmitReply} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Agregar respuesta</h3>
            <RichTextEditor
              key={submitting ? 'submitting' : 'idle'}
              onChange={setReplyContent}
              placeholder="Escribe tu respuesta..."
              minHeight="120px"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !replyContent || replyContent === '<p></p>'}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 hover:cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <Spinner size="sm" /> : <Send size={14} />}
                Responder
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Inicia sesión</Link> para responder
        </div>
      )}
    </div>
  )
}

export default ThreadDetailPage
