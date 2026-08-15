import { useMemo, useState } from 'react'
import { Flag, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { createReport } from '../store/reportsSlice'
import Spinner from '../../../components/shared/Spinner'
import { selectUser } from '../../auth/store/authSelectors'
import { type Profile, type ReportReason, type ReportTargetType } from '../../../types'
import { getDisplayUsername } from '../../../services/deletedUser'

interface ReportTargetOption {
  type: ReportTargetType
  label: string
  targetTopicId?: string | null
  targetReplyId?: string | null
  targetUserId?: string | null
  reportedUserId?: string | null
}

interface ReportModalProps {
  open: boolean
  onClose: () => void
  title: string
  author?: Profile
  options: ReportTargetOption[]
}

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'abuse', label: 'Acoso o abuso' },
  { value: 'offensive', label: 'Contenido ofensivo' },
  { value: 'personal_info', label: 'Información personal' },
  { value: 'off_topic', label: 'Fuera de tema' },
  { value: 'other', label: 'Otro' },
]

const ReportModal = ({ open, onClose, title, author, options }: ReportModalProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const submitting = useSelector((state: RootState) => state.reports.submitting)
  const user = useSelector(selectUser)
  const availableOptions = useMemo(
    () => options.filter((option) => (option.reportedUserId ?? option.targetUserId) !== user?.id),
    [options, user?.id]
  )
  const [selectedType, setSelectedType] = useState<ReportTargetType>(availableOptions[0]?.type ?? options[0]?.type ?? 'topic')
  const [reason, setReason] = useState<ReportReason>('spam')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!open) return null

  const selectedOption = availableOptions.find((option) => option.type === selectedType) ?? availableOptions[0]
  const activeType = selectedOption?.type

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedOption) return
    setError('')
    setSuccess(false)
    try {
      await dispatch(createReport({
        targetType: selectedOption.type,
        reason,
        details,
        reportedUserId: selectedOption.reportedUserId,
        targetTopicId: selectedOption.targetTopicId,
        targetReplyId: selectedOption.targetReplyId,
        targetUserId: selectedOption.targetUserId,
      })).unwrap()
      setSuccess(true)
      setDetails('')
      setTimeout(onClose, 900)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Flag size={17} className="text-red-500 shrink-0" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {author && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Autor: <span className="font-medium text-slate-700 dark:text-slate-300">{getDisplayUsername(author)}</span>
            </div>
          )}

          {availableOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Qué quieres reportar</label>
              <div className="grid grid-cols-2 gap-2">
                {availableOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedType(option.type)}
                    className={`hover:cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${activeType === option.type
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableOptions.length === 0 && (
            <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
              No puedes reportarte a ti mismo ni reportar contenido propio.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Motivo</label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 hover:cursor-pointer"
            >
              {reasons.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contexto adicional</label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Agrega detalles para que el equipo pueda revisar mejor el caso."
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="text-right text-xs text-slate-400 mt-1">{details.length}/1000</div>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg px-3 py-2">Reporte enviado.</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="hover:cursor-pointer border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedOption}
              className="hover:cursor-pointer bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : <Flag size={14} />}
              Enviar reporte
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportModal
