import { X, ScrollText } from 'lucide-react'
import { type TopicRule } from '../../../types'

interface TopicRulesModalProps {
  open: boolean
  rules: TopicRule[]
  onClose: () => void
}

const TopicRulesModal = ({ open, rules, onClose }: TopicRulesModalProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-2">
            <ScrollText size={18} className="shrink-0 text-indigo-500" />
            <h3 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">Reglas del tema</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X size={19} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {rules.length > 0 ? (
            <ol className="space-y-3">
              {rules.map((rule) => (
                <li key={rule.id} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {rule.position}
                  </span>
                  <span className="min-w-0 break-words leading-6">{rule.body}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Este tema no tiene reglas especificas.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopicRulesModal
