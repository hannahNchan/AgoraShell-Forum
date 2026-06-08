import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import { type ReputationSummary, getReputationLevel } from '../reputation'

interface ReputationBadgeProps {
  userId?: string | null
  summary?: Pick<ReputationSummary, 'shell_score' | 'level_name'> | null
  compact?: boolean
}

const ReputationBadge = ({ userId, summary, compact = false }: ReputationBadgeProps) => {
  const [fetchedSummary, setFetchedSummary] = useState<{
    userId: string
    summary: Pick<ReputationSummary, 'shell_score' | 'level_name'> | null
  } | null>(null)

  useEffect(() => {
    if (summary || !userId) return

    let cancelled = false

    const run = async () => {
      const { data } = await supabase
        .from('user_reputation_scores')
        .select('shell_score, level_name')
        .eq('user_id', userId)
        .maybeSingle()
      if (!cancelled) {
        setFetchedSummary({
          userId,
          summary: data as Pick<ReputationSummary, 'shell_score' | 'level_name'> | null,
        })
      }
    }

    void run()
    return () => { cancelled = true }
  }, [summary, userId])

  const currentFetchedSummary = fetchedSummary && fetchedSummary.userId === userId ? fetchedSummary.summary : null
  const currentSummary = summary ?? currentFetchedSummary
  const score = currentSummary?.shell_score ?? 0
  const levelName = currentSummary?.level_name ?? getReputationLevel(score).name

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
      <Sparkles size={compact ? 10 : 12} />
      <span>{levelName}</span>
      <span className="text-indigo-500 dark:text-indigo-300">{score}</span>
    </span>
  )
}

export default ReputationBadge
