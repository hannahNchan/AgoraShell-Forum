import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Tag, type AppSettings } from '../../../types'

interface TagsState {
  items: Tag[]
  settings: AppSettings | null
  loading: boolean
  error: string | null
}

const initialState: TagsState = {
  items: [],
  settings: null,
  loading: false,
  error: null,
}

const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export const fetchTags = createAsyncThunk(
  'tags/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Tag[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const searchTags = createAsyncThunk(
  'tags/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(10)
      if (error) throw error
      return data as Tag[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTag = createAsyncThunk(
  'tags/create',
  async (name: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const slug = toSlug(name)
      const { data: existing } = await supabase
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .single()
      if (existing) return existing as Tag
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: name.trim(), slug, created_by: user?.id }])
        .select()
        .single()
      if (error) throw error
      return data as Tag
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchSettings = createAsyncThunk(
  'tags/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single()
      if (error) throw error
      return data as AppSettings
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateMaxTags = createAsyncThunk(
  'tags/updateMaxTags',
  async (max: number, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ max_tags_per_topic: max })
        .eq('id', 1)
        .select()
        .single()
      if (error) throw error
      return data as AppSettings
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateMaxReplyDepth = createAsyncThunk(
  'tags/updateMaxReplyDepth',
  async (depth: number, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ max_reply_depth: depth })
        .eq('id', 1)
        .select()
        .single()
      if (error) throw error
      return data as AppSettings
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => { state.loading = true })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(searchTags.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(createTag.fulfilled, (state, action) => {
        const exists = state.items.find((t) => t.id === action.payload.id)
        if (!exists) state.items.push(action.payload)
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(updateMaxTags.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(updateMaxReplyDepth.fulfilled, (state, action) => {
        state.settings = action.payload
      })
  },
})

export const { clearError } = tagsSlice.actions
export default tagsSlice.reducer
