import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { MessageSquare, Flame, Users } from 'lucide-react'
import { type RootState } from '../../../store'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const ForumsPage = () => {
  const channels = useSelector((state: RootState) => state.channels.items)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Canales</h1>
        <p className="text-slate-500 text-sm mt-1">Elige un canal para ver los temas de discusión</p>
      </div>

      <div className="grid gap-3">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            to={`/channels/${channel.id}`}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{channel.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {channel.name}
                </h2>
                {channel.description && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{channel.description}</p>
                )}
              </div>
              <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                <MessageSquare size={20} />
              </div>
            </div>
          </Link>
        ))}

        {channels.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay canales todavía</p>
            <p className="text-sm mt-1">Un administrador puede crear el primer canal</p>
          </div>
        )}
      </div>

      {/* Hot Topics section */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-orange-500" />
          <h3 className="font-semibold text-slate-700 text-sm">Hot Topics</h3>
        </div>
        <p className="text-sm text-slate-500">Los temas con más actividad aparecerán aquí.</p>
      </div>
    </div>
  )
}

export default ForumsPage
