'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, Compass, Dices, Route } from 'lucide-react'
import type { WikiArticle } from '@/types'
import { encodeStops } from '@/lib/tour'
import { motionTransitions } from '@/lib/motion-tokens'
import { FloatingDock, DockItem, DockDivider } from '@/components/ui/small-floating-dock'
import { MagneticButton } from '@/components/ui/magnetic-button'
import { Badge } from '@/components/ui/badge'
import SidequestChips from './SidequestChips'

interface FloatingBarProps {
  articles: WikiArticle[]
  activeSidequest: string | null
  isDrawerOpen: boolean
  lat: number
  lng: number
  radius: number
  tourStopIds: number[]
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
  tourStopIds,
  onZoomIn,
  onZoomOut,
  onSurpriseMe,
  onSidequestChange,
}: FloatingBarProps) {
  const router = useRouter()
  const [sidequestOpen, setSidequestOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  // Close the theme picker on outside pointer or Escape
  useEffect(() => {
    if (!sidequestOpen) return
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setSidequestOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSidequestOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [sidequestOpen])

  // Opening the picker moves focus to the first chip; Escape returns it to the toggle
  useEffect(() => {
    if (sidequestOpen) popoverRef.current?.querySelector<HTMLElement>('button')?.focus()
  }, [sidequestOpen])

  const handleSurpriseMe = () => {
    if (articles.length === 0) return
    onSurpriseMe(articles[Math.floor(Math.random() * articles.length)])
  }

  // Plan tour builds from the current centre + radius, or from hand-picked stops
  const handlePlanTour = () => {
    const params = new URLSearchParams({
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
      radius: radius.toString(),
    })
    if (tourStopIds.length > 0) params.set('stops', encodeStops(tourStopIds))
    router.push(`/tour?${params}`)
  }

  const empty = articles.length === 0
  const picked = tourStopIds.length
  // The drawer narrows the map on desktop; drop the zoom buttons and the Surprise label so the dock still fits
  const compact = isDrawerOpen

  return (
    <div
      ref={rootRef}
      className={`
        absolute bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] md:bottom-6
        left-1/2 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2
        transition-opacity duration-200 motion-reduce:transition-none
        ${isDrawerOpen
          ? 'pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100'
          : 'opacity-100'}
      `}
    >
      <FloatingDock label="Map actions">
        <DockItem
          icon={<Minus />}
          label="Zoom out"
          hideLabel
          tooltip
          onClick={onZoomOut}
          className={compact ? 'hidden' : 'hidden md:inline-flex'}
        />
        <DockItem
          icon={<Plus />}
          label="Zoom in"
          hideLabel
          tooltip
          onClick={onZoomIn}
          className={compact ? 'hidden' : 'hidden md:inline-flex'}
        />
        <DockDivider className={compact ? 'hidden' : 'hidden md:block'} />

        <DockItem
          ref={toggleRef}
          icon={<Compass />}
          label="Sidequests"
          labelClassName="hidden xs:inline"
          active={!!activeSidequest}
          aria-expanded={sidequestOpen}
          aria-controls={sidequestOpen ? popoverId : undefined}
          onClick={() => setSidequestOpen((v) => !v)}
        >
          {activeSidequest && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
        </DockItem>

        <DockDivider />

        <DockItem
          icon={<Dices />}
          label="Surprise me"
          labelClassName={compact ? 'hidden' : 'hidden sm:inline'}
          title="Surprise me: open a random place nearby"
          disabled={empty}
          onClick={handleSurpriseMe}
        />

        <DockDivider />

        {/* The primary action is nested in the pill; the pseudo-element gives it the full 44px hit area */}
        <MagneticButton
          variant="primary"
          size="nested"
          strength={0.2}
          disabled={empty}
          onClick={handlePlanTour}
          className="before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
        >
          <Route size={18} aria-hidden="true" />
          <span>Plan tour</span>
          {picked > 0 && <span className="sr-only">, {picked} picked</span>}
          {picked > 0 && (
            <Badge tone="ink" size="sm" aria-hidden="true">
              {picked}
            </Badge>
          )}
        </MagneticButton>
      </FloatingDock>

      <AnimatePresence>
        {sidequestOpen && (
          <motion.div
            id={popoverId}
            ref={popoverRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={motionTransitions.springSnappy}
            className="absolute bottom-full left-1/2 mb-3 w-max max-w-[calc(100vw-2rem)] origin-bottom -translate-x-1/2"
          >
            <SidequestChips
              label="Sidequest themes"
              size="md"
              elevated
              className="justify-center"
              active={activeSidequest}
              onChange={(id) => {
                onSidequestChange(id)
                setSidequestOpen(false)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
