import { useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Cropper from 'react-easy-crop'
import { type User } from '@supabase/supabase-js'
import { AtSign, FileText, Upload, X, Check, Trash2 } from 'lucide-react'
import { type AppDispatch, type RootState } from '../../../store'
import { updateAvatar, updateProfileSettings } from '../store/authSlice'
import Spinner from '../../../components/shared/Spinner'
import UserLink from '../../../components/shared/UserLink'
import { type Profile } from '../../../types'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const getCroppedBlob = (imageSrc: string, pixelCrop: CropArea): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas empty'))
      }, 'image/webp', 0.92)
    }
    image.onerror = reject
  })

interface SettingsContentProps {
  profile: Profile
  user: User
}

const SettingsContent = ({ profile, user }: SettingsContentProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identitySuccess, setIdentitySuccess] = useState(false)
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [username, setUsername] = useState(profile?.username ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_: unknown, croppedPixels: CropArea) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return
    setSaving(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      await dispatch(updateAvatar({ userId: user.id, blob })).unwrap()
      setImageSrc(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!user) return
    setSaving(true)
    try {
      await dispatch(updateAvatar({ userId: user.id, blob: null })).unwrap()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const cleanUsername = username.trim()
  const cleanBio = bio.trim()
  const usernameValid = /^[A-Za-z0-9_]{3,30}$/.test(cleanUsername)
  const bioValid = cleanBio.length <= 280
  const identityDirty = cleanUsername !== (profile?.username ?? '') || cleanBio !== (profile?.bio ?? '')

  const handleSaveIdentity = async () => {
    if (!user || !usernameValid || !bioValid || !identityDirty) return
    setIdentitySaving(true)
    setIdentityError(null)
    try {
      await dispatch(updateProfileSettings({ userId: user.id, username: cleanUsername, bio: cleanBio })).unwrap()
      setIdentitySuccess(true)
      setTimeout(() => setIdentitySuccess(false), 3000)
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : String(error))
    } finally {
      setIdentitySaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Configuración</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona tu perfil y preferencias</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xl overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.username?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profile?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
            <UserLink profile={profile} className="mt-1 inline-block text-xs font-medium text-indigo-500 hover:text-indigo-600">
              Ver perfil público
            </UserLink>
          </div>
          {profile?.avatar_url && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="ml-auto flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 hover:cursor-pointer"
            >
              <Trash2 size={12} />
              Quitar foto
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <AtSign size={16} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Identidad pública</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={30}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="tu_username"
            />
            <p className={`mt-1 text-xs ${usernameValid ? 'text-slate-400' : 'text-red-500'}`}>
              3-30 caracteres. Letras, números y guion bajo.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <FileText size={14} />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="Una frase corta sobre ti, tus intereses o tu rol en la comunidad."
            />
            <p className={`mt-1 text-right text-xs ${bioValid ? 'text-slate-400' : 'text-red-500'}`}>{cleanBio.length}/280</p>
          </div>
        </div>

        {identityError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {identityError}
          </div>
        )}

        {identitySuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Check size={14} />
            Perfil actualizado correctamente
          </div>
        )}

        <button
          type="button"
          onClick={handleSaveIdentity}
          disabled={identitySaving || !identityDirty || !usernameValid || !bioValid}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
        >
          {identitySaving ? <Spinner size="sm" /> : <Check size={14} />}
          Guardar perfil
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Foto de perfil</h2>

        {!imageSrc ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
              }`}
          >
            <Upload size={24} className="mx-auto mb-3 text-slate-300 dark:text-slate-500" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Arrastra una imagen o haz click para elegir</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — máx. 5MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full h-72 rounded-xl overflow-hidden bg-slate-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-12">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setImageSrc(null); setZoom(1); setCrop({ x: 0, y: 0 }) }}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors hover:cursor-pointer"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 hover:cursor-pointer"
              >
                {saving ? <Spinner size="sm" /> : <Check size={14} />}
                Guardar foto
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
            <Check size={14} />
            Foto actualizada correctamente
          </div>
        )}
      </div>
    </div>
  )
}

const SettingsPage = () => {
  const profile = useSelector((state: RootState) => state.auth.profile)
  const user = useSelector((state: RootState) => state.auth.user)
  const loading = useSelector((state: RootState) => state.auth.loading)

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (!profile || !user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Inicia sesión para editar tu perfil.</p>
      </div>
    )
  }

  return <SettingsContent key={profile.id} profile={profile} user={user} />
}

export default SettingsPage
