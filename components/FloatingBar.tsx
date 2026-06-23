'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { WikiArticle } from '@/types'
import { SIDEQUESTS } from '@/lib/sidequests'

interface FloatingBarProps {
  articles: WikiArticle[]
  activeSidequest: string | null
  isDrawerOpen: boolean
  lat: number
  lng: number
  radius: number
  onZoomIn: () => void
  onZoomOut: () => void
  onSurpriseMe: (article: WikiArticle) => void
  onSidequestChange: (id: string | null) => void
}

export default function FloatingBar({
  articles,
  activeSidequest,
  isDrawerOpen,
  lat,
  lng,
  radius,
  onZoomIn,
  onZoomOut,
  onSurpriseMe,
  onSidequestChange,
}: FloatingBarProps) {
  const router = useRouter()
  const [sidequestOpen, setSidequestOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSidequestOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSurpriseMe = () => {
    if (articles.length === 0) return
    onSurpriseMe(articles[Math.floor(Math.random() * articles.length)])
  }

  // Plan Tour auto-generates from current center + radius (same-tab navigation)
  const handlePlanTour = () => {
    const params = new URLSearchParams({
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
      radius: radius.toString(),
    })
    router.push(`/tour?${params}`)
  }

  return (
    <div
      className={`
        absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6
        left-1/2 -translate-x-1/2 z-20
        transition-opacity duration-200
        ${isDrawerOpen
          ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'
          : 'opacity-100 pointer-events-auto'}
      `}
    >
      {/* Sidequest chips popover */}
      {sidequestOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex gap-2 flex-nowrap"
        >
          {SIDEQUESTS.map((sq) => (
            <button
              key={sq.id}
              onClick={() => {
                onSidequestChange(activeSidequest === sq.id ? null : sq.id)
                setSidequestOpen(false)
              }}
              className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium shadow-lg whitespace-nowrap transition-colors ${
                activeSidequest === sq.id
                  ? 'bg-detour-orange text-white'
                  : 'bg-[#1c1c1e] text-white/80 hover:text-white'
              }`}
            >
              <span>{sq.icon}</span>
              <span>{sq.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Pill bar */}
      <div className="flex items-center bg-[#1c1c1e]/95 backdrop-blur-md rounded-full shadow-2xl border border-white/10 overflow-hidden h-11">

        {/* − zoom */}
        <button
          onClick={onZoomOut}
          aria-label="Zoom out"
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" />
          </svg>
        </button>

        <div className="w-px h-5 bg-white/15" />

        {/* + zoom */}
        <button
          onClick={onZoomIn}
          aria-label="Zoom in"
          className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div className="w-px h-5 bg-white/15" />

        {/* Sidequests */}
        <button
          onClick={() => setSidequestOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 h-11 text-sm font-medium transition-colors ${
            activeSidequest || sidequestOpen ? 'text-detour-orange' : 'text-white hover:bg-white/10'
          }`}
        >
          <span className="text-base leading-none">🧭</span>
          Sidequests
          {activeSidequest && <span className="w-1.5 h-1.5 rounded-full bg-detour-orange" />}
        </button>

        <div className="w-px h-5 bg-white/15" />

        {/* Surprise Me */}
        <button
          onClick={handleSurpriseMe}
          disabled={articles.length === 0}
          className="flex items-center gap-2 px-4 h-11 text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-40"
        >
          <span className="text-base leading-none">🎲</span>
          Surprise Me
        </button>

        <div className="w-px h-5 bg-white/15" />

        {/* Plan Tour — always visible, auto-generates from current area */}
        <button
          onClick={handlePlanTour}
          disabled={articles.length === 0}
          className="flex items-center gap-2 mx-1.5 px-4 h-9 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-base leading-none">🗺️</span>
          Plan Tour
        </button>
      </div>
    </div>
  )
}
