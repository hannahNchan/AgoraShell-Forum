import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Report, type ReportReason, type ReportStatus, type ReportTargetType } from '../../../types'

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
  reported_user:profiles!reports_reported_user_id_fkey(id, username, avatar_url, role),
  assigned_moderator:profiles!reports_assigned_moderator_id_fkey(id, username, avatar_url),
  handled_by:profiles!reports_handled_by_id_fkey(id, username, avatar_url),
  target_topic:topics!reports_target_topic_id_fkey(id, title, channel_id),
  target_reply:replies!reports_target_reply_id_fkey(id, topic_id, content)
`

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : null

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
    { rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Debes iniciar sesión para reportar.')
      if (payload.targetType === 'user' && payload.targetUserId === user.id) {
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
