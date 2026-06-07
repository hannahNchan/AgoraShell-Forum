import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle, ClipboardList, ExternalLink, Flag, Inbox,
  RotateCcw, Search, UserCheck, XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { claimReport, fetchReports, releaseReport, updateReportStatus } from '../store/reportsSlice'
import Spinner from '../../../components/shared/Spinner'
import { type Report, type ReportReason, type ReportStatus, type ReportTargetType } from '../../../types'

type StatusFilter = 'open' | ReportStatus | 'all'
type TargetFilter = ReportTargetType | 'all'
type ReasonFilter = ReportReason | 'all'

const reasonLabel: Record<ReportReason, string> = {
  spam: 'Spam',
  abuse: 'Acoso o abuso',
  offensive: 'Contenido ofensivo',
  personal_info: 'Información personal',
  off_topic: 'Fuera de tema',
  other: 'Otro',
}

const targetLabel: Record<ReportTargetType, string> = {
  topic: 'Tema',
  reply: 'Respuesta',
  user: 'Usuario',
}

const statusStyles: Record<ReportStatus, string> = {
  pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  in_review: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  reviewed: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  dismissed: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
}

const statusLabel: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  in_review: 'En revisión',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
}

const stripHtml = (html?: string | null) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const reportLink = (report: Report) => {
  if (report.target_type === 'topic' && report.target_topic) {
    return `/channels/${report.target_topic.channel_id}/topics/${report.target_topic.id}`
  }
  if (report.target_type === 'reply' && report.target_reply) {
    return `/channels/topics/${report.target_reply.topic_id}/thread/${report.target_reply.id}`
  }
  return null
}

const previewText = (report: Report) => {
  if (report.target_type === 'reply') return stripHtml(report.target_reply?.content)
  if (report.target_type === 'topic') return report.target_topic?.title ?? ''
  return report.reported_user?.username ? `Usuario: ${report.reported_user.username}` : 'Usuario reportado'
}

const isHighPriority = (report: Report) =>
  report.status === 'pending' && ['abuse', 'personal_info', 'offensive'].includes(report.reason)

const statusOrder: Record<ReportStatus, number> = {
  pending: 0,
  in_review: 1,
  reviewed: 2,
  dismissed: 3,
}

const ReportsAdminPanel = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading, error } = useSelector((state: RootState) => state.reports)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [targetFilter, setTargetFilter] = useState<TargetFilter>('all')
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all')
  const [query, setQuery] = useState('')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [moderatorNote, setModeratorNote] = useState('')

  useEffect(() => {
    dispatch(fetchReports())
  }, [dispatch])

  const counts = useMemo(() => ({
    pending: items.filter((report) => report.status === 'pending').length,
    inReview: items.filter((report) => report.status === 'in_review').length,
    closed: items.filter((report) => report.status === 'reviewed' || report.status === 'dismissed').length,
    urgent: items.filter(isHighPriority).length,
  }), [items])

  const filteredReports = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    return [...items]
      .filter((report) => {
        if (statusFilter === 'open' && report.status !== 'pending' && report.status !== 'in_review') return false
        if (statusFilter !== 'open' && statusFilter !== 'all' && report.status !== statusFilter) return false
        if (targetFilter !== 'all' && report.target_type !== targetFilter) return false
        if (reasonFilter !== 'all' && report.reason !== reasonFilter) return false
        if (!cleanQuery) return true

        const haystack = [
          report.reporter?.username,
          report.reported_user?.username,
          report.details,
          previewText(report),
          reasonLabel[report.reason],
          targetLabel[report.target_type],
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(cleanQuery)
      })
      .sort((a, b) => {
        const priorityDelta = Number(isHighPriority(b)) - Number(isHighPriority(a))
        if (priorityDelta !== 0) return priorityDelta
        const statusDelta = statusOrder[a.status] - statusOrder[b.status]
        if (statusDelta !== 0) return statusDelta
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [items, query, reasonFilter, statusFilter, targetFilter])

  const handleClose = (reportId: string, status: Extract<ReportStatus, 'reviewed' | 'dismissed'>) => {
    dispatch(updateReportStatus({ reportId, status, moderatorNote }))
    setActiveNoteId(null)
    setModeratorNote('')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={17} className="text-red-500" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cola de moderación</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {counts.pending + counts.inReview} abiertos
            </span>
          </div>
          <button
            onClick={() => dispatch(fetchReports())}
            className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{counts.pending}</div>
            <div className="text-xs text-amber-700/80 dark:text-amber-300/80">Pendientes</div>
          </div>
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2">
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{counts.inReview}</div>
            <div className="text-xs text-indigo-700/80 dark:text-indigo-300/80">En revisión</div>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
            <div className="text-lg font-bold text-red-700 dark:text-red-300">{counts.urgent}</div>
            <div className="text-xs text-red-700/80 dark:text-red-300/80">Alta prioridad</div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
            <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{counts.closed}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Cerrados</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por usuario, motivo o texto"
              className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="hover:cursor-pointer border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="open">Abiertos</option>
            <option value="pending">Pendientes</option>
            <option value="in_review">En revisión</option>
            <option value="reviewed">Revisados</option>
            <option value="dismissed">Descartados</option>
            <option value="all">Todos</option>
          </select>
          <select
            value={targetFilter}
            onChange={(event) => setTargetFilter(event.target.value as TargetFilter)}
            className="hover:cursor-pointer border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="topic">Temas</option>
            <option value="reply">Respuestas</option>
            <option value="user">Usuarios</option>
          </select>
          <select
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value as ReasonFilter)}
            className="hover:cursor-pointer border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los motivos</option>
            {Object.entries(reasonLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="p-5 text-sm text-red-500">{error}</div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          <Inbox size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          No hay reportes para estos filtros.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {filteredReports.map((report) => {
            const link = reportLink(report)
            const preview = previewText(report)
            const noteOpen = activeNoteId === report.id
            return (
              <div key={report.id} className={`p-4 sm:p-5 transition-colors ${isHighPriority(report) ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isHighPriority(report) && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                          <AlertTriangle size={12} />
                          Prioridad
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusStyles[report.status]}`}>
                        {statusLabel[report.status]}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{targetLabel[report.target_type]}</span>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{reasonLabel[report.reason]}</p>
                      {report.details && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">{report.details}</p>}
                      {preview && <p className="text-xs text-slate-400 mt-2 line-clamp-2 break-words">{preview}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Reportó <span className="font-medium text-slate-700 dark:text-slate-300">{report.reporter?.username ?? 'Usuario'}</span>
                      </div>
                      <div>
                        Reportado <span className="font-medium text-slate-700 dark:text-slate-300">{report.reported_user?.username ?? 'Contenido'}</span>
                      </div>
                      <div>
                        Moderador <span className="font-medium text-slate-700 dark:text-slate-300">{report.assigned_moderator?.username ?? report.handled_by?.username ?? 'Sin asignar'}</span>
                      </div>
                    </div>

                    {report.moderator_note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2">
                        Nota: {report.moderator_note}
                      </p>
                    )}

                    {noteOpen && (
                      <div className="space-y-2">
                        <textarea
                          value={moderatorNote}
                          onChange={(event) => setModeratorNote(event.target.value)}
                          maxLength={1000}
                          rows={3}
                          placeholder="Nota interna opcional para cerrar este reporte"
                          className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <button
                            onClick={() => handleClose(report.id, 'reviewed')}
                            className="hover:cursor-pointer inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <CheckCircle size={14} />
                            Cerrar como revisado
                          </button>
                          <button
                            onClick={() => handleClose(report.id, 'dismissed')}
                            className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <XCircle size={14} />
                            Descartar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 xl:w-44 shrink-0">
                    {link && (
                      <Link
                        to={link}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Ver contenido
                      </Link>
                    )}
                    {report.status === 'pending' && (
                      <button
                        onClick={() => dispatch(claimReport(report.id))}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <UserCheck size={14} />
                        Tomar caso
                      </button>
                    )}
                    {report.status === 'in_review' && (
                      <button
                        onClick={() => dispatch(releaseReport(report.id))}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        <RotateCcw size={14} />
                        Liberar
                      </button>
                    )}
                    {(report.status === 'pending' || report.status === 'in_review') && (
                      <button
                        onClick={() => {
                          setActiveNoteId(noteOpen ? null : report.id)
                          setModeratorNote(report.moderator_note ?? '')
                        }}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <Flag size={14} />
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ReportsAdminPanel
