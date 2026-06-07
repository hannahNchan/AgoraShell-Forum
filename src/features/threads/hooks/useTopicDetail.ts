import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchTopicById, toggleStar, closeTopic, updateTopic, incrementRepliesCount, decrementRepliesCount } from '../store/threadsSlice'
import { fetchMoreRepliesByTopic, fetchRepliesByTopic, fetchReplyThreadById, addReplyRealtime, deleteReplyRealtime, updateReplyRealtime } from '../../posts/store/postsSlice'
import { fetchSettings } from '../../tags/store/tagsSlice'
import { supabase } from '../../../services/supabase'
import { type Reply } from '../../../types'

export const useTopicDetail = (topicId: string | undefined, replyId?: string) => {
  const dispatch = useDispatch<AppDispatch>()
  const topic = useSelector((state: RootState) => state.topics.currentTopic)
  const topicLoading = useSelector((state: RootState) => state.topics.loading)
  const replies = useSelector((state: RootState) => state.posts.items)
  const repliesLoading = useSelector((state: RootState) => state.posts.loading)
  const repliesLoadingMore = useSelector((state: RootState) => state.posts.loadingMore)
  const repliesHasMore = useSelector((state: RootState) => state.posts.hasMore)
  const repliesLoadMoreError = useSelector((state: RootState) => state.posts.loadMoreError)
  const maxTags = useSelector((state: RootState) => state.tags.settings?.max_tags_per_topic ?? 3)
  const subscribed = useRef(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef(1)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)
  const loadingRef = useRef(false)

  useEffect(() => { loadingMoreRef.current = repliesLoadingMore }, [repliesLoadingMore])
  useEffect(() => { hasMoreRef.current = repliesHasMore }, [repliesHasMore])
  useEffect(() => { loadingRef.current = repliesLoading }, [repliesLoading])

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (!topicId) return
    pageRef.current = 1
    dispatch(fetchTopicById(topicId))
    if (replyId) {
      dispatch(fetchReplyThreadById(replyId))
    } else {
      dispatch(fetchRepliesByTopic(topicId))
    }

    if (subscribed.current) return
    subscribed.current = true

    const channel = supabase
      .channel(`replies:${topicId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
        async (payload) => {
          const { data } = await supabase
            .from('replies')
            .select('*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            dispatch(addReplyRealtime(data as Reply))
            dispatch(incrementRepliesCount(topicId))
          }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
        (payload) => {
          dispatch(deleteReplyRealtime(payload.old.id))
          dispatch(decrementRepliesCount(topicId))
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'replies', filter: `topic_id=eq.${topicId}` },
        async (payload) => {
          const { data } = await supabase
            .from('replies')
            .select('*, author:profiles(id, username, avatar_url, role), reactions:reply_reactions(id, user_id, emoji)')
            .eq('id', payload.new.id)
            .single()
          if (data) dispatch(updateReplyRealtime(data as Reply))
        }
      )
      .subscribe()

    return () => {
      subscribed.current = false
      supabase.removeChannel(channel)
    }
  }, [topicId, replyId, dispatch])

  const handleLoadMoreReplies = useCallback(async () => {
    if (!topicId || replyId) return
    const page = pageRef.current
    try {
      await dispatch(fetchMoreRepliesByTopic({ topicId, page })).unwrap()
      pageRef.current = page + 1
    } catch {
      pageRef.current = page
    }
  }, [dispatch, replyId, topicId])

  useEffect(() => {
    if (replyId) return
    const el = loaderRef.current
    if (!el) return
    const scrollRoot = document.getElementById('main-scroll')
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && !loadingMoreRef.current && hasMoreRef.current) {
          void handleLoadMoreReplies()
        }
      },
      { root: scrollRoot, threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleLoadMoreReplies, replyId])

  const handleStar = () => {
    if (!topic) return
    dispatch(toggleStar({ topicId: topic.id, isStarred: topic.is_starred ?? false }))
  }

  const handleClose = () => {
    if (!topic) return
    dispatch(closeTopic({ topicId: topic.id, isClosed: topic.is_closed ?? false }))
  }

  const handleSaveEdit = async (title: string, content: string, tagIds: string[]) => {
    if (!topic) return
    await dispatch(updateTopic({ topicId: topic.id, title, content, tagIds })).unwrap()
  }

  return {
    topic,
    topicLoading,
    replies,
    repliesLoading,
    repliesLoadingMore,
    repliesHasMore,
    repliesLoadMoreError,
    repliesLoaderRef: loaderRef,
    maxTags,
    handleStar,
    handleClose,
    handleSaveEdit,
    handleLoadMoreReplies,
  }
}
