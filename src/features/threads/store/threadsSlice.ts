import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Topic } from '../../../types'

interface TopicsState {
  items: Topic[]
  currentTopic: Topic | null
  loading: boolean
  error: string | null
}

const initialState: TopicsState = {
  items: [],
  currentTopic: null,
  loading: false,
  error: null,
}

export const fetchTopicsByChannel = createAsyncThunk(
  'topics/fetchByChannel',
  async (channelId: string, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('topics')
        .select(`*, author:profiles(id, username, avatar_url, role)`)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
      if (error) throw error

      if (user && data) {
        const topicIds = data.map((t: any) => t.id)
        const { data: stars } = await supabase
          .from('topic_stars')
          .select('topic_id')
          .eq('user_id', user.id)
          .in('topic_id', topicIds)
        const starredIds = new Set((stars || []).map((s: any) => s.topic_id))
        return data.map((t: any) => ({ ...t, is_starred: starredIds.has(t.id) })) as Topic[]
      }

      return data as Topic[]
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
        .select(`*, author:profiles(id, username, avatar_url, role), channel:channels(id, name, slug, icon)`)
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
          .single()
        is_starred = !!star
      }

      return { ...data, is_starred } as Topic
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createTopic = createAsyncThunk(
  'topics/create',
  async (payload: { channel_id: string; title: string; content: string }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('topics')
        .insert([{ ...payload, author_id: user?.id }])
        .select(`*, author:profiles(id, username, avatar_url, role)`)
        .single()
      if (error) throw error
      return data as Topic
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
      return { topicId, isStarred: !isStarred }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    clearTopics: (state) => { state.items = []; state.currentTopic = null },
    clearError: (state) => { state.error = null },
    incrementRepliesCount: (state, action: PayloadAction<string>) => {
      const topic = state.items.find((t) => t.id === action.payload)
      if (topic) topic.replies_count += 1
      if (state.currentTopic?.id === action.payload) {
        state.currentTopic.replies_count += 1
      }
    },
    setRepliesCount: (state, action: PayloadAction<{ topicId: string; count: number }>) => {
      const topic = state.items.find((t) => t.id === action.payload.topicId)
      if (topic) topic.replies_count = action.payload.count
      if (state.currentTopic?.id === action.payload.topicId) {
        state.currentTopic.replies_count = action.payload.count
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopicsByChannel.pending, (state) => { state.loading = true })
      .addCase(fetchTopicsByChannel.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchTopicsByChannel.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

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
        state.items.unshift(action.payload)
      })

      .addCase(toggleStar.fulfilled, (state, action) => {
        const { topicId, isStarred } = action.payload
        const topic = state.items.find((t) => t.id === topicId)
        if (topic) {
          topic.is_starred = isStarred
          topic.stars_count = isStarred ? topic.stars_count + 1 : topic.stars_count - 1
        }
        if (state.currentTopic?.id === topicId) {
          state.currentTopic.is_starred = isStarred
          state.currentTopic.stars_count = isStarred
            ? state.currentTopic.stars_count + 1
            : state.currentTopic.stars_count - 1
        }
      })
  },
})

export const { clearTopics, clearError, incrementRepliesCount, setRepliesCount } = topicsSlice.actions
export default topicsSlice.reducer
