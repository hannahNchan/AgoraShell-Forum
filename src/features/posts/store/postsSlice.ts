import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Reply, type ReplyReaction, type ReactionGroup } from '../../../types'
import { incrementRepliesCount } from '../../threads/store/threadsSlice'

interface PostsState {
  items: Reply[]
  loading: boolean
  error: string | null
}

const initialState: PostsState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchRepliesByTopic = createAsyncThunk(
  'posts/fetchByTopic',
  async (topicId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select(`*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)`)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Reply[]
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createReply = createAsyncThunk(
  'posts/create',
  async ({ topicId, content }: { topicId: string; content: string }, { dispatch, rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('replies')
        .insert([{ topic_id: topicId, content, author_id: user?.id }])
        .select(`*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)`)
        .single()
      if (error) throw error
      dispatch(incrementRepliesCount(topicId))
      return data as Reply
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const toggleReaction = createAsyncThunk(
  'posts/toggleReaction',
  async ({ replyId, emoji }: { replyId: string; emoji: string }, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: existing } = await supabase
        .from('reply_reactions')
        .select('id')
        .eq('reply_id', replyId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single()

      if (existing) {
        await supabase.from('reply_reactions').delete().eq('id', existing.id)
        return { replyId, emoji, userId: user.id, action: 'remove' as const }
      } else {
        await supabase.from('reply_reactions').insert([{ reply_id: replyId, user_id: user.id, emoji }])
        return { replyId, emoji, userId: user.id, action: 'add' as const }
      }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => { state.items = [] },
    clearError: (state) => { state.error = null },
    addReplyRealtime: (state, action: PayloadAction<Reply>) => {
      const exists = state.items.find((r) => r.id === action.payload.id)
      if (!exists) {
        state.items.push(action.payload)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepliesByTopic.pending, (state) => { state.loading = true })
      .addCase(fetchRepliesByTopic.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchRepliesByTopic.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(createReply.fulfilled, (state, action) => {
        const exists = state.items.find((r) => r.id === action.payload.id)
        if (!exists) state.items.push(action.payload)
      })

      .addCase(toggleReaction.fulfilled, (state, action) => {
        const { replyId, emoji, userId, action: act } = action.payload
        const reply = state.items.find((r) => r.id === replyId)
        if (!reply) return
        if (!reply.reactions) reply.reactions = []
        if (act === 'remove') {
          reply.reactions = reply.reactions.filter((r) => !(r.emoji === emoji && r.user_id === userId))
        } else {
          reply.reactions.push({ id: Date.now().toString(), reply_id: replyId, user_id: userId, emoji, created_at: new Date().toISOString() })
        }
      })
  },
})

export const { clearPosts, clearError, addReplyRealtime } = postsSlice.actions
export default postsSlice.reducer

export const groupReactions = (reactions: ReplyReaction[], currentUserId?: string): ReactionGroup[] => {
  const groups: Record<string, ReactionGroup> = {}
  for (const r of reactions) {
    if (!groups[r.emoji]) {
      groups[r.emoji] = { emoji: r.emoji, count: 0, reacted: false, user_ids: [] }
    }
    groups[r.emoji].count++
    groups[r.emoji].user_ids.push(r.user_id)
    if (currentUserId && r.user_id === currentUserId) {
      groups[r.emoji].reacted = true
    }
  }
  return Object.values(groups)
}
