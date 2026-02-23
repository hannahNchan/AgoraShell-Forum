import { useState } from 'react'
import { X } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { type AppDispatch } from '../../../store'
import { createTopic } from '../store/threadsSlice'
import Spinner from '../../../components/shared/Spinner'
import RichTextEditor from '../../../components/shared/RichTextEditor'

interface CreateTopicModalProps {
  channelId: string
  onClose: () => void
}

const CreateTopicModal = ({ channelId, onClose }: CreateTopicModalProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createTopic({ channel_id: channelId, title: title.trim(), content })).unwrap()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-10 pb-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Nuevo tema</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Sobre qué quieres hablar?"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
            <RichTextEditor
              onChange={setContent}
              placeholder="Escribe el contenido de tu tema..."
              minHeight="200px"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : 'Publicar tema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTopicModal
