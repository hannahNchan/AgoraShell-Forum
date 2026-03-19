import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchTopicById, toggleStar, closeTopic, updateTopic, incrementRepliesCount, decrementRepliesCount } from '../store/threadsSlice'
import { fetchRepliesByTopic, addReplyRealtime, deleteReplyRealtime } from '../../posts/store/postsSlice'
import { fetchSettings } from '../../tags/store/tagsSlice'
import { supabase } from '../../../services/supabase'
import { type Reply } from '../../../types'

export const useTopicDetail = (topicId: string | undefined) => {
  const dispatch = useDispatch<AppDispatch>()
  const topic = useSelector((state: RootState) => state.topics.currentTopic)
  const topicLoading = useSelector((state: RootState) => state.topics.loading)
  const replies = useSelector((state: RootState) => state.posts.items)
  const repliesLoading = useSelector((state: RootState) => state.posts.loading)
  const maxTags = useSelector((state: RootState) => state.tags.settings?.max_tags_per_topic ?? 3)
  const subscribed = useRef(false)

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (!topicId) return
    dispatch(fetchTopicById(topicId))
    dispatch(fetchRepliesByTopic(topicId))

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
      .subscribe()

    return () => {
      subscribed.current = false
      supabase.removeChannel(channel)
    }
  }, [topicId, dispatch])

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

  return { topic, topicLoading, replies, repliesLoading, maxTags, handleStar, handleClose, handleSaveEdit }
}
