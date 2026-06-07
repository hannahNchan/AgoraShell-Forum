import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Ban, CheckCircle, ClipboardList, ExternalLink, Flag, Inbox,
  RotateCcw, Search, Trash2, UserCheck, XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { claimReport, fetchReports, releaseReport, resolveReportWithAction, updateReportStatus } from '../store/reportsSlice'
import Spinner from '../../../components/shared/Spinner'
import { type Report, type ReportReason, type ReportStatus, type ReportTargetType } from '../../../types'
import { MODERATION_REASONS, getModerationReason, type ModerationPenalty } from '../constants/moderationCatalog'

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
  const [penalty, setPenalty] = useState<ModerationPenalty>('none')
  const [moderationReasonId, setModerationReasonId] = useState(MODERATION_REASONS[0].id)
  const [durationDays, setDurationDays] = useState(7)
  const [deleteReply, setDeleteReply] = useState(false)
  const [resolveError, setResolveError] = useState('')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

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

  const openResolve = (report: Report, noteOpen: boolean) => {
    setActiveNoteId(noteOpen ? null : report.id)
    setModeratorNote(report.moderator_note ?? '')
    setResolveError('')
    setPenalty('none')
    const mappedReason = report.reason === 'spam'
      ? 'spam_or_manipulation'
      : report.reason === 'abuse'
        ? 'harassment_or_bullying'
        : report.reason === 'offensive'
          ? 'hate_or_abuse'
          : report.reason === 'personal_info'
            ? 'personal_information'
            : report.reason === 'off_topic'
              ? 'off_topic_or_low_quality'
              : 'custom_moderator_reason'
    setModerationReasonId(mappedReason)
    setDurationDays(getModerationReason(mappedReason).defaultDays ?? 7)
    setDeleteReply(false)
  }

  const handleResolve = async (report: Report) => {
    setResolveError('')
    setResolvingId(report.id)
    try {
      await dispatch(resolveReportWithAction({
        report,
        moderatorNote,
        penalty,
        reasonId: moderationReasonId,
        durationDays,
        deleteReply,
      })).unwrap()
      setActiveNoteId(null)
      setModeratorNote('')
      setPenalty('none')
      setDeleteReply(false)
    } catch (error) {
      setResolveError(String(error))
    } finally {
      setResolvingId(null)
    }
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
                      <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Accion final
                            <select
                              value={penalty}
                              onChange={(event) => setPenalty(event.target.value as ModerationPenalty)}
                              className="mt-1 w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="none">Sin castigo</option>
                              <option value="suspend">Suspender usuario</option>
                              <option value="ban">Ban permanente</option>
                            </select>
                          </label>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Motivo de moderacion
                            <select
                              value={moderationReasonId}
                              onChange={(event) => {
                                const next = event.target.value
                                setModerationReasonId(next)
                                setDurationDays(getModerationReason(next).defaultDays ?? durationDays)
                              }}
                              className="mt-1 w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {MODERATION_REASONS.map((reason) => (
                                <option key={reason.id} value={reason.id}>{reason.label}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {penalty === 'suspend' && (
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Duracion de suspension
                            <div className="mt-1 grid grid-cols-4 gap-2">
                              {[1, 3, 7, 30].map((days) => (
                                <button
                                  key={days}
                                  type="button"
                                  onClick={() => setDurationDays(days)}
                                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${durationDays === days
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                                    }`}
                                >
                                  {days}d
                                </button>
                              ))}
                            </div>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={durationDays}
                              onChange={(event) => setDurationDays(Number(event.target.value))}
                              className="mt-2 w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </label>
                        )}
                        {report.target_type === 'reply' && (
                          <label className="flex items-start gap-2 rounded-lg border border-red-100 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                            <input
                              type="checkbox"
                              checked={deleteReply}
                              onChange={(event) => setDeleteReply(event.target.checked)}
                              className="mt-1"
                            />
                            <span>Eliminar mensaje y reemplazarlo por la leyenda de moderacion.</span>
                          </label>
                        )}
                        <textarea
                          value={moderatorNote}
                          onChange={(event) => setModeratorNote(event.target.value)}
                          maxLength={1000}
                          rows={3}
                          placeholder="Comentario del moderador. Se usara junto al motivo del catalogo."
                          className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        {resolveError && (
                          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
                            {resolveError}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <button
                            onClick={() => handleResolve(report)}
                            disabled={resolvingId === report.id}
                            className="hover:cursor-pointer inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
                          >
                            {resolvingId === report.id ? <Spinner size="sm" /> : penalty === 'ban' ? <Ban size={14} /> : deleteReply ? <Trash2 size={14} /> : <CheckCircle size={14} />}
                            {resolvingId === report.id ? 'Aplicando...' : 'Aplicar decision'}
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
                        onClick={() => openResolve(report, noteOpen)}
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
