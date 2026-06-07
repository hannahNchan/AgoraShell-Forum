import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'

export interface AdminAuditLog {
  id: string
  actor_id: string | null
  actor_role: string | null
  action: string
  target_type: string
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor?: { id: string; username: string; avatar_url: string | null } | null
}

interface AdminAuditState {
  items: AdminAuditLog[]
  loading: boolean
  error: string | null
}

const initialState: AdminAuditState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchAdminAuditLogs = createAsyncThunk(
  'adminAudit/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*, actor:profiles!admin_audit_logs_actor_id_fkey(id, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as AdminAuditLog[]
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'No se pudo cargar la auditoria.')
    }
  }
)

const adminAuditSlice = createSlice({
  name: 'adminAudit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAuditLogs.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdminAuditLogs.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchAdminAuditLogs.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export default adminAuditSlice.reducer
