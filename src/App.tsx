import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { type AppDispatch } from './store'
import { clearAuthState, hydrateAuthSession, loadAuthUser } from './features/auth/store/authSlice'
import { supabase } from './services/supabase'
import AppRouter from './routes'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    let active = true
    dispatch(loadAuthUser())
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (!session) {
        dispatch(clearAuthState())
        return
      }
      setTimeout(() => {
        if (!active) return
        dispatch(hydrateAuthSession(session))
      }, 0)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [dispatch])

  return <AppRouter />
}

export default App
