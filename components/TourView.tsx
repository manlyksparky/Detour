'use client'

import { useEffect, useState, useCallback, useMemo, useId } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { ArrowLeft, Link as LinkIcon, Flag, MapPin, Footprints, ExternalLink, Route } from 'lucide-react'
import type { WikiArticle, TourStop } from '@/types'
import { computeTourStops, formatDistance } from '@/lib/geo'
import { LONDON_CENTER, RADIUS_DEFAULT, RADIUS_MAX } from '@/lib/constants'
import { reverseGeocode, areaName } from '@/lib/geocode'
import { decodeStops } from '@/lib/tour'
import { FloatingDock, DockDivider, dockLinkClasses } from '@/components/ui/small-floating-dock'
import { MorphingButton } from '@/components/ui/morphing-button'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { StepIndicator, StepConnector, type StepState } from '@/components/ui/stepper'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { buttonClasses } from '@/components/ui/button'

const TourMap = dynamic(() => import('./TourMap'), { ssr: false })

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
      return { ...s, ...detail, thumbnail: detail.thumbnail ?? s.thumbnail }
    })
  } catch {
    return stops
  }
}

function formatWalk(minutes: number): string {
  return minutes < 1 ? 'under 1 min' : `${minutes} min`
}

export default function TourView() {
  const searchParams = useSearchParams()

  const lat = parseFloat(searchParams.get('lat') ?? '') || LONDON_CENTER.lat
  const lng = parseFloat(searchParams.get('lng') ?? '') || LONDON_CENTER.lng
  const radius = parseInt(searchParams.get('radius') ?? '') || RADIUS_DEFAULT
  const pickedKey = searchParams.get('stops') ?? ''
  const picked = useMemo(() => decodeStops(pickedKey || null), [pickedKey])

  const [stops, setStops] = useState<TourStop[]>([])
  const [tourName, setTourName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeStop, setActiveStop] = useState<number | null>(null)
  const trailId = useId()

  const generate = useCallback(async () => {
    setLoading(true)
    setStops([])
    setTourName('')
    setActiveStop(null)

    const [articles, address] = await Promise.all([
      fetch(`/api/wikipedia?lat=${lat}&lng=${lng}&radius=${radius}`)
        .then((r) => (r.ok ? (r.json() as Promise<WikiArticle[]>) : ([] as WikiArticle[])))
        .catch(() => [] as WikiArticle[]),
      reverseGeocode(lat, lng, 10),
    ])

    setTourName(`${areaName(address)} walking tour`)
    const pool = picked.length > 0 ? articles.filter((a) => picked.includes(a.pageid)) : articles
    const rawStops = computeTourStops(pool, lat, lng, { curated: picked.length > 0 })
    setStops(rawStops)
    setLoading(false)
    enrichStops(rawStops).then(setStops)
  }, [lat, lng, radius, picked])

  useEffect(() => {
    generate()
  }, [generate])

  useEffect(() => {
    if (tourName) document.title = `${tourName} · Detour`
    return () => {
      document.title = 'Detour'
    }
  }, [tourName])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked; the URL bar still carries the link
    }
  }

  const backHref = `/?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&radius=${radius}`
  const widerRadius = Math.min(radius * 2, RADIUS_MAX)
  const widerHref = `/?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}&radius=${widerRadius}`

  const totalDistance = stops.reduce((sum, s) => sum + (s.distFromPrev ?? 0), 0)
  const totalTime = stops.reduce((sum, s) => sum + (s.timeFromPrev ?? 0), 0)
  const activeIndex = stops.findIndex((s) => s.pageid === activeStop)
  const last = stops.length - 1

  const secondaryBtn = buttonClasses({ variant: 'secondary', size: 'md' })

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-paper md:flex-row">
      {/* ── Stop list ───────────────────────────────────── */}
      <aside
        aria-label="Tour stops"
        className="flex h-[45dvh] flex-col overflow-hidden border-b border-line bg-paper md:h-full md:w-[380px] md:shrink-0 md:border-b-0 md:border-r"
      >
        <header className="shrink-0 border-b border-line px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1rem)]">
          {loading ? (
            <div className="space-y-2" role="status" aria-label="Building your tour">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold leading-tight text-ink">{tourName}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
                <Stat icon={Flag}>
                  <AnimatedNumber value={stops.length} animateOnMount /> {stops.length === 1 ? 'stop' : 'stops'}
                </Stat>
                <span className="sr-only">, </span>
                <Stat icon={MapPin}>
                  <Distance metres={totalDistance} />
                </Stat>
                <span className="sr-only">, </span>
                <Stat icon={Footprints}>
                  {totalTime < 1 ? (
                    'under 1 min walking'
                  ) : (
                    <>
                      about <AnimatedNumber value={totalTime} animateOnMount /> min walking
                    </>
                  )}
                </Stat>
              </p>
            </>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : stops.length === 0 ? (
            <div className="p-8 text-center">
              <Route className="mx-auto text-ink-3" size={28} aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">No places to walk to here</p>
              <p className="mt-1 text-xs text-ink-2">
                {picked.length > 0
                  ? 'The places you picked are outside this search area.'
                  : 'Widen the search to find stops nearby.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {radius < RADIUS_MAX && (
                  <Link href={widerHref} className={secondaryBtn}>
                    Search within {formatDistance(widerRadius)}
                  </Link>
                )}
                <Link href={backHref} className={secondaryBtn}>
                  Back to explore
                </Link>
              </div>
            </div>
          ) : (
            <ol className="px-4 py-3" aria-label="Stops in walking order">
              {stops.map((stop, i) => {
                const state: StepState =
                  activeIndex === -1
                    ? 'upcoming'
                    : i < activeIndex
                      ? 'complete'
                      : i === activeIndex
                        ? 'current'
                        : 'upcoming'
                const next = stops[i + 1]
                return (
                  <li key={stop.pageid} className="relative">
                    {i < last && (
                      <StepConnector
                        filled={activeIndex > i}
                        className="absolute bottom-0 left-[13.5px] top-11"
                      />
                    )}
                    <div className="flex gap-3">
                      <div className="relative z-10 shrink-0 pt-4">
                        <StepIndicator index={i} state={state} layoutId={trailId} checkWhenComplete={false} />
                      </div>
                      <StopCard
                        stop={stop}
                        index={i}
                        isActive={activeStop === stop.pageid}
                        onSelect={() => setActiveStop(stop.pageid === activeStop ? null : stop.pageid)}
                      />
                    </div>
                    {next && (
                      <p className="flex items-center gap-1.5 py-2 pl-10 text-xs font-medium text-ink-2">
                        <Footprints size={12} className="text-ink-3" aria-hidden="true" />
                        <span className="sr-only">Then walk </span>
                        {formatDistance(next.distFromPrev ?? 0)}, {formatWalk(next.timeFromPrev ?? 0)} to stop{' '}
                        {next.order}
                      </p>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </aside>

      {/* ── Map + floating dock ─────────────────────────── */}
      <div className="relative min-h-0 flex-1">
        <TourMap stops={stops} center={{ lat, lng }} activeId={activeStop} onSelect={setActiveStop} />

        <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2">
          <FloatingDock label="Tour actions">
            <Link href={backHref} className={dockLinkClasses}>
              <ArrowLeft size={18} aria-hidden="true" />
              Back to explore
            </Link>
            <DockDivider />
            <MorphingButton
              variant="ghost"
              size="nested"
              status={copied ? 'success' : 'idle'}
              idleText="Copy tour link"
              idleIcon={<LinkIcon size={18} aria-hidden="true" />}
              successText="Copied"
              successTone="success"
              onClick={handleCopyLink}
              className="min-w-[9rem] px-3 font-medium"
            />
            <span role="status" className="sr-only">
              {copied ? 'Tour link copied to clipboard' : ''}
            </span>
          </FloatingDock>
        </div>
      </div>
    </main>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function Stat({ icon: Icon, children }: { icon: typeof Flag; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon size={14} className="text-ink-3" aria-hidden="true" />
      <span className="font-medium text-ink-2">{children}</span>
    </span>
  )
}

function Distance({ metres }: { metres: number }) {
  if (metres < 1000) return <AnimatedNumber value={Math.round(metres)} suffix=" m" animateOnMount />
  return <AnimatedNumber value={metres / 1000} decimals={1} suffix=" km" animateOnMount />
}

function StopCard({
  stop,
  index,
  isActive,
  onSelect,
}: {
  stop: TourStop
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  return (
    <article
      aria-current={isActive ? 'true' : undefined}
      className={`relative flex min-w-0 flex-1 gap-3 rounded-2xl border bg-surface p-4 shadow-card transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-accent-strong focus-within:ring-offset-2 focus-within:ring-offset-paper ${
        isActive ? 'border-accent shadow-raised' : 'border-line hover:border-line-strong hover:shadow-raised'
      }`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sunken">
        {stop.thumbnail ? (
          <Image src={stop.thumbnail} alt="" fill sizes="64px" className="object-cover" unoptimized />
        ) : (
          <MapPin className="absolute inset-0 m-auto text-ink-2" size={20} aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold leading-snug text-ink line-clamp-2">
          <button
            type="button"
            onClick={onSelect}
            className="focus-quiet cursor-pointer text-left after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            <span className="sr-only">Stop {stop.order}: </span>
            {stop.title}
          </button>
        </h2>

        {index === 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent-strong">
            <MapPin size={12} aria-hidden="true" />
            {formatDistance(stop.distFromPrev ?? 0)} from the start
          </p>
        )}

        {stop.extract && (
          <p className="mt-1 text-xs leading-relaxed text-ink-2 line-clamp-2">{stop.extract}</p>
        )}

        {stop.url && (
          <a
            href={stop.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 mt-2 inline-flex min-h-6 items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
          >
            Read on Wikipedia
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 px-4 py-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="mt-4 size-7 shrink-0 rounded-full" />
          <div className="flex flex-1 gap-3 rounded-2xl border border-line bg-surface p-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            <div className="flex-1 pt-1">
              <SkeletonText lines={3} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
