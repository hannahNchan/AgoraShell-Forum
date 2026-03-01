import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase'

export interface HotTopic {
  id: string
  title: string
  content: string
  stars_count: number
  replies_count: number
  created_at: string
  channel_id: string
  author: {
    username: string
    avatar_url: string | null
  }
  score: number
  thumbnail: string | null
}

const extractThumbnail = (html: string): string | null => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/)
  return match ? match[1] : null
}

export const useHotTopics = (limit = 5) => {
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('topics')
        .select('id, title, content, stars_count, replies_count, created_at, channel_id, author:profiles(username, avatar_url)')
        .order('stars_count', { ascending: false })
        .limit(50)

      if (!data) {
        setLoading(false)
        return
      }

      const scored = (data as any[])
        .map((t) => ({
          ...t,
          author: Array.isArray(t.author) ? t.author[0] : t.author,
          score: (t.stars_count * 2) + t.replies_count,
          thumbnail: extractThumbnail(t.content),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      setHotTopics(scored)
      setLoading(false)
    }

    fetch()
  }, [limit])

  return { hotTopics, loading }
}
