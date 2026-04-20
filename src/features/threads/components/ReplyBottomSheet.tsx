import { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import Spinner from '../../../components/shared/Spinner'

interface ReplyBottomSheetProps {
  open: boolean
  onClose: () => void
  onSubmit: (content: string) => Promise<void>
  replyingTo: string
  submitting: boolean
}

const ReplyBottomSheet = ({ open, onClose, onSubmit, replyingTo, submitting }: ReplyBottomSheetProps) => {
  const [content, setContent] = useState('')

  useEffect(() => { if (!open) setContent('') }, [open])
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Respondiendo a <span className="text-indigo-600 dark:text-indigo-400">@{replyingTo}</span>
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          <RichTextEditor onChange={setContent} placeholder={`Respondiendo a ${replyingTo}...`} minHeight="140px" />
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(content)}
            disabled={submitting || !content || content === '<p></p>'}
            className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {submitting ? <Spinner size="sm" /> : <Send size={13} />}
            Responder
          </button>
        </div>
      </div>
    </>
  )
}

export default ReplyBottomSheet
