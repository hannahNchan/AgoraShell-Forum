import { useSelector } from 'react-redux'
import { type RootState } from '../../../store'

export const useAuth = () => {
  const { user, profile, session, loading } = useSelector((state: RootState) => state.auth)
  const isAuthenticated = !!session && !!user && !!profile

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isAdmin: isAuthenticated && profile?.role === 'admin',
    isModerator: isAuthenticated && (profile?.role === 'admin' || profile?.role === 'moderator'),
  }
}
