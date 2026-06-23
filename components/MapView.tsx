'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { WikiArticle, LatLng } from '@/types'
import type { MapControls } from './Map'
import { getUserLocation } from '@/lib/geo'
import { fetchNearby, fetchSummary } from '@/lib/wikipedia'
import { LONDON_CENTER, RADIUS_DEFAULT, DEFAULT_ZOOM } from '@/lib/constants'

function radiusToZoom(radius: number): number {
  if (radius <= 250) return 16
  if (radius <= 500) return 15
  if (radius <= 1000) return 14
  if (radius <= 2000) return 13
  if (radius <= 5000) return 12
  return 11
}
import ArticleList from './ArticleList'
import ArticleDrawer from './ArticleDrawer'
import FloatingBar from './FloatingBar'

const Map = dynamic(() => import('./Map'), { ssr: false })

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export default function MapView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const initLat = parseFloat(searchParams.get('lat') ?? '') || LONDON_CENTER.lat
  const initLng = parseFloat(searchParams.get('lng') ?? '') || LONDON_CENTER.lng
  const initRadius = parseInt(searchParams.get('radius') ?? '') || RADIUS_DEFAULT

  const [center, setCenter] = useState<LatLng>({ lat: initLat, lng: initLng })
  const [geoCenter, setGeoCenter] = useState<LatLng | null>(null)
  const [radius, setRadius] = useState(initRadius)
  const [articles, setArticles] = useState<WikiArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tourStopIds, setTourStopIds] = useState<number[]>([])
  const [activeSidequest, setActiveSidequest] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const debouncedRadius = useDebounce(radius, 400)
  const fetchedRef = useRef<string>('')
  const mapControlsRef = useRef<MapControls | null>(null)

  const updateUrl = useCallback(
    (lat: number, lng: number, r: number) => {
      const params = new URLSearchParams()
      params.set('lat', lat.toFixed(5))
      params.set('lng', lng.toFixed(5))
      params.set('radius', r.toString())
      router.replace(`${pathname}?${params}`, { scroll: false })
    },
    [router, pathname]
  )

  useEffect(() => {
    getUserLocation().then((loc) => {
      const hasUrlCoords = searchParams.get('lat') && searchParams.get('lng')
      if (!hasUrlCoords) {
        setCenter(loc)
        setGeoCenter(loc)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${debouncedRadius}`
    if (fetchedRef.current === key) return
    fetchedRef.current = key
    setLoading(true)
    fetchNearby(center.lat, center.lng, debouncedRadius).then((arts) => {
      setArticles(arts)
      setLoading(false)
    })
    updateUrl(center.lat, center.lng, debouncedRadius)
  }, [center.lat, center.lng, debouncedRadius, updateUrl])

  const handleMapMove = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng })
  }, [])

  const handleFlyTo = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng })
    setGeoCenter({ lat, lng })
  }, [])

  const handleRequestLocation = useCallback(() => {
    getUserLocation().then((loc) => {
      setCenter(loc)
      setGeoCenter(loc)
    })
  }, [])

  const handleMapReady = useCallback((controls: MapControls) => {
    mapControlsRef.current = controls
  }, [])

  const handleArticleSelect = useCallback(async (article: WikiArticle) => {
    setSelectedArticle(article)
    setDrawerOpen(true)
    if (!article.leadText) {
      const summary = await fetchSummary(article.pageid, article.title)
      setSelectedArticle((prev) =>
        prev?.pageid === article.pageid ? { ...prev, ...summary } : prev
      )
    }
  }, [])

  const handleAddToTour = useCallback((article: WikiArticle) => {
    setTourStopIds((prev) =>
      prev.includes(article.pageid) ? prev : [...prev, article.pageid]
    )
  }, [])

  const handleRemoveFromTour = useCallback((pageid: number) => {
    setTourStopIds((prev) => prev.filter((id) => id !== pageid))
  }, [])

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedArticle(null)
  }, [])

  return (
    <div className="relative h-dvh overflow-hidden bg-gray-100">
      {/* Map — offset left by sidebar, right by drawer when open.
          FloatingBar lives INSIDE here so it auto-centers in the map area. */}
      <div
        className={`absolute inset-0 md:left-[380px] transition-all duration-300 ${
          drawerOpen ? 'md:right-[380px]' : 'md:right-0'
        }`}
      >
        <Map
          center={center}
          zoom={radiusToZoom(initRadius)}
          zoomTarget={radiusToZoom(radius)}
          radius={debouncedRadius}
          articles={articles}
          selectedId={selectedArticle?.pageid ?? null}
          flyToTarget={geoCenter}
          onArticleSelect={handleArticleSelect}
          onMapMove={handleMapMove}
          onReady={handleMapReady}
        />

        {/* Floating toolbar — centered within the map area */}
        <FloatingBar
          articles={articles}
          activeSidequest={activeSidequest}
          isDrawerOpen={drawerOpen}
          lat={center.lat}
          lng={center.lng}
          radius={radius}
          onZoomIn={() => mapControlsRef.current?.zoomIn()}
          onZoomOut={() => mapControlsRef.current?.zoomOut()}
          onSurpriseMe={handleArticleSelect}
          onSidequestChange={setActiveSidequest}
        />
      </div>

      {/* Left sidebar / mobile bottom sheet */}
      <ArticleList
        articles={articles}
        selectedId={selectedArticle?.pageid ?? null}
        tourStopIds={tourStopIds}
        loading={loading}
        isDrawerOpen={drawerOpen}
        radius={radius}
        activeSidequest={activeSidequest}
        onArticleSelect={handleArticleSelect}
        onRadiusChange={setRadius}
        onSidequestChange={setActiveSidequest}
        onFlyTo={handleFlyTo}
        onRequestLocation={handleRequestLocation}
        onCopyLink={handleCopyLink}
        copied={copied}
      />

      {/* Article detail drawer */}
      <ArticleDrawer
        article={selectedArticle}
        isOpen={drawerOpen}
        isInTour={selectedArticle ? tourStopIds.includes(selectedArticle.pageid) : false}
        onClose={handleCloseDrawer}
        onAddToTour={handleAddToTour}
        onRemoveFromTour={handleRemoveFromTour}
      />
    </div>
  )
}
