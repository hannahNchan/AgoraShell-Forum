import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchTopicsByChannel, fetchMoreTopics, setRepliesCount } from '../store/threadsSlice'
import { fetchSettings } from '../../tags/store/tagsSlice'
import { supabase } from '../../../services/supabase'
import { type Tag } from '../../../types'

export const useChannel = (channelId: string | undefined) => {
  const dispatch = useDispatch<AppDispatch>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [channelTags, setChannelTags] = useState<Tag[]>([])
  const [activeTags, setActiveTags] = useState<Tag[]>([])
  const pageRef = useRef(1)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  const { items: topics, loading, loadingMore, hasMore } = useSelector((state: RootState) => state.topics)
  const maxTags = useSelector((state: RootState) => state.tags.settings?.max_tags_per_topic ?? 3)
  const currentChannel = useSelector((state: RootState) =>
    state.channels.items.find((c) => c.id === channelId)
  )

  useEffect(() => { loadingMoreRef.current = loadingMore }, [loadingMore])
  useEffect(() => { hasMoreRef.current = hasMore }, [hasMore])

  useEffect(() => {
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (!channelId) return
    const load = async () => {
      const { data: topicRows } = await supabase.from('topics').select('id').eq('channel_id', channelId)
      const ids = (topicRows || []).map((t: any) => t.id)
      if (ids.length === 0) return
      const { data } = await supabase.from('topic_tags').select('tag:tags(*)').in('topic_id', ids)
      const unique = new Map<string, Tag>()
        ; (data || []).forEach((row: any) => { if (row.tag) unique.set(row.tag.id, row.tag) })
      setChannelTags(Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name)))
    }
    load()
  }, [channelId])

  useEffect(() => {
    if (!channelId) return

    const slugs = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const resolved = slugs.map((s) => channelTags.find((t) => t.slug === s)).filter(Boolean) as Tag[]
    setActiveTags(resolved)
    pageRef.current = 1

    const runFetch = async () => {
      if (resolved.length === 0) {
        dispatch(fetchTopicsByChannel({ channelId }))
        return
      }
      if (resolved.length === 1) {
        dispatch(fetchTopicsByChannel({ channelId, tagId: resolved[0].id }))
        return
      }
      const sets = await Promise.all(
        resolved.map(async (tag) => {
          const { data } = await supabase.from('topic_tags').select('topic_id').eq('tag_id', tag.id)
          return new Set((data || []).map((r: any) => r.topic_id as string))
        })
      )
      const intersection = [...sets[0]].filter((id) => sets.every((s) => s.has(id)))
      dispatch(fetchTopicsByChannel({ channelId, tagIds: intersection }))
    }
    runFetch()

    const realtimeChannel = supabase
      .channel(`replies-count:${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' },
        async (payload) => {
          const topicId = payload.new.topic_id
          const { data } = await supabase.from('topics').select('replies_count').eq('id', topicId).single()
          if (data) dispatch(setRepliesCount({ topicId, count: data.replies_count }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(realtimeChannel) }
  }, [channelId, searchParams, channelTags, dispatch])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const scrollRoot = document.getElementById('main-scroll')
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !loadingMoreRef.current && hasMoreRef.current && channelId) {
          const tagId = activeTags.length === 1 ? activeTags[0].id : undefined
          dispatch(fetchMoreTopics({ channelId, page: pageRef.current, tagId }))
          pageRef.current += 1
        }
      },
      { root: scrollRoot, threshold: 0.1 }
    )
    observer.observe(el)
    return () => { observer.disconnect() }
  }, [channelId, activeTags, dispatch])

  const handleTagFilter = (tag: Tag) => {
    const isActive = activeTags.some((t) => t.id === tag.id)
    const next = isActive ? activeTags.filter((t) => t.id !== tag.id) : [...activeTags, tag]
    if (next.length === 0) setSearchParams({})
    else setSearchParams({ tags: next.map((t) => t.slug).join(',') })
  }

  const clearTagFilters = () => setSearchParams({})

  return {
    topics, loading, loadingMore, hasMore,
    maxTags, currentChannel, channelTags, activeTags,
    loaderRef, handleTagFilter, clearTagFilters,
  }
}
