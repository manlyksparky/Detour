'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * EasyUI Skeleton, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/skeleton`
 * Kept: quiet blocks with a slow light sweep, text and avatar presets, and
 * a reveal wrapper that swaps placeholder for content. Changed: Sunken
 * blocks on Surface, and the reveal fades and rises without a blur.
 */

export interface SkeletonProps extends React.ComponentProps<'div'> {}

/** A quiet block with a slow light sweep. Size it with className. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn('relative overflow-hidden rounded-md bg-sunken', className)} {...props}>
      <motion.span
        className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.7),transparent)]"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.2 }}
      />
    </div>
  )
}

const WIDTHS = ['100%', '94%', '98%', '88%']

export interface SkeletonTextProps {
  lines?: number
  className?: string
  /** Height class for each line */
  lineClassName?: string
}

export function SkeletonText({ lines = 3, className, lineClassName = 'h-3' }: SkeletonTextProps) {
  return (
    <div aria-hidden="true" className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={lineClassName}
          style={{ width: i === lines - 1 && lines > 1 ? '62%' : WIDTHS[i % WIDTHS.length] }}
        />
      ))}
    </div>
  )
}

export interface SkeletonAvatarProps {
  size?: number
  className?: string
}

export function SkeletonAvatar({ size = 40, className }: SkeletonAvatarProps) {
  return <Skeleton className={cn('shrink-0 rounded-full', className)} style={{ width: size, height: size }} />
}

export interface SkeletonRevealProps {
  loading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Spoken while loading */
  label?: string
}

/**
 * Swap a skeleton for real content. Content eases in (fade and rise).
 * Make the skeleton roughly the same size as the content so nothing jumps.
 */
export function SkeletonReveal({ loading, skeleton, children, className, label = 'Loading' }: SkeletonRevealProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            role="status"
            aria-busy="true"
            aria-label={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
