'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'

export interface GreetingItem {
  text: string
  lang?: string
}

export interface IntroLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Words to cycle through (strings or { text, lang } objects) */
  greetings?: (string | GreetingItem)[]
  /** Callback fired when the welcome sequence completes */
  onComplete?: () => void
  /** Whether to render as fixed full-screen overlay or inline container */
  fullScreen?: boolean
  /** Milliseconds per word */
  intervalMs?: number
  /** Show the hairline progress indicator */
  showProgress?: boolean
  /** Show the language label beneath the word */
  showLangBadge?: boolean
  /** Allow pressing ESC or clicking Skip to bypass */
  allowSkip?: boolean
  /** Speed multiplier (e.g. 1 = normal, 1.5 = fast) */
  speedMultiplier?: number
}

const DEFAULT_GREETINGS: GreetingItem[] = [
  { text: 'Détour', lang: 'FR' },
  { text: 'Desvío', lang: 'ES' },
  { text: 'Umweg', lang: 'DE' },
  { text: '回り道', lang: 'JA' },
  { text: '우회로', lang: 'KO' },
  { text: 'Detour', lang: 'EN' },
]

export const IntroLoader: React.FC<IntroLoaderProps> = ({
  greetings = DEFAULT_GREETINGS,
  onComplete,
  fullScreen = true,
  intervalMs = 240,
  showProgress = true,
  showLangBadge = true,
  allowSkip = true,
  speedMultiplier = 1,
  className,
  ...props
}) => {
  const normalizedGreetings: GreetingItem[] = greetings.map((g) =>
    typeof g === 'string' ? { text: g } : g
  )

  const [greetingIndex, setGreetingIndex] = useState(0)
  const [stage, setStage] = useState<'greeting' | 'done'>('greeting')
  const [cycleKey, setCycleKey] = useState(0)
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef<HTMLButtonElement>(null)

  // Keep the latest onComplete in a ref so an inline callback from the parent
  // doesn't restart the cycle effect on every render.
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const adjustedInterval = Math.max(100, Math.round(intervalMs / speedMultiplier))

  const handleFinish = useCallback(() => {
    setStage('done')
    onCompleteRef.current?.()
  }, [])

  // Word cycling (runs on mount and on every replay)
  useEffect(() => {
    if (stage !== 'greeting') return

    if (reducedMotion) {
      handleFinish()
      return
    }

    setGreetingIndex(0)

    let finishTimeout: ReturnType<typeof setTimeout> | null = null
    const interval = setInterval(() => {
      setGreetingIndex((prev) => {
        if (prev < normalizedGreetings.length - 1) {
          return prev + 1
        }
        clearInterval(interval)
        finishTimeout = setTimeout(() => {
          handleFinish()
        }, Math.round(450 / speedMultiplier))
        return prev
      })
    }, adjustedInterval)

    return () => {
      clearInterval(interval)
      if (finishTimeout) clearTimeout(finishTimeout)
    }
  }, [cycleKey, stage, normalizedGreetings.length, adjustedInterval, reducedMotion, handleFinish, speedMultiplier])

  // ESC to skip; Tab stays on the Skip control while the modal is up
  useEffect(() => {
    if (!allowSkip || stage === 'done') return
    skipRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleFinish()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        skipRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allowSkip, stage, handleFinish, cycleKey])

  const replay = () => {
    setGreetingIndex(0)
    setStage('greeting')
    setCycleKey((prev) => prev + 1)
  }

  const currentGreeting = normalizedGreetings[greetingIndex] || normalizedGreetings[0]

  const progressPercent =
    stage === 'greeting' ? ((greetingIndex + 1) / normalizedGreetings.length) * 100 : 100

  return (
    <AnimatePresence mode="wait">
      {stage !== 'done' ? (
        <motion.div
          ref={containerRef}
          key={`intro-overlay-${cycleKey}`}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.02 }}
          transition={motionTransitions.easeOutExpo}
          role="dialog"
          aria-modal={fullScreen}
          aria-label="Welcome"
          className={cn(
            'flex flex-col items-center justify-center select-none overflow-hidden bg-paper',
            fullScreen ? 'fixed inset-0 z-[100]' : 'relative w-full h-80 sm:h-96',
            className
          )}
          {...(props as any)}
        >
          {/* Soft orange wash behind the word */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgb(224_92_26_/_0.10),transparent_60%)]"
          />

          {/* One calm announcement; the cycling words are decorative for screen readers */}
          <p className="sr-only">Welcome to Detour. Press Escape to skip the intro.</p>

          {/* Skip control (top right) */}
          {allowSkip && (
            <motion.button
              ref={skipRef}
              type="button"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              onClick={handleFinish}
              className="absolute right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink-2 shadow-card transition-colors hover:border-line-strong hover:text-ink sm:right-6"
              aria-label="Skip welcome sequence"
            >
              <span>Skip</span>
              <kbd className="hidden rounded border border-line bg-sunken px-1 py-px font-mono text-xs text-ink-2 sm:inline-block">
                ESC
              </kbd>
              <X className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
            </motion.button>
          )}

          {/* Centre stage: the word */}
          <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center justify-center px-4 text-center">
            <motion.div
              aria-hidden="true"
              key={`greeting-${greetingIndex}`}
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10, filter: 'blur(8px)' }
              }
              animate={
                reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }
              }
              exit={
                reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.03, y: -10, filter: 'blur(8px)' }
              }
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center gap-3 text-center"
            >
              <span
                lang={currentGreeting.lang?.toLowerCase()}
                className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl"
              >
                {currentGreeting.text}
              </span>
              {showLangBadge && currentGreeting.lang && (
                <span aria-hidden="true" className="text-xs font-medium uppercase tracking-[0.2em] text-ink-2">
                  {currentGreeting.lang}
                </span>
              )}
            </motion.div>
          </div>

          {/* Hairline progress tracker */}
          {showProgress && (
            <div className="pointer-events-none absolute inset-x-8 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] h-[2px] overflow-hidden rounded-full bg-line sm:inset-x-1/3 sm:bottom-8">
              <motion.div
                className="h-full rounded-full bg-ink"
                animate={{ width: `${progressPercent}%` }}
                transition={{ ease: 'easeOut', duration: 0.22 }}
              />
            </div>
          )}
        </motion.div>
      ) : (
        !fullScreen && (
          /* Inline replay button (demo / non-fullscreen mode) */
          <motion.div
            key="replay-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={motionTransitions.springGentle}
            className="flex h-80 w-full items-center justify-center sm:h-96"
          >
            <button
              type="button"
              onClick={replay}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-ink shadow-card transition-colors hover:bg-paper active:scale-95"
              aria-label="Replay intro animation"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              <span>Replay intro</span>
            </button>
          </motion.div>
        )
      )}
    </AnimatePresence>
  )
}

export default IntroLoader
