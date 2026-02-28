export type UserRole = 'admin' | 'moderator' | 'user' | 'banned'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  role_id: number
  role?: UserRole
  created_at: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string
  created_by: string | null
  created_at: string
  topics_count?: number
}

export interface Topic {
  id: string
  channel_id: string
  title: string
  content: string
  author_id: string
  stars_count: number
  replies_count: number
  created_at: string
  updated_at: string
  // Joined
  author?: Profile
  channel?: Channel
  is_starred?: boolean
}

export interface Reply {
  id: string
  topic_id: string
  parent_id: string | null
  content: string
  author_id: string
  created_at: string
  updated_at: string
  author?: Profile
  reactions?: ReplyReaction[]
  children?: Reply[]
}

export interface TopicStar {
  id: string
  topic_id: string
  user_id: string
  created_at: string
}

export interface ReplyReaction {
  id: string
  reply_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ReactionGroup {
  emoji: string
  count: number
  reacted: boolean
  user_ids: string[]
}
