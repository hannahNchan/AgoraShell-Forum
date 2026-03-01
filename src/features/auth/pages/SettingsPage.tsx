import { useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Cropper from 'react-easy-crop'
import { Upload, X, Check, Trash2 } from 'lucide-react'
import { type AppDispatch, type RootState } from '../../../store'
import { updateAvatar } from '../store/authSlice'
import Spinner from '../../../components/shared/Spinner'

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

const SettingsPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const profile = useSelector((state: RootState) => state.auth.profile)
  const user = useSelector((state: RootState) => state.auth.user)

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
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

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu perfil y preferencias</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Foto de perfil</h2>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold text-xl overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.username?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{profile?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
          </div>
          {profile?.avatar_url && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="ml-auto flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} />
              Quitar foto
            </button>
          )}
        </div>

        {!imageSrc ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
          >
            <Upload size={24} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Arrastra una imagen o haz click para elegir</p>
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
                className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Spinner size="sm" /> : <Check size={14} />}
                Guardar foto
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check size={14} />
            Foto actualizada correctamente
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
