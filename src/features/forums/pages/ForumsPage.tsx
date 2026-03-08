import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { MessageSquare, Trash2 } from 'lucide-react'
import { type RootState, type AppDispatch } from '../../../store'
import { useRole } from '../../auth/hooks/useRole'
import { useConfirm } from '../../../hooks/useConfirm'
import { deleteChannel } from '../store/forumsSlice'
import { supabase } from '../../../services/supabase'

export const ForumsPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const channels = useSelector((state: RootState) => state.channels.items)
  const { isAdmin } = useRole()
  const { confirm } = useConfirm()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, channelId: string) => {
    e.preventDefault()
    setErrorId(null)

    const { count } = await supabase
      .from('topics')
      .select('id', { count: 'exact', head: true })
      .eq('channel_id', channelId)

    if (count && count > 0) {
      setErrorId(channelId)
      setTimeout(() => setErrorId(null), 3000)
      return
    }

    const ok = await confirm('Eliminar canal', '¿Eliminar este canal? Esta acción no se puede deshacer.')
    if (!ok) return

    setDeletingId(channelId)
    await dispatch(deleteChannel(channelId))
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Canales</h1>
        <p className="text-slate-500 text-sm mt-1">Elige un canal para ver los temas de discusión</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex flex-col gap-4">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group">
              <Link
                to={`/channels/${channel.id}`}
                className="flex items-center gap-4 p-5 pb-2 hover:cursor-pointer"
              >
                <div className="text-3xl">{channel.icon}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {channel.name}
                  </h2>
                  {channel.description && (
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{channel.description}</p>
                  )}
                  {errorId === channel.id && (
                    <p className="text-xs text-red-500 mt-1">No se puede eliminar: el canal tiene topics.</p>
                  )}
                </div>
                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <MessageSquare size={20} />
                </div>
              </Link>
              {isAdmin && (
                <div className="flex items-center gap-4 px-5 pb-3">
                  <span className="text-xs text-slate-400">
                    Creado por @<span className="font-medium">
                      {channel.created_by_profile?.username ?? 'bot >'}
                    </span>
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, channel.id)}
                    disabled={deletingId === channel.id}
                    className="flex items-center gap-1 text-xs text-red-500 bg-red-50 hover:text-red-800 hover:bg-red-200 hover:cursor-pointer px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                    <span>Borrar canal</span>
                  </button>
                </div>
              )}
            </div>
          ))}
          {channels.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay canales todavía</p>
              <p className="text-sm mt-1">Un administrador puede crear el primer canal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ForumsPage
