import { type Profile, type UserRole } from '../types'

export type PermissionAction =
  | 'view_forum'
  | 'create_channel'
  | 'delete_channel'
  | 'create_topic'
  | 'create_reply'
  | 'edit_own_content'
  | 'delete_own_content'
  | 'delete_any_content'
  | 'close_topic'
  | 'pin_topic'
  | 'report_content'
  | 'review_reports'
  | 'resolve_reports'
  | 'ban_user'
  | 'suspend_user'
  | 'change_roles'
  | 'manage_admin_settings'
  | 'toggle_forum_lock'
  | 'react_to_content'

export const roleFromId = (roleId?: number | null): UserRole => {
  if (roleId === 1) return 'admin'
  if (roleId === 2) return 'moderator'
  if (roleId === 4) return 'banned'
  return 'user'
}

export const getEffectiveRole = (profile?: Pick<Profile, 'role' | 'role_id' | 'suspended_until'> | null): UserRole | null => {
  if (!profile) return null
  const suspendedUntil = profile.suspended_until ? new Date(profile.suspended_until).getTime() : 0
  if (profile.role === 'banned' || profile.role_id === 4 || suspendedUntil > Date.now()) return 'banned'
  return profile.role ?? roleFromId(profile.role_id)
}

export const ROLE_PERMISSIONS: Record<UserRole, Record<PermissionAction, boolean>> = {
  admin: {
    view_forum: true,
    create_channel: true,
    delete_channel: true,
    create_topic: true,
    create_reply: true,
    edit_own_content: true,
    delete_own_content: true,
    delete_any_content: true,
    close_topic: true,
    pin_topic: true,
    report_content: true,
    review_reports: true,
    resolve_reports: true,
    ban_user: true,
    suspend_user: true,
    change_roles: true,
    manage_admin_settings: true,
    toggle_forum_lock: true,
    react_to_content: true,
  },
  moderator: {
    view_forum: true,
    create_channel: false,
    delete_channel: false,
    create_topic: true,
    create_reply: true,
    edit_own_content: true,
    delete_own_content: true,
    delete_any_content: true,
    close_topic: true,
    pin_topic: true,
    report_content: true,
    review_reports: true,
    resolve_reports: true,
    ban_user: true,
    suspend_user: true,
    change_roles: false,
    manage_admin_settings: false,
    toggle_forum_lock: false,
    react_to_content: true,
  },
  user: {
    view_forum: true,
    create_channel: false,
    delete_channel: false,
    create_topic: true,
    create_reply: true,
    edit_own_content: true,
    delete_own_content: true,
    delete_any_content: false,
    close_topic: false,
    pin_topic: false,
    report_content: true,
    review_reports: false,
    resolve_reports: false,
    ban_user: false,
    suspend_user: false,
    change_roles: false,
    manage_admin_settings: false,
    toggle_forum_lock: false,
    react_to_content: true,
  },
  banned: {
    view_forum: true,
    create_channel: false,
    delete_channel: false,
    create_topic: false,
    create_reply: false,
    edit_own_content: false,
    delete_own_content: false,
    delete_any_content: false,
    close_topic: false,
    pin_topic: false,
    report_content: false,
    review_reports: false,
    resolve_reports: false,
    ban_user: false,
    suspend_user: false,
    change_roles: false,
    manage_admin_settings: false,
    toggle_forum_lock: false,
    react_to_content: false,
  },
}

export const can = (
  profile: Pick<Profile, 'role' | 'role_id' | 'suspended_until'> | UserRole | null | undefined,
  action: PermissionAction
) => {
  const role = typeof profile === 'string' ? profile : getEffectiveRole(profile)
  return role ? ROLE_PERMISSIONS[role][action] : false
}

export const canModerateTarget = (
  actor: Pick<Profile, 'role' | 'role_id' | 'suspended_until'> | UserRole | null | undefined,
  target: Pick<Profile, 'role' | 'role_id' | 'suspended_until'> | UserRole | null | undefined
) => {
  const actorRole = typeof actor === 'string' ? actor : getEffectiveRole(actor)
  const targetRole = typeof target === 'string' ? target : getEffectiveRole(target)
  if (!actorRole || !targetRole) return false
  if (targetRole === 'admin') return false
  if (actorRole === 'admin') return true
  return actorRole === 'moderator' && targetRole === 'user'
}
