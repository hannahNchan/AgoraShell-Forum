export const DELETED_USER_LABEL = 'Deleted User'
export const DELETED_USER_INITIAL = 'D'

export const getDisplayUsername = (profile?: { username?: string | null } | null) =>
  profile?.username || DELETED_USER_LABEL

export const getAvatarInitial = (profile?: { username?: string | null } | null) =>
  (profile?.username?.charAt(0) || DELETED_USER_INITIAL).toUpperCase()
