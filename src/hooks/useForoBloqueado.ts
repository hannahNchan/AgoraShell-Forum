import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export const useForoBloqueado = () => {
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('foro_bloqueado')
        .eq('id', 1)
        .single()
      if (data) setBloqueado(data.foro_bloqueado ?? false)
    }
    fetch()

    const channel = supabase
      .channel('foro-bloqueado')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings', filter: 'id=eq.1' },
        (payload) => { setBloqueado(payload.new.foro_bloqueado ?? false) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return bloqueado
}
