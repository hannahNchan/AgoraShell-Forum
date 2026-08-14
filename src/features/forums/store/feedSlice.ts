import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Topic } from '../../../types'
import { toggleStar } from '../../threads/store/threadsSlice'
import { type RootState } from '../../../store'
import { filterAccessibleTopics } from '../../../services/channelAccess'

const PAGE_SIZE = 20

export type FeedFilter = 'best' | 'hot' | 'new' | 'top' | 'rising'

interface FeedState {
  items: Topic[]
  filter: FeedFilter
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMoreError: string | null
  currentRequestId?: string
  currentMoreRequestId?: string
}

const initialState: FeedState = {
  items: [],
  filter: 'best',
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  loadMoreError: null,
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
        .order('id', { ascending: false })
        .range(from, to)
    case 'hot':
      return base
        .gte('created_at', hoursAgo(48))
        .order('replies_count', { ascending: false })
        .order('stars_count', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    case 'new':
      return base
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    case 'top':
      return base
        .order('stars_count', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
    case 'rising':
      return base
        .gte('created_at', hoursAgo(168))
        .order('replies_count', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
  }
}

const mergeUniqueTopics = (current: Topic[], incoming: Topic[]) => {
  const seen = new Set(current.map((topic) => topic.id))
  return [...current, ...incoming.filter((topic) => {
    if (seen.has(topic.id)) return false
    seen.add(topic.id)
    return true
  })]
}

export const fetchFeed = createAsyncThunk(
  'feed/fetch',
  async (filter: FeedFilter, { getState, rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await buildQuery(filter, 0, PAGE_SIZE - 1)
      if (error) throw error
      const email = (getState() as RootState).auth.user?.email
      const accessibleTopics = filterAccessibleTopics((data ?? []) as Topic[], email)
      if (user && accessibleTopics.length > 0) return await fetchStars(accessibleTopics, user.id)
      return accessibleTopics
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreFeed = createAsyncThunk(
  'feed/fetchMore',
  async ({ filter, page }: { filter: FeedFilter; page: number }, { getState, rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await buildQuery(filter, from, to)
      if (error) throw error
      const email = (getState() as RootState).auth.user?.email
      const accessibleTopics = filterAccessibleTopics((data ?? []) as Topic[], email)
      if (user && accessibleTopics.length > 0) return await fetchStars(accessibleTopics, user.id)
      return accessibleTopics
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.loadMoreError = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.items = action.payload
        state.hasMore = action.payload.length === PAGE_SIZE
        state.currentRequestId = undefined
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.error = action.payload as string
        state.currentRequestId = undefined
      })
      .addCase(fetchMoreFeed.pending, (state, action) => {
        state.loadingMore = true
        state.loadMoreError = null
        state.currentMoreRequestId = action.meta.requestId
      })
      .addCase(fetchMoreFeed.fulfilled, (state, action) => {
        if (state.currentMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.items = mergeUniqueTopics(state.items, action.payload)
        state.hasMore = action.payload.length === PAGE_SIZE
        state.currentMoreRequestId = undefined
      })
      .addCase(fetchMoreFeed.rejected, (state, action) => {
        if (state.currentMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.loadMoreError = action.payload as string
        state.currentMoreRequestId = undefined
      })
      .addCase(toggleStar.fulfilled, (state, action) => {
        const { topicId, isStarred, stars_count } = action.payload
        const topic = state.items.find((t) => t.id === topicId)
        if (topic) {
          topic.is_starred = isStarred
          topic.stars_count = stars_count
        }
      })
  },
})

export const { setFilter } = feedSlice.actions
export default feedSlice.reducer
