import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ExternalLink, Flag, Inbox, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchReports, updateReportStatus } from '../store/reportsSlice'
import Spinner from '../../../components/shared/Spinner'
import { type Report, type ReportReason, type ReportStatus, type ReportTargetType } from '../../../types'

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
  reviewed: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  dismissed: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
}

const statusLabel: Record<ReportStatus, string> = {
  pending: 'Pendiente',
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

const ReportsAdminPanel = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading, error } = useSelector((state: RootState) => state.reports)
  const pendingCount = useMemo(() => items.filter((report) => report.status === 'pending').length, [items])

  useEffect(() => {
    dispatch(fetchReports())
  }, [dispatch])

  const handleStatus = (reportId: string, status: ReportStatus) => {
    dispatch(updateReportStatus({ reportId, status }))
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-red-500" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reportes</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {pendingCount} pendientes
          </span>
        </div>
        <button
          onClick={() => dispatch(fetchReports())}
          className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="p-5 text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400">
          <Inbox size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          No hay reportes todavía.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.map((report) => {
            const link = reportLink(report)
            const preview = report.target_type === 'reply' ? stripHtml(report.target_reply?.content) : report.target_topic?.title
            return (
              <div key={report.id} className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Reportado por <span className="font-medium text-slate-700 dark:text-slate-300">{report.reporter?.username ?? 'Usuario'}</span>
                      </div>
                      <div>
                        Reportado <span className="font-medium text-slate-700 dark:text-slate-300">{report.reported_user?.username ?? 'Contenido'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40 shrink-0">
                    {link && (
                      <Link
                        to={link}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Ver contenido
                      </Link>
                    )}
                    {report.status !== 'reviewed' && (
                      <button
                        onClick={() => handleStatus(report.id, 'reviewed')}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Revisado
                      </button>
                    )}
                    {report.status !== 'dismissed' && (
                      <button
                        onClick={() => handleStatus(report.id, 'dismissed')}
                        className="hover:cursor-pointer inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <XCircle size={14} />
                        Descartar
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
