import { type Topic } from '../types'

export const MAGISTRANS_CHANNEL_ID = 'cf49cdd1-b720-4e04-8c10-4409e7d0cdff'
export const MAGISTRANS_EMAIL_DOMAIN = '@magistrans.com'

export const isMagistransEmail = (email?: string | null) =>
  (email ?? '').trim().toLowerCase().endsWith(MAGISTRANS_EMAIL_DOMAIN)

export const isRestrictedChannel = (channelId?: string | null) =>
  channelId === MAGISTRANS_CHANNEL_ID

export const canAccessChannel = (channelId: string | undefined | null, email?: string | null) =>
  !isRestrictedChannel(channelId) || isMagistransEmail(email)

export const canAccessTopic = (topic: Pick<Topic, 'channel_id'> | null | undefined, email?: string | null) =>
  !topic || canAccessChannel(topic.channel_id, email)

export const filterAccessibleChannels = <T extends { id: string }>(channels: T[], email?: string | null) =>
  channels.filter((channel) => canAccessChannel(channel.id, email))

export const filterAccessibleTopics = <T extends { channel_id: string }>(topics: T[], email?: string | null) =>
  topics.filter((topic) => canAccessChannel(topic.channel_id, email))
