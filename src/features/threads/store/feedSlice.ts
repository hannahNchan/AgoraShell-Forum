import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Topic } from '../../../types'

const PAGE_SIZE = 20

export type FeedFilter = 'best' | 'hot' | 'new' | 'top' | 'rising'

interface FeedState {
  items: Topic[]
  filter: FeedFilter
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
}

const initialState: FeedState = {
  items: [],
  filter: 'best',
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
}

const fetchStars = async (data: any[], userId: string) => {
  const topicIds = data.map((t: any) => t.id)
  const { data: stars } = await supabase
    .from('topic_stars')
    .select('topic_id')
    .eq('user_id', userId)
    .in('topic_id', topicIds)
  const starredIds = new Set((stars || []).map((s: any) => s.topic_id))
  return data.map((t: any) => ({ ...t, is_starred: starredIds.has(t.id) })) as Topic[]
}

const buildQuery = (filter: FeedFilter, from: number, to: number) => {
  const base = supabase
    .from('topics')
    .select(`*, author:profiles(id, username, avatar_url, role), channel:channels(id, name, slug, icon)`)

  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString()

  switch (filter) {
    case 'best':
      return base
        .order('stars_count', { ascending: false })
        .order('replies_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
    case 'hot':
      return base
        .gte('created_at', hoursAgo(48))
        .order('replies_count', { ascending: false })
        .order('stars_count', { ascending: false })
        .range(from, to)
    case 'new':
      return base
        .order('created_at', { ascending: false })
        .range(from, to)
    case 'top':
      return base
        .order('stars_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
    case 'rising':
      return base
        .gte('created_at', hoursAgo(168))
        .order('replies_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)
  }
}

export const fetchFeed = createAsyncThunk(
  'feed/fetch',
  async (filter: FeedFilter, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await buildQuery(filter, 0, PAGE_SIZE - 1)
      if (error) throw error
      if (user && data) return await fetchStars(data, user.id)
      return (data ?? []) as Topic[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreFeed = createAsyncThunk(
  'feed/fetchMore',
  async ({ filter, page }: { filter: FeedFilter; page: number }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await buildQuery(filter, from, to)
      if (error) throw error
      if (user && data && data.length > 0) return await fetchStars(data, user.id)
      return (data ?? []) as Topic[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<FeedFilter>) => {
      state.filter = action.payload
      state.items = []
      state.hasMore = true
    },
    toggleFeedStar: (state, action: PayloadAction<{ topicId: string; isStarred: boolean }>) => {
      const { topicId, isStarred } = action.payload
      const topic = state.items.find((t) => t.id === topicId)
      if (topic) {
        topic.is_starred = isStarred
        topic.stars_count = isStarred ? topic.stars_count + 1 : topic.stars_count - 1
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.hasMore = action.payload.length === PAGE_SIZE
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchMoreFeed.pending, (state) => { state.loadingMore = true })
      .addCase(fetchMoreFeed.fulfilled, (state, action) => {
        state.loadingMore = false
        const newItems = action.payload.filter((t) => !state.items.find((e) => e.id === t.id))
        state.items = [...state.items, ...newItems]
        state.hasMore = action.payload.length === PAGE_SIZE
      })
      .addCase(fetchMoreFeed.rejected, (state) => { state.loadingMore = false })
  },
})

export const { setFilter, toggleFeedStar } = feedSlice.actions
export default feedSlice.reducer
