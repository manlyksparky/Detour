'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { WikiArticle, LatLng, TourStop } from '@/types'
import { DEFAULT_ZOOM } from '@/lib/constants'
import { cameraDuration } from '@/lib/motion-tokens'

export interface MapControls {
  zoomIn: () => void
  zoomOut: () => void
}

interface MapProps {
  center: LatLng
  zoom: number
  zoomTarget?: number
  radius: number
  articles: WikiArticle[]
  selectedId: number | null
  tourStops?: TourStop[]
  flyToTarget?: LatLng | null
  onArticleSelect: (article: WikiArticle) => void
  onMapMove: (lat: number, lng: number) => void
  onReady?: (controls: MapControls) => void
}

const BASEMAP =
  process.env.NEXT_PUBLIC_BASEMAP_STYLE ??
  'https://tiles.openfreemap.org/styles/liberty'

const ACCENT = '#e05c1a'
const ACCENT_STRONG = '#c2410c'
/** Zoom at which every pin stands alone; clusters exist below it. */
const UNCLUSTERED_ZOOM = 17

function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Approximate a geographic circle as a GeoJSON polygon. */
function makeCirclePolygon(
  lat: number,
  lng: number,
  radiusM: number
): GeoJSON.Feature<GeoJSON.Polygon> {
  const pts = 64
  const earthR = 6371000
  const angular = radiusM / earthR
  const latR = (lat * Math.PI) / 180
  const lngR = (lng * Math.PI) / 180
  const coords: [number, number][] = []
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * 2 * Math.PI
    const pLat = Math.asin(
      Math.sin(latR) * Math.cos(angular) +
        Math.cos(latR) * Math.sin(angular) * Math.cos(a)
    )
    const pLng =
      lngR +
      Math.atan2(
        Math.sin(a) * Math.sin(angular) * Math.cos(latR),
        Math.cos(angular) - Math.sin(latR) * Math.sin(pLat)
      )
    coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI])
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}

export default function Map({
  center,
  zoom,
  zoomTarget,
  radius,
  articles,
  selectedId,
  tourStops,
  flyToTarget,
  onArticleSelect,
  onMapMove,
  onReady,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const styleLoadedRef = useRef(false)
  const [unsupported, setUnsupported] = useState(false)

  const articlesRef = useRef(articles)
  const selectedIdRef = useRef(selectedId)
  const onArticleSelectRef = useRef(onArticleSelect)
  const onMapMoveRef = useRef(onMapMove)
  const onReadyRef = useRef(onReady)

  useEffect(() => { articlesRef.current = articles }, [articles])
  useEffect(() => { selectedIdRef.current = selectedId }, [selectedId])
  useEffect(() => { onArticleSelectRef.current = onArticleSelect }, [onArticleSelect])
  useEffect(() => { onMapMoveRef.current = onMapMove }, [onMapMove])
  useEffect(() => { onReadyRef.current = onReady }, [onReady])

  const setArticlesData = useCallback(
    (map: maplibregl.Map, arts: WikiArticle[], selId: number | null) => {
      const src = map.getSource('articles') as maplibregl.GeoJSONSource | undefined
      src?.setData({
        type: 'FeatureCollection',
        features: arts.map((a) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [a.lng, a.lat] },
          properties: { pageid: a.pageid, title: a.title, selected: a.pageid === selId ? 1 : 0 },
        })),
      })
    },
    []
  )

  const setRadiusData = useCallback(
    (map: maplibregl.Map, lat: number, lng: number, r: number) => {
      const src = map.getSource('radius-circle') as maplibregl.GeoJSONSource | undefined
      src?.setData({
        type: 'FeatureCollection',
        features: [makeCirclePolygon(lat, lng, r)],
      })
    },
    []
  )

  const setTourData = useCallback(
    (map: maplibregl.Map, stops: TourStop[] | undefined) => {
      const src = map.getSource('tour-route') as maplibregl.GeoJSONSource | undefined
      if (!src) return
      if (!stops || stops.length < 2) {
        src.setData({ type: 'FeatureCollection', features: [] })
        return
      }
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: stops.map((s) => [s.lng, s.lat]),
            },
            properties: {},
          },
        ],
      })
    },
    []
  )

  // Initialise once
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
        zoom,
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

    // Only propagate user-initiated pans; ignore programmatic flyTo moveend events
    map.on('moveend', (e) => {
      if (!(e as unknown as { originalEvent?: Event }).originalEvent) return
      const c = map.getCenter()
      onMapMoveRef.current(c.lat, c.lng)
    })

    map.on('load', () => {
      styleLoadedRef.current = true

      // Reuse the basemap's own font stack so cluster counts always have glyphs
      const styleLayers = map.getStyle().layers as Array<{ type: string; layout?: Record<string, unknown> }>
      const symbolLayer = styleLayers.find((l) => l.type === 'symbol' && l.layout && 'text-font' in l.layout)
      const textFont = (symbolLayer?.layout?.['text-font'] as string[] | undefined) ?? ['Noto Sans Regular']

      map.addSource('radius-circle', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': 'rgba(224, 92, 26, 0.06)',
          'fill-outline-color': 'rgba(224, 92, 26, 0.35)',
        },
      })

      map.addSource('articles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 28,
        clusterMaxZoom: UNCLUSTERED_ZOOM - 1,
      })
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
          'line-color': ACCENT,
          'line-width': 2.5,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2],
        },
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'articles',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ACCENT_STRONG,
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 30, 22],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'articles',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': textFont,
          'text-size': 12,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#ffffff' },
      })

      map.addLayer({
        id: 'articles-halo',
        type: 'circle',
        source: 'articles',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'selected'], 1]],
        paint: {
          'circle-radius': 20,
          'circle-color': 'rgba(224, 92, 26, 0.18)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(224, 92, 26, 0.5)',
        },
      })
      map.addLayer({
        id: 'articles-circles',
        type: 'circle',
        source: 'articles',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], 1], 10, 7],
          'circle-color': ACCENT,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.on('click', 'articles-circles', (e) => {
        if (!e.features?.[0]) return
        const pageid = e.features[0].properties?.pageid as number
        const article = articlesRef.current.find((a) => a.pageid === pageid)
        if (article) onArticleSelectRef.current(article)
      })

      map.on('click', 'clusters', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id as number
        const src = map.getSource('articles') as maplibregl.GeoJSONSource
        src
          .getClusterExpansionZoom(clusterId)
          .then((z) => {
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates
            map.easeTo({ center: [lng, lat], zoom: Math.min(z + 0.5, 19), duration: cameraDuration(400) })
          })
          .catch(() => {})
      })

      for (const layer of ['articles-circles', 'clusters']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }

      // Paint initial data
      setArticlesData(map, articlesRef.current, selectedIdRef.current)
      setRadiusData(map, center.lat, center.lng, radius)
      if (tourStops) setTourData(map, tourStops)

      onReadyRef.current?.({
        zoomIn: () => map.zoomIn({ duration: cameraDuration(300) }),
        zoomOut: () => map.zoomOut({ duration: cameraDuration(300) }),
      })
    })

    return () => {
      wide.removeEventListener('change', placeAttribution)
      styleLoadedRef.current = false
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update article pins & selection highlight
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    setArticlesData(map, articles, selectedId)
  }, [articles, selectedId, setArticlesData])

  // Update radius circle when center or radius changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    setRadiusData(map, center.lat, center.lng, radius)
  }, [center.lat, center.lng, radius, setRadiusData])

  // Update tour route
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current) return
    setTourData(map, tourStops)
  }, [tourStops, setTourData])

  // Fly to geolocation or a searched place; never on user pan
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTarget) return
    map.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: DEFAULT_ZOOM,
      duration: cameraDuration(800),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToTarget?.lat, flyToTarget?.lng])

  // Ease to the zoom implied by the radius (skip on initial mount)
  const zoomTargetMountedRef = useRef(false)
  useEffect(() => {
    if (!zoomTargetMountedRef.current) {
      zoomTargetMountedRef.current = true
      return
    }
    const map = mapRef.current
    if (!map || zoomTarget == null) return
    map.easeTo({ zoom: zoomTarget, duration: cameraDuration(500) })
  }, [zoomTarget])

  // Fly to the selected article, close enough that it leaves its cluster
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current || selectedId === null) return
    const article = articlesRef.current.find((a) => a.pageid === selectedId)
    if (article) {
      map.flyTo({
        center: [article.lng, article.lat],
        zoom: Math.max(map.getZoom(), UNCLUSTERED_ZOOM),
        duration: cameraDuration(600),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div className="map-explore relative h-full w-full">
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
              It needs WebGL, which is switched off or unsupported here. The list of nearby places still works.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
