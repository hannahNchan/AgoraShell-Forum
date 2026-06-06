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
  created_by_profile?: { username: string } | null
  icon: string
  created_by: string | null
  created_at: string
  topics_count?: number
}
export interface Tag {
  id: string
  name: string
  slug: string
  created_by: string | null
  created_at: string
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
  author?: Profile
  channel?: Channel
  is_starred?: boolean
  tags?: Tag[]
  is_pinned?: boolean
  is_closed?: boolean
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
export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'mention' | 'reply'
  topic_id: string | null
  reply_id: string | null
  read: boolean
  created_at: string
  actor?: Profile
  topic?: Pick<Topic, 'id' | 'title' | 'channel_id'>
}
export interface AppSettings {
  id: number
  max_tags_per_topic: number
  max_reply_depth: number
  foro_bloqueado: boolean
}

export type ReportTargetType = 'topic' | 'reply' | 'user'
export type ReportReason = 'spam' | 'abuse' | 'offensive' | 'personal_info' | 'off_topic' | 'other'
export type ReportStatus = 'pending' | 'in_review' | 'reviewed' | 'dismissed'

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string | null
  target_type: ReportTargetType
  target_topic_id: string | null
  target_reply_id: string | null
  target_user_id: string | null
  reason: ReportReason
  details: string | null
  status: ReportStatus
  assigned_moderator_id: string | null
  handled_by_id: string | null
  handled_at: string | null
  moderator_note: string | null
  created_at: string
  updated_at: string
  reporter?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  reported_user?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'role'>
  assigned_moderator?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  handled_by?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  target_topic?: Pick<Topic, 'id' | 'title' | 'channel_id'>
  target_reply?: Pick<Reply, 'id' | 'topic_id' | 'content'>
}
