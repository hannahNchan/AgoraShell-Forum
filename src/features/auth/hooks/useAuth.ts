import { useSelector } from 'react-redux'
import { type RootState } from '../../../store'
import { can, getEffectiveRole } from '../../../services/permissions'

export const useAuth = () => {
  const { user, profile, session, loading } = useSelector((state: RootState) => state.auth)
  const isAuthenticated = !!session && !!user && !!profile
  const role = isAuthenticated ? getEffectiveRole(profile) : null

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isAdmin: role === 'admin',
    isModerator: isAuthenticated && can(role, 'review_reports'),
  }
}
