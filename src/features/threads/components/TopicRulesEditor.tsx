import { Plus, Trash2 } from 'lucide-react'

const MAX_TOPIC_RULES = 10

interface TopicRulesEditorProps {
  rules: string[]
  onChange: (rules: string[]) => void
}

const normalizeRules = (rules: string[]) =>
  rules.length > 0 ? rules.slice(0, MAX_TOPIC_RULES) : ['']

const TopicRulesEditor = ({ rules, onChange }: TopicRulesEditorProps) => {
  const visibleRules = normalizeRules(rules)
  const canAdd = visibleRules.length < MAX_TOPIC_RULES

  const updateRule = (index: number, value: string) => {
    onChange(visibleRules.map((rule, i) => (i === index ? value : rule)))
  }

  const addRule = () => {
    if (!canAdd) return
    onChange([...visibleRules, ''])
  }

  const removeRule = (index: number) => {
    const next = visibleRules.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [''])
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Reglas del tema</label>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Opcional. Máximo 10 reglas.</p>
        </div>
        <button
          type="button"
          onClick={addRule}
          disabled={!canAdd}
          title="Agregar regla"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {visibleRules.map((rule, index) => (
          <div key={index} className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-7 shrink-0 items-center justify-center text-xs font-semibold text-slate-400">
              {index + 1}.
            </span>
            <input
              type="text"
              value={rule}
              onChange={(e) => updateRule(index, e.target.value)}
              maxLength={240}
              placeholder={index === 0 ? 'Ej. No publicar contenido explicito' : 'Agregar otra regla'}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-950"
            />
            <button
              type="button"
              onClick={() => removeRule(index)}
              title="Eliminar regla"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopicRulesEditor
