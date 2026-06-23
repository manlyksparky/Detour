'use client'

import { useState, useEffect, useRef } from 'react'
import type { WikiArticle } from '@/types'
import ArticleCard from './ArticleCard'
import { filterBySidequest, SIDEQUESTS } from '@/lib/sidequests'

const RADIUS_OPTIONS = [
  { value: 250, label: '250 m' },
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
]

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

async function geocodePlace(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LondonDetour/1.0' } }
    )
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
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
  const [showWelcome, setShowWelcome] = useState(true)
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [radiusOpen, setRadiusOpen] = useState(false)
  const radiusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDrawerOpen) setMobileExpanded(false)
  }, [isDrawerOpen])

  // Close radius dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (radiusRef.current && !radiusRef.current.contains(e.target as Node)) {
        setRadiusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    const result = await geocodePlace(searchQuery)
    setSearchLoading(false)
    if (result) onFlyTo(result.lat, result.lng)
  }

  const displayed = activeSidequest
    ? filterBySidequest(articles, activeSidequest)
    : articles

  const radiusLabel = RADIUS_OPTIONS.find((o) => o.value === radius)?.label ??
    (radius < 1000 ? `${radius} m` : `${radius / 1000} km`)

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <div
        className={`
          hidden md:flex flex-col
          fixed top-0 left-0 bottom-0 w-[380px] z-30
          bg-white/75 backdrop-blur-xl border-r border-gray-200/60
          transition-transform duration-300
          ${isDrawerOpen ? '' : ''}
        `}
      >
        <SidebarInner
          showWelcome={showWelcome}
          setShowWelcome={setShowWelcome}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          handleSearch={handleSearch}
          onRequestLocation={onRequestLocation}
          radiusLabel={radiusLabel}
          radiusOpen={radiusOpen}
          setRadiusOpen={setRadiusOpen}
          radiusRef={radiusRef}
          radius={radius}
          onRadiusChange={onRadiusChange}
          articles={articles}
          displayed={displayed}
          activeSidequest={activeSidequest}
          setActiveSidequest={onSidequestChange}
          loading={loading}
          selectedId={selectedId}
          tourStopIds={tourStopIds}
          onArticleSelect={onArticleSelect}
          onCopyLink={onCopyLink}
          copied={copied}
        />
      </div>

      {/* ── Mobile bottom sheet ──────────────────────────── */}
      <div
        className={`
          md:hidden fixed z-30 bottom-0 left-0 right-0
          bg-white/80 backdrop-blur-xl rounded-t-2xl border-t border-gray-200/60
          transition-all duration-300 ease-out
          ${mobileExpanded
            ? 'h-[75vh]'
            : 'h-[calc(3.5rem+env(safe-area-inset-bottom))]'
          }
          ${isDrawerOpen
            ? 'translate-y-full pointer-events-none opacity-0'
            : 'translate-y-0 opacity-100 pointer-events-auto'
          }
        `}
      >
        {/* Drag handle row */}
        <div
          className="pt-3 pb-2 cursor-pointer"
          onClick={() => setMobileExpanded((v) => !v)}
        >
          <div className="drag-handle" />
          <div className="flex items-center justify-between px-4 pt-2">
            <span className="text-sm font-semibold text-gray-800">
              {loading ? 'Finding places…' : `${displayed.length} place${displayed.length !== 1 ? 's' : ''} nearby`}
            </span>
            <svg
              className={`text-gray-400 transition-transform ${mobileExpanded ? 'rotate-180' : ''}`}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </div>
        </div>

        {mobileExpanded && (
          <div className="overflow-y-auto h-[calc(75vh-5rem)] px-3 pb-4 space-y-2">
            {loading ? <SkeletonList /> : displayed.length === 0 ? <EmptyState activeSidequest={activeSidequest} /> : (
              displayed.map((a) => (
                <ArticleCard
                  key={a.pageid}
                  article={a}
                  isSelected={a.pageid === selectedId}
                  isInTour={tourStopIds.includes(a.pageid)}
                  onClick={() => { onArticleSelect(a); setMobileExpanded(false) }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Sidebar inner content (shared structure) ─────────── */
interface InnerProps {
  showWelcome: boolean
  setShowWelcome: (v: boolean) => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  searchLoading: boolean
  handleSearch: (e: React.FormEvent) => void
  onRequestLocation: () => void
  radiusLabel: string
  radiusOpen: boolean
  setRadiusOpen: (v: boolean) => void
  radiusRef: React.RefObject<HTMLDivElement | null>
  radius: number
  onRadiusChange: (r: number) => void
  articles: WikiArticle[]
  displayed: WikiArticle[]
  activeSidequest: string | null
  setActiveSidequest: (id: string | null) => void
  loading: boolean
  selectedId: number | null
  tourStopIds: number[]
  onArticleSelect: (a: WikiArticle) => void
  onCopyLink: () => void
  copied: boolean
}

function SidebarInner({
  showWelcome,
  setShowWelcome,
  searchQuery,
  setSearchQuery,
  searchLoading,
  handleSearch,
  onRequestLocation,
  radiusLabel,
  radiusOpen,
  setRadiusOpen,
  radiusRef,
  radius,
  onRadiusChange,
  articles,
  displayed,
  activeSidequest,
  setActiveSidequest,
  loading,
  selectedId,
  tourStopIds,
  onArticleSelect,
  onCopyLink,
  copied,
}: InnerProps) {
  return (
    <>
      {/* Welcome banner */}
      {showWelcome && (
        <div className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
            Welcome to Detour
          </p>
          <p className="text-sm text-gray-700 leading-relaxed pr-4">
            Browse nearby Wikipedia articles on a map.{' '}
            Try exploring spots or plan a walking tour!
          </p>
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mx-3 mt-3 flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search a place..."
            className="w-full pl-9 pr-4 h-10 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-detour-orange transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={searchLoading}
          className="h-10 w-10 bg-detour-orange rounded-xl flex items-center justify-center text-white hover:bg-orange-700 transition-colors shrink-0 disabled:opacity-60"
        >
          {searchLoading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onRequestLocation}
          title="Use my location"
          className="h-10 w-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:border-detour-orange hover:text-detour-orange transition-colors shrink-0"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="9" strokeDasharray="2 4" />
          </svg>
        </button>
      </form>

      {/* Radius row */}
      <div className="mx-3 mt-2 bg-white border border-gray-100 rounded-xl px-4 h-11 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="10" />
          </svg>
          Radius
        </div>
        <div className="relative" ref={radiusRef}>
          <button
            onClick={() => setRadiusOpen(!radiusOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-800 hover:text-detour-orange transition-colors"
          >
            {radiusLabel}
            <svg
              className={`text-gray-400 transition-transform ${radiusOpen ? 'rotate-180' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {radiusOpen && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 min-w-[100px]">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onRadiusChange(opt.value); setRadiusOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    opt.value === radius
                      ? 'text-detour-orange font-semibold bg-orange-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidequest chips */}
      <div className="mx-3 mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {SIDEQUESTS.map((sq) => (
          <button
            key={sq.id}
            onClick={() => setActiveSidequest(activeSidequest === sq.id ? null : sq.id)}
            className={`shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium border transition-colors ${
              activeSidequest === sq.id
                ? 'bg-detour-orange text-white border-detour-orange'
                : 'bg-white text-gray-600 border-gray-200 hover:border-detour-orange hover:text-detour-orange'
            }`}
          >
            <span>{sq.icon}</span>
            <span>{sq.label}</span>
          </button>
        ))}
      </div>

      {/* Article count + copy link */}
      <div className="mx-3 mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {loading ? 'Searching…' : (
            <>
              <span className="font-semibold text-gray-700">{displayed.length} article{displayed.length !== 1 ? 's' : ''}</span>
              {' '}found across{' '}
              <span className="font-semibold text-gray-700">{radiusLabel}</span>
            </>
          )}
        </p>
        <button
          onClick={onCopyLink}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-detour-orange transition-colors"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>

      {/* Scrollable article list */}
      <div className="flex-1 overflow-y-auto mt-2 px-3 pb-6 space-y-2">
        {loading ? (
          <SkeletonList />
        ) : displayed.length === 0 ? (
          <EmptyState activeSidequest={activeSidequest} />
        ) : (
          displayed.map((a) => (
            <ArticleCard
              key={a.pageid}
              article={a}
              isSelected={a.pageid === selectedId}
              isInTour={tourStopIds.includes(a.pageid)}
              onClick={() => onArticleSelect(a)}
            />
          ))
        )}
      </div>
    </>
  )
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/5" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

function EmptyState({ activeSidequest }: { activeSidequest: string | null }) {
  return (
    <div className="py-12 text-center">
      <p className="text-3xl mb-3">🔭</p>
      <p className="text-sm text-gray-500">
        {activeSidequest ? 'No matches for this theme' : 'Nothing here — try a larger radius'}
      </p>
    </div>
  )
}
