import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { type AppDispatch } from './store'
import { loadAuthUser } from './features/auth/store/authSlice'
import AppRouter from './routes'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(loadAuthUser())
  }, [dispatch])

  return <AppRouter />
}

export default App
