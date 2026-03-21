import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Topic, type Tag } from '../../../types'

const PAGE_SIZE = 20

const TOPIC_SELECT = `
  *,
  author:profiles(id, username, avatar_url, role),
  tags:topic_tags(tag:tags(*))
`

const TOPIC_SELECT_WITH_CHANNEL = `
  *,
  author:profiles(id, username, avatar_url, role),
  channel:channels(id, name, slug, icon),
  tags:topic_tags(tag:tags(*))
`

const normalizeTags = (data: any): Topic => ({
  ...data,
  tags: (data.tags || []).map((tt: any) => tt.tag).filter(Boolean) as Tag[],
})

interface TopicsState {
  items: Topic[]
  currentTopic: Topic | null
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
}

const initialState: TopicsState = {
  items: [],
  currentTopic: null,
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
  return data.map((t: any) => ({ ...normalizeTags(t), is_starred: starredIds.has(t.id) })) as Topic[]
}

const sortPinnedFirst = (topics: Topic[]) => [
  ...topics.filter((t) => t.is_pinned),
  ...topics.filter((t) => !t.is_pinned),
]

const resolveFilterIds = async (tagId?: string, tagIds?: string[]): Promise<string[] | null> => {
  if (tagIds && tagIds.length > 0) return tagIds
  if (tagId) {
    const { data } = await supabase.from('topic_tags').select('topic_id').eq('tag_id', tagId)
    return (data || []).map((r: any) => r.topic_id)
  }
  return null
}

export const fetchTopicsByChannel = createAsyncThunk(
  'topics/fetchByChannel',
  async (
    { channelId, tagId, tagIds }: { channelId: string; tagId?: string; tagIds?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase
        .from('topics')
        .select(TOPIC_SELECT)
        .eq('channel_id', channelId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1)

      const ids = await resolveFilterIds(tagId, tagIds)
      if (ids !== null) {
        if (ids.length === 0) return []
        query = query.in('id', ids)
      }

      const { data, error } = await query
      if (error) throw error
      if (user && data) return await fetchStars(data, user.id)
      return (data || []).map(normalizeTags) as Topic[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreTopics = createAsyncThunk(
  'topics/fetchMore',
  async (
    { channelId, page, tagId, tagIds }: { channelId: string; page: number; tagId?: string; tagIds?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('topics')
        .select(TOPIC_SELECT)
        .eq('channel_id', channelId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      const ids = await resolveFilterIds(tagId, tagIds)
      if (ids !== null) {
        if (ids.length === 0) return []
        query = query.in('id', ids)
      }

      const { data, error } = await query
      if (error) throw error
      if (user && data && data.length > 0) return await fetchStars(data, user.id)
      return (data ?? []).map(normalizeTags) as Topic[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchTopicById = createAsyncThunk(
  'topics/fetchById',
  async (topicId: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('topics')
        .select(TOPIC_SELECT_WITH_CHANNEL)
        .eq('id', topicId)
        .single()
      if (error) throw error
      let is_starred = false
      if (user) {
        const { data: star } = await supabase
          .from('topic_stars')
          .select('id')
          .eq('topic_id', topicId)
          .eq('user_id', user.id)
          .maybeSingle()
        is_starred = !!star
      }
      return { ...normalizeTags(data), is_starred } as Topic
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTopic = createAsyncThunk(
  'topics/create',
  async (
    payload: { channel_id: string; title: string; content: string; tagIds?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { tagIds, ...topicPayload } = payload
      const { data, error } = await supabase
        .from('topics')
        .insert([{ ...topicPayload, author_id: user?.id }])
        .select('id')
        .single()
      if (error) throw error

      if (tagIds && tagIds.length > 0) {
        await supabase.from('topic_tags').insert(
          tagIds.map((tag_id) => ({ topic_id: data.id, tag_id }))
        )
      }

      const { data: full, error: err2 } = await supabase
        .from('topics')
        .select(TOPIC_SELECT)
        .eq('id', data.id)
        .single()
      if (err2) throw err2
      return normalizeTags(full) as Topic
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateTopic = createAsyncThunk(
  'topics/update',
  async (
    { topicId, title, content, tagIds }: { topicId: string; title: string; content: string; tagIds?: string[] },
    { rejectWithValue }
  ) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', topicId)
      if (error) throw error

      if (tagIds !== undefined) {
        await supabase.from('topic_tags').delete().eq('topic_id', topicId)
        if (tagIds.length > 0) {
          await supabase.from('topic_tags').insert(
            tagIds.map((tag_id) => ({ topic_id: topicId, tag_id }))
          )
        }
      }

      const { data: full, error: err2 } = await supabase
        .from('topics')
        .select(TOPIC_SELECT_WITH_CHANNEL)
        .eq('id', topicId)
        .single()
      if (err2) throw err2
      return normalizeTags(full) as Topic
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const pinTopic = createAsyncThunk(
  'topics/pin',
  async ({ topicId, isPinned }: { topicId: string; isPinned: boolean }, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ is_pinned: !isPinned })
        .eq('id', topicId)
      if (error) throw error
      return { topicId, is_pinned: !isPinned }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const closeTopic = createAsyncThunk(
  'topics/close',
  async ({ topicId, isClosed }: { topicId: string; isClosed: boolean }, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ is_closed: !isClosed })
        .eq('id', topicId)
      if (error) throw error
      return { topicId, is_closed: !isClosed }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const toggleStar = createAsyncThunk(
  'topics/toggleStar',
  async ({ topicId, isStarred }: { topicId: string; isStarred: boolean }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (isStarred) {
        await supabase.from('topic_stars').delete().eq('topic_id', topicId).eq('user_id', user.id)
      } else {
        await supabase.from('topic_stars').insert([{ topic_id: topicId, user_id: user.id }])
      }
      const { data } = await supabase.from('topics').select('stars_count').eq('id', topicId).single()
      return { topicId, isStarred: !isStarred, stars_count: data?.stars_count ?? 0 }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteTopic = createAsyncThunk(
  'topics/delete',
  async (topicId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.from('topics').delete().eq('id', topicId)
      if (error) throw error
      return topicId
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    clearTopics: (state) => {
      state.items = []
      state.currentTopic = null
      state.hasMore = true
    },
    clearError: (state) => { state.error = null },
    incrementRepliesCount: (state, action: PayloadAction<string>) => {
      const topic = state.items.find((t) => t.id === action.payload)
      if (topic) topic.replies_count += 1
      if (state.currentTopic?.id === action.payload) state.currentTopic.replies_count += 1
    },
    setRepliesCount: (state, action: PayloadAction<{ topicId: string; count: number }>) => {
      const topic = state.items.find((t) => t.id === action.payload.topicId)
      if (topic) topic.replies_count = action.payload.count
      if (state.currentTopic?.id === action.payload.topicId) state.currentTopic.replies_count = action.payload.count
    },
    decrementRepliesCount: (state, action: PayloadAction<string>) => {
      const topic = state.items.find((t) => t.id === action.payload)
      if (topic) topic.replies_count = Math.max(0, topic.replies_count - 1)
      if (state.currentTopic?.id === action.payload) {
        state.currentTopic.replies_count = Math.max(0, state.currentTopic.replies_count - 1)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopicsByChannel.pending, (state) => { state.loading = true; state.hasMore = true })
      .addCase(fetchTopicsByChannel.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.hasMore = action.payload.length === PAGE_SIZE
      })
      .addCase(fetchTopicsByChannel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(fetchMoreTopics.pending, (state) => { state.loadingMore = true })
      .addCase(fetchMoreTopics.fulfilled, (state, action) => {
        state.loadingMore = false
        const newItems = action.payload.filter((t) => !state.items.find((e) => e.id === t.id))
        state.items = sortPinnedFirst([...state.items, ...newItems])
        state.hasMore = action.payload.length === PAGE_SIZE
      })
      .addCase(fetchMoreTopics.rejected, (state) => { state.loadingMore = false })

      .addCase(fetchTopicById.pending, (state) => { state.loading = true })
      .addCase(fetchTopicById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTopic = action.payload
      })
      .addCase(fetchTopicById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(createTopic.fulfilled, (state, action) => {
        state.items = sortPinnedFirst([action.payload, ...state.items])
      })

      .addCase(updateTopic.fulfilled, (state, action) => {
        const updated = action.payload
        const idx = state.items.findIndex((t) => t.id === updated.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...updated }
        if (state.currentTopic?.id === updated.id) state.currentTopic = { ...state.currentTopic, ...updated }
      })

      .addCase(pinTopic.fulfilled, (state, action) => {
        const { topicId, is_pinned } = action.payload
        const topic = state.items.find((t) => t.id === topicId)
        if (topic) topic.is_pinned = is_pinned
        if (state.currentTopic?.id === topicId) state.currentTopic.is_pinned = is_pinned
        state.items = sortPinnedFirst([...state.items])
      })

      .addCase(closeTopic.fulfilled, (state, action) => {
        const { topicId, is_closed } = action.payload
        const topic = state.items.find((t) => t.id === topicId)
        if (topic) topic.is_closed = is_closed
        if (state.currentTopic?.id === topicId) state.currentTopic.is_closed = is_closed
      })

      .addCase(toggleStar.fulfilled, (state, action) => {
        const { topicId, isStarred, stars_count } = action.payload
        const topic = state.items.find((t) => t.id === topicId)
        if (topic) {
          topic.is_starred = isStarred
          topic.stars_count = stars_count
        }
        if (state.currentTopic?.id === topicId) {
          state.currentTopic.is_starred = isStarred
          state.currentTopic.stars_count = stars_count
        }
      })

      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload)
        if (state.currentTopic?.id === action.payload) state.currentTopic = null
      })
  },
})

export const { clearTopics, clearError, incrementRepliesCount, setRepliesCount, decrementRepliesCount } = topicsSlice.actions
export default topicsSlice.reducer
