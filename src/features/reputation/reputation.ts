export interface ReputationSummary {
  user_id: string
  shell_score: number
  stars_received: number
  reply_reactions_received: number
  topics_created: number
  replies_created: number
  level_name: ReputationLevelName
  level_range: string
}

export type ReputationLevelName = 'Visitante' | 'Aportador' | 'Conector' | 'Referente' | 'Arquitecto'

export const REPUTATION_LEVELS: Array<{ name: ReputationLevelName; min: number; max: number | null; range: string }> = [
  { name: 'Visitante', min: 0, max: 49, range: '0 - 49' },
  { name: 'Aportador', min: 50, max: 249, range: '50 - 249' },
  { name: 'Conector', min: 250, max: 499, range: '250 - 499' },
  { name: 'Referente', min: 500, max: 999, range: '500 - 999' },
  { name: 'Arquitecto', min: 1000, max: null, range: '1000+' },
]

export const getReputationLevel = (score: number) => {
  const cleanScore = Math.max(0, score)
  return [...REPUTATION_LEVELS].reverse().find((level) => cleanScore >= level.min) ?? REPUTATION_LEVELS[0]
}

export const getNextReputationLevel = (score: number) => REPUTATION_LEVELS.find((level) => score < level.min) ?? null

export const getReputationProgress = (score: number) => {
  const level = getReputationLevel(score)
  const next = getNextReputationLevel(score)
  if (!next || level.max === null) return 100
  const span = next.min - level.min
  return Math.min(100, Math.max(0, ((score - level.min) / span) * 100))
}
