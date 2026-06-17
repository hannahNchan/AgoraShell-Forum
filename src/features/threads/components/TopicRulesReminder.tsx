import { type TopicRule } from '../../../types'

interface TopicRulesReminderProps {
  rules: TopicRule[]
  onOpen: () => void
}

const TopicRulesReminder = ({ rules, onOpen }: TopicRulesReminderProps) => {
  if (rules.length === 0) return null

  return (
    <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
      Recuerda seguir las{' '}
      <button
        type="button"
        onClick={onOpen}
        className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
      >
        reglas de la comunidad
      </button>
      .
    </p>
  )
}

export default TopicRulesReminder
