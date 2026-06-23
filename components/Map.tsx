'use client'

import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { WikiArticle, LatLng, TourStop } from '@/types'
import { DEFAULT_ZOOM } from '@/lib/constants'

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

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
    })

    mapRef.current = map

    // Only propagate user-initiated pans; ignore programmatic flyTo moveend events
    map.on('moveend', (e) => {
      if (!(e as unknown as { originalEvent?: Event }).originalEvent) return
      const c = map.getCenter()
      onMapMoveRef.current(c.lat, c.lng)
    })

    map.on('load', () => {
      styleLoadedRef.current = true

      map.addSource('radius-circle', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': 'rgba(240, 165, 0, 0.06)',
          'fill-outline-color': 'rgba(240, 165, 0, 0.3)',
        },
      })

      map.addSource('articles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
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
          'line-color': '#F0A500',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [2, 2],
        },
      })

      map.addLayer({
        id: 'articles-halo',
        type: 'circle',
        source: 'articles',
        filter: ['==', ['get', 'selected'], 1],
        paint: {
          'circle-radius': 20,
          'circle-color': 'rgba(240, 165, 0, 0.15)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(240, 165, 0, 0.5)',
        },
      })

      map.addLayer({
        id: 'articles-circles',
        type: 'circle',
        source: 'articles',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'selected'], 1], 10, 7],
          'circle-color': '#F0A500',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 0.9,
        },
      })

      map.on('click', 'articles-circles', (e) => {
        if (!e.features?.[0]) return
        const pageid = e.features[0].properties?.pageid as number
        const article = articlesRef.current.find((a) => a.pageid === pageid)
        if (article) onArticleSelectRef.current(article)
      })

      map.on('mouseenter', 'articles-circles', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'articles-circles', () => {
        map.getCanvas().style.cursor = ''
      })

      // Paint initial data
      setArticlesData(map, articlesRef.current, selectedIdRef.current)
      setRadiusData(map, center.lat, center.lng, radius)
      if (tourStops) setTourData(map, tourStops)

      // Expose zoom controls to parent
      onReadyRef.current?.({
        zoomIn: () => map.zoomIn(),
        zoomOut: () => map.zoomOut(),
      })
    })

    return () => {
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

  // Fly to geolocation — only when this target changes, never on user pan
  useEffect(() => {
    const map = mapRef.current
    if (!map || !flyToTarget) return
    map.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: DEFAULT_ZOOM,
      duration: 800,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToTarget?.lat, flyToTarget?.lng])

  // Ease to zoom level driven by radius dropdown (skip on initial mount)
  const zoomTargetMountedRef = useRef(false)
  useEffect(() => {
    if (!zoomTargetMountedRef.current) {
      zoomTargetMountedRef.current = true
      return
    }
    const map = mapRef.current
    if (!map || zoomTarget == null) return
    map.easeTo({ zoom: zoomTarget, duration: 500 })
  }, [zoomTarget])

  // Fly to selected article without resetting user's zoom level
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleLoadedRef.current || selectedId === null) return
    const article = articlesRef.current.find((a) => a.pageid === selectedId)
    if (article) {
      map.flyTo({
        center: [article.lng, article.lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 600,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return <div ref={containerRef} className="w-full h-full" />
}
