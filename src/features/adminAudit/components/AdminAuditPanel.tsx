import { useEffect, useMemo, useState } from 'react'
import { Activity, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import Spinner from '../../../components/shared/Spinner'
import { fetchAdminAuditLogs } from '../store/adminAuditSlice'

const actionLabel: Record<string, string> = {
  'channel.create': 'Canal creado',
  'channel.delete': 'Canal eliminado',
  'topic.pin': 'Tema fijado',
  'topic.unpin': 'Tema desfijado',
  'topic.close': 'Tema cerrado',
  'topic.reopen': 'Tema reabierto',
  'topic.delete': 'Tema eliminado',
  'reply.delete': 'Respuesta eliminada',
  'reply.moderation_delete': 'Respuesta borrada por moderacion',
  'report.claim': 'Reporte tomado',
  'report.release': 'Reporte liberado',
  'report.dismiss': 'Reporte descartado',
  'report.resolve': 'Reporte resuelto',
  'user.role_change': 'Rol cambiado',
  'user.suspend': 'Usuario suspendido',
  'user.ban': 'Usuario baneado',
  'user.delete_requested': 'Borrado de usuario solicitado',
  'user.deleted': 'Usuario borrado',
  'user.restriction_lift': 'Restriccion levantada',
  'settings.update': 'Configuracion actualizada',
  'forum.lock': 'Foro bloqueado',
  'forum.unlock': 'Foro reactivado',
}

const targetLabel: Record<string, string> = {
  channel: 'Canal',
  topic: 'Tema',
  reply: 'Respuesta',
  report: 'Reporte',
  user: 'Usuario',
  settings: 'Settings',
  forum: 'Foro',
}

const AdminAuditPanel = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading, error } = useSelector((state: RootState) => state.adminAudit)
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    dispatch(fetchAdminAuditLogs())
  }, [dispatch])

  const actions = useMemo(() => Array.from(new Set(items.map((item) => item.action))).sort(), [items])
  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    return items.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false
      if (!cleanQuery) return true
      const haystack = [
        actionLabel[item.action] ?? item.action,
        item.actor?.username,
        item.actor_role,
        item.target_type,
        item.target_label,
        JSON.stringify(item.metadata ?? {}),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(cleanQuery)
    })
  }, [actionFilter, items, query])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="space-y-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Auditoria administrativa</h2>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-400 dark:border-slate-700">
              {filtered.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchAdminAuditLogs())}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por actor, accion o objetivo"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="all">Todas las acciones</option>
            {actions.map((action) => (
              <option key={action} value={action}>{actionLabel[action] ?? action}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <div className="px-5 py-6 text-sm text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">No hay acciones registradas.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((item) => (
            <div key={item.id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[1.1fr_1fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0 text-slate-400" />
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {actionLabel[item.action] ?? item.action}
                  </p>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {item.actor?.username ?? 'Sistema'} · {item.actor_role ?? 'rol desconocido'}
                </p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {targetLabel[item.target_type] ?? item.target_type}: {item.target_label ?? item.target_id ?? 'sin objetivo'}
                </p>
                {Object.keys(item.metadata ?? {}).length > 0 && (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                    {JSON.stringify(item.metadata)}
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400 md:text-right">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminAuditPanel
