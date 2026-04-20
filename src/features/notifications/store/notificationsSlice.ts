import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Notification } from '../../../types'

interface NotificationsState {
  items: Notification[]
  unreadCount: number
  loading: boolean
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url, role), topic:topics(id, title, channel_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data as Notification[]
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (error) throw error
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

export const markOneAsRead = createAsyncThunk(
  'notifications/markOneRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      if (error) throw error
      return notificationId
    } catch (err: any) {
      return rejectWithValue(err.message)
    }
  }
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotificationRealtime: (state, action: PayloadAction<Notification>) => {
      const exists = state.items.find((n) => n.id === action.payload.id)
      if (exists) return
      state.items.unshift(action.payload)
      if (!action.payload.read) state.unreadCount += 1
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.unreadCount = action.payload.filter((n) => !n.read).length
      })
      .addCase(fetchNotifications.rejected, (state) => { state.loading = false })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }))
        state.unreadCount = 0
      })
      .addCase(markOneAsRead.fulfilled, (state, action) => {
        const n = state.items.find((n) => n.id === action.payload)
        if (n && !n.read) {
          n.read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
  },
})

export const { addNotificationRealtime } = notificationsSlice.actions
export default notificationsSlice.reducer
