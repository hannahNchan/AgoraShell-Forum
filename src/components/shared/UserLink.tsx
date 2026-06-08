import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { type Profile } from '../../types'

interface UserLinkProps {
  profile?: Pick<Profile, 'username'> | null
  className?: string
  children?: ReactNode
}

const UserLink = ({ profile, className, children }: UserLinkProps) => {
  if (!profile?.username) {
    return <span className={className}>{children ?? 'Usuario'}</span>
  }

  return (
    <Link
      to={`/users/${encodeURIComponent(profile.username)}`}
      onClick={(event) => event.stopPropagation()}
      className={className}
    >
      {children ?? profile.username}
    </Link>
  )
}

export default UserLink
