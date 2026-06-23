'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { TourStop, LatLng } from '@/types'

interface TourMapProps {
  stops: TourStop[]
  center: LatLng
}

// Light basemap for tour readability
const LIGHT_BASEMAP = 'https://tiles.openfreemap.org/styles/liberty'

export default function TourMap({ stops, center }: TourMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const styleLoadedRef = useRef(false)

  function addMarkersAndLine(map: maplibregl.Map, tourStops: TourStop[]) {
    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (tourStops.length === 0) return

    // Numbered DOM markers
    tourStops.forEach((stop, i) => {
      const el = document.createElement('div')
      el.className = 'tour-marker'
      el.textContent = String(i + 1)
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })

    // Route line
    const src = map.getSource('tour-route') as maplibregl.GeoJSONSource | undefined
    if (src) {
      src.setData({
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
    }

    // Fit bounds to all stops
    const bounds = new maplibregl.LngLatBounds()
    tourStops.forEach((s) => bounds.extend([s.lng, s.lat]))
    map.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 16 })
  }

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: LIGHT_BASEMAP,
      center: [center.lng, center.lat],
      zoom: 14,
      attributionControl: false,
    })

    mapRef.current = map

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

      if (stops.length > 0) addMarkersAndLine(map, stops)
    })

    return () => {
      styleLoadedRef.current = false
      markersRef.current.forEach((m) => m.remove())
      map.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    addMarkersAndLine(map, stops)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops])

  return <div ref={containerRef} className="w-full h-full" />
}
