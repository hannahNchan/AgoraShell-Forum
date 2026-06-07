import { supabase } from './supabase'
import { can, roleFromId } from './permissions'
import { type UserRole } from '../types'

type ProfileRoleRow = {
  role_id: number | null
  role?: string | null
  roles?: { name?: string } | { name?: string }[] | null
}

export const ensureForumCanPublish = async (userId?: string) => {
  const { data } = await supabase
    .from('app_settings')
    .select('foro_bloqueado')
    .eq('id', 1)
    .single()
  if (!data?.foro_bloqueado) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, role, roles(name)')
    .eq('id', userId)
    .single()
  const profileRow = profile as ProfileRoleRow | null
  const roles = profileRow?.roles
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name
  const rawRole = profileRow?.role ?? roleName
  const role: UserRole = rawRole === 'admin' || rawRole === 'moderator' || rawRole === 'user' || rawRole === 'banned'
    ? rawRole
    : roleFromId(profileRow?.role_id)
  if (!can(role, 'toggle_forum_lock')) {
    throw new Error('El foro está temporalmente bloqueado.')
  }
}
