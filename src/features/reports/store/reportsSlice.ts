import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Profile, type Report, type ReportReason, type ReportStatus, type ReportTargetType } from '../../../types'
import { can, canModerateTarget } from '../../../services/permissions'
import { type RootState } from '../../../store'
import { logAdminAction } from '../../../services/adminAudit'
import { getDisplayUsername } from '../../../services/deletedUser'
import {
  buildModerationReasonText,
  moderationDeletedReplyHtml,
  type ModerationPenalty,
} from '../constants/moderationCatalog'

interface ReportsState {
  items: Report[]
  loading: boolean
  submitting: boolean
  error: string | null
}

const initialState: ReportsState = {
  items: [],
  loading: false,
  submitting: false,
  error: null,
}

const REPORT_SELECT = `
  *,
  reporter:profiles!reports_reporter_id_fkey(id, username, avatar_url),
  reported_user:profiles!reports_reported_user_id_fkey(id, username, avatar_url, role, role_id, suspended_until, suspension_reason, banned_reason, moderation_previous_role_id),
  assigned_moderator:profiles!reports_assigned_moderator_id_fkey(id, username, avatar_url),
  handled_by:profiles!reports_handled_by_id_fkey(id, username, avatar_url),
  target_topic:topics!reports_target_topic_id_fkey(id, title, channel_id),
  target_reply:replies!reports_target_reply_id_fkey(id, topic_id, content)
`

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : null

const PROFILE_PERMISSION_SELECT = 'id, username, avatar_url, bio, role_id, role, suspended_until, suspension_reason, banned_reason, moderation_previous_role_id, moderation_updated_by, moderation_updated_at, created_at'

const getProfileForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_PERMISSION_SELECT)
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export const createReport = createAsyncThunk(
  'reports/create',
  async (
    payload: {
      targetType: ReportTargetType
      reason: ReportReason
      details?: string
      reportedUserId?: string | null
      targetTopicId?: string | null
      targetReplyId?: string | null
      targetUserId?: string | null
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión para reportar.')
      const profile = (getState() as RootState).auth.profile ?? await getProfileForUser(user.id)
      if (!can(profile, 'report_content')) throw new Error('No tienes permisos para reportar contenido.')
      if ((payload.reportedUserId ?? payload.targetUserId) === user.id) {
        throw new Error('No puedes reportarte a ti mismo.')
      }

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          reporter_id: user.id,
          reported_user_id: payload.reportedUserId ?? payload.targetUserId ?? null,
          target_type: payload.targetType,
          target_topic_id: payload.targetTopicId ?? null,
          target_reply_id: payload.targetReplyId ?? null,
          target_user_id: payload.targetUserId ?? null,
          reason: payload.reason,
          details: payload.details?.trim() || null,
        }])
        .select(REPORT_SELECT)
        .single()
      if (error) throw error
      return data as Report
    } catch (error: unknown) {
      const message = getErrorCode(error) === '23505'
        ? 'Ya enviaste un reporte para este contenido.'
        : getErrorMessage(error)
      return rejectWithValue(message)
    }
  }
)

export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(REPORT_SELECT)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as Report[]
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const updateReportStatus = createAsyncThunk(
  'reports/updateStatus',
  async ({ reportId, status, moderatorNote }: { reportId: string; status: ReportStatus; moderatorNote?: string }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión.')
      const profile = await getProfileForUser(user.id)
      if (!can(profile, status === 'reviewed' || status === 'dismissed' ? 'resolve_reports' : 'review_reports')) {
        throw new Error('No tienes permisos para moderar reportes.')
      }
      const patch = status === 'reviewed' || status === 'dismissed'
        ? {
          status,
          handled_by_id: user.id,
          handled_at: new Date().toISOString(),
          moderator_note: moderatorNote?.trim() || null,
          updated_at: new Date().toISOString(),
        }
        : {
          status,
          handled_by_id: null,
          handled_at: null,
          moderator_note: null,
          updated_at: new Date().toISOString(),
        }
      const { data, error } = await supabase
        .from('reports')
        .update(patch)
        .eq('id', reportId)
        .select(REPORT_SELECT)
        .single()
      if (error) throw error
      await logAdminAction({
        actor: profile,
        action: status === 'dismissed' ? 'report.dismiss' : 'report.resolve',
        targetType: 'report',
        targetId: reportId,
        targetLabel: status,
        metadata: { moderatorNote: moderatorNote?.trim() || null },
      })
      return data as Report
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const resolveReportWithAction = createAsyncThunk(
  'reports/resolveWithAction',
  async ({
    report,
    moderatorNote,
    penalty,
    reasonId,
    durationDays,
    deleteReply,
  }: {
    report: Report
    moderatorNote?: string
    penalty: ModerationPenalty
    reasonId: string
    durationDays?: number
    deleteReply?: boolean
  }, { getState, rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión.')
      const actorProfile = (getState() as RootState).auth.profile ?? await getProfileForUser(user.id)
      if (!can(actorProfile, 'resolve_reports')) throw new Error('No tienes permisos para resolver reportes.')

      const reasonText = buildModerationReasonText(reasonId, moderatorNote)
      const now = new Date().toISOString()

      if (deleteReply && report.target_type === 'reply' && report.target_reply_id) {
        const { error: replyError } = await supabase
          .from('replies')
          .update({
            content: moderationDeletedReplyHtml(reasonText),
            updated_at: now,
          })
          .eq('id', report.target_reply_id)
        if (replyError) throw replyError
      }

      if (penalty !== 'none') {
        if (!report.reported_user_id || !report.reported_user) {
          throw new Error('Este reporte no tiene usuario reportado.')
        }

        if (!can(actorProfile, penalty === 'ban' ? 'ban_user' : 'suspend_user')) {
          throw new Error('No tienes permisos para aplicar esta sancion.')
        }

        if (!canModerateTarget(actorProfile, report.reported_user)) {
          throw new Error('No se puede banear o suspender a este rol.')
        }

        if (penalty === 'ban') {
          const previousRoleId = report.reported_user.role_id === 4
            ? report.reported_user.moderation_previous_role_id ?? 3
            : report.reported_user.role_id ?? 3
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              role_id: 4,
              role: 'banned',
              banned_reason: reasonText,
              suspended_until: null,
              suspension_reason: null,
              moderation_previous_role_id: previousRoleId,
            })
            .eq('id', report.reported_user_id)
          if (profileError) throw profileError
        }

        if (penalty === 'suspend') {
          const days = Math.max(1, durationDays ?? 1)
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              suspended_until: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
              suspension_reason: reasonText,
              banned_reason: null,
            })
            .eq('id', report.reported_user_id)
          if (profileError) throw profileError
        }
      }

      const actionSummary = [
        moderatorNote?.trim() ? `Nota: ${moderatorNote.trim()}` : null,
        penalty === 'ban' ? `Accion: ban permanente (${reasonText})` : null,
        penalty === 'suspend' ? `Accion: suspension ${Math.max(1, durationDays ?? 1)} dias (${reasonText})` : null,
        deleteReply ? `Contenido: mensaje borrado por moderacion (${reasonText})` : null,
      ].filter(Boolean).join('\n')

      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'reviewed',
          handled_by_id: user.id,
          handled_at: now,
          moderator_note: actionSummary || null,
          updated_at: now,
        })
        .eq('id', report.id)
        .select(REPORT_SELECT)
        .single()
      if (error) throw error
      await logAdminAction({
        actor: actorProfile,
        action: 'report.resolve',
        targetType: 'report',
        targetId: report.id,
        targetLabel: report.reported_user ? getDisplayUsername(report.reported_user) : report.target_type,
        metadata: {
          penalty,
          reasonId,
          durationDays: penalty === 'suspend' ? Math.max(1, durationDays ?? 1) : null,
          deleteReply: !!deleteReply,
          reportedUserId: report.reported_user_id,
        },
      })
      if (deleteReply && report.target_type === 'reply' && report.target_reply_id) {
        await logAdminAction({
          actor: actorProfile,
          action: 'reply.moderation_delete',
          targetType: 'reply',
          targetId: report.target_reply_id,
          targetLabel: report.reported_user ? `Respuesta de ${getDisplayUsername(report.reported_user)}` : null,
          metadata: { reportId: report.id, reason: reasonText },
        })
      }
      if (penalty === 'ban' || penalty === 'suspend') {
        await logAdminAction({
          actor: actorProfile,
          action: penalty === 'ban' ? 'user.ban' : 'user.suspend',
          targetType: 'user',
          targetId: report.reported_user_id,
          targetLabel: report.reported_user ? getDisplayUsername(report.reported_user) : undefined,
          metadata: {
            reportId: report.id,
            reason: reasonText,
            durationDays: penalty === 'suspend' ? Math.max(1, durationDays ?? 1) : null,
          },
        })
      }
      return data as Report
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const claimReport = createAsyncThunk(
  'reports/claim',
  async (reportId: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión.')
      const profile = await getProfileForUser(user.id)
      if (!can(profile, 'review_reports')) throw new Error('No tienes permisos para tomar reportes.')
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'in_review',
          assigned_moderator_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .in('status', ['pending', 'in_review'])
        .select(REPORT_SELECT)
        .single()
      if (error) throw error
      await logAdminAction({
        actor: profile,
        action: 'report.claim',
        targetType: 'report',
        targetId: reportId,
      })
      return data as Report
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const releaseReport = createAsyncThunk(
  'reports/release',
  async (reportId: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión.')
      const profile = await getProfileForUser(user.id)
      if (!can(profile, 'review_reports')) throw new Error('No tienes permisos para soltar reportes.')
      const { data, error } = await supabase
        .from('reports')
        .update({
          status: 'pending',
          assigned_moderator_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .eq('status', 'in_review')
        .select(REPORT_SELECT)
        .single()
      if (error) throw error
      await logAdminAction({
        actor: profile,
        action: 'report.release',
        targetType: 'report',
        targetId: reportId,
      })
      return data as Report
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearReportError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReport.pending, (state) => {
        state.submitting = true
        state.error = null
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.submitting = false
        state.items.unshift(action.payload)
      })
      .addCase(createReport.rejected, (state, action) => {
        state.submitting = false
        state.error = action.payload as string
      })
      .addCase(fetchReports.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(updateReportStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((report) => report.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(resolveReportWithAction.fulfilled, (state, action) => {
        const index = state.items.findIndex((report) => report.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(claimReport.fulfilled, (state, action) => {
        const index = state.items.findIndex((report) => report.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
      .addCase(releaseReport.fulfilled, (state, action) => {
        const index = state.items.findIndex((report) => report.id === action.payload.id)
        if (index !== -1) state.items[index] = action.payload
      })
  },
})

export const { clearReportError } = reportsSlice.actions
export default reportsSlice.reducer
