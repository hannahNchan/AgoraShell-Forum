import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as maplibregl from 'maplibre-gl'
import { type GeoJSONSource, type LngLatLike, type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Crosshair, ExternalLink, Hand, MapPin, PencilLine, Plus, Route, Shapes, X } from 'lucide-react'

type DrawMode = 'explore' | 'place' | 'line' | 'polygon'
type MapPoint = [number, number]

interface MapPlace {
  id: string
  title: string
  city: string
  category: string
  note: string
  coordinates: MapPoint
}

interface MapShape {
  id: string
  type: 'line' | 'polygon'
  label: string
  coordinates: MapPoint[]
}

const MEXICO_BOUNDS: [[number, number], [number, number]] = [[-118.6, 13.8], [-86.4, 33.5]]
const MEXICO_CENTER: LngLatLike = [-102.55, 23.63]

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

const initialPlaces: MapPlace[] = [
  {
    id: 'zona-rosa-cdmx',
    title: 'Zona Rosa',
    city: 'Ciudad de Mexico',
    category: 'Zona LGBT+',
    note: 'Area historica con bares, cafes, vida nocturna y puntos de reunion. Ideal para mapear lugares seguros, horarios y notas de accesibilidad.',
    coordinates: [-99.1647, 19.4233],
  },
  {
    id: 'chapultepec-gdl',
    title: 'Corredor Chapultepec',
    city: 'Guadalajara',
    category: 'Cultura y noche',
    note: 'Corredor con actividad nocturna, restaurantes y espacios culturales. Buen punto para agregar recomendaciones por colonia.',
    coordinates: [-103.3778, 20.6736],
  },
  {
    id: 'barrio-antiguo-mty',
    title: 'Barrio Antiguo',
    city: 'Monterrey',
    category: 'Vida nocturna',
    note: 'Zona centrica para marcar venues, eventos y rutas caminables entre lugares relevantes.',
    coordinates: [-100.309, 25.666],
  },
]

const initialShapes: MapShape[] = [
  {
    id: 'cdmx-safe-walk',
    type: 'line',
    label: 'Ruta sugerida Zona Rosa',
    coordinates: [
      [-99.1671, 19.4255],
      [-99.1647, 19.4233],
      [-99.1625, 19.4214],
    ],
  },
  {
    id: 'centro-cdmx-area',
    type: 'polygon',
    label: 'Area central de referencia',
    coordinates: [
      [-99.17, 19.428],
      [-99.156, 19.428],
      [-99.156, 19.418],
      [-99.17, 19.418],
    ],
  },
]

const buildPlacesGeoJson = (places: MapPlace[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => ({
    type: 'Feature' as const,
    properties: {
      id: place.id,
      title: place.title,
      category: place.category,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: place.coordinates,
    },
  })),
})

const buildShapesGeoJson = (shapes: MapShape[], draft: MapPoint[], mode: DrawMode) => ({
  type: 'FeatureCollection' as const,
  features: [
    ...shapes.map((shape) => ({
      type: 'Feature' as const,
      properties: {
        id: shape.id,
        label: shape.label,
        kind: shape.type,
      },
      geometry: shape.type === 'polygon'
        ? {
            type: 'Polygon' as const,
            coordinates: [[...shape.coordinates, shape.coordinates[0]]],
          }
        : {
            type: 'LineString' as const,
            coordinates: shape.coordinates,
          },
    })),
    ...(draft.length > 0
      ? [{
          type: 'Feature' as const,
          properties: { id: 'draft', label: 'Trazo en progreso', kind: mode },
          geometry: mode === 'polygon' && draft.length > 2
            ? {
                type: 'Polygon' as const,
                coordinates: [[...draft, draft[0]]],
              }
            : {
                type: 'LineString' as const,
                coordinates: draft,
              },
        }]
      : []),
  ],
})

const createMarkerElement = (isSelected: boolean) => {
  const marker = document.createElement('button')
  marker.type = 'button'
  marker.className = 'topic-map-marker'
  marker.setAttribute('aria-label', 'Lugar marcado')
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

const TopicMapView = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [places, setPlaces] = useState<MapPlace[]>(initialPlaces)
  const [shapes, setShapes] = useState<MapShape[]>(initialShapes)
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialPlaces[0]?.id ?? '')
  const [mode, setMode] = useState<DrawMode>('explore')
  const [draft, setDraft] = useState<MapPoint[]>([])

  const selectedPlace = places.find((place) => place.id === selectedPlaceId) ?? places[0]
  const placesGeoJson = useMemo(() => buildPlacesGeoJson(places), [places])
  const shapesGeoJson = useMemo(() => buildShapesGeoJson(shapes, draft, mode), [shapes, draft, mode])

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
        data: buildPlacesGeoJson(initialPlaces),
      })
      map.addSource('topic-map-shapes', {
        type: 'geojson',
        data: buildShapesGeoJson(initialShapes, [], 'explore'),
      })
      map.addLayer({
        id: 'topic-map-polygons',
        type: 'fill',
        source: 'topic-map-shapes',
        filter: ['==', ['get', 'kind'], 'polygon'],
        paint: {
          'fill-color': '#55cdfc',
          'fill-opacity': 0.18,
        },
      })
      map.addLayer({
        id: 'topic-map-lines',
        type: 'line',
        source: 'topic-map-shapes',
        paint: {
          'line-color': ['case', ['==', ['get', 'id'], 'draft'], '#f7a8b8', '#55cdfc'],
          'line-width': ['case', ['==', ['get', 'id'], 'draft'], 4, 3],
          'line-dasharray': ['case', ['==', ['get', 'id'], 'draft'], ['literal', [1.2, 1.2]], ['literal', [1, 0]]],
        },
      })
      map.fitBounds([[-117.2, 14.4], [-86.8, 32.7]], { padding: 36, duration: 0 })
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const coordinates: MapPoint = [Number(event.lngLat.lng.toFixed(6)), Number(event.lngLat.lat.toFixed(6))]
      if (mode === 'place') {
        const nextPlace: MapPlace = {
          id: `place-${Date.now()}`,
          title: 'Nuevo lugar marcado',
          city: 'Mexico',
          category: 'Nota comunitaria',
          note: `Nota creada en ${coordinates[1]}, ${coordinates[0]}. Editar y persistir este contenido sera el siguiente paso.`,
          coordinates,
        }
        setPlaces((current) => [...current, nextPlace])
        setSelectedPlaceId(nextPlace.id)
        setMode('explore')
        return
      }
      if (mode === 'line' || mode === 'polygon') {
        setDraft((current) => [...current, coordinates])
      }
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getCanvas().style.cursor = mode === 'explore' ? 'grab' : 'crosshair'
  }, [mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = places.map((place) => {
      const marker = new maplibregl.Marker({ element: createMarkerElement(place.id === selectedPlaceId), anchor: 'bottom' })
        .setLngLat(place.coordinates)
        .addTo(map)
      marker.getElement().addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation()
        setSelectedPlaceId(place.id)
        map.easeTo({ center: place.coordinates, zoom: Math.max(map.getZoom(), 14), duration: 650 })
      })
      return marker
    })

    const source = map.getSource('topic-map-places') as GeoJSONSource | undefined
    source?.setData(placesGeoJson)
  }, [places, selectedPlaceId, placesGeoJson])

  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource('topic-map-shapes') as GeoJSONSource | undefined
    source?.setData(shapesGeoJson)
  }, [shapesGeoJson])

  const finishDraft = () => {
    if ((mode === 'line' && draft.length < 2) || (mode === 'polygon' && draft.length < 3)) return
    const nextShape: MapShape = {
      id: `shape-${Date.now()}`,
      type: mode === 'polygon' ? 'polygon' : 'line',
      label: mode === 'polygon' ? 'Nueva area marcada' : 'Nuevo trazo',
      coordinates: draft,
    }
    setShapes((current) => [...current, nextShape])
    setDraft([])
    setMode('explore')
  }

  const selectMode = (nextMode: DrawMode) => {
    setMode(nextMode)
    if (nextMode !== mode && draft.length > 0) setDraft([])
  }

  const flyToMexico = () => {
    mapRef.current?.fitBounds([[-117.2, 14.4], [-86.8, 32.7]], { padding: 42, duration: 700 })
  }

  const openStreetView = () => {
    if (!selectedPlace) return
    const [lng, lat] = selectedPlace.coordinates
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`, '_blank', 'noopener,noreferrer')
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
        <div className="flex flex-wrap gap-2">
          <MapButton active={mode === 'explore'} icon={<Hand size={14} />} label="Mover" onClick={() => selectMode('explore')} />
          <MapButton active={mode === 'place'} icon={<MapPin size={14} />} label="Lugar" onClick={() => selectMode('place')} />
          <MapButton active={mode === 'line'} icon={<Route size={14} />} label="Trazo" onClick={() => selectMode('line')} />
          <MapButton active={mode === 'polygon'} icon={<Shapes size={14} />} label="Area" onClick={() => selectMode('polygon')} />
        </div>
      </div>

      <div className="relative h-[68vh] min-h-[520px] md:h-[72vh]">
        <div ref={containerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-col gap-2 md:left-4 md:top-4">
          <div className="pointer-events-auto flex w-fit flex-wrap gap-2 rounded-lg border border-white/15 bg-slate-950/85 p-2 text-white shadow-xl backdrop-blur">
            <button
              type="button"
              onClick={flyToMexico}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              <Crosshair size={13} />
              Mexico
            </button>
            {draft.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={finishDraft}
                  disabled={(mode === 'line' && draft.length < 2) || (mode === 'polygon' && draft.length < 3)}
                  className="flex items-center gap-1.5 rounded-md bg-cyan-400 px-2.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-50"
                >
                  <Plus size={13} />
                  Guardar trazo
                </button>
                <button
                  type="button"
                  onClick={() => setDraft([])}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  <X size={13} />
                  Limpiar
                </button>
              </>
            )}
          </div>
          {mode !== 'explore' && (
            <p className="pointer-events-auto w-fit max-w-sm rounded-lg border border-cyan-300/30 bg-slate-950/85 px-3 py-2 text-xs text-cyan-50 shadow-xl backdrop-blur">
              {mode === 'place' ? 'Haz click en el mapa para crear un marcador con nota.' : 'Haz clicks para agregar vertices y luego guarda el trazo.'}
            </p>
          )}
        </div>

        {selectedPlace && (
          <aside className="absolute inset-x-3 bottom-3 max-h-[46%] overflow-y-auto rounded-xl border border-white/15 bg-slate-950/92 p-4 text-white shadow-2xl backdrop-blur md:inset-x-auto md:bottom-4 md:right-4 md:top-4 md:max-h-none md:w-80">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{selectedPlace.category}</p>
                <h3 className="mt-1 text-lg font-bold leading-tight">{selectedPlace.title}</h3>
                <p className="text-sm text-slate-300">{selectedPlace.city}</p>
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
            <p className="mt-4 text-sm leading-6 text-slate-200">{selectedPlace.note}</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <PencilLine size={13} />
                Nota grande
              </div>
              <textarea
                value={selectedPlace.note}
                onChange={(event) => {
                  const note = event.target.value
                  setPlaces((current) => current.map((place) => place.id === selectedPlace.id ? { ...place, note } : place))
                }}
                className="mt-2 h-28 w-full resize-none rounded-md border border-white/10 bg-slate-900/80 p-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-300"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span>Markers: {places.length}</span>
              <span>Trazos: {shapes.length}</span>
            </div>
          </aside>
        )}

        <div className="absolute bottom-3 left-3 hidden rounded-lg border border-white/15 bg-slate-950/85 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur md:block">
          Zoom a calles, colonias y estados via OpenStreetMap. Vista de calle abre Google Maps si hay cobertura.
        </div>
      </div>
    </section>
  )
}

interface MapButtonProps {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}

const MapButton = ({ active, icon, label, onClick }: MapButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
      active
        ? 'border-cyan-300 bg-cyan-300 text-slate-950'
        : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/70 hover:bg-white/10'
    }`}
  >
    {icon}
    {label}
  </button>
)

export default TopicMapView
