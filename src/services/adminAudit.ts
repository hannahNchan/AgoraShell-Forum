import { supabase } from './supabase'
import { getEffectiveRole } from './permissions'
import { type Profile } from '../types'

export type AdminAuditAction =
  | 'channel.create'
  | 'channel.delete'
  | 'topic.pin'
  | 'topic.unpin'
  | 'topic.close'
  | 'topic.reopen'
  | 'topic.delete'
  | 'reply.delete'
  | 'reply.moderation_delete'
  | 'report.claim'
  | 'report.release'
  | 'report.dismiss'
  | 'report.resolve'
  | 'user.role_change'
  | 'user.suspend'
  | 'user.ban'
  | 'user.restriction_lift'
  | 'settings.update'
  | 'forum.lock'
  | 'forum.unlock'

export type AdminAuditTargetType =
  | 'channel'
  | 'topic'
  | 'reply'
  | 'report'
  | 'user'
  | 'settings'
  | 'forum'

interface LogAdminActionInput {
  actor?: Pick<Profile, 'id' | 'role' | 'role_id' | 'suspended_until'> | null
  action: AdminAuditAction
  targetType: AdminAuditTargetType
  targetId?: string | null
  targetLabel?: string | null
  metadata?: Record<string, unknown>
}

export const logAdminAction = async ({
  actor,
  action,
  targetType,
  targetId,
  targetLabel,
  metadata = {},
}: LogAdminActionInput) => {
  if (!actor?.id) return

  const { error } = await supabase.from('admin_audit_logs').insert([{
    actor_id: actor.id,
    actor_role: getEffectiveRole(actor),
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    target_label: targetLabel ?? null,
    metadata,
  }])

  if (error) {
    console.warn('No se pudo registrar la auditoria administrativa', error.message)
  }
}
