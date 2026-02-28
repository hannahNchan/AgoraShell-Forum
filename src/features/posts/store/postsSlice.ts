import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Reply, type ReplyReaction, type ReactionGroup } from '../../../types'
import { incrementRepliesCount, decrementRepliesCount } from '../../threads/store/threadsSlice'

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

const buildTree = (replies: Reply[]): Reply[] => {
  const map = new Map<string, Reply>()
  const roots: Reply[] = []

  for (const reply of replies) {
    map.set(reply.id, { ...reply, children: [] })
  }

  for (const reply of map.values()) {
    if (reply.parent_id && map.has(reply.parent_id)) {
      map.get(reply.parent_id)!.children!.push(reply)
    } else {
      roots.push(reply)
    }
  }

  return roots
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
      return buildTree(data as Reply[])
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createReply = createAsyncThunk(
  'posts/create',
  async (
    { topicId, content, parentId }: { topicId: string; content: string; parentId?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('replies')
        .insert([{ topic_id: topicId, content, author_id: user?.id, parent_id: parentId ?? null }])
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

export const deleteReply = createAsyncThunk(
  'posts/delete',
  async ({ replyId, topicId }: { replyId: string; topicId: string }, { dispatch, rejectWithValue }) => {
    try {
      const { error } = await supabase.from('replies').delete().eq('id', replyId)
      if (error) throw error
      dispatch(decrementRepliesCount(topicId))
      return replyId
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const findReplyById = (replies: Reply[], id: string): Reply | null => {
  for (const reply of replies) {
    if (reply.id === id) return reply
    if (reply.children?.length) {
      const found = findReplyById(reply.children, id)
      if (found) return found
    }
  }
  return null
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => { state.items = [] },
    clearError: (state) => { state.error = null },
    addReplyRealtime: (state, action: PayloadAction<Reply>) => {
      const reply = action.payload
      const exists = findReplyById(state.items, reply.id)
      if (exists) return

      if (!reply.parent_id) {
        state.items.push({ ...reply, children: [] })
      } else {
        const parent = findReplyById(state.items, reply.parent_id)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push({ ...reply, children: [] })
        }
      }
    },
    deleteReplyRealtime: (state, action: PayloadAction<string>) => {
      const removeFromTree = (replies: Reply[]): Reply[] =>
        replies
          .filter((r) => r.id !== action.payload)
          .map((r) => ({ ...r, children: r.children ? removeFromTree(r.children) : [] }))
      state.items = removeFromTree(state.items)
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
        const reply = action.payload
        const exists = findReplyById(state.items, reply.id)
        if (exists) return

        if (!reply.parent_id) {
          state.items.push({ ...reply, children: [] })
        } else {
          const parent = findReplyById(state.items, reply.parent_id)
          if (parent) {
            if (!parent.children) parent.children = []
            parent.children.push({ ...reply, children: [] })
          }
        }
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
      .addCase(deleteReply.fulfilled, (state, action) => {
        const removeFromTree = (replies: Reply[]): Reply[] =>
          replies
            .filter((r) => r.id !== action.payload)
            .map((r) => ({ ...r, children: r.children ? removeFromTree(r.children) : [] }))
        state.items = removeFromTree(state.items)
      })
  },
})

export const { clearPosts, clearError, addReplyRealtime, deleteReplyRealtime } = postsSlice.actions
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
