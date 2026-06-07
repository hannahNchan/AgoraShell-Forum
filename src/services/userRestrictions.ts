import { supabase } from './supabase'

export const ensureUserCanCreateContent = async (userId?: string) => {
  if (!userId) throw new Error('Debes iniciar sesión.')

  const { data, error } = await supabase
    .from('profiles')
    .select('role_id, suspended_until')
    .eq('id', userId)
    .single()
  if (error) throw error

  const suspendedUntil = data?.suspended_until ? new Date(data.suspended_until).getTime() : 0
  if (data?.role_id === 4 || suspendedUntil > Date.now()) {
    throw new Error('Tu cuenta está suspendida y no puedes publicar contenido.')
  }
}
