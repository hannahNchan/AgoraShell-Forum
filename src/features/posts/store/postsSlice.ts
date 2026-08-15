import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '../../../services/supabase'
import { type Reply, type ReplyReaction, type ReactionGroup } from '../../../types'
import { incrementRepliesCount, decrementRepliesCount } from '../../threads/store/threadsSlice'
import { ensureForumCanPublish } from '../../../services/forumLock'
import { ensureUserCanCreateContent } from '../../../services/userRestrictions'
import { requireSyncedAuthUser } from '../../../services/authGuard'
import { type RootState } from '../../../store'
import { logAdminAction } from '../../../services/adminAudit'
import { getDisplayUsername } from '../../../services/deletedUser'

const REPLIES_PAGE_SIZE = 20
const REPLY_SELECT = '*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)'

interface PostsState {
  items: Reply[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  loadMoreError: string | null
  currentRequestId?: string
  currentMoreRequestId?: string
}

const initialState: PostsState = {
  items: [],
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  loadMoreError: null,
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

const mergeReplyTrees = (current: Reply[], incoming: Reply[]) => {
  const existing = new Set(current.map((reply) => reply.id))
  return [...current, ...incoming.filter((reply) => {
    if (existing.has(reply.id)) return false
    existing.add(reply.id)
    return true
  })]
}

const fetchRepliesByIds = async (ids: string[]) => {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('replies')
    .select(REPLY_SELECT)
    .in('id', ids)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as Reply[]
}

export const fetchRepliesByTopic = createAsyncThunk(
  'posts/fetchByTopic',
  async (topicId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc('get_topic_reply_threads_page', {
        p_topic_id: topicId,
        p_limit: REPLIES_PAGE_SIZE,
        p_offset: 0,
      })
      if (error) throw error
      const rootCount = ((data ?? []) as Reply[]).filter((reply) => !reply.parent_id).length
      const rows = await fetchRepliesByIds(((data ?? []) as Reply[]).map((reply) => reply.id))
      return { items: buildTree(rows), hasMore: rootCount === REPLIES_PAGE_SIZE }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMoreRepliesByTopic = createAsyncThunk(
  'posts/fetchMoreByTopic',
  async ({ topicId, page }: { topicId: string; page: number }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc('get_topic_reply_threads_page', {
        p_topic_id: topicId,
        p_limit: REPLIES_PAGE_SIZE,
        p_offset: page * REPLIES_PAGE_SIZE,
      })
      if (error) throw error
      const rootCount = ((data ?? []) as Reply[]).filter((reply) => !reply.parent_id).length
      const rows = await fetchRepliesByIds(((data ?? []) as Reply[]).map((reply) => reply.id))
      return { items: buildTree(rows), hasMore: rootCount === REPLIES_PAGE_SIZE }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchReplyThreadById = createAsyncThunk(
  'posts/fetchReplyThreadById',
  async (replyId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc('get_reply_thread_by_reply_id', { p_reply_id: replyId })
      if (error) throw error
      const rows = await fetchRepliesByIds(((data ?? []) as Reply[]).map((reply) => reply.id))
      return { items: buildTree(rows), hasMore: false }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const createReply = createAsyncThunk(
  'posts/create',
  async (
    { topicId, content, parentId }: { topicId: string; content: string; parentId?: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const user = await requireSyncedAuthUser(getState() as RootState)
      await ensureForumCanPublish(user.id)
      await ensureUserCanCreateContent(user.id)
      const { data, error } = await supabase
        .from('replies')
        .insert([{ topic_id: topicId, content, author_id: user.id, parent_id: parentId ?? null }])
        .select(REPLY_SELECT)
        .single()
      if (error) throw error
      dispatch(incrementRepliesCount(topicId))
      return data as Reply
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateReply = createAsyncThunk(
  'posts/update',
  async ({ replyId, content }: { replyId: string; content: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('replies')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', replyId)
        .select(REPLY_SELECT)
        .single()
      if (error) throw error
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
  async ({ replyId, topicId }: { replyId: string; topicId: string }, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const findReply = (replies: Reply[]): Reply | null => {
        for (const reply of replies) {
          if (reply.id === replyId) return reply
          const found = reply.children ? findReply(reply.children) : null
          if (found) return found
        }
        return null
      }
      const reply = findReply(state.posts.items)
      const { error } = await supabase.from('replies').delete().eq('id', replyId)
      if (error) throw error
      if (state.auth.profile?.id && reply?.author_id && state.auth.profile.id !== reply.author_id) {
        await logAdminAction({
          actor: state.auth.profile,
          action: 'reply.delete',
          targetType: 'reply',
          targetId: replyId,
          targetLabel: reply.author ? `Respuesta de ${getDisplayUsername(reply.author)}` : undefined,
          metadata: { topicId },
        })
      }
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

const updateReplyInTree = (replies: Reply[], updated: Reply): Reply[] =>
  replies.map((r) => {
    if (r.id === updated.id) {
      return { ...r, content: updated.content, updated_at: updated.updated_at }
    }
    if (r.children?.length) {
      return { ...r, children: updateReplyInTree(r.children, updated) }
    }
    return r
  })

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.items = []
      state.loading = false
      state.loadingMore = false
      state.hasMore = true
      state.error = null
      state.loadMoreError = null
      state.currentRequestId = undefined
      state.currentMoreRequestId = undefined
    },
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
    updateReplyRealtime: (state, action: PayloadAction<Reply>) => {
      state.items = updateReplyInTree(state.items, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepliesByTopic.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.loadMoreError = null
        state.hasMore = true
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchRepliesByTopic.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.items = action.payload.items
        state.hasMore = action.payload.hasMore
        state.currentRequestId = undefined
      })
      .addCase(fetchRepliesByTopic.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.error = action.payload as string
        state.currentRequestId = undefined
      })

      .addCase(fetchMoreRepliesByTopic.pending, (state, action) => {
        state.loadingMore = true
        state.loadMoreError = null
        state.currentMoreRequestId = action.meta.requestId
      })
      .addCase(fetchMoreRepliesByTopic.fulfilled, (state, action) => {
        if (state.currentMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.items = mergeReplyTrees(state.items, action.payload.items)
        state.hasMore = action.payload.hasMore
        state.currentMoreRequestId = undefined
      })
      .addCase(fetchMoreRepliesByTopic.rejected, (state, action) => {
        if (state.currentMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.loadMoreError = action.payload as string
        state.currentMoreRequestId = undefined
      })

      .addCase(fetchReplyThreadById.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.loadMoreError = null
        state.hasMore = false
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchReplyThreadById.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.items = action.payload.items
        state.hasMore = action.payload.hasMore
        state.currentRequestId = undefined
      })
      .addCase(fetchReplyThreadById.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.error = action.payload as string
        state.currentRequestId = undefined
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

      .addCase(updateReply.fulfilled, (state, action) => {
        state.items = updateReplyInTree(state.items, action.payload)
      })

      .addCase(toggleReaction.fulfilled, (state, action) => {
        const { replyId, emoji, userId, action: act } = action.payload
        const reply = findReplyById(state.items, replyId)
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

export const { clearPosts, clearError, addReplyRealtime, deleteReplyRealtime, updateReplyRealtime } = postsSlice.actions
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
