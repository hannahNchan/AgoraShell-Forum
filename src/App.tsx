import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { type AppDispatch } from './store'
import { clearAuthState, loadAuthUser } from './features/auth/store/authSlice'
import { supabase } from './services/supabase'
import AppRouter from './routes'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(loadAuthUser())
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        dispatch(clearAuthState())
        return
      }
      dispatch(loadAuthUser())
    })

    return () => subscription.unsubscribe()
  }, [dispatch])

  return <AppRouter />
}

export default App
