'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { TourStop, LatLng } from '@/types'
import { cameraDuration } from '@/lib/motion-tokens'

interface TourMapProps {
  stops: TourStop[]
  center: LatLng
  activeId: number | null
  onSelect: (pageid: number) => void
}

const BASEMAP =
  process.env.NEXT_PUBLIC_BASEMAP_STYLE ??
  'https://tiles.openfreemap.org/styles/liberty'

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function TourMap({ stops, center, activeId, onSelect }: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<globalThis.Map<number, maplibregl.Marker>>(new globalThis.Map())
  const styleLoadedRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  function syncMarkersAndLine(map: maplibregl.Map, tourStops: TourStop[]) {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()
    if (tourStops.length === 0) return

    tourStops.forEach((stop, i) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'tour-marker'
      el.textContent = String(i + 1)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current(stop.pageid)
      })
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map)
      el.setAttribute('aria-label', `Stop ${i + 1}: ${stop.title}`)
      markersRef.current.set(stop.pageid, marker)
    })

    const src = map.getSource('tour-route') as maplibregl.GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection',
      features:
        tourStops.length >= 2
          ? [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'LineString' as const,
                  coordinates: tourStops.map((s) => [s.lng, s.lat]),
                },
                properties: {},
              },
            ]
          : [],
    })

    const bounds = new maplibregl.LngLatBounds()
    tourStops.forEach((s) => bounds.extend([s.lng, s.lat]))
    map.fitBounds(bounds, { padding: 60, duration: cameraDuration(600), maxZoom: 16 })
  }

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
        attributionControl: false,
      })
    } catch {
      setUnsupported(true)
      return
    }

    mapRef.current = map
    // Desktop has free space top-right; phones keep it bottom-right above the controls (see globals.css).
    // Re-place it when the breakpoint flips (zoom, rotation, window resize).
    const attribution = new maplibregl.AttributionControl({ compact: true })
    const wide = window.matchMedia('(min-width: 768px)')
    const placeAttribution = () => {
      if (map.hasControl(attribution)) map.removeControl(attribution)
      map.addControl(attribution, wide.matches ? 'top-right' : 'bottom-right')
    }
    placeAttribution()
    wide.addEventListener('change', placeAttribution)

    map.on('load', () => {
      styleLoadedRef.current = true

      map.addSource('tour-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'tour-line',
        type: 'line',
        source: 'tour-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#e05c1a',
          'line-width': 2.5,
          'line-opacity': 0.85,
          'line-dasharray': [2, 3],
        },
      })

      if (stops.length > 0) syncMarkersAndLine(map, stops)
    })

    return () => {
      wide.removeEventListener('change', placeAttribution)
      styleLoadedRef.current = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    syncMarkersAndLine(map, stops)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  // Highlight the active stop and bring it into view
  useEffect(() => {
    const map = mapRef.current
    markersRef.current.forEach((marker, pageid) => {
      marker.getElement().dataset.active = String(pageid === activeId)
    })
    if (!map || activeId === null) return
    const marker = markersRef.current.get(activeId)
    if (!marker) return
    map.easeTo({
      center: marker.getLngLat(),
      zoom: Math.max(map.getZoom(), 16),
      duration: cameraDuration(500),
    })
  }, [activeId])

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
