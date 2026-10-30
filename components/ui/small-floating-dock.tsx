'use client'

import React, { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'
import { DirectionalTooltip } from './directional-tooltip'

/**
 * EasyUI SmallFloatingDock, taken apart into composable pieces for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/small-floating-dock`
 * Kept: the spring entrance, the lift-on-hover items, tooltips for icon-only
 * actions. Changed: the dock is the Field Notebook's 44px Surface pill with
 * hairline dividers; items are 36px pills inside it with a 44px hit area so
 * the primary action can sit nested at the end.
 */

export interface FloatingDockProps extends HTMLMotionProps<'div'> {
  /** Accessible name for the group of actions */
  label: string
}

export const FloatingDock = forwardRef<HTMLDivElement, FloatingDockProps>(function FloatingDock(
  { label, className, children, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      role="group"
      aria-label={label}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={motionTransitions.springSmooth}
      className={cn('flex h-11 items-center gap-0.5 rounded-full border border-line bg-surface p-1 shadow-float', className)}
      {...props}
    >
      {children}
    </motion.div>
  )
})

export function DockDivider({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('mx-0.5 h-5 w-px shrink-0 bg-line', className)} />
}

export interface DockItemProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode
  label: string
  /** Hide the text at some widths; the label stays as the accessible name */
  labelClassName?: string
  /** Icon-only item; pair with `tooltip` on pointer devices */
  hideLabel?: boolean
  /** Show the label as a tooltip on hover and focus */
  tooltip?: boolean
  /** Visually mark the item as active (a filter is applied, for instance) */
  active?: boolean
  children?: React.ReactNode
}

export const DockItem = forwardRef<HTMLButtonElement, DockItemProps>(function DockItem(
  { icon, label, labelClassName, hideLabel = false, tooltip = false, active = false, className, disabled, children, ...props },
  ref
) {
  const button = (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={hideLabel || labelClassName ? label : undefined}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={motionTransitions.springSnappy}
      className={cn(
        // the pseudo-element stretches the hit area to the full 44px pill height
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-medium text-ink transition-colors before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
        hideLabel && 'w-9 justify-center px-0',
        active && 'text-accent-strong',
        className
      )}
      {...props}
    >
      <span className="flex shrink-0 items-center justify-center [&>svg]:size-[18px]" aria-hidden="true">
        {icon}
      </span>
      {!hideLabel && <span className={labelClassName}>{label}</span>}
      {children}
    </motion.button>
  )

  return tooltip ? (
    <DirectionalTooltip content={label} side="top">
      {button}
    </DirectionalTooltip>
  ) : (
    button
  )
})

/** Link styled as a dock item, for navigation that belongs in the dock. */
export const dockLinkClasses =
  "relative inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-medium text-ink transition-[color,background-color,transform] before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] hover:-translate-y-px hover:bg-paper motion-reduce:hover:translate-y-0"
