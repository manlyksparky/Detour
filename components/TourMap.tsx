'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { TourStop, LatLng, RouteLeg, UserLocation } from '@/types'
import { cameraDuration, prefersReducedMotion } from '@/lib/motion-tokens'
import { bearingBetween, buildPath, lerpAngle, pointAlong } from '@/lib/path'
import {
  BASEMAP,
  BUILDINGS_LAYER,
  type ViewMode,
  applyNotebookTheme,
  applyPaperSky,
  applyWarmLight,
  enableGlobe,
  ensureBuildings,
  firstSymbolLayerId,
  setBuildingsVisible,
  setTerrainEnabled,
  syncUserLocation,
} from '@/lib/basemap'

export type TourView = ViewMode
export type FlightState = 'idle' | 'playing'

interface TourMapProps {
  stops: TourStop[]
  center: LatLng
  activeId: number | null
  onSelect: (pageid: number) => void
  /** Street geometry per leg (start to 1, 1 to 2, …); null draws straight lines */
  route: RouteLeg[] | null
  view: TourView
  /** 'playing' flies the camera along the route */
  flight: FlightState
  /** Fired with the index of each stop as the flight reaches it */
  onFlightProgress?: (stopIndex: number) => void
  onFlightEnd?: () => void
  /** The device's latest position fix, drawn as "you are here" */
  userLocation?: UserLocation | null
}

const PITCH_3D = 58
const FLIGHT_PITCH = 62
const FLIGHT_ZOOM = 17.2
/** Metres per second for the preview; the whole walk fits between 12 and 45 seconds */
const FLIGHT_SPEED = 32

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** The polyline the camera follows: every routed leg joined, or straight segments. */
function tourCoordinates(start: LatLng, stops: TourStop[], route: RouteLeg[] | null): [number, number][] {
  if (route && route.length === stops.length) {
    const coords: [number, number][] = [[start.lng, start.lat]]
    route.forEach((leg) => leg.coordinates.forEach((c) => coords.push(c)))
    return coords
  }
  return [[start.lng, start.lat], ...stops.map((s) => [s.lng, s.lat] as [number, number])]
}

export default function TourMap({
  stops,
  center,
  activeId,
  onSelect,
  route,
  view,
  flight,
  onFlightProgress,
  onFlightEnd,
  userLocation = null,
}: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<globalThis.Map<number, maplibregl.Marker>>(new globalThis.Map())
  const styleLoadedRef = useRef(false)
  const flyingRef = useRef(false)
  const viewRef = useRef<TourView>(view)
  const onSelectRef = useRef(onSelect)
  const onProgressRef = useRef(onFlightProgress)
  const onEndRef = useRef(onFlightEnd)
  // The style can finish loading after the stops arrive; the load handler reads these
  const latestRef = useRef({ stops, route, userLocation })
  latestRef.current = { stops, route, userLocation }
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
    onProgressRef.current = onFlightProgress
    onEndRef.current = onFlightEnd
  }, [onSelect, onFlightProgress, onFlightEnd])

  /** Looking along the walk: from the start towards the last stop. */
  function tourBearing(tourStops: TourStop[]): number {
    if (tourStops.length === 0) return 0
    const last = tourStops[tourStops.length - 1]
    return bearingBetween(center, { lat: last.lat, lng: last.lng })
  }

  function fitTour(map: maplibregl.Map, tourStops: TourStop[], duration = cameraDuration(800)) {
    if (tourStops.length === 0) return
    const bounds = new maplibregl.LngLatBounds()
    bounds.extend([center.lng, center.lat])
    tourStops.forEach((s) => bounds.extend([s.lng, s.lat]))
    const three = viewRef.current === '3d'
    const pitch = three ? PITCH_3D : 0
    const bearing = three ? tourBearing(tourStops) : 0
    const camera = map.cameraForBounds(bounds, {
      padding: { top: 72, bottom: 112, left: 56, right: 56 },
      maxZoom: three ? 16.4 : 16,
      bearing,
      pitch,
    })
    if (camera) map.easeTo({ ...camera, pitch, bearing, duration })
  }

  function syncMarkersAndRoute(map: maplibregl.Map, tourStops: TourStop[], legs: RouteLeg[] | null) {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    tourStops.forEach((stop, i) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'tour-marker'
      el.textContent = String(i + 1)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(stop.pageid)
      })
      const marker = new maplibregl.Marker({ element: el, pitchAlignment: 'viewport', rotationAlignment: 'viewport' })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map)
      el.setAttribute('aria-label', `Stop ${i + 1}: ${stop.title}`)
      markersRef.current.set(stop.pageid, marker)
    })

    const src = map.getSource('tour-route') as maplibregl.GeoJSONSource | undefined
    const routed = !!legs && legs.length === tourStops.length
    src?.setData({
      type: 'FeatureCollection',
      features:
        tourStops.length === 0
          ? []
          : routed
            ? legs!.map((leg, i) => ({
                type: 'Feature' as const,
                geometry: { type: 'LineString' as const, coordinates: leg.coordinates },
                properties: { kind: 'street', leg: i },
              }))
            : [
                {
                  type: 'Feature' as const,
                  geometry: {
                    type: 'LineString' as const,
                    coordinates: tourCoordinates(center, tourStops, null),
                  },
                  properties: { kind: 'straight' },
                },
              ],
    })
  }

  // ── Map setup ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    if (!webglSupported()) {
      setUnsupported(true)
      return
    }

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: BASEMAP,
        center: [center.lng, center.lat],
        zoom: 14,
        pitch: view === '3d' ? PITCH_3D : 0,
        maxPitch: 70,
        attributionControl: false,
      })
    } catch {
      setUnsupported(true)
      return
    }

    mapRef.current = map
    if (process.env.NODE_ENV !== 'production') {
      // lets scripted checks inspect the camera; stripped from production builds
      ;(window as unknown as { __detourTourMap?: maplibregl.Map }).__detourTourMap = map
    }
    // Desktop has free space top-right; phones keep the credits bottom-right above the
    // dock (see globals.css). Zoom and compass stay top-right; all are re-placed when
    // the breakpoint flips so their order holds.
    const attribution = new maplibregl.AttributionControl({ compact: true })
    const navigation = new maplibregl.NavigationControl({ showZoom: true, showCompass: true, visualizePitch: true })
    const wide = window.matchMedia('(min-width: 768px)')
    const placeControls = () => {
      if (map.hasControl(attribution)) map.removeControl(attribution)
      if (map.hasControl(navigation)) map.removeControl(navigation)
      map.addControl(attribution, wide.matches ? 'top-right' : 'bottom-right')
      map.addControl(navigation, 'top-right')
    }
    placeControls()
    wide.addEventListener('change', placeControls)

    map.on('load', () => {
      styleLoadedRef.current = true

      // Dress the basemap as the notebook: paper land, ink labels, warm extrusions, paper sky
      applyNotebookTheme(map)
      ensureBuildings(map)
      applyPaperSky(map)
      applyWarmLight(map)
      enableGlobe(map)
      const three = viewRef.current === '3d'
      setBuildingsVisible(map, three)
      setTerrainEnabled(map, three)

      map.addSource('tour-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Under the extrusions so buildings occlude the route like real streets; above the roads
      const beforeId = map.getLayer(BUILDINGS_LAYER) ? BUILDINGS_LAYER : firstSymbolLayerId(map)
      map.addLayer(
        {
          id: 'tour-line-casing',
          type: 'line',
          source: 'tour-route',
          filter: ['==', ['get', 'kind'], 'street'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
        },
        beforeId
      )
      map.addLayer(
        {
          id: 'tour-line',
          type: 'line',
          source: 'tour-route',
          filter: ['==', ['get', 'kind'], 'street'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#e05c1a', 'line-width': 3.5, 'line-opacity': 0.95 },
        },
        beforeId
      )
      // As the crow flies, while routing is pending or unavailable
      map.addLayer(
        {
          id: 'tour-line-straight',
          type: 'line',
          source: 'tour-route',
          filter: ['==', ['get', 'kind'], 'straight'],
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#e05c1a', 'line-width': 2.5, 'line-opacity': 0.85, 'line-dasharray': [2, 3] },
        },
        beforeId
      )

      const latest = latestRef.current
      syncUserLocation(map, latest.userLocation)
      if (latest.stops.length > 0) {
        syncMarkersAndRoute(map, latest.stops, latest.route)
        fitTour(map, latest.stops, cameraDuration(600))
      }
    })

    return () => {
      wide.removeEventListener('change', placeControls)
      styleLoadedRef.current = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Stops and route ────────────────────────────────────
  const stopsKey = stops.map((s) => s.pageid).join(',')
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    syncMarkersAndRoute(map, stops, route)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, route])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current || flyingRef.current) return
    fitTour(map, stops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey])

  // ── 2D / 3D ────────────────────────────────────────────
  useEffect(() => {
    viewRef.current = view
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    setBuildingsVisible(map, view === '3d')
    setTerrainEnabled(map, view === '3d')
    if (!flyingRef.current) fitTour(map, stops, cameraDuration(900))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // ── "You are here" ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    syncUserLocation(map, userLocation)
  }, [userLocation])

  // ── Active stop ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    markersRef.current.forEach((marker, pageid) => {
      marker.getElement().dataset.active = String(pageid === activeId)
    })
    if (!map || activeId === null || flyingRef.current) return
    const marker = markersRef.current.get(activeId)
    if (!marker) return
    map.easeTo({
      center: marker.getLngLat(),
      zoom: Math.max(map.getZoom(), 16),
      duration: cameraDuration(500),
    })
  }, [activeId])

  // ── Preview walk: the camera travels the route ─────────
  useEffect(() => {
    const map = mapRef.current
    if (flight !== 'playing' || !map || !styleLoadedRef.current || stops.length === 0) return

    const path = buildPath(tourCoordinates(center, stops, route))
    // metres along the path at which each stop is reached
    const stopMarks: number[] = []
    if (route && route.length === stops.length) {
      let acc = 0
      let idx = 0
      route.forEach((leg) => {
        idx += leg.coordinates.length
        acc = path.cum[Math.min(idx, path.cum.length - 1)]
        stopMarks.push(acc)
      })
    } else {
      stops.forEach((_, i) => stopMarks.push(path.cum[i + 1] ?? path.total))
    }

    let cancelled = false
    let frame = 0
    let timer = 0
    let nextStop = 0
    flyingRef.current = true

    const finish = () => {
      if (cancelled) return
      cancelled = true
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      flyingRef.current = false
      map.off('dragstart', finish)
      map.off('wheel', finish)
      map.off('dblclick', finish)
      map.off('touchstart', finish)
      onEndRef.current?.()
    }

    // Any gesture hands the camera back
    map.on('dragstart', finish)
    map.on('wheel', finish)
    map.on('dblclick', finish)
    map.on('touchstart', finish)

    if (prefersReducedMotion()) {
      // No camera travel: step from stop to stop
      const step = () => {
        if (cancelled) return
        if (nextStop >= stops.length) {
          finish()
          return
        }
        const s = stops[nextStop]
        map.jumpTo({ center: [s.lng, s.lat], zoom: 16.5 })
        onProgressRef.current?.(nextStop)
        nextStop += 1
        timer = window.setTimeout(step, 1600)
      }
      step()
      return finish
    }

    const durationMs = Math.min(45, Math.max(12, path.total / FLIGHT_SPEED)) * 1000
    const start = pointAlong(path, 0)
    const ahead = pointAlong(path, Math.min(path.total, 40))
    let bearing = bearingBetween(start, ahead)

    // Glide down to the start, then travel
    map.easeTo({
      center: [start.lng, start.lat],
      zoom: FLIGHT_ZOOM,
      pitch: FLIGHT_PITCH,
      bearing,
      duration: 1400,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })
    map.once('moveend', () => {
      if (cancelled) return
      const t0 = performance.now()
      const tick = (now: number) => {
        if (cancelled) return
        const progress = Math.min(1, (now - t0) / durationMs)
        // ease the very start and end so the walk settles instead of stopping dead
        const eased = progress < 0.06 ? (progress / 0.06) * 0.06 * (progress / 0.06) : progress
        const d = eased * path.total
        const pos = pointAlong(path, d)
        const look = pointAlong(path, Math.min(path.total, d + 35))
        if (d < path.total - 5) bearing = lerpAngle(bearing, bearingBetween(pos, look), 0.07)
        map.jumpTo({ center: [pos.lng, pos.lat], bearing, pitch: FLIGHT_PITCH, zoom: FLIGHT_ZOOM })

        while (nextStop < stops.length && d >= stopMarks[nextStop] - 8) {
          onProgressRef.current?.(nextStop)
          nextStop += 1
        }
        if (progress < 1) frame = requestAnimationFrame(tick)
        else {
          while (nextStop < stops.length) onProgressRef.current?.(nextStop++)
          finish()
        }
      }
      frame = requestAnimationFrame(tick)
    })

    return finish
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight])

  return (
    <div className="map-tour relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {unsupported && (
        <div
          role="region"
          aria-label="Map unavailable"
          className="absolute inset-0 flex items-center justify-center bg-sunken p-6 text-center"
        >
          <div className="max-w-xs">
            <p className="text-sm font-medium text-ink">This browser can&apos;t draw the map.</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">
              It needs WebGL, which is switched off or unsupported here. The stop list still works.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
