'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { WikiArticle, TourStop } from '@/types'
import { computeTourStops, formatDistance } from '@/lib/geo'
import { LONDON_CENTER, RADIUS_DEFAULT } from '@/lib/constants'

const TourMap = dynamic(() => import('./TourMap'), { ssr: false })

async function fetchTourName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'User-Agent': 'LondonDetour/1.0' } }
    )
    const data = await res.json()
    const a = data.address ?? {}
    const hood =
      a.suburb ?? a.city_district ?? a.quarter ?? a.village ?? a.town ?? a.city ?? 'London'
    return `${hood} Walking Tour`
  } catch {
    return 'Walking Tour'
  }
}

async function enrichStops(stops: TourStop[]): Promise<TourStop[]> {
  if (stops.length === 0) return []
  const ids = stops.map((s) => s.pageid).join(',')
  try {
    const res = await fetch(`/api/wikipedia?pageids=${ids}`)
    if (!res.ok) return stops
    const details: Partial<WikiArticle>[] = await res.json()
    const byId = new Map(details.map((d) => [d.pageid!, d]))
    return stops.map((s) => {
      const detail = byId.get(s.pageid)
      if (!detail) return s
      return {
        ...s,
        ...detail,
        // Never overwrite an existing thumbnail with undefined
        thumbnail: detail.thumbnail ?? s.thumbnail,
      }
    })
  } catch {
    return stops
  }
}

export default function TourView() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const lat = parseFloat(searchParams.get('lat') ?? '') || LONDON_CENTER.lat
  const lng = parseFloat(searchParams.get('lng') ?? '') || LONDON_CENTER.lng
  const radius = parseInt(searchParams.get('radius') ?? '') || RADIUS_DEFAULT

  const [stops, setStops] = useState<TourStop[]>([])
  const [tourName, setTourName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeStop, setActiveStop] = useState<number | null>(null)

  const generate = useCallback(async () => {
    setLoading(true)
    setStops([])
    setTourName('')

    const [articlesRes, name] = await Promise.all([
      fetch(`/api/wikipedia?lat=${lat}&lng=${lng}&radius=${radius}`).then((r) =>
        r.ok ? (r.json() as Promise<WikiArticle[]>) : Promise.resolve([] as WikiArticle[])
      ),
      fetchTourName(lat, lng),
    ])

    setTourName(name)
    const rawStops = computeTourStops(articlesRes, lat, lng)
    setStops(rawStops)
    setLoading(false)
    enrichStops(rawStops).then(setStops)
  }, [lat, lng, radius])

  useEffect(() => { generate() }, [generate])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const backHref = `/?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&radius=${radius}`

  const totalDistance = stops.reduce((sum, s) => sum + (s.distFromPrev ?? 0), 0)
  const totalTime = stops.reduce((sum, s) => sum + (s.timeFromPrev ?? 0), 0)

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-white overflow-hidden">

      {/* ── Left sidebar ────────────────────────────────── */}
      <div className="flex flex-col md:w-[380px] md:shrink-0 md:h-full md:border-r md:border-gray-200 h-[45vh] border-b border-gray-200 overflow-hidden">

        {/* Tour header — name + stats only */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{tourName}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Stat icon="🚩" label={`${stops.length} stops`} />
                <span className="text-gray-200">·</span>
                <Stat icon="📍" label={formatDistance(totalDistance)} />
                <span className="text-gray-200">·</span>
                <Stat icon="🚶" label={`~${totalTime} min`} />
              </div>
            </>
          )}
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : stops.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-2xl mb-3">🗺️</p>
              <p className="text-sm text-gray-500 mb-3">No articles found in this area.</p>
              <button
                onClick={() => router.push(backHref)}
                className="text-sm text-detour-orange hover:underline"
              >
                ← Try a larger radius
              </button>
            </div>
          ) : (
            <div className="py-3 space-y-0">
              {stops.map((stop, i) => (
                <StopCard
                  key={stop.pageid}
                  stop={stop}
                  index={i}
                  isActive={activeStop === stop.pageid}
                  onClick={() => setActiveStop(stop.pageid === activeStop ? null : stop.pageid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Map + floating bar ───────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        <TourMap stops={stops} center={{ lat, lng }} />

        {/* Floating pill: Back to Explore | Copy walking tour link */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center bg-[#1c1c1e]/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 overflow-hidden h-11">

            {/* Back to Explore */}
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-2 px-5 h-11 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Explore
            </button>

            <div className="w-px h-5 bg-white/20" />

            {/* Copy walking tour link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-5 h-11 text-sm font-medium transition-colors text-white hover:bg-white/10"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  Copy walking tour link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <span>{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </span>
  )
}

function StopCard({
  stop,
  index,
  isActive,
  onClick,
}: {
  stop: TourStop
  index: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div className="px-4">
      {/* Connector line between cards */}
      {index > 0 && (
        <div className="ml-10 w-px h-2 bg-gray-200" />
      )}

      <div
        onClick={onClick}
        className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all duration-150 cursor-pointer ${
          isActive
            ? 'border-detour-orange shadow-md'
            : 'border-gray-100 hover:shadow-md hover:border-gray-200'
        }`}
      >
        <div className="flex gap-3">
          {/* Thumbnail with stop-number badge */}
          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {stop.thumbnail ? (
              <Image
                src={stop.thumbnail}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            )}
            {/* Number badge */}
            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-detour-orange text-white text-[10px] font-bold flex items-center justify-center shadow">
              {stop.order}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
              {stop.title}
            </h3>

            <p className="flex items-center gap-1 text-detour-orange text-xs font-medium mt-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {index === 0
                ? `${formatDistance(stop.distFromPrev ?? 0)} from start`
                : `${formatDistance(stop.distFromPrev ?? 0)} · ${stop.timeFromPrev} min from prev`}
            </p>

            {stop.extract && (
              <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2">
                {stop.extract}
              </p>
            )}

            {stop.url && (
              <a
                href={stop.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-detour-orange text-xs font-medium mt-2 hover:underline"
              >
                Read article
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
            <div className="h-2.5 bg-gray-100 rounded animate-pulse w-2/5" />
            <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/5" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  )
}
