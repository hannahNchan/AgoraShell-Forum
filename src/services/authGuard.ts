import { type RootState } from '../store'
import { supabase } from './supabase'

export const requireSyncedAuthUser = async (state: RootState) => {
  const stateUserId = state.auth.user?.id

  if (!state.auth.session || !state.auth.profile || !stateUserId) {
    throw new Error('Debes iniciar sesion para publicar.')
  }

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error

  if (!user || user.id !== stateUserId) {
    throw new Error('Tu sesion cambio. Vuelve a iniciar sesion.')
  }

  return user
}
