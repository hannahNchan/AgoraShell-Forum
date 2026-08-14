import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { type GeoJSONSource, type LngLatLike, type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Check, ExternalLink, Loader2, MapPin, Plus, X } from 'lucide-react'
import { supabase } from '../../../services/supabase'
import { useAuth } from '../../auth/hooks/useAuth'

interface TopicMapViewProps {
  topicId: string
}

interface TopicMapPlace {
  id: string
  topic_id: string
  created_by: string
  created_by_email: string
  name: string
  activities: string
  description: string
  is_lgbt_friendly: boolean
  is_trans_inclusive: boolean
  observations: string | null
  longitude: number
  latitude: number
  created_at: string
}

interface DraftCoordinates {
  longitude: number
  latitude: number
  menuX: number
  menuY: number
}

interface PlaceFormState {
  name: string
  activities: string
  description: string
  isLgbtFriendly: boolean
  isTransInclusive: boolean
  observations: string
}

const MEXICO_BOUNDS: [[number, number], [number, number]] = [[-118.6, 13.8], [-86.4, 33.5]]
const MEXICO_CENTER: LngLatLike = [-102.55, 23.63]

const emptyForm: PlaceFormState = {
  name: '',
  activities: '',
  description: '',
  isLgbtFriendly: false,
  isTransInclusive: false,
  observations: '',
}

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

const buildPlacesGeoJson = (places: TopicMapPlace[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => ({
    type: 'Feature' as const,
    properties: {
      id: place.id,
      name: place.name,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [place.longitude, place.latitude],
    },
  })),
})

const createMarkerElement = (isSelected: boolean) => {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = 'topic-map-marker'
  marker.setAttribute('aria-label', 'Lugar de interes')
  marker.style.width = isSelected ? '34px' : '28px'
  marker.style.height = isSelected ? '34px' : '28px'
  marker.style.borderRadius = '999px'
  marker.style.border = isSelected ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.86)'
  marker.style.background = 'linear-gradient(135deg, #55cdfc, #f7a8b8)'
  marker.style.boxShadow = isSelected ? '0 0 0 7px rgba(85,205,252,0.26)' : '0 10px 24px rgba(15,23,42,0.35)'
  marker.style.cursor = 'pointer'
  marker.style.transform = 'translateY(-2px)'
  return marker
}

const numberFromDb = (value: unknown) => Number(value)

const TopicMapView = ({ topicId }: TopicMapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const touchTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const { isAuthenticated, user } = useAuth()
  const [places, setPlaces] = useState<TopicMapPlace[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [draftCoordinates, setDraftCoordinates] = useState<DraftCoordinates | null>(null)
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<PlaceFormState>(emptyForm)
  const [loadingPlaces, setLoadingPlaces] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? null
  const placesGeoJson = useMemo(() => buildPlacesGeoJson(places), [places])

  const openContextMenu = useCallback((longitude: number, latitude: number, x: number, y: number) => {
    const container = containerRef.current
    const maxX = (container?.clientWidth ?? 260) - 232
    const maxY = (container?.clientHeight ?? 220) - 58
    setSelectedPlaceId('')
    setDraftCoordinates({
      longitude: Number(longitude.toFixed(6)),
      latitude: Number(latitude.toFixed(6)),
      menuX: Math.max(8, Math.min(x, maxX)),
      menuY: Math.max(8, Math.min(y, maxY)),
    })
    setContextMenuOpen(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadPlaces = async () => {
      setLoadingPlaces(true)
      setError('')
      const { data, error: placesError } = await supabase
        .from('topic_map_places')
        .select('id, topic_id, created_by, created_by_email, name, activities, description, is_lgbt_friendly, is_trans_inclusive, observations, longitude, latitude, created_at')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })

      if (cancelled) return
      if (placesError) {
        setError(placesError.message)
        setPlaces([])
      } else {
        const rows = (data ?? []).map((place) => ({
          ...place,
          longitude: numberFromDb(place.longitude),
          latitude: numberFromDb(place.latitude),
        })) as TopicMapPlace[]
        setPlaces(rows)
        setSelectedPlaceId((current) => current || rows[0]?.id || '')
      }
      setLoadingPlaces(false)
    }

    void loadPlaces()
    return () => {
      cancelled = true
    }
  }, [topicId])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: MEXICO_CENTER,
      zoom: 4.2,
      minZoom: 4,
      maxZoom: 19,
      maxBounds: MEXICO_BOUNDS,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')

    map.on('load', () => {
      map.addSource('topic-map-places', {
        type: 'geojson',
        data: buildPlacesGeoJson([]),
      })
      map.fitBounds([[-117.2, 14.4], [-86.8, 32.7]], { padding: 36, duration: 0 })
    })

    map.on('contextmenu', (event) => {
      event.preventDefault()
      openContextMenu(event.lngLat.lng, event.lngLat.lat, event.point.x, event.point.y)
    })

    map.on('click', () => setContextMenuOpen(false))

    const canvas = map.getCanvas()
    const clearTouchTimer = () => {
      if (!touchTimerRef.current) return
      window.clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      clearTouchTimer()
      touchTimerRef.current = window.setTimeout(() => {
        const point = [event.offsetX, event.offsetY] as [number, number]
        const lngLat = map.unproject(point)
        openContextMenu(lngLat.lng, lngLat.lat, point[0], point[1])
      }, 550)
    }
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', clearTouchTimer)
    canvas.addEventListener('pointerup', clearTouchTimer)
    canvas.addEventListener('pointercancel', clearTouchTimer)

    mapRef.current = map

    return () => {
      clearTouchTimer()
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', clearTouchTimer)
      canvas.removeEventListener('pointerup', clearTouchTimer)
      canvas.removeEventListener('pointercancel', clearTouchTimer)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [openContextMenu])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = places.map((place) => {
      const marker = new maplibregl.Marker({ element: createMarkerElement(place.id === selectedPlaceId), anchor: 'bottom' })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map)

      marker.getElement().addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation()
        setContextMenuOpen(false)
        setSelectedPlaceId(place.id)
        map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 14), duration: 650 })
      })

      return marker
    })

    const source = map.getSource('topic-map-places') as GeoJSONSource | undefined
    source?.setData(placesGeoJson)
  }, [places, selectedPlaceId, placesGeoJson])

  const openAddModal = () => {
    setContextMenuOpen(false)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setModalOpen(false)
    setDraftCoordinates(null)
    setForm(emptyForm)
  }

  const updateForm = <K extends keyof PlaceFormState>(key: K, value: PlaceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const canSubmit = Boolean(
    draftCoordinates &&
    form.name.trim() &&
    form.activities.trim() &&
    form.description.trim() &&
    isAuthenticated
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draftCoordinates || !canSubmit) return

    setSubmitting(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('topic_map_places')
      .insert({
        topic_id: topicId,
        name: form.name.trim(),
        activities: form.activities.trim(),
        description: form.description.trim(),
        is_lgbt_friendly: form.isLgbtFriendly,
        is_trans_inclusive: form.isTransInclusive,
        observations: form.observations.trim() || null,
        longitude: draftCoordinates.longitude,
        latitude: draftCoordinates.latitude,
      })
      .select('id, topic_id, created_by, created_by_email, name, activities, description, is_lgbt_friendly, is_trans_inclusive, observations, longitude, latitude, created_at')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    const nextPlace = {
      ...data,
      longitude: numberFromDb(data.longitude),
      latitude: numberFromDb(data.latitude),
    } as TopicMapPlace

    setPlaces((current) => [nextPlace, ...current])
    setSelectedPlaceId(nextPlace.id)
    setDraftCoordinates(null)
    setModalOpen(false)
    setForm(emptyForm)
    setSubmitting(false)
    mapRef.current?.easeTo({ center: [nextPlace.longitude, nextPlace.latitude], zoom: 15, duration: 650 })
  }

  const openStreetView = () => {
    if (!selectedPlace) return
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedPlace.latitude},${selectedPlace.longitude}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700 md:w-[calc(100vw-4rem)] lg:w-[calc(100vw-20rem)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-slate-950/95 p-3 text-white md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            <MapPin size={14} />
            Mapa interactivo de Mexico
          </div>
          <h2 className="mt-1 text-lg font-bold leading-tight">Lugares relevantes por ciudad</h2>
        </div>
        <p className="text-xs text-slate-300 md:text-right">
          Click derecho o manten presionado el mapa para agregar un lugar de interes.
        </p>
      </div>

      <div className="relative h-[68vh] min-h-[520px] md:h-[72vh]">
        <div ref={containerRef} className="h-full w-full" />

        {loadingPlaces && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/85 px-3 py-2 text-xs font-medium text-slate-100 shadow-xl backdrop-blur">
            <Loader2 size={14} className="animate-spin text-cyan-200" />
            Cargando lugares...
          </div>
        )}

        {!loadingPlaces && places.length === 0 && !selectedPlace && (
          <div className="absolute left-3 top-3 max-w-xs rounded-lg border border-white/15 bg-slate-950/85 px-3 py-2 text-xs text-slate-100 shadow-xl backdrop-blur">
            Este mapa esta virgen. Usa click derecho o manten presionado para marcar el primer lugar.
          </div>
        )}

        {contextMenuOpen && draftCoordinates && (
          <div
            className="absolute z-10 w-56 overflow-hidden rounded-lg border border-white/15 bg-slate-950 text-sm text-white shadow-2xl"
            style={{
              left: draftCoordinates.menuX,
              top: draftCoordinates.menuY,
            }}
          >
            <button
              type="button"
              onClick={openAddModal}
              className="flex w-full items-center gap-2 px-3 py-3 text-left font-medium transition-colors hover:bg-cyan-400 hover:text-slate-950"
            >
              <Plus size={15} />
              Agregar lugar de interes
            </button>
          </div>
        )}

        {selectedPlace && (
          <aside className="absolute inset-x-3 bottom-3 max-h-[46%] overflow-y-auto rounded-xl border border-white/15 bg-slate-950/92 p-4 text-white shadow-2xl backdrop-blur md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-80">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Lugar de interes</p>
                <h3 className="mt-1 text-lg font-bold leading-tight">{selectedPlace.name}</h3>
                <p className="mt-1 text-xs text-slate-400">Agregado por {selectedPlace.created_by_email}</p>
              </div>
              <button
                type="button"
                onClick={openStreetView}
                className="shrink-0 rounded-lg border border-white/15 p-2 text-slate-200 transition-colors hover:border-cyan-300/70 hover:text-cyan-100"
                title="Abrir Street View en Google Maps"
              >
                <ExternalLink size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              <p><span className="font-semibold text-slate-100">Actividades:</span> {selectedPlace.activities}</p>
              <p><span className="font-semibold text-slate-100">Descripcion:</span> {selectedPlace.description}</p>
              {selectedPlace.observations && <p><span className="font-semibold text-slate-100">Observaciones:</span> {selectedPlace.observations}</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge checked={selectedPlace.is_lgbt_friendly} label="LGBT friendly" />
              <Badge checked={selectedPlace.is_trans_inclusive} label="Transincluyente" />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
            </p>
          </aside>
        )}

        {error && !modalOpen && (
          <div className="absolute bottom-3 left-3 max-w-sm rounded-lg border border-red-400/40 bg-red-950/90 px-3 py-2 text-xs text-red-100 shadow-xl backdrop-blur">
            {error}
          </div>
        )}
      </div>

      {modalOpen && draftCoordinates && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm md:items-center md:p-4">
          <form onSubmit={handleSubmit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:max-w-2xl md:rounded-2xl md:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Agregar lugar de interes</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Coordenadas WGS84: {draftCoordinates.latitude.toFixed(6)}, {draftCoordinates.longitude.toFixed(6)}
                </p>
                {user?.email && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Se registrara con {user.email}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {!isAuthenticated && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Necesitas iniciar sesion para guardar un lugar.
              </div>
            )}

            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Nombre del lugar
                <input
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                  maxLength={120}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Ej. Cafe, centro cultural, bar..."
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Actividades
                <textarea
                  value={form.activities}
                  onChange={(event) => updateForm('activities', event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Que se puede hacer ahi, eventos, servicios, horarios relevantes..."
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripcion
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  maxLength={1200}
                  rows={4}
                  className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Describe el lugar y por que es relevante para la comunidad."
                />
              </label>

              <div className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <CheckboxRow
                  checked={form.isLgbtFriendly}
                  label="Es amigable con LGBT"
                  onChange={(checked) => updateForm('isLgbtFriendly', checked)}
                />
                <CheckboxRow
                  checked={form.isTransInclusive}
                  label="Transincluyente"
                  onChange={(checked) => updateForm('isTransInclusive', checked)}
                />
              </div>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                Observaciones
                <textarea
                  value={form.observations}
                  onChange={(event) => updateForm('observations', event.target.value)}
                  maxLength={1200}
                  rows={3}
                  className="resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Notas de seguridad, accesibilidad, trato, restricciones, etc."
                />
              </label>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{error}</p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Guardar lugar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

interface CheckboxRowProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

const CheckboxRow = ({ checked, label, onChange }: CheckboxRowProps) => (
  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-400 dark:border-slate-600"
    />
    {label}
  </label>
)

const Badge = ({ checked, label }: { checked: boolean; label: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
    checked
      ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
      : 'border-slate-500/30 bg-slate-800 text-slate-300'
  }`}
  >
    {checked ? 'Si' : 'No'} · {label}
  </span>
)

export default TopicMapView
