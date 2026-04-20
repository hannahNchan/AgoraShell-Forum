import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../services/supabase'
import Spinner from '../../../components/shared/Spinner'

const AuthCallbackPage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        navigate('/login?error=callback_failed', { replace: true })
        return
      }
      navigate('/', { replace: true })
    }
    handle()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">Verificando tu cuenta...</p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
