'use client'

import * as React from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * EasyUI Badge, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/badge`
 * Kept: numbers and short strings roll when they change, optional status dot
 * and remove button. Changed: tones come from the notebook palette and the
 * type is the body family at the 12px floor.
 */

const spring = { type: 'spring', stiffness: 520, damping: 36, mass: 0.6 } as const

export type BadgeVariant = 'soft' | 'solid' | 'outline'
export type BadgeTone = 'neutral' | 'ink' | 'accent' | 'success'
export type BadgeSize = 'sm' | 'md'

const styles: Record<BadgeVariant, Record<BadgeTone, string>> = {
  soft: {
    neutral: 'bg-sunken text-ink-2',
    ink: 'bg-ink/10 text-ink',
    accent: 'bg-accent-soft text-accent-strong',
    success: 'bg-success/10 text-success',
  },
  solid: {
    neutral: 'bg-ink-2 text-surface',
    ink: 'bg-ink text-surface',
    accent: 'bg-accent text-ink',
    success: 'bg-success text-white',
  },
  outline: {
    neutral: 'border-line-strong text-ink-2',
    ink: 'border-ink text-ink',
    accent: 'border-accent-strong text-accent-strong',
    success: 'border-success text-success',
  },
}

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-ink-3',
  ink: 'bg-ink',
  accent: 'bg-accent',
  success: 'bg-success',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5',
  md: 'h-6 px-2.5',
}

export type BadgeProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
  variant?: BadgeVariant
  tone?: BadgeTone
  size?: BadgeSize
  /** Leading status dot */
  dot?: boolean
  /** Soft ping on the dot, for live status only */
  pulse?: boolean
  /** Shows a remove button (chip behaviour) */
  onRemove?: () => void
  children?: React.ReactNode
}

export function Badge({
  variant = 'soft',
  tone = 'neutral',
  size = 'md',
  dot,
  pulse,
  onRemove,
  className,
  children,
  ...props
}: BadgeProps) {
  // strings and numbers roll when they change (counts, status labels)
  const roll = typeof children === 'string' || typeof children === 'number'

  return (
    <motion.span
      className={cn(
        'relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent text-xs font-medium tabular-nums',
        styles[variant][tone],
        sizes[size],
        onRemove && 'pr-1',
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex size-1.5 shrink-0" aria-hidden="true">
          {pulse && (
            <span
              className={cn(
                'absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:animate-none',
                variant === 'solid' ? 'bg-current' : dots[tone]
              )}
            />
          )}
          <span className={cn('relative size-1.5 rounded-full', variant === 'solid' ? 'bg-current' : dots[tone])} />
        </span>
      )}

      {roll ? (
        <span className="relative inline-flex overflow-hidden py-px">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(children)}
              initial={{ y: '70%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-70%', opacity: 0 }}
              transition={spring}
              className="inline-block"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        children
      )}

      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="grid size-4 place-items-center rounded-full opacity-70 transition hover:bg-ink/10 hover:opacity-100"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </motion.span>
  )
}
