import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell, AtSign, Check, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchNotifications, markAllAsRead, markOneAsRead, addNotificationRealtime } from '../store/notificationsSlice'
import { useAuth } from '../../auth/hooks/useAuth'
import { supabase } from '../../../services/supabase'
import { type Notification } from '../../../types'
import Spinner from '../../../components/shared/Spinner'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (n: Notification) => void }) => {
  const isUnread = !notification.read

  const getIcon = () => {
    if (notification.type === 'mention') return <AtSign size={14} className="text-indigo-500" />
    if (notification.type === 'reply') return <MessageCircle size={14} className="text-emerald-500" />
    return <Bell size={14} className="text-slate-400" />
  }

  const getText = () => {
    if (notification.type === 'mention') {
      return (
        <span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{notification.actor?.username}</span>
          <span className="text-slate-600 dark:text-slate-400"> te mencionó en </span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">{notification.topic?.title ?? 'un tema'}</span>
        </span>
      )
    }
    if (notification.type === 'reply') {
      return (
        <span>
          <span className="font-semibold text-slate-800 dark:text-slate-100">{notification.actor?.username}</span>
          <span className="text-slate-600 dark:text-slate-400"> respondió a tu mensaje en </span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">{notification.topic?.title ?? 'un tema'}</span>
        </span>
      )
    }
    return <span className="text-slate-600 dark:text-slate-400">Nueva notificación</span>
  }

  return (
    <button
      onClick={() => onRead(notification)}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isUnread ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''
        }`}
    >
      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
        {notification.actor?.avatar_url ? (
          <img src={notification.actor.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            {notification.actor?.username?.charAt(0).toUpperCase() ?? '?'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {getIcon()}
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
          </span>
          {isUnread && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
        </div>
        <p className="text-sm leading-snug">{getText()}</p>
      </div>
    </button>
  )
}

export const NotificationPanel = ({ open, onClose }: NotificationPanelProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { items, unreadCount, loading } = useSelector((state: RootState) => state.notifications)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return
    dispatch(fetchNotifications())

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url, role), topic:topics(id, title, channel_id)')
            .eq('id', payload.new.id)
            .single()
          if (data) dispatch(addNotificationRealtime(data as Notification))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, user?.id, dispatch])

  const handleRead = (notification: Notification) => {
    dispatch(markOneAsRead(notification.id))
    if (notification.topic_id && notification.topic?.channel_id) {
      navigate(`/channels/${notification.topic.channel_id}/topics/${notification.topic_id}`)
    }
    onClose()
  }

  const handleMarkAll = () => {
    dispatch(markAllAsRead())
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        ref={panelRef}
        className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:cursor-pointer transition-colors"
            >
              <Check size={13} />
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
              <Bell size={28} className="opacity-30" />
              <span className="text-sm">Sin notificaciones</span>
            </div>
          ) : (
            items.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={handleRead} />
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default NotificationPanel
