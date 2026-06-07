import { type RootState } from '../../../store'
import { type UserRole } from '../../../types'
import { can, getEffectiveRole } from '../../../services/permissions'

export const selectUser = (state: RootState) => state.auth.user
export const selectProfile = (state: RootState) => state.auth.profile
export const selectUserRole = (state: RootState): UserRole | null =>
  state.auth.session && state.auth.user && state.auth.profile
    ? getEffectiveRole(state.auth.profile)
    : null

export const selectIsAdmin = (state: RootState) =>
  !!state.auth.session && !!state.auth.user && selectUserRole(state) === 'admin'

export const selectIsModerator = (state: RootState) =>
  !!state.auth.session &&
  !!state.auth.user &&
  can(selectUserRole(state), 'review_reports')

export const selectIsBanned = (state: RootState) =>
  !!state.auth.session &&
  !!state.auth.user &&
  selectUserRole(state) === 'banned'

export const selectCanModerate = selectIsModerator
