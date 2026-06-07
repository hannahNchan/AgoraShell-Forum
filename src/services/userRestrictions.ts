import { supabase } from './supabase'
import { can, roleFromId } from './permissions'

export const ensureUserCanCreateContent = async (userId?: string) => {
  if (!userId) throw new Error('Debes iniciar sesión.')

  const { data, error } = await supabase
    .from('profiles')
    .select('role_id, role, suspended_until')
    .eq('id', userId)
    .single()
  if (error) throw error

  const role = data?.role ?? roleFromId(data?.role_id)
  if (!can({ role, role_id: data?.role_id ?? 3, suspended_until: data?.suspended_until }, 'create_reply')) {
    throw new Error('Tu cuenta está suspendida y no puedes publicar contenido.')
  }
}
