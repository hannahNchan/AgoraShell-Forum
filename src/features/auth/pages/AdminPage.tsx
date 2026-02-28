import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectIsAdmin } from '../store/authSelectors'
import { supabase } from '../../../services/supabase'
import { type UserRole } from '../../../types'
import Spinner from '../../../components/shared/Spinner'

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
  admin: 'bg-purple-100 text-purple-700',
  moderator: 'bg-blue-100 text-blue-700',
  user: 'bg-slate-100 text-slate-600',
  banned: 'bg-red-100 text-red-600',
}

const AdminPage = () => {
  const isAdmin = useSelector(selectIsAdmin)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

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

  useEffect(() => { fetchUsers() }, [])

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

  if (!isAdmin) {
    return (
      <div className="text-center py-16 text-slate-400">
        No tienes permisos para ver esta página.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Panel de administración</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs text-slate-500 font-medium">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol actual</th>
                <th className="px-5 py-3">Cambiar rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs overflow-hidden flex-shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-medium text-slate-700">{u.username}</span>
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
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
