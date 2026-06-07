export type ModerationPenalty = 'none' | 'suspend' | 'ban'

export interface ModerationReasonOption {
  id: string
  label: string
  detail: string
  defaultDays?: number
}

export const MODERATION_REASONS: ModerationReasonOption[] = [
  {
    id: 'spam_or_manipulation',
    label: 'Spam o manipulacion',
    detail: 'Spam, autopromocion repetitiva, fraude, bots o manipulacion de votos.',
    defaultDays: 3,
  },
  {
    id: 'harassment_or_bullying',
    label: 'Acoso o intimidacion',
    detail: 'Ataques personales, persecucion, insultos dirigidos o comportamiento abusivo.',
    defaultDays: 7,
  },
  {
    id: 'hate_or_abuse',
    label: 'Odio o abuso grave',
    detail: 'Ataques contra identidad, amenazas, incitacion al odio o abuso severo.',
    defaultDays: 30,
  },
  {
    id: 'personal_information',
    label: 'Informacion personal',
    detail: 'Doxxing, datos privados, enlaces a informacion personal o intentos de exponer a alguien.',
    defaultDays: 30,
  },
  {
    id: 'sexual_or_exploitative',
    label: 'Contenido sexual o explotacion',
    detail: 'Contenido sexual no permitido, explotacion, insinuaciones hacia menores o material no consentido.',
    defaultDays: 30,
  },
  {
    id: 'violent_or_threatening',
    label: 'Violencia o amenazas',
    detail: 'Amenazas creibles, glorificacion de violencia o instrucciones para hacer dano.',
    defaultDays: 30,
  },
  {
    id: 'ban_evasion',
    label: 'Evasion de ban',
    detail: 'Uso de cuentas alternativas para evadir sanciones o restricciones previas.',
    defaultDays: 30,
  },
  {
    id: 'off_topic_or_low_quality',
    label: 'Fuera de tema o baja calidad',
    detail: 'Contenido repetitivo, ruido, provocaciones o publicaciones fuera del canal.',
    defaultDays: 1,
  },
  {
    id: 'custom_moderator_reason',
    label: 'Motivo personalizado',
    detail: 'Decision manual del equipo de moderacion.',
    defaultDays: 7,
  },
]

export const getModerationReason = (id: string) =>
  MODERATION_REASONS.find((reason) => reason.id === id) ?? MODERATION_REASONS[0]

export const buildModerationReasonText = (reasonId: string, note?: string) => {
  const reason = getModerationReason(reasonId)
  const cleanNote = note?.trim()
  return cleanNote ? `${reason.label}: ${cleanNote}` : `${reason.label}: ${reason.detail}`
}

export const moderationDeletedReplyHtml = (reason: string) =>
  `<p><em>Mensaje borrado por moderacion: ${reason.replace(/[<>&"]/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
  }[char] ?? char))}</em></p>`
