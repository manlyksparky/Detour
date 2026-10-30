'use client'

import React, { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'

/**
 * EasyUI DirectionalTooltip, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/directional-tooltip`
 * Kept: the tip springs in from the side it belongs to, on hover and on
 * keyboard focus. Changed: Ink on Surface styling at the 12px floor.
 */

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left'
export type TooltipAlign = 'start' | 'center' | 'end'

export interface DirectionalTooltipProps {
  /** The trigger. It must accept a ref and mouse/focus handlers. */
  children: React.ReactElement
  content: React.ReactNode
  side?: TooltipSide
  align?: TooltipAlign
  /** Delay before showing, in ms */
  delayDuration?: number
  showArrow?: boolean
  className?: string
  /** Wrapper class, e.g. to let the trigger stretch */
  wrapperClassName?: string
}

const sideTransform: Record<TooltipSide, { x: number; y: number }> = {
  top: { x: 0, y: 6 },
  right: { x: -6, y: 0 },
  bottom: { x: 0, y: -6 },
  left: { x: 6, y: 0 },
}

const sideStyles: Record<TooltipSide, string> = {
  top: 'bottom-full mb-2',
  right: 'left-full ml-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
}

const alignStyles: Record<TooltipAlign, Record<TooltipSide, string>> = {
  start: { top: 'left-0', bottom: 'left-0', right: 'top-0', left: 'top-0' },
  center: {
    top: 'left-1/2 -translate-x-1/2',
    bottom: 'left-1/2 -translate-x-1/2',
    right: 'top-1/2 -translate-y-1/2',
    left: 'top-1/2 -translate-y-1/2',
  },
  end: { top: 'right-0', bottom: 'right-0', right: 'bottom-0', left: 'bottom-0' },
}

const arrowStyles: Record<TooltipSide, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-ink border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-ink border-x-transparent border-t-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-ink border-y-transparent border-l-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-ink border-y-transparent border-r-transparent',
}

export const DirectionalTooltip: React.FC<DirectionalTooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 150,
  showArrow = true,
  className,
  wrapperClassName,
}) => {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const id = useId()

  const show = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setOpen(true), delayDuration)
  }
  const hide = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    setOpen(false)
  }

  const childProps = children.props as Record<string, ((e: unknown) => void) | undefined>
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      show()
      childProps.onMouseEnter?.(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide()
      childProps.onMouseLeave?.(e)
    },
    onFocus: (e: React.FocusEvent) => {
      show()
      childProps.onFocus?.(e)
    },
    onBlur: (e: React.FocusEvent) => {
      hide()
      childProps.onBlur?.(e)
    },
  } as Record<string, unknown>)

  const offset = sideTransform[side]

  return (
    <span className={cn('relative inline-flex', wrapperClassName)}>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.94, x: offset.x, y: offset.y }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: offset.x * 0.5, y: offset.y * 0.5 }}
            transition={motionTransitions.springSnappy}
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-surface shadow-raised',
              sideStyles[side],
              alignStyles[align][side],
              className
            )}
          >
            {content}
            {showArrow && <span aria-hidden="true" className={cn('absolute size-0 border-4', arrowStyles[side])} />}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
