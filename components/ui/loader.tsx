'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * EasyUI Loader, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/loader`
 * Kept: four calm variants (arc, dots, line, rings) with a spoken label.
 * Changed: Ink 2 on a Line track instead of white on black.
 */

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size in pixels. Default 32. */
  size?: number
  variant?: 'arc' | 'dots' | 'line' | 'rings'
  /** Spoken label; always present */
  label?: string
  /** Stroke or fill colour. Inherits the text colour by default. */
  color?: string
}

export const Loader: React.FC<LoaderProps> = ({
  size = 32,
  variant = 'arc',
  label = 'Loading…',
  color = 'currentColor',
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn('inline-flex flex-col items-center justify-center gap-2 text-ink-2', className)}
      {...props}
    >
      {variant === 'arc' && (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
          <svg
            className="h-full w-full animate-spin motion-reduce:animate-none"
            style={{ animationDuration: '1.4s' }}
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="16" stroke="var(--color-line)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset="65"
            />
          </svg>
        </div>
      )}

      {variant === 'dots' && (
        <div style={{ width: size * 1.5, height: size * 0.4 }} className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="rounded-full bg-current"
              style={{
                width: Math.max(4, size * 0.18),
                height: Math.max(4, size * 0.18),
                backgroundColor: color !== 'currentColor' ? color : undefined,
              }}
              animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {variant === 'line' && (
        <div
          style={{ width: size * 2, height: Math.max(3, size * 0.08) }}
          className="relative overflow-hidden rounded-full bg-sunken"
        >
          <motion.div
            className="absolute bottom-0 top-0 rounded-full"
            style={{ width: '35%', backgroundColor: color !== 'currentColor' ? color : 'var(--color-ink)' }}
            animate={{ left: ['-35%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {variant === 'rings' && (
        <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border border-current"
              style={{ borderColor: color !== 'currentColor' ? color : undefined }}
              animate={{ scale: [0.6, 1.15], opacity: [0.8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.9, ease: 'easeOut' }}
            />
          ))}
          <span
            className="rounded-full bg-current"
            style={{
              width: Math.max(4, size * 0.2),
              height: Math.max(4, size * 0.2),
              backgroundColor: color !== 'currentColor' ? color : undefined,
            }}
          />
        </div>
      )}
    </div>
  )
}
