import { useSelector } from 'react-redux'
import {
  selectIsAdmin,
  selectIsBanned,
  selectIsModerator,
  selectProfile,
  selectUserRole,
} from '../store/authSelectors'
import { can, canModerateTarget, type PermissionAction } from '../../../services/permissions'
import { type Profile, type UserRole } from '../../../types'

export const useRole = () => {
  const role = useSelector(selectUserRole)
  const isAdmin = useSelector(selectIsAdmin)
  const isModerator = useSelector(selectIsModerator)
  const isBanned = useSelector(selectIsBanned)
  const profile = useSelector(selectProfile)

  const canDo = (action: PermissionAction) => can(profile, action)
  const canModerate = (target?: Pick<Profile, 'role' | 'role_id' | 'suspended_until'> | UserRole | null) =>
    canModerateTarget(profile, target)

  return { role, isAdmin, isModerator, isBanned, can: canDo, canModerate }
}
