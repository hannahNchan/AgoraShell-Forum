import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Channel } from '../../../types'

interface ChannelsState {
  items: Channel[]
  loading: boolean
  error: string | null
}

const initialState: ChannelsState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchChannels = createAsyncThunk('channels/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data as Channel[]
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const createChannel = createAsyncThunk(
  'channels/create',
  async (
    payload: { name: string; description?: string; slug: string; icon?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('channels')
        .insert([{ ...payload, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data as Channel
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteChannel = createAsyncThunk(
  'channels/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.from('channels').delete().eq('id', id)
      if (error) throw error
      return id
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChannels.pending, (state) => { state.loading = true })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
      .addCase(deleteChannel.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { clearError } = channelsSlice.actions
export default channelsSlice.reducer
