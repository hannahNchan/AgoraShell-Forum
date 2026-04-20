import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ChevronLeft, ChevronRight, Home, Bookmark, Flame,
  Settings, LogOut, User, Plus, ChevronDown, LayoutGrid, Menu, X, Bell, Sun, Moon,
} from 'lucide-react'
import { type AppDispatch, type RootState } from '../store'
import { fetchChannels, createChannel, deleteChannel } from '../features/forums/store/forumsSlice'
import { logout } from '../features/auth/store/authSlice'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useRole } from '../features/auth/hooks/useRole'
import { useDarkMode } from '../hooks/useDarkMode'
import Spinner from '../components/shared/Spinner'
import { type Channel } from '../types'
import ConfirmModal from '../components/shared/ConfirmModal'
import { useConfirm } from '../hooks/useConfirm'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import GlobalSearch from '../components/GlobalSearch'
import NotificationPanel from '../features/notifications/components/NotificationPanel'

const CreateChannelModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('💬')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setIcon(emojiData.emoji)
    setShowPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      await dispatch(createChannel({ name: name.trim(), description: description.trim(), slug, icon })).unwrap()
      onClose()
    } catch (err: any) {
      setError(err || 'Error al crear el canal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Crear canal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:cursor-pointer transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {showPicker && (
            <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-slate-800 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">Elige un icono</span>
                <button type="button" onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600 hover:cursor-pointer transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <EmojiPicker onEmojiClick={handleEmojiClick} width="100%" height="100%" />
              </div>
            </div>
          )}

          <div className="hidden md:flex flex-col items-center bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 p-4 min-w-[340px]">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Icono del canal</p>
            <div className="text-4xl mb-4 p-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
              {icon}
            </div>
            <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={380} />
          </div>

          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
            <div className="md:hidden">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icono <span className="text-slate-400 font-normal">— toca para elegir</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-indigo-300 bg-indigo-50 hover:bg-indigo-100 hover:cursor-pointer transition-colors w-full"
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-sm text-indigo-600 font-medium">Cambiar icono</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Diseño Web"
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve del canal"
                rows={2}
                style={{ fieldSizing: 'content' } as React.CSSProperties}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 hover:cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Spinner size="sm" /> : 'Crear canal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { channelId } = useParams()

  const { profile, isAuthenticated, isModerator } = useAuth()
  const { isAdmin } = useRole()
  const channels = useSelector((state: RootState) => state.channels.items)
  const channelsLoading = useSelector((state: RootState) => state.channels.loading)
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount)
  const { confirm } = useConfirm()
  const isHome = location.pathname === '/'

  useEffect(() => {
    dispatch(fetchChannels())
  }, [dispatch])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const handleDeleteChannel = async (channel: Channel) => {
    const ok = await confirm('Eliminar canal', `¿Eliminar "${channel.name}"? Solo se puede eliminar si está vacío.`)
    if (!ok) return
    try {
      await dispatch(deleteChannel(channel.id)).unwrap()
    } catch (err: any) {
      console.error(err)
    }
  }

  const isActiveChannel = (id: string) => channelId === id

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#0e1e40' }}>
      <div
        className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}
        style={{ borderBottom: '1px solid rgba(85,205,252,0.15)' }}
      >
        <img src="/images/big_logo.svg" alt="Logo Agora shell" className="w-auto" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {[
          { to: '/', icon: <Home size={16} />, label: 'Inicio' },
          { to: '/saved', icon: <Bookmark size={16} />, label: 'Guardados' },
          { to: '/hot', icon: <Flame size={16} />, label: 'Hot Topics' },
          { to: '/channels', icon: <LayoutGrid size={16} />, label: 'Ver todos los canales' },
        ].map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:cursor-pointer ${collapsed ? 'justify-center' : ''}`}
            style={
              location.pathname === to
                ? { background: 'rgba(85,205,252,0.18)', color: '#55cdfc' }
                : { color: 'rgba(255,255,255,0.65)' }
            }
            onMouseEnter={e => {
              if (location.pathname !== to) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(85,205,252,0.08)'
                  ; (e.currentTarget as HTMLElement).style.color = '#ffffff'
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== to) {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
              }
            }}
            title={collapsed ? label : undefined}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(247,168,184,0.6)' }}>Canales</p>
          </div>
        )}
        {collapsed && <div className="my-2" style={{ borderTop: '1px solid rgba(85,205,252,0.15)' }} />}

        {channelsLoading ? (
          <div className={`flex ${collapsed ? 'justify-center' : ''} py-2`}>
            <Spinner size="sm" />
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="group relative">
              <Link
                to={`/channels/${channel.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:cursor-pointer ${collapsed ? 'justify-center' : ''}`}
                style={
                  isActiveChannel(channel.id)
                    ? { background: 'rgba(247,168,184,0.15)', color: '#f7a8b8' }
                    : { color: 'rgba(255,255,255,0.65)' }
                }
                onMouseEnter={e => {
                  if (!isActiveChannel(channel.id)) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(85,205,252,0.08)'
                      ; (e.currentTarget as HTMLElement).style.color = '#ffffff'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActiveChannel(channel.id)) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
                  }
                }}
                title={collapsed ? `>| ${channel.name}` : undefined}
              >
                <span className="text-base shrink-0">{channel.icon}</span>
                {!collapsed && (
                  <span className="truncate flex-1 flex items-center gap-1">
                    <span
                      className="font-mono font-bold text-xs shrink-0"
                      style={{
                        background: 'linear-gradient(90deg, #55cdfc, #f7a8b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {'>|'}
                    </span>
                    {channel.name}
                  </span>
                )}
                {!collapsed && isModerator && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleDeleteChannel(channel) }}
                    className="hover:cursor-pointer opacity-0 group-hover:opacity-100 transition-all ml-auto"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f7a8b8'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
                    title="Eliminar canal"
                  >
                    <X size={18} />
                  </button>
                )}
              </Link>
            </div>
          ))
        )}

        {isModerator && (
          <button
            onClick={() => setShowCreateChannel(true)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:cursor-pointer transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'rgba(0,255,136,0.7)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.08)'
                ; (e.currentTarget as HTMLElement).style.color = '#00ff88'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
                ; (e.currentTarget as HTMLElement).style.color = 'rgba(0,255,136,0.7)'
            }}
            title={collapsed ? 'Crear canal' : undefined}
          >
            <Plus size={18} />
            {!collapsed && <span>Crear canal</span>}
          </button>
        )}
      </nav>

      {isAuthenticated && profile && (
        <div className="p-3" style={{ borderTop: '1px solid rgba(85,205,252,0.15)' }}>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:cursor-pointer ${collapsed ? 'justify-center' : ''}`}
            style={{ color: 'rgba(255,255,255,0.65)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(85,205,252,0.08)'
                ; (e.currentTarget as HTMLElement).style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
                ; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
            }}
            title={collapsed ? 'Configuración' : undefined}
          >
            <Settings size={16} />
            {!collapsed && <span>Configuración</span>}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setUserMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:cursor-pointer ${collapsed ? 'justify-center' : ''}`}
              style={{ color: '#f7a8b8' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(247,168,184,0.1)'
                  ; (e.currentTarget as HTMLElement).style.color = '#f7a8b8'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ; (e.currentTarget as HTMLElement).style.color = '#f7a8b8'
              }}
            >
              <Settings size={15} />
              {!collapsed && <span>Administración</span>}
            </Link>
          )}
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-3 transition-colors hover:cursor-pointer"
        style={{ borderTop: '1px solid rgba(85,205,252,0.15)', color: 'rgba(255,255,255,0.4)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(85,205,252,0.08)'
            ; (e.currentTarget as HTMLElement).style.color = '#55cdfc'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
            ; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </div>
  )

  const Breadcrumb = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    const activeChannel = channels.find((c) => c.id === channelId)

    if (parts.length === 0) return null

    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
        <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Inicio</Link>
        {activeChannel && (
          <>
            <span
              className="font-mono font-bold text-xs shrink-0"
              style={{
                background: 'linear-gradient(90deg, #55cdfc, #f7a8b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {'>|'}
            </span>
            <Link to={`/channels/${activeChannel.id}`} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1">
              <span>{activeChannel.icon}</span>
              <span>{activeChannel.name}</span>
            </Link>
          </>
        )}
        {parts.includes('topics') && (
          <>
            <span
              className="font-mono font-bold text-xs shrink-0"
              style={{
                background: 'linear-gradient(90deg, #55cdfc, #f7a8b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {'>|'}
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Tema</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" style={{ position: 'relative' }}>
      <aside
        className={`
          fixed lg:relative z-40 lg:z-auto h-full flex flex-col transition-all duration-300 ease-in-out shrink-0
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          w-[80vw] lg:w-64
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ background: '#0e1e40' }}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
        {mobileOpen && (
          <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-2 md:px-4 py-2 flex items-center gap-4 sticky top-0 z-20 shrink-0 relative">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:cursor-pointer transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 hidden md:block">
            <span className="text-slate-800 dark:text-slate-100 font-bold text-lg">AgoraShell</span>
          </div>

          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-full max-w-xl">
            <GlobalSearch />
          </div>

          <div className="lg:hidden flex-1">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1 hidden md:block"
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
              </div>
            )}

            {isAuthenticated && profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 p-1 transition-colors hover:cursor-pointer"
                >
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      profile.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.username}</p>
                        <p className="text-xs text-slate-400 capitalize">{profile.role}</p>
                      </div>
                      <button
                        onClick={toggleDark}
                        title={isDark ? 'Modo claro' : 'Modo oscuro'}
                        className="items-center gap-3 px-4 py-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:cursor-pointer transition-colors p-1 block md:hidden"
                      >
                        <div className="flex gap-2 items-center">
                          <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center ${isDark ? 'left-[22px]' : 'left-0.5'}`}>
                              {isDark ? <Moon size={11} className="text-indigo-600" /> : <Sun size={11} className="text-amber-500" />}
                            </div>
                          </div>
                          {isDark ? 'Modo claro' : 'Modo oscuro'}
                        </div>
                      </button>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:cursor-pointer transition-colors"
                      >
                        <Settings size={15} />
                        Configuración
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:cursor-pointer transition-colors w-full"
                      >
                        <LogOut size={15} />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:cursor-pointer">
                <User size={20} />
              </Link>
            )}
          </div>
        </header>

        <Breadcrumb />

        <main id="main-scroll" className="flex-1 overflow-y-auto">
          <div className={`${isHome ? 'max-w-7xl' : 'max-w-4xl'} mx-auto px-4 py-6`}>
            <Outlet />
          </div>
        </main>
      </div>

      {showCreateChannel && <CreateChannelModal onClose={() => setShowCreateChannel(false)} />}
      <ConfirmModal />
    </div>
  )
}

export default MainLayout
