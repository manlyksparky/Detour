'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { WikiArticle, LatLng, UserLocation } from '@/types'
import type { MapControls } from './Map'
import type { ViewMode } from '@/lib/basemap'
import { getUserLocation, watchUserLocation } from '@/lib/geo'
import { fetchNearby, fetchSummary } from '@/lib/wikipedia'
import { LONDON_CENTER, RADIUS_DEFAULT } from '@/lib/constants'
import ArticleList from './ArticleList'
import ArticleDrawer from './ArticleDrawer'
import FloatingBar from './FloatingBar'

const Map = dynamic(() => import('./Map'), { ssr: false })

function radiusToZoom(radius: number): number {
  if (radius <= 250) return 16
  if (radius <= 500) return 15
  if (radius <= 1000) return 14
  if (radius <= 2000) return 13
  if (radius <= 5000) return 12
  return 11
}

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
  const [view, setView] = useState<ViewMode>('3d')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  const debouncedRadius = useDebounce(radius, 400)
  const fetchedRef = useRef<string>('')
  const requestRef = useRef(0)
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

  // The device's position stays on the map as "you are here" while the visitor walks
  useEffect(() => watchUserLocation(setUserLocation), [])

  useEffect(() => {
    const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${debouncedRadius}`
    if (fetchedRef.current === key) return
    fetchedRef.current = key
    const request = ++requestRef.current
    setLoading(true)
    fetchNearby(center.lat, center.lng, debouncedRadius).then((arts) => {
      if (request !== requestRef.current) return // a newer search is on its way
      // A failed lookup keeps the places already on screen rather than clearing them
      if (arts) setArticles(arts)
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
    setTourStopIds((prev) => (prev.includes(article.pageid) ? prev : [...prev, article.pageid]))
  }, [])

  const handleRemoveFromTour = useCallback((pageid: number) => {
    setTourStopIds((prev) => prev.filter((id) => id !== pageid))
  }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context or permission); the URL bar still has the link
    }
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedArticle(null)
  }, [])

  return (
    <main className="relative h-dvh overflow-hidden bg-paper" aria-busy={loading}>
      <a href="#places" className="skip-link hidden md:block">
        Skip to places
      </a>
      <a href="#places-sheet" className="skip-link md:hidden">
        Skip to places
      </a>
      {/* Map: offset by the sidebar on desktop and by the drawer when open,
          so the floating bar stays centred in the visible map area. */}
      <div
        id="map"
        tabIndex={-1}
        className={`absolute inset-0 outline-none transition-[left,right] duration-200 ease-out-expo motion-reduce:transition-none md:left-[380px] ${
          drawerOpen ? 'md:right-[420px]' : 'md:right-0'
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
          view={view}
          userLocation={userLocation}
          onArticleSelect={handleArticleSelect}
          onMapMove={handleMapMove}
          onReady={handleMapReady}
        />

        <FloatingBar
          articles={articles}
          activeSidequest={activeSidequest}
          isDrawerOpen={drawerOpen}
          lat={center.lat}
          lng={center.lng}
          radius={radius}
          tourStopIds={tourStopIds}
          view={view}
          onViewChange={setView}
          onZoomIn={() => mapControlsRef.current?.zoomIn()}
          onZoomOut={() => mapControlsRef.current?.zoomOut()}
          onSurpriseMe={handleArticleSelect}
          onSidequestChange={setActiveSidequest}
        />
      </div>

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

      <ArticleDrawer
        article={selectedArticle}
        isOpen={drawerOpen}
        isInTour={selectedArticle ? tourStopIds.includes(selectedArticle.pageid) : false}
        onClose={handleCloseDrawer}
        onAddToTour={handleAddToTour}
        onRemoveFromTour={handleRemoveFromTour}
      />
    </main>
  )
}
