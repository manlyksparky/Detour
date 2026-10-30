'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { Globe, Navigation, MapPin, Plus, Minus, Check, Map as MapIcon } from 'lucide-react'
import type { WikiArticle } from '@/types'
import { formatDistance } from '@/lib/geo'
import { reverseGeocode, formatAddress } from '@/lib/geocode'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { MorphingButton } from '@/components/ui/morphing-button'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { buttonClasses } from '@/components/ui/button'

interface ArticleDrawerProps {
  article: WikiArticle | null
  isOpen: boolean
  isInTour: boolean
  onClose: () => void
  onAddToTour: (article: WikiArticle) => void
  onRemoveFromTour: (pageid: number) => void
}

/**
 * The place panel is an EasyUI Sheet: it slides in from the right on
 * desktop and rises as a bottom sheet on phones, where a swipe dismisses it.
 */
export default function ArticleDrawer({
  article,
  isOpen,
  isInTour,
  onClose,
  onAddToTour,
  onRemoveFromTour,
}: ArticleDrawerProps) {
  // null = looking up, '' = unknown
  const [address, setAddress] = useState<string | null>(null)
  const [ctaStatus, setCtaStatus] = useState<'idle' | 'success'>('idle')
  const ctaTimer = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const gettingThereId = useId()
  const desktop = useMediaQuery('(min-width: 768px)')
  const open = isOpen && !!article

  useEffect(() => {
    if (!article?.lat || !article?.lng) return
    let cancelled = false
    setAddress(null)
    setCtaStatus('idle')
    scrollRef.current?.scrollTo({ top: 0 })
    reverseGeocode(article.lat, article.lng).then((a) => {
      if (!cancelled) setAddress(formatAddress(a))
    })
    return () => {
      cancelled = true
    }
  }, [article?.lat, article?.lng])

  useEffect(
    () => () => {
      if (ctaTimer.current) window.clearTimeout(ctaTimer.current)
    },
    []
  )

  const handleTourToggle = () => {
    if (!article) return
    if (isInTour) {
      onRemoveFromTour(article.pageid)
      return
    }
    onAddToTour(article)
    setCtaStatus('success')
    if (ctaTimer.current) window.clearTimeout(ctaTimer.current)
    ctaTimer.current = window.setTimeout(() => setCtaStatus('idle'), 1400)
  }

  const googleMapsUrl = article?.lat
    ? `https://www.google.com/maps/search/?api=1&query=${article.lat},${article.lng}`
    : null
  const googleDirectionsUrl = article?.lat
    ? `https://www.google.com/maps/dir/?api=1&destination=${article.lat},${article.lng}`
    : null
  const heroSrc = article?.heroImage ?? article?.thumbnail ?? null

  const pill =
    'inline-flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-surface/95 px-3.5 text-xs font-semibold text-ink shadow-raised transition-colors hover:bg-surface'
  const mapLink = buttonClasses({
    variant: 'outline',
    size: 'lg',
    shape: 'rounded',
    className: 'gap-1.5 border-line-strong px-3.5 text-xs text-ink',
  })

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <SheetContent
        side={desktop ? 'right' : 'bottom'}
        initialFocus="close"
        className={desktop ? 'w-[420px] max-w-none' : 'max-h-[92dvh] max-w-none'}
        closeClassName="right-3 top-[calc(env(safe-area-inset-top)+0.75rem)]"
      >
        {article && (
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {/* Hero */}
            <div className="relative h-64 w-full shrink-0 bg-sunken">
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
                <div className="flex h-full w-full items-center justify-center">
                  <MapPin className="text-line-strong" size={56} aria-hidden="true" />
                </div>
              )}

              <div className="absolute left-3 right-16 top-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center gap-2">
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className={pill}>
                    <Globe size={14} aria-hidden="true" />
                    Wikipedia
                  </a>
                )}
                {googleDirectionsUrl && (
                  <a href={googleDirectionsUrl} target="_blank" rel="noopener noreferrer" className={pill}>
                    <Navigation size={14} aria-hidden="true" />
                    Directions
                  </a>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-5 p-5">
              <div>
                <SheetTitle className="text-xl font-bold leading-snug tracking-normal text-ink">{article.title}</SheetTitle>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
                    <MapPin size={14} aria-hidden="true" />
                    {formatDistance(article.distance)} away
                  </span>
                  {article.lat !== 0 && (
                    <span className="font-mono text-xs tabular-nums text-ink-2">
                      {article.lat.toFixed(4)}, {article.lng.toFixed(4)}
                    </span>
                  )}
                </div>
                {article.description && (
                  <p className="mt-2 text-sm leading-snug text-ink-2">{article.description}</p>
                )}
              </div>

              <MorphingButton
                status={ctaStatus}
                variant={isInTour ? 'soft' : 'primary'}
                size="lg"
                fullWidth
                idleText={isInTour ? 'Remove from walking tour' : 'Add to walking tour'}
                idleIcon={isInTour ? <Minus size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                successText="Added to your tour"
                successIcon={<Check size={16} aria-hidden="true" />}
                onClick={handleTourToggle}
              />

              {article.leadText ? (
                <div
                  className="wiki-content text-base text-ink"
                  dangerouslySetInnerHTML={{ __html: article.leadText }}
                />
              ) : article.extract ? (
                <p className="text-base leading-relaxed text-ink">{article.extract}</p>
              ) : (
                <div role="status" aria-label="Loading article">
                  <SkeletonText lines={7} lineClassName="h-3" />
                </div>
              )}

              {article.sections && article.sections.length > 0 && (
                <div className="flex flex-col gap-5">
                  {article.sections.map((section) => (
                    <section key={section.title}>
                      <h3 className="mb-2 border-b border-line pb-1 text-base font-semibold text-ink">
                        {section.title}
                      </h3>
                      <div
                        className="wiki-content text-base text-ink"
                        dangerouslySetInnerHTML={{ __html: section.text }}
                      />
                    </section>
                  ))}
                </div>
              )}

              <section aria-labelledby={gettingThereId} className="rounded-2xl bg-sunken p-4">
                <h3 id={gettingThereId} className="text-sm font-semibold text-ink">
                  Getting there
                </h3>

                {address === null ? (
                  <div role="status" aria-label="Looking up the address" className="mt-3 flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 bg-line-strong/60" />
                    <Skeleton className="h-3 w-3/4 bg-line-strong/60" />
                  </div>
                ) : address ? (
                  <p className="mt-2 flex items-start gap-2 text-sm leading-snug text-ink-2">
                    <MapPin className="mt-0.5 shrink-0 text-ink-3" size={14} aria-hidden="true" />
                    {address}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-ink-2">Street address unavailable. The map links below still work.</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className={mapLink}>
                      <MapIcon size={14} aria-hidden="true" />
                      Google Maps
                    </a>
                  )}
                  <a
                    href={`https://maps.apple.com/?q=${article.lat},${article.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={mapLink}
                  >
                    <MapIcon size={14} aria-hidden="true" />
                    Apple Maps
                  </a>
                </div>
              </section>

              <p className="pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-center text-xs text-ink-2">
                Content from Wikipedia, CC BY-SA 4.0
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
