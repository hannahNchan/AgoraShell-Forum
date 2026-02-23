import { useSelector } from 'react-redux'
import { type RootState } from '../../../store'

export const useAuth = () => {
  const { user, profile, session, loading } = useSelector((state: RootState) => state.auth)

  return {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin',
    isModerator: profile?.role === 'admin' || profile?.role === 'moderator',
  }
}
