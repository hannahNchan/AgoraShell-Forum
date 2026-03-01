import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ChevronLeft, ChevronRight, Home, Bookmark, Flame,
  Settings, LogOut, User, Plus, ChevronDown, Menu, X, Bell,
} from 'lucide-react'
import { type AppDispatch, type RootState } from '../store'
import { fetchChannels, createChannel, deleteChannel } from '../features/forums/store/forumsSlice'
import { logout } from '../features/auth/store/authSlice'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useRole } from '../features/auth/hooks/useRole'
import Spinner from '../components/shared/Spinner'
import { type Channel } from '../types'
import ConfirmModal from '../components/shared/ConfirmModal'
import { useConfirm } from '../hooks/useConfirm'

const CreateChannelModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('💬')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const ICONS = ['💬', '📢', '🆘', '🎯', '🔥', '💡', '📚', '🎮', '🛠️', '🌍']

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Crear canal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Icono</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`text-xl p-2 rounded-lg border-2 transition-colors ${icon === i ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-slate-50'
                    }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Diseño Web"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción breve del canal"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Spinner size="sm" /> : 'Crear canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { channelId } = useParams()

  const { profile, isAuthenticated, isModerator } = useAuth()
  const { isAdmin } = useRole()
  const channels = useSelector((state: RootState) => state.channels.items)
  const channelsLoading = useSelector((state: RootState) => state.channels.loading)
  const { confirm } = useConfirm()
  const isHome = location.pathname === '/'

  useEffect(() => {
    dispatch(fetchChannels())
  }, [dispatch])

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
      alert(err || 'No se puede eliminar un canal con temas existentes.')
    }
  }

  const isActiveChannel = (id: string) => channelId === id

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
          A
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">AgoraShell</p>
            <p className="text-slate-400 text-xs">Forum</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {[
          { to: '/', icon: <Home size={16} />, label: 'Inicio' },
          { to: '/saved', icon: <Bookmark size={16} />, label: 'Guardados' },
          { to: '/hot', icon: <Flame size={16} />, label: 'Hot Topics' },
        ].map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${location.pathname === to
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : undefined}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {!collapsed && (
          <div className="pt-4 pb-1 px-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canales</p>
          </div>
        )}
        {collapsed && <div className="my-2 border-t border-slate-800" />}

        {channelsLoading ? (
          <div className={`flex ${collapsed ? 'justify-center' : ''} py-2`}>
            <Spinner size="sm" />
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="group relative">
              <Link
                to={`/channels/${channel.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActiveChannel(channel.id)
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? channel.name : undefined}
              >
                <span className="text-base flex-shrink-0">{channel.icon}</span>
                {!collapsed && (
                  <span className="truncate flex-1">{channel.name}</span>
                )}
                {!collapsed && isModerator && (
                  <button
                    onClick={(e) => { e.preventDefault(); handleDeleteChannel(channel) }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all ml-auto"
                    title="Eliminar canal"
                  >
                    <X size={12} />
                  </button>
                )}
              </Link>
            </div>
          ))
        )}

        {isModerator && (
          <button
            onClick={() => setShowCreateChannel(true)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Crear canal' : undefined}
          >
            <Plus size={16} />
            {!collapsed && <span>Crear canal</span>}
          </button>
        )}
      </nav>

      {isAuthenticated && profile && (
        <div className="p-3 border-t border-slate-800">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Configuración' : undefined}
          >
            <Settings size={16} />
            {!collapsed && <span>Configuración</span>}
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Settings size={15} />
              Administración
            </Link>
          )}
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-3 border-t border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
      <div className="flex items-center gap-2 text-sm text-slate-500 px-6 py-2 bg-white border-b border-slate-100">
        <Link to="/" className="hover:text-slate-700 transition-colors">Inicio</Link>
        {activeChannel && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <Link to={`/channels/${activeChannel.id}`} className="hover:text-slate-700 transition-colors flex items-center gap-1">
              <span>{activeChannel.icon}</span>
              <span>{activeChannel.name}</span>
            </Link>
          </>
        )}
        {parts.includes('topics') && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-700 font-medium">Tema</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-40 lg:z-auto h-full bg-slate-900 flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          ${mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}
        `}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-20 flex-shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1">
            <span className="text-slate-800 font-bold text-lg">AgoraShell</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell size={20} />
            </button>

            {isAuthenticated && profile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full hover:bg-slate-50 p-1 transition-colors hover:cursor-pointer"
                >
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
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
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{profile.username}</p>
                        <p className="text-xs text-slate-400 capitalize">{profile.role}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Settings size={15} />
                        Configuración
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut size={15} />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
              >
                <User size={20} />
              </Link>
            )}
          </div>
        </header>

        <Breadcrumb />

        <main className="flex-1 overflow-y-auto">
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
