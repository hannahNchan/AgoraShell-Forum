import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsAdmin } from '../store/authSelectors'
import { supabase } from '../../../services/supabase'
import { type UserRole } from '../../../types'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchSettings, updateMaxTags, updateMaxReplyDepth } from '../../tags/store/tagsSlice'
import Spinner from '../../../components/shared/Spinner'
import { Settings, Tag as TagIcon, Users, MessageSquare } from 'lucide-react'

interface UserRow {
  id: string
  username: string
  avatar_url: string | null
  role_id: number
  role?: UserRole
  created_at: string
}

const ROLES: { label: string; value: UserRole; id: number }[] = [
  { id: 1, label: 'Admin', value: 'admin' },
  { id: 2, label: 'Moderador', value: 'moderator' },
  { id: 3, label: 'Usuario', value: 'user' },
  { id: 4, label: 'Baneado', value: 'banned' },
]

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  moderator: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  user: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  banned: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

const AdminPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const isAdmin = useSelector(selectIsAdmin)
  const settings = useSelector((state: RootState) => state.tags.settings)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [maxTagsInput, setMaxTagsInput] = useState<number>(3)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [maxDepthInput, setMaxDepthInput] = useState<number>(5)
  const [savingDepth, setSavingDepth] = useState(false)
  const [depthSaved, setDepthSaved] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .order('created_at', { ascending: false })
    setUsers(
      (data || []).map((u: any) => ({ ...u, role: u.roles?.name as UserRole }))
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (settings) {
      setMaxTagsInput(settings.max_tags_per_topic)
      setMaxDepthInput(settings.max_reply_depth ?? 5)
    }
  }, [settings])

  const handleRoleChange = async (userId: string, roleId: number) => {
    setSaving(userId)
    await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, role_id: roleId, role: ROLES.find((r) => r.id === roleId)?.value }
          : u
      )
    )
    setSaving(null)
  }

  const handleSaveSettings = async () => {
    if (maxTagsInput < 1 || maxTagsInput > 10) return
    setSavingSettings(true)
    await dispatch(updateMaxTags(maxTagsInput)).unwrap()
    setSavingSettings(false)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleSaveDepth = async () => {
    if (maxDepthInput < 1 || maxDepthInput > 20) return
    setSavingDepth(true)
    await dispatch(updateMaxReplyDepth(maxDepthInput)).unwrap()
    setSavingDepth(false)
    setDepthSaved(true)
    setTimeout(() => setDepthSaved(false), 2000)
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16 text-slate-400">
        No tienes permisos para ver esta página.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Panel de administración</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Configuración general</h2>
        </div>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <TagIcon size={14} className="text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags máximos por tema</span>
              </div>
              <p className="text-xs text-slate-400">
                Número máximo de tags que un usuario puede agregar a un tema. (1–10)
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input
                type="number"
                min={1}
                max={10}
                value={maxTagsInput}
                onChange={(e) => setMaxTagsInput(Number(e.target.value))}
                className="w-20 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings || maxTagsInput < 1 || maxTagsInput > 10}
                className="hover:cursor-pointer px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingSettings ? <Spinner size="sm" /> : settingsSaved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-6 flex items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MessageSquare size={14} className="text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profundidad máxima de hilos</span>
              </div>
              <p className="text-xs text-slate-400">
                Niveles de anidación antes de mostrar "Seguir viendo este hilo". (1–20)
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input
                type="number"
                min={1}
                max={20}
                value={maxDepthInput}
                onChange={(e) => setMaxDepthInput(Number(e.target.value))}
                className="w-20 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveDepth}
                disabled={savingDepth || maxDepthInput < 1 || maxDepthInput > 20}
                className="hover:cursor-pointer px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingDepth ? <Spinner size="sm" /> : depthSaved ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gestión de usuarios</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-left text-xs text-slate-500 dark:text-slate-400 font-medium">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol actual</th>
                <th className="px-5 py-3">Cambiar rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-xs overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleBadge[u.role ?? 'user']}`}>
                      {u.role ?? 'user'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={u.role_id}
                        onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                        disabled={saving === u.id}
                        className="text-xs border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 hover:cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                      {saving === u.id && <Spinner size="sm" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPage
