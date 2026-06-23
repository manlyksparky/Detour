'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import type { WikiArticle } from '@/types'
import { formatDistance } from '@/lib/geo'

interface ArticleDrawerProps {
  article: WikiArticle | null
  isOpen: boolean
  isInTour: boolean
  onClose: () => void
  onAddToTour: (article: WikiArticle) => void
  onRemoveFromTour: (pageid: number) => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17`,
      { headers: { 'User-Agent': 'LondonDetour/1.0' } }
    )
    const data = await res.json()
    const a = data.address ?? {}
    const parts = [a.road, a.suburb ?? a.city_district ?? a.quarter, a.postcode].filter(Boolean)
    return parts.join(', ')
  } catch {
    return ''
  }
}

export default function ArticleDrawer({
  article,
  isOpen,
  isInTour,
  onClose,
  onAddToTour,
  onRemoveFromTour,
}: ArticleDrawerProps) {
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (!article?.lat || !article?.lng) return
    setAddress('')
    reverseGeocode(article.lat, article.lng).then(setAddress)
  }, [article?.lat, article?.lng])

  const googleMapsUrl = article?.lat
    ? `https://www.google.com/maps/search/?api=1&query=${article.lat},${article.lng}`
    : null
  const googleDirectionsUrl = article?.lat
    ? `https://www.google.com/maps/dir/?api=1&destination=${article.lat},${article.lng}`
    : null

  const heroSrc = article?.heroImage ?? article?.thumbnail ?? null

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-[35] bg-black/20 transition-opacity duration-300 ${
          isOpen && article ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-dvh z-40 bg-white
          w-full md:w-[420px]
          overflow-y-auto shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen && article ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {article && (
          <>
            {/* ── Hero image ──────────────────────────────── */}
            <div className="relative w-full h-64 bg-gray-100 shrink-0">
              {heroSrc ? (
                <Image
                  src={heroSrc}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <svg className="text-gray-300" width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  </svg>
                </div>
              )}

              {/* Top action bar overlaid on image */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                {/* Quick actions */}
                <div className="flex items-center gap-2">
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 hover:bg-white shadow-sm transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                      </svg>
                      Wikipedia
                    </a>
                  )}
                  {googleDirectionsUrl && (
                    <a
                      href={googleDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 hover:bg-white shadow-sm transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                      </svg>
                      Directions
                    </a>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gray-900 shadow-sm transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Content ─────────────────────────────────── */}
            <div className="p-5 flex flex-col gap-5">

              {/* Title + meta */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  {article.title}
                </h2>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-detour-orange text-sm font-medium">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {formatDistance(article.distance)} away
                  </span>

                  {article.lat !== 0 && (
                    <span className="text-xs text-gray-400 font-mono">
                      {article.lat.toFixed(4)}, {article.lng.toFixed(4)}
                    </span>
                  )}
                </div>

                {article.description && (
                  <p className="mt-2 text-sm text-gray-500 italic leading-snug">
                    {article.description}
                  </p>
                )}
              </div>

              {/* ── Add to tour CTA ─────────────────────── */}
              <button
                onClick={() => isInTour ? onRemoveFromTour(article.pageid) : onAddToTour(article)}
                className={`w-full h-11 rounded-2xl text-sm font-semibold transition-colors ${
                  isInTour
                    ? 'bg-orange-50 text-detour-orange border border-orange-200 hover:bg-orange-100'
                    : 'bg-detour-orange text-white hover:bg-orange-700'
                }`}
              >
                {isInTour ? '✓ Added to walking tour' : '+ Add to walking tour'}
              </button>

              {/* ── Article content ──────────────────────── */}
              {article.leadText ? (
                <div
                  className="wiki-content text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: article.leadText }}
                />
              ) : article.extract ? (
                <p className="text-sm text-gray-700 leading-relaxed">{article.extract}</p>
              ) : (
                <ContentSkeleton />
              )}

              {/* Sections */}
              {article.sections && article.sections.length > 0 && (
                <div className="flex flex-col gap-5">
                  {article.sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                        {section.title}
                      </h3>
                      <div
                        className="wiki-content text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: section.text }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Loading state for sections */}
              {!article.leadText && !article.extract && <ContentSkeleton />}

              {/* ── Practical info ───────────────────────── */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Getting there</p>

                {address ? (
                  <div className="flex items-start gap-3">
                    <svg className="text-gray-400 mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <p className="text-sm text-gray-700 leading-snug">{address}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-gray-200 animate-pulse shrink-0" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-detour-orange hover:text-detour-orange transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Google Maps
                    </a>
                  )}
                  <a
                    href={`https://maps.apple.com/?q=${article.lat},${article.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-detour-orange hover:text-detour-orange transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Apple Maps
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center pb-2">
                Content from Wikipedia · CC BY-SA 4.0
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ContentSkeleton() {
  return (
    <div className="space-y-2">
      {[100, 92, 85, 100, 78, 90, 65].map((w, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}
