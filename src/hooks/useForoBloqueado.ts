import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { supabase } from '../services/supabase'
import { selectIsAdmin } from '../features/auth/store/authSelectors'

let currentBloqueado = false
const listeners = new Set<(bloqueado: boolean) => void>()
let channel: ReturnType<typeof supabase.channel> | null = null
let subscribers = 0

const setBloqueadoGlobal = (bloqueado: boolean) => {
  currentBloqueado = bloqueado
  listeners.forEach((listener) => listener(bloqueado))
}

export const useForoBloqueado = () => {
  const isAdmin = useSelector(selectIsAdmin)
  const [bloqueado, setBloqueado] = useState(currentBloqueado)

  useEffect(() => {
    subscribers += 1
    listeners.add(setBloqueado)

    const fetch = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('foro_bloqueado')
        .eq('id', 1)
        .single()
      if (data) setBloqueadoGlobal(data.foro_bloqueado ?? false)
    }
    fetch()

    if (!channel) {
      channel = supabase
        .channel('foro-bloqueado')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
          (payload) => { setBloqueadoGlobal(payload.new.foro_bloqueado ?? false) }
        )
        .subscribe()
    }

    return () => {
      listeners.delete(setBloqueado)
      subscribers -= 1
      if (subscribers === 0 && channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [])

  return bloqueado && !isAdmin
}
