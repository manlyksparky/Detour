'use client'

import { useState, useEffect, useId } from 'react'
import { Search, LocateFixed, Link, ChevronDown, Telescope } from 'lucide-react'
import type { WikiArticle } from '@/types'
import ArticleCard from './ArticleCard'
import SidequestChips from './SidequestChips'
import { filterBySidequest } from '@/lib/sidequests'
import { geocodePlace } from '@/lib/geocode'
import { Button } from '@/components/ui/button'
import { IOSSearchBar } from '@/components/ui/ios-search-bar'
import { SpringSelect } from '@/components/ui/spring-select'
import { MorphingButton } from '@/components/ui/morphing-button'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { DirectionalTooltip } from '@/components/ui/directional-tooltip'

const RADIUS_OPTIONS = [
  { value: 250, label: '250 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
]

function radiusLabel(r: number): string {
  return RADIUS_OPTIONS.find((o) => o.value === r)?.label ?? (r < 1000 ? `${r} m` : `${r / 1000} km`)
}

type SearchState = 'idle' | 'loading' | 'notfound'

interface ArticleListProps {
  articles: WikiArticle[]
  selectedId: number | null
  tourStopIds: number[]
  loading: boolean
  isDrawerOpen: boolean
  radius: number
  activeSidequest: string | null
  onArticleSelect: (article: WikiArticle) => void
  onRadiusChange: (r: number) => void
  onSidequestChange: (id: string | null) => void
  onFlyTo: (lat: number, lng: number) => void
  onRequestLocation: () => void
  onCopyLink: () => void
  copied: boolean
}

export default function ArticleList({
  articles,
  selectedId,
  tourStopIds,
  loading,
  isDrawerOpen,
  radius,
  activeSidequest,
  onArticleSelect,
  onRadiusChange,
  onSidequestChange,
  onFlyTo,
  onRequestLocation,
  onCopyLink,
  copied,
}: ArticleListProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchState, setSearchState] = useState<SearchState>('idle')
  const listId = useId()

  useEffect(() => {
    if (isDrawerOpen) setMobileExpanded(false)
  }, [isDrawerOpen])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchState('loading')
    const result = await geocodePlace(q)
    if (result) {
      setSearchState('idle')
      onFlyTo(result.lat, result.lng)
    } else {
      setSearchState('notfound')
    }
  }

  const displayed = activeSidequest ? filterBySidequest(articles, activeSidequest) : articles
  const nextRadius = RADIUS_OPTIONS.find((o) => o.value > radius)?.value ?? null
  const countLabel = loading
    ? 'Finding places…'
    : `${displayed.length} ${displayed.length === 1 ? 'place' : 'places'} ${activeSidequest ? 'match' : 'nearby'}`

  const searchProps = {
    query: searchQuery,
    setQuery: (v: string) => {
      setSearchQuery(v)
      if (searchState === 'notfound') setSearchState('idle')
    },
    state: searchState,
    onSubmit: handleSearch,
    onRequestLocation,
  }

  const listBody = loading ? (
    <SkeletonList />
  ) : displayed.length === 0 ? (
    <EmptyState
      activeSidequest={activeSidequest}
      nextRadius={nextRadius}
      onClearSidequest={() => onSidequestChange(null)}
      onWidenRadius={onRadiusChange}
    />
  ) : (
    <ul className="space-y-2">
      {displayed.map((a) => (
        <li key={a.pageid}>
          <ArticleCard
            article={a}
            isSelected={a.pageid === selectedId}
            isInTour={tourStopIds.includes(a.pageid)}
            onClick={() => {
              onArticleSelect(a)
              setMobileExpanded(false)
            }}
          />
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        id="places"
        tabIndex={-1}
        aria-label="Nearby places"
        className="fixed bottom-0 left-0 top-0 z-30 hidden w-[380px] flex-col border-r border-line bg-paper outline-none md:flex"
      >
        <a href="#map" className="skip-link">
          Skip to map
        </a>
        <header className="px-4 pb-3 pt-4">
          <h1 className="text-lg font-semibold text-ink">Detour</h1>
          <p className="mt-0.5 text-sm text-ink-2">Wander unfamiliar territory, discovering the gems around you.</p>
        </header>

        <div className="space-y-3 px-3">
          <SearchForm {...searchProps} />
          <div className="flex items-center gap-2">
            <RadiusSelect radius={radius} onChange={onRadiusChange} />
            <CopyLinkButton copied={copied} onCopy={onCopyLink} />
          </div>
          <SidequestChips active={activeSidequest} onChange={onSidequestChange} />
        </div>

        <h2 className="mt-3 px-4 text-sm font-semibold text-ink" aria-live="polite">
          {countLabel}
          {!loading && <span className="font-normal text-ink-2"> within {radiusLabel(radius)}</span>}
        </h2>

        <div className="mt-2 flex-1 overflow-y-auto px-3 pb-6">{listBody}</div>
      </aside>

      {/* ── Phone: search floats over the map ───────────── */}
      <div
        className={`fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 md:hidden ${
          isDrawerOpen ? 'hidden' : ''
        }`}
      >
        <h1 className="sr-only">Detour</h1>
        <SearchForm {...searchProps} floating />
      </div>

      {/* ── Phone: bottom sheet ─────────────────────────── */}
      <section
        id="places-sheet"
        tabIndex={-1}
        aria-label="Nearby places"
        className={`outline-none 
          fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t border-line bg-paper shadow-float md:hidden
          transition-[height,transform,opacity] duration-200 ease-out-expo motion-reduce:transition-none
          ${mobileExpanded ? 'h-[75dvh]' : 'h-[calc(3.5rem+env(safe-area-inset-bottom))]'}
          ${isDrawerOpen ? 'pointer-events-none translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        <div className="relative shrink-0 px-4 pb-2 pt-2.5">
          <div className="drag-handle" />
          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink" aria-live="polite">
              {countLabel}
            </h2>
            <ChevronDown
              className={`text-ink-3 transition-transform duration-200 motion-reduce:transition-none ${
                mobileExpanded ? 'rotate-180' : ''
              }`}
              size={18}
              aria-hidden="true"
            />
          </div>
          <button
            type="button"
            aria-expanded={mobileExpanded}
            aria-controls={listId}
            aria-label={mobileExpanded ? 'Hide nearby places' : 'Show nearby places'}
            onClick={() => setMobileExpanded((v) => !v)}
            className="absolute inset-0 w-full cursor-pointer rounded-t-2xl focus-visible:outline-offset-[-2px]"
          />
        </div>

        <div id={listId} hidden={!mobileExpanded} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 px-3 pb-3">
            <RadiusSelect radius={radius} onChange={onRadiusChange} />
            <CopyLinkButton copied={copied} onCopy={onCopyLink} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {listBody}
          </div>
        </div>
      </section>
    </>
  )
}

/* ─── Pieces ─────────────────────────────────────────────── */

function SearchForm({
  query,
  setQuery,
  state,
  onSubmit,
  onRequestLocation,
  floating = false,
}: {
  query: string
  setQuery: (v: string) => void
  state: SearchState
  onSubmit: (e: React.FormEvent) => void
  onRequestLocation: () => void
  floating?: boolean
}) {
  const hintId = useId()
  const notFound = state === 'notfound'

  return (
    <form role="search" onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <IOSSearchBar
          value={query}
          onChange={setQuery}
          label="Search a place in London"
          placeholder="Search a place in London"
          shape={floating ? 'pill' : 'rounded'}
          elevated={floating}
          invalid={notFound}
          aria-describedby={notFound ? hintId : undefined}
          autoComplete="off"
          enterKeyHint="search"
          name="q"
          className="min-w-0 flex-1"
          trailing={
            <DirectionalTooltip content="Search" side="top">
              <Button
                type="submit"
                variant="primary"
                size="icon-sm"
                isLoading={state === 'loading'}
                aria-label="Search"
                className="shadow-none before:absolute before:-inset-1 before:content-['']"
              >
                <Search size={16} aria-hidden="true" />
              </Button>
            </DirectionalTooltip>
          }
        />
        <DirectionalTooltip content="Use my location" side="top">
          <Button
            type="button"
            variant={floating ? 'secondary' : 'outline'}
            size="icon"
            shape={floating ? 'pill' : 'rounded'}
            onClick={onRequestLocation}
            aria-label="Use my location"
            className={floating ? 'border-line text-ink-2 shadow-float hover:text-accent-strong' : undefined}
          >
            <LocateFixed size={16} aria-hidden="true" />
          </Button>
        </DirectionalTooltip>
      </div>
      {notFound && (
        <p
          id={hintId}
          role="alert"
          className={`text-xs text-ink-2 ${floating ? 'rounded-xl bg-surface px-3 py-2 shadow-raised' : 'px-1'}`}
        >
          No place with that name in London. Try a street, station or landmark.
        </p>
      )}
    </form>
  )
}

function RadiusSelect({ radius, onChange }: { radius: number; onChange: (r: number) => void }) {
  const base = RADIUS_OPTIONS.some((o) => o.value === radius)
    ? RADIUS_OPTIONS
    : [...RADIUS_OPTIONS, { value: radius, label: radiusLabel(radius) }].sort((a, b) => a.value - b.value)
  const options = base.map((o) => ({ value: String(o.value), label: `Within ${o.label}` }))

  return (
    <SpringSelect
      label="Search radius"
      hideLabel
      options={options}
      value={String(radius)}
      onChange={(v) => onChange(Number(v))}
      className="min-w-0 flex-1"
    />
  )
}

function CopyLinkButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <>
      <MorphingButton
        variant="secondary"
        size="lg"
        status={copied ? 'success' : 'idle'}
        idleText="Copy link"
        idleIcon={<Link size={16} aria-hidden="true" />}
        successText="Copied"
        successTone="success"
        onClick={onCopy}
        className="min-w-[7.25rem] shrink-0 rounded-xl px-3"
      />
      <span role="status" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </>
  )
}

function SkeletonList() {
  return (
    <ul className="space-y-2" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex-1 pt-1">
            <SkeletonText lines={3} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function EmptyState({
  activeSidequest,
  nextRadius,
  onClearSidequest,
  onWidenRadius,
}: {
  activeSidequest: string | null
  nextRadius: number | null
  onClearSidequest: () => void
  onWidenRadius: (r: number) => void
}) {
  return (
    <div className="py-10 text-center">
      <Telescope className="mx-auto text-ink-3" size={28} aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-ink">
        {activeSidequest ? 'Nothing here matches that theme' : 'No places within this radius'}
      </p>
      <p className="mt-1 text-xs text-ink-2">
        {activeSidequest ? 'Clear the theme or widen the search.' : 'Widen the search to find more.'}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {activeSidequest && (
          <Button variant="secondary" size="md" onClick={onClearSidequest}>
            Clear theme
          </Button>
        )}
        {nextRadius && (
          <Button variant="secondary" size="md" onClick={() => onWidenRadius(nextRadius)}>
            Search within {radiusLabel(nextRadius)}
          </Button>
        )}
      </div>
    </div>
  )
}
