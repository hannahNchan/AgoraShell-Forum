import { supabase } from './supabase'

type ProfileRoleRow = {
  role_id: number | null
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
    .select('role_id, roles(name)')
    .eq('id', userId)
    .single()
  const profileRow = profile as ProfileRoleRow | null
  const roles = profileRow?.roles
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name
  if (profileRow?.role_id !== 1 && roleName !== 'admin') {
    throw new Error('El foro está temporalmente bloqueado.')
  }
}
