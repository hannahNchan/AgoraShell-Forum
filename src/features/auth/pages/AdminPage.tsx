import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Ban, Clock, MessageSquare, RotateCcw, Settings, ShieldAlert, Tag as TagIcon, Users, X } from 'lucide-react'
import { selectIsAdmin } from '../store/authSelectors'
import { supabase } from '../../../services/supabase'
import { type UserRole } from '../../../types'
import { type AppDispatch, type RootState } from '../../../store'
import { fetchSettings, updateMaxReplyDepth, updateMaxTags } from '../../tags/store/tagsSlice'
import Spinner from '../../../components/shared/Spinner'
import ReportsAdminPanel from '../../reports/components/ReportsAdminPanel'

interface UserRow {
  id: string
  username: string
  avatar_url: string | null
  role_id: number
  role?: UserRole
  created_at: string
  suspended_until: string | null
  suspension_reason: string | null
  banned_reason: string | null
  moderation_previous_role_id: number | null
  moderation_updated_by: string | null
  moderation_updated_at: string | null
}

type UserQueryRow = UserRow & {
  roles?: { name?: UserRole } | null
}

type RestrictionAction = 'ban' | 'suspend'

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

const getRoleValue = (roleId: number) => ROLES.find((role) => role.id === roleId)?.value ?? 'user'

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la accion.'

const getRestrictionState = (user: UserRow) => {
  const suspendedUntil = user.suspended_until ? new Date(user.suspended_until).getTime() : 0
  const isSuspended = suspendedUntil > Date.now()

  if (user.role_id === 4) {
    return {
      label: 'Baneado',
      detail: user.banned_reason || 'Sin razon registrada',
      className: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/60',
    }
  }

  if (isSuspended) {
    return {
      label: `Suspendido hasta ${formatDateTime(user.suspended_until!)}`,
      detail: user.suspension_reason || 'Sin razon registrada',
      className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/60',
    }
  }

  return {
    label: 'Activo',
    detail: '',
    className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/60',
  }
}

const AdminPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const isAdmin = useSelector(selectIsAdmin)
  const settings = useSelector((state: RootState) => state.tags.settings)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [userError, setUserError] = useState('')
  const [maxTagsInput, setMaxTagsInput] = useState<number>(3)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [maxDepthInput, setMaxDepthInput] = useState<number>(5)
  const [savingDepth, setSavingDepth] = useState(false)
  const [depthSaved, setDepthSaved] = useState(false)
  const [foroBloqueado, setForoBloqueado] = useState(false)
  const [savingBloqueo, setSavingBloqueo] = useState(false)
  const [bloqueoError, setBloqueoError] = useState('')
  const [restrictionModal, setRestrictionModal] = useState<{ user: UserRow; action: RestrictionAction } | null>(null)
  const [reason, setReason] = useState('')
  const [durationDays, setDurationDays] = useState(7)
  const [modalError, setModalError] = useState('')

  const restrictionTarget = restrictionModal?.user
  const modalTitle = restrictionModal?.action === 'ban' ? 'Banear usuario' : 'Suspender usuario'
  const modalSaving = restrictionTarget ? saving === restrictionTarget.id : false

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .order('created_at', { ascending: false })
    setUsers(
      ((data || []) as UserQueryRow[]).map((u) => ({ ...u, role: u.roles?.name as UserRole }))
    )
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      fetchUsers()
      dispatch(fetchSettings())
      const { data: settingsData } = await supabase.from('app_settings').select('foro_bloqueado').eq('id', 1).single()
      if (settingsData) setForoBloqueado(settingsData.foro_bloqueado ?? false)
    }
    init()
  }, [dispatch])

  useEffect(() => {
    if (settings) {
      setMaxTagsInput(settings.max_tags_per_topic)
      setMaxDepthInput(settings.max_reply_depth ?? 5)
    }
  }, [settings])

  const userCountLabel = useMemo(() => `${users.length} usuarios`, [users.length])

  const updateUserInList = (updatedUser: UserRow) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === updatedUser.id ? { ...updatedUser, role: updatedUser.role ?? getRoleValue(updatedUser.role_id) } : user
      )
    )
  }

  const updateProfile = async (userId: string, payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*, roles(name)')
      .single()

    if (error) throw error

    const updated = data as UserQueryRow
    updateUserInList({ ...updated, role: updated.roles?.name as UserRole })
  }

  const openRestrictionModal = (user: UserRow, action: RestrictionAction) => {
    if (user.role_id === 1) return
    setRestrictionModal({ user, action })
    setReason('')
    setDurationDays(7)
    setModalError('')
  }

  const closeRestrictionModal = () => {
    if (modalSaving) return
    setRestrictionModal(null)
    setModalError('')
  }

  const handleRoleChange = async (user: UserRow, roleId: number) => {
    setUserError('')

    if (roleId === 4) {
      openRestrictionModal(user, 'ban')
      return
    }

    setSaving(user.id)
    try {
      await updateProfile(user.id, {
        role_id: roleId,
        role: getRoleValue(roleId),
        ...(user.role_id === 4
          ? {
            banned_reason: null,
            moderation_previous_role_id: null,
          }
          : {}),
      })
    } catch (error: unknown) {
      setUserError(getErrorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  const handleApplyRestriction = async () => {
    if (!restrictionModal) return

    const cleanReason = reason.trim()
    if (cleanReason.length < 5) {
      setModalError('Agrega una razon clara de al menos 5 caracteres.')
      return
    }

    if (restrictionModal.action === 'suspend' && durationDays < 1) {
      setModalError('La suspension debe durar al menos 1 dia.')
      return
    }

    const target = restrictionModal.user
    setSaving(target.id)
    setModalError('')
    setUserError('')

    try {
      if (restrictionModal.action === 'ban') {
        await updateProfile(target.id, {
          role_id: 4,
          role: 'banned',
          banned_reason: cleanReason,
          suspended_until: null,
          suspension_reason: null,
          moderation_previous_role_id: target.role_id === 4 ? target.moderation_previous_role_id ?? 3 : target.role_id,
        })
      } else {
        await updateProfile(target.id, {
          suspended_until: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
          suspension_reason: cleanReason,
          banned_reason: null,
        })
      }
      setRestrictionModal(null)
    } catch (error: unknown) {
      setModalError(getErrorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  const handleLiftRestriction = async (user: UserRow) => {
    setSaving(user.id)
    setUserError('')
    try {
      const restoredRoleId = user.role_id === 4 ? user.moderation_previous_role_id ?? 3 : user.role_id
      await updateProfile(user.id, {
        role_id: restoredRoleId,
        role: getRoleValue(restoredRoleId),
        suspended_until: null,
        suspension_reason: null,
        banned_reason: null,
        moderation_previous_role_id: null,
      })
    } catch (error: unknown) {
      setUserError(getErrorMessage(error))
    } finally {
      setSaving(null)
    }
  }

  const handleToggleBloqueo = async () => {
    setSavingBloqueo(true)
    setBloqueoError('')
    const next = !foroBloqueado
    const { data, error } = await supabase
      .from('app_settings')
      .update({ foro_bloqueado: next })
      .eq('id', 1)
      .select('foro_bloqueado')
      .single()
    if (error) {
      setBloqueoError(error.message)
    } else {
      setForoBloqueado(data.foro_bloqueado ?? false)
    }
    setSavingBloqueo(false)
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

  const renderUserActions = (user: UserRow) => {
    const restriction = getRestrictionState(user)
    const isProtectedAdmin = user.role_id === 1
    const isRestricted = user.role_id === 4 || (user.suspended_until ? new Date(user.suspended_until).getTime() > Date.now() : false)

    return (
      <div className="flex flex-col gap-2">
        <span className={`inline-flex w-fit max-w-full items-center rounded-md border px-2 py-1 text-xs font-medium ${restriction.className}`}>
          {restriction.label}
        </span>
        {restriction.detail && <p className="max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{restriction.detail}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openRestrictionModal(user, 'suspend')}
            disabled={saving === user.id || isProtectedAdmin || user.role_id === 4}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            <Clock size={13} />
            Suspender
          </button>
          <button
            type="button"
            onClick={() => openRestrictionModal(user, 'ban')}
            disabled={saving === user.id || isProtectedAdmin || user.role_id === 4}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Ban size={13} />
            Banear
          </button>
          {isRestricted && (
            <button
              type="button"
              onClick={() => handleLiftRestriction(user)}
              disabled={saving === user.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              <RotateCcw size={13} />
              Levantar
            </button>
          )}
          {isProtectedAdmin && <span className="self-center text-xs text-slate-400">Admin protegido</span>}
          {saving === user.id && <Spinner size="sm" />}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="py-16 text-center text-slate-400">
        No tienes permisos para ver esta pagina.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Panel de administracion</h1>

      <ReportsAdminPanel />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <Settings size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Configuracion general</h2>
        </div>
        <div className="space-y-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <TagIcon size={14} className="text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags maximos por tema</span>
              </div>
              <p className="text-xs text-slate-400">
                Numero maximo de tags que un usuario puede agregar a un tema. (1-10)
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                value={maxTagsInput}
                onChange={(e) => setMaxTagsInput(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings || maxTagsInput < 1 || maxTagsInput > 10}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:cursor-pointer hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingSettings ? <Spinner size="sm" /> : settingsSaved ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 dark:border-slate-700">
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <MessageSquare size={14} className="text-indigo-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profundidad maxima de hilos</span>
              </div>
              <p className="text-xs text-slate-400">
                Niveles de anidacion antes de mostrar "Seguir viendo este hilo". (1-20)
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <input
                type="number"
                min={1}
                max={20}
                value={maxDepthInput}
                onChange={(e) => setMaxDepthInput(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                onClick={handleSaveDepth}
                disabled={savingDepth || maxDepthInput < 1 || maxDepthInput > 20}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:cursor-pointer hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingDepth ? <Spinner size="sm" /> : depthSaved ? 'Guardado' : 'Guardar'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 dark:border-slate-700">
            <div>
              <div className="mb-0.5 flex items-center gap-2">
                <ShieldAlert size={14} className={foroBloqueado ? 'text-red-500' : 'text-slate-400'} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo emergencia</span>
              </div>
              <p className="text-xs text-slate-400">
                {foroBloqueado
                  ? 'El foro esta bloqueado para usuarios no admin: no pueden crear canales, temas ni replies.'
                  : 'Bloquea la creacion de canales, temas y replies para usuarios no admin.'}
              </p>
              {bloqueoError && <p className="mt-2 text-xs text-red-500">{bloqueoError}</p>}
            </div>
            <button
              onClick={handleToggleBloqueo}
              disabled={savingBloqueo}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:cursor-pointer disabled:opacity-50 ${foroBloqueado
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {savingBloqueo ? <Spinner size="sm" /> : foroBloqueado ? 'Reactivar foro' : 'Bloquear foro'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gestion de usuarios</h2>
            </div>
            <span className="text-xs text-slate-400">{userCountLabel}</span>
          </div>
          {userError && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{userError}</div>}

          <div className="divide-y divide-slate-100 dark:divide-slate-700 md:hidden">
            {users.map((user) => (
              <article key={user.id} className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-700 dark:text-slate-300">{user.username}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[user.role ?? 'user']}`}>
                      {user.role ?? 'user'}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Cambiar rol
                    <select
                      value={user.role_id}
                      onChange={(event) => handleRoleChange(user, Number(event.target.value))}
                      disabled={saving === user.id}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {ROLES.map((role) => (
                        <option key={role.id} value={role.id} disabled={user.role_id === 1 && role.id === 4}>{role.label}</option>
                      ))}
                    </select>
                  </label>
                  {renderUserActions(user)}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-700/40 dark:text-slate-400">
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Rol actual</th>
                  <th className="px-5 py-3">Cambiar rol</th>
                  <th className="px-5 py-3">Restriccion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[user.role ?? 'user']}`}>
                        {user.role ?? 'user'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role_id}
                        onChange={(event) => handleRoleChange(user, Number(event.target.value))}
                        disabled={saving === user.id}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      >
                        {ROLES.map((role) => (
                          <option key={role.id} value={role.id} disabled={user.role_id === 1 && role.id === 4}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">{renderUserActions(user)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {restrictionModal && restrictionTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-0 sm:items-center sm:px-4">
          <div className="w-full rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:max-w-lg sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{modalTitle}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{restrictionTarget.username}</p>
              </div>
              <button
                type="button"
                onClick={closeRestrictionModal}
                disabled={modalSaving}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {restrictionModal.action === 'suspend' && (
              <label className="mb-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duracion
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[1, 3, 7, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDurationDays(days)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${durationDays === days
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </label>
            )}

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Razon
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={restrictionModal.action === 'ban' ? 'Explica por que este usuario queda baneado.' : 'Explica por que se suspende temporalmente.'}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <div className="mt-1 text-right text-xs text-slate-400">{reason.length}/1000</div>

            {modalError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{modalError}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRestrictionModal}
                disabled={modalSaving}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyRestriction}
                disabled={modalSaving}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${restrictionModal.action === 'ban'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700'
                  }`}
              >
                {modalSaving && <Spinner size="sm" />}
                {restrictionModal.action === 'ban' ? 'Banear usuario' : 'Suspender usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
