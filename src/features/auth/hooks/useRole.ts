import { useSelector } from 'react-redux'
import {
  selectIsAdmin,
  selectIsBanned,
  selectIsModerator,
  selectUserRole,
} from '../store/authSelectors'

export const useRole = () => {
  const role = useSelector(selectUserRole)
  const isAdmin = useSelector(selectIsAdmin)
  const isModerator = useSelector(selectIsModerator)
  const isBanned = useSelector(selectIsBanned)

  return { role, isAdmin, isModerator, isBanned }
}
