'use client'

import { type ElementType, type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonClasses } from './button'

/**
 * EasyUI NotFound, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/not-found`
 * Kept: the layered illustration (an orange card, a big 404, a folder that
 * lifts on hover, a mark that spins in) with pointer parallax, the path
 * chip, the focus-on-heading announcement. Changed: paper and ink instead
 * of a dark room, the folder is paper rather than frosted glass (the
 * No-Blur rule), the eyebrow label is gone, and the actions are Detour's
 * buttons.
 */

export interface NotFoundSuggestion {
  label: string
  href: string
  description?: string
}

export interface NotFoundProps {
  errorCode?: string
  title?: string
  description?: ReactNode
  homeHref?: string
  homeLabel?: string
  showBack?: boolean
  backLabel?: string
  onBack?: () => void
  /** The missing path, shown in a chip. Read from the URL when undefined; `null` hides it. */
  path?: string | null
  /** Up to 3 helpful destinations */
  suggestions?: NotFoundSuggestion[]
  /** Pass next/link so navigation stays client-side */
  LinkComponent?: ElementType
  /** Browser tab title */
  documentTitle?: string
  /** Pointer parallax on the illustration (desktop) */
  parallax?: boolean
  footer?: ReactNode
  className?: string
}

/* ------------------------------ Design space ------------------------------- */
// The illustration is authored on a 460 × 360 stage and scaled to its container.

const W = 460
const H = 360
const CX = 230
const CY = 185
const TILT = 8

const ORANGE = '#e05c1a'
const ORANGE_DEEP = '#c2410c'

const FOLDER_BOX = { x: -151, y: -31, w: 288, h: 142 }
const FOLDER =
  'M12 0H64Q72 0 78 6L90 20Q94 26 102 26H276Q288 26 288 38V130Q288 142 276 142H12Q0 142 0 130V12Q0 0 12 0Z'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// "4": outer outline + the small triangular counter (even-odd)
const FOUR = 'M76 0H110V102H124V134H110V154H76V134H0V102ZM76 46V102H36Z'
// "0": outer ellipse + counter (even-odd), centred on (-6,-40)
const ZERO = 'M-69 -40a63 77 0 1 0 126 0a63 77 0 1 0 -126 0ZM-43 -40a37 49 0 1 1 74 0a37 49 0 1 1 -74 0Z'

/* -------------------------------- Illustration ------------------------------ */

export function Illustration({ parallax = true }: { parallax?: boolean }) {
  const reduce = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Pointer parallax: each layer moves a different amount for depth
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 90, damping: 18, mass: 0.6 })
  useEffect(() => {
    if (!parallax || reduce) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const move = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2)
      my.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    const reset = () => {
      mx.set(0)
      my.set(0)
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', reset)
    }
  }, [parallax, reduce, mx, my])

  const panelX = useTransform(sx, (v) => v * -5)
  const panelY = useTransform(sy, (v) => v * -3)
  const textX = useTransform(sx, (v) => v * 4)
  const textY = useTransform(sy, (v) => v * 2.5)
  const folderX = useTransform(sx, (v) => v * 11)
  const folderY = useTransform(sy, (v) => v * 7)
  const markX = useTransform(sx, (v) => v * 16)
  const markY = useTransform(sy, (v) => v * 10)

  const spring = (delay: number) =>
    reduce ? { duration: 0 } : ({ type: 'spring', duration: 0.9, bounce: 0.18, delay } as const)

  const layer = 'absolute inset-0'
  const svgProps = {
    viewBox: `0 0 ${W} ${H}`,
    className: 'absolute inset-0 h-full w-full overflow-visible',
    'aria-hidden': true,
  } as const
  const group = `translate(${CX} ${CY}) rotate(${TILT})`
  const anchor: React.CSSProperties = {
    position: 'absolute',
    left: CX,
    top: CY,
    width: 0,
    height: 0,
    transform: `rotate(${TILT}deg)`,
  }

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="A paper folder covering the number 404"
      className="relative mx-auto w-full max-w-[420px]"
      style={{ aspectRatio: `${W} / ${H}`, opacity: scale === null ? 0 : 1 }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <clipPath id={`${uid}-folder`} clipPathUnits="objectBoundingBox">
            <path d={FOLDER} transform={`scale(${1 / FOLDER_BOX.w} ${1 / FOLDER_BOX.h})`} />
          </clipPath>
        </defs>
      </svg>

      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: W, height: H, transform: `scale(${scale ?? 1})` }}
      >
        <motion.div
          className="absolute inset-0"
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={reduce ? undefined : { repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        >
          {/* 1 · orange card */}
          <motion.div className={layer} style={{ x: panelX, y: panelY }}>
            <motion.div
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring(0)}
            >
              <svg {...svgProps}>
                <defs>
                  <linearGradient id={`${uid}-panel`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor={ORANGE} />
                    <stop offset="0.72" stopColor={ORANGE} />
                    <stop offset="1" stopColor={ORANGE_DEEP} />
                  </linearGradient>
                </defs>
                <g transform={group}>
                  <rect x={-140} y={-63} width={285} height={168} rx={9} fill={`url(#${uid}-panel)`} />
                </g>
              </svg>
            </motion.div>
          </motion.div>

          {/* 2 · the big 404 in paper */}
          <motion.div className={layer} style={{ x: textX, y: textY }}>
            <motion.div
              className="absolute inset-0"
              initial={reduce ? false : { opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={spring(0.08)}
              style={{ transformOrigin: '50% 50%' }}
            >
              <svg {...svgProps} style={{ filter: 'drop-shadow(0 6px 10px rgba(110,30,0,0.3))' }}>
                <g transform={group} fill="#faf9f6" stroke="#faf9f6" strokeWidth={6} strokeLinejoin="round">
                  <path d={FOUR} fillRule="evenodd" transform="translate(-177 -117)" />
                  <path d={ZERO} fillRule="evenodd" />
                  <path d={FOUR} fillRule="evenodd" transform="translate(45 -117)" />
                </g>
              </svg>
            </motion.div>
          </motion.div>

          {/* 3 · paper folder */}
          <motion.div className={layer} style={{ x: folderX, y: folderY }}>
            <div style={anchor}>
              <motion.div
                style={{
                  position: 'absolute',
                  left: FOLDER_BOX.x,
                  top: FOLDER_BOX.y,
                  width: FOLDER_BOX.w,
                  height: FOLDER_BOX.h,
                }}
                initial={reduce ? false : { y: 30 }}
                animate={{ y: 0 }}
                whileHover={reduce ? undefined : { y: -6 }}
                transition={spring(0.2)}
              >
                {/* soft shadow under the folder */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 14,
                    right: 14,
                    bottom: -10,
                    height: 40,
                    borderRadius: 24,
                    background: 'rgba(28,25,23,0.28)',
                    filter: 'blur(22px)',
                  }}
                />
                <motion.div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: `url(#${uid}-folder)`,
                    WebkitClipPath: `url(#${uid}-folder)`,
                    background: 'linear-gradient(180deg, #ffffff 0%, #faf9f6 55%, #f3f1ec 100%)',
                  }}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25, ease: EASE_OUT }}
                />
                {/* folder rim */}
                <svg
                  width={FOLDER_BOX.w}
                  height={FOLDER_BOX.h}
                  viewBox={`0 0 ${FOLDER_BOX.w} ${FOLDER_BOX.h}`}
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                >
                  <path d={FOLDER} fill="none" stroke="rgba(28,25,23,0.16)" strokeWidth={1.2} />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          {/* 4 · the mark */}
          <motion.div className={layer} style={{ x: markX, y: markY }}>
            <div style={anchor}>
              <motion.div
                style={{ position: 'absolute', left: -5 - 28, top: 107 - 28, width: 56, height: 56 }}
                initial={reduce ? false : { scale: 0, rotate: -70 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={reduce ? undefined : { rotate: 90 }}
                transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.7, bounce: 0.35, delay: 0.5 }}
              >
                <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
                  <g transform="translate(28 28)" fill={ORANGE_DEEP}>
                    <rect x={-23} y={-5.5} width={46} height={11} rx={5.5} transform="rotate(45)" />
                    <rect x={-23} y={-5.5} width={46} height={11} rx={5.5} transform="rotate(-45)" />
                  </g>
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

/* ---------------------------------- Page ----------------------------------- */

export function NotFound({
  errorCode = '404',
  title = 'This page took a wrong turn.',
  description = 'The page you asked for does not exist or has moved.',
  homeHref = '/',
  homeLabel = 'Go back home',
  showBack = true,
  backLabel = 'Go back',
  onBack,
  path,
  suggestions,
  LinkComponent,
  documentTitle,
  parallax = true,
  footer,
  className,
}: NotFoundProps) {
  const reduce = useReducedMotion()
  const Anchor: ElementType = LinkComponent ?? 'a'
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [detected, setDetected] = useState<string | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  useEffect(() => {
    setDetected(window.location.pathname)
    setCanGoBack(window.history.length > 1)
    headingRef.current?.focus({ preventScroll: true }) // announce the page on navigation
  }, [])

  useEffect(() => {
    const previous = document.title
    document.title = documentTitle ?? `${errorCode} · ${title}`
    return () => {
      document.title = previous
    }
  }, [documentTitle, errorCode, title])

  const shownPath = path === undefined ? detected : path
  const goBack = () => (onBack ? onBack() : window.history.back())
  const backVisible = showBack && (canGoBack || Boolean(onBack))
  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: EASE_OUT },
        }

  return (
    <main
      className={cn(
        'relative isolate flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-paper px-5 py-14 text-center text-ink sm:px-8',
        className
      )}
    >
      {/* one warm wash behind the illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] -z-10 h-[420px] w-[560px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(224_92_26/0.12),transparent)]"
      />

      <div className="flex w-full max-w-xl flex-col items-center">
        <Illustration parallax={parallax} />

        <p className="sr-only">{`Error ${errorCode}: ${title}`}</p>

        <motion.h1
          ref={headingRef}
          tabIndex={-1}
          {...rise(0.22)}
          className="focus-quiet mt-4 text-3xl font-bold leading-tight tracking-tight text-ink sm:text-[2.5rem]"
        >
          {title}
        </motion.h1>

        <motion.p {...rise(0.3)} className="mt-3 max-w-md text-base leading-relaxed text-ink-2">
          {description}
        </motion.p>

        {shownPath && (
          <motion.div
            {...rise(0.36)}
            className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-sunken px-3.5 py-1.5"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <code title={shownPath} className="truncate font-mono text-xs text-ink-2">
              {shownPath.length > 80 ? `${shownPath.slice(0, 79)}…` : shownPath}
            </code>
          </motion.div>
        )}

        <motion.div
          {...rise(0.42)}
          className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
          <Anchor href={homeHref} className={buttonClasses({ variant: 'primary', size: 'lg' })}>
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />
            </svg>
            {homeLabel}
          </Anchor>
          {backVisible && (
            <button type="button" onClick={goBack} className={buttonClasses({ variant: 'secondary', size: 'lg' })}>
              {backLabel}
            </button>
          )}
        </motion.div>

        {suggestions && suggestions.length > 0 && (
          <motion.nav {...rise(0.5)} aria-label="Helpful links" className="mt-12 w-full">
            <ul className="grid grid-cols-1 gap-2.5 text-left sm:grid-cols-3">
              {suggestions.slice(0, 3).map((s) => (
                <li key={s.href}>
                  <Anchor
                    href={s.href}
                    className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-raised"
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-ink">
                      {s.label}
                      <svg
                        viewBox="0 0 24 24"
                        className="size-3.5 shrink-0 text-ink-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </span>
                    {s.description && <span className="mt-1 text-xs leading-snug text-ink-2">{s.description}</span>}
                  </Anchor>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}

        {footer && (
          <motion.div {...rise(0.58)} className="mt-12 text-xs text-ink-2">
            {footer}
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default NotFound
