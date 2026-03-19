import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { X, Check } from 'lucide-react'
import { type AppDispatch } from '../../../store'
import { updateTopic } from '../store/threadsSlice'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import TagInput from '../../tags/components/TagInput'
import Spinner from '../../../components/shared/Spinner'
import { type Tag } from '../../../types'

interface EditTopicModalProps {
  topic: any
  onClose: () => void
  maxTags: number
}

const EditTopicModal = ({ topic, onClose, maxTags }: EditTopicModalProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [title, setTitle] = useState(topic.title)
  const [content, setContent] = useState(topic.content)
  const [selectedTags, setSelectedTags] = useState<Tag[]>(topic.tags || [])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(updateTopic({
        topicId: topic.id,
        title: title.trim(),
        content,
        tagIds: selectedTags.map((t) => t.id),
      })).unwrap()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-10 pb-4 px-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Editar tema</h3>
          <button onClick={onClose} className="hover:cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Sobre qué quieres hablar?"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contenido *</label>
            <RichTextEditor
              key={`edit-${topic.id}`}
              onChange={setContent}
              content={topic.content}
              placeholder="Edita el contenido de tu tema..."
              minHeight="200px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
            <TagInput selected={selectedTags} onChange={setSelectedTags} maxTags={maxTags} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors hover:cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:cursor-pointer"
            >
              {submitting ? <Spinner size="sm" /> : <><Check size={15} />Guardar cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTopicModal
