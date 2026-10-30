'use client'

import * as React from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * EasyUI Stepper, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/stepper`
 * Kept: numbered indicators joined by lines that fill as you progress, an
 * active ring that glides between steps, panels that slide in the direction
 * of travel. Changed: Ink and Marker Orange on Surface, and the indicator
 * and connector are exported on their own so the walking-tour trail can use
 * them around richer stop cards.
 */

const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 } as const
const fill = { duration: 0.35, ease: [0.32, 0.72, 0, 1] } as const

export type StepState = 'complete' | 'current' | 'upcoming'

export interface StepIndicatorProps {
  /** Zero-based position; the number shown is index + 1 */
  index: number
  state: StepState
  /** Shared layoutId base so the current ring glides between indicators */
  layoutId?: string
  /** Show a drawn check instead of the number when complete */
  checkWhenComplete?: boolean
  className?: string
}

export function StepIndicator({ index, state, layoutId, checkWhenComplete = true, className }: StepIndicatorProps) {
  // don't replay the check-draw for steps that are already done on first paint
  const ready = React.useRef(false)
  React.useEffect(() => {
    ready.current = true
  }, [])

  return (
    <span
      className={cn(
        'relative grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold tabular-nums transition-colors duration-300',
        state === 'complete' && 'border-ink bg-ink text-surface',
        state === 'current' && 'border-accent bg-accent text-ink shadow-raised',
        state === 'upcoming' && 'border-line-strong bg-surface text-ink',
        className
      )}
    >
      {state === 'current' && layoutId && (
        <motion.span
          layoutId={`${layoutId}-ring`}
          transition={spring}
          className="absolute -inset-[5px] rounded-full border border-accent-strong"
          aria-hidden="true"
        />
      )}
      {state === 'complete' && checkWhenComplete ? (
        <svg
          viewBox="0 0 24 24"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={ready.current ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
          />
        </svg>
      ) : (
        index + 1
      )}
    </span>
  )
}

export interface StepConnectorProps {
  /** Fill the line in Ink (the step before it is complete) */
  filled: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

/** The line between two indicators. Position it from the parent. */
export function StepConnector({ filled, orientation = 'vertical', className }: StepConnectorProps) {
  const vertical = orientation === 'vertical'
  return (
    <span aria-hidden="true" className={cn('overflow-hidden bg-line', vertical ? 'w-px' : 'h-px', className)}>
      <motion.span
        initial={false}
        animate={vertical ? { scaleY: filled ? 1 : 0 } : { scaleX: filled ? 1 : 0 }}
        transition={fill}
        className={cn('absolute inset-0 bg-ink', vertical ? 'origin-top' : 'origin-left')}
      />
    </span>
  )
}

export interface Step {
  title: string
  description?: string
}

export interface StepperProps {
  steps: Step[]
  /** Zero-based index of the active step */
  current: number
  /** Makes completed steps clickable (jump back) */
  onStepChange?: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Stepper({ steps, current, onStepChange, orientation = 'horizontal', className }: StepperProps) {
  const uid = React.useId()
  const vertical = orientation === 'vertical'
  const last = steps.length - 1

  return (
    <ol aria-label="Progress" className={cn(vertical ? 'flex flex-col' : 'flex w-full items-center', className)}>
      {steps.map((step, i) => {
        const state: StepState = i < current ? 'complete' : i === current ? 'current' : 'upcoming'
        const clickable = !!onStepChange && state === 'complete'

        const label = (
          <span className={cn('flex min-w-0 flex-col text-left', !vertical && state !== 'current' && 'hidden sm:flex')}>
            <span
              className={cn(
                'truncate text-sm transition-colors duration-300',
                state === 'upcoming' ? 'text-ink-2' : 'font-medium text-ink'
              )}
            >
              {step.title}
              {state === 'complete' && <span className="sr-only"> (completed)</span>}
            </span>
            {step.description && <span className="truncate text-xs text-ink-2">{step.description}</span>}
          </span>
        )

        const row = clickable ? (
          <button
            type="button"
            onClick={() => onStepChange!(i)}
            className={cn('flex cursor-pointer gap-3 rounded-lg text-left', vertical ? 'items-start' : 'items-center')}
          >
            <StepIndicator index={i} state={state} layoutId={uid} />
            {label}
          </button>
        ) : (
          <div className={cn('flex gap-3', vertical ? 'items-start' : 'items-center')}>
            <StepIndicator index={i} state={state} layoutId={uid} />
            {label}
          </div>
        )

        return (
          <li
            key={i}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn(vertical ? 'relative pb-7 last:pb-0' : 'flex items-center', !vertical && i < last && 'flex-1')}
          >
            {row}
            {i < last && (
              <StepConnector
                filled={i < current}
                orientation={orientation}
                className={vertical ? 'absolute bottom-1 left-[13.5px] top-[34px]' : 'relative mx-3 flex-1'}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ───────────── panels: slide in the direction you're travelling ───────────── */

const slide: Variants = {
  enter: (d: number) => ({ x: d * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * -24, opacity: 0 }),
}

export interface StepPanelsProps {
  current: number
  /** One child per step, in order */
  children: React.ReactNode
  className?: string
}

export function StepPanels({ current, children, className }: StepPanelsProps) {
  const panels = React.Children.toArray(children)
  const prev = React.useRef(current)
  const dir = current >= prev.current ? 1 : -1
  React.useEffect(() => {
    prev.current = current
  }, [current])

  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={current}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
        >
          {panels[current]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
