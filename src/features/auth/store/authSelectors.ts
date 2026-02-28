import { type RootState } from '../../../store'
import { type UserRole } from '../../../types'

export const selectUser = (state: RootState) => state.auth.user
export const selectProfile = (state: RootState) => state.auth.profile
export const selectUserRole = (state: RootState): UserRole | null =>
  (state.auth.profile?.role as UserRole) ?? null

export const selectIsAdmin = (state: RootState) =>
  state.auth.profile?.role === 'admin'

export const selectIsModerator = (state: RootState) =>
  state.auth.profile?.role === 'moderator' || state.auth.profile?.role === 'admin'

export const selectIsBanned = (state: RootState) =>
  state.auth.profile?.role === 'banned'

export const selectCanModerate = selectIsModerator
