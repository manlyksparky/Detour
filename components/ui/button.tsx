'use client'

import React, { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'

/**
 * EasyUI Button, skinned for Detour's Field Notebook.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/button`
 * Kept: spring tap feedback, loading state, icon slots, full-width option.
 * Changed: variants and sizes follow DESIGN.md (pill shapes, 44px standard
 * height, Marker Orange with Ink text, Deep Marker on hover).
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'nested' | 'icon' | 'icon-sm'
export type ButtonShape = 'pill' | 'rounded'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent font-semibold text-ink shadow-raised hover:bg-accent-strong hover:text-white disabled:hover:bg-accent disabled:hover:text-ink',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-paper disabled:hover:bg-surface',
  outline:
    'border border-line-field bg-surface text-ink-2 hover:border-accent-strong hover:text-accent-strong disabled:hover:border-line-field disabled:hover:text-ink-2',
  ghost: 'bg-transparent text-ink hover:bg-paper disabled:hover:bg-transparent',
  soft: 'border border-accent-strong bg-accent-soft font-semibold text-accent-strong hover:bg-surface',
  link: 'h-auto p-0 text-accent-strong underline-offset-4 hover:underline',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-1.5 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
  /** Primary action nested inside a 44px floating pill */
  nested: 'h-9 gap-2 px-4 text-sm',
  icon: 'h-11 w-11 shrink-0 p-0',
  'icon-sm': 'h-9 w-9 shrink-0 p-0',
}

const shapeStyles: Record<ButtonShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded-xl',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  fullWidth?: boolean
  className?: string
}

/** The button look as a class string, for links that should read as buttons. */
export function buttonClasses({
  variant = 'primary',
  size = 'lg',
  shape = 'pill',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    'relative inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
    variantStyles[variant],
    variant !== 'link' && sizeStyles[size],
    variant !== 'link' && shapeStyles[shape],
    fullWidth && 'w-full',
    className
  )
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'>, ButtonStyleOptions {
  /** Loading state: spinner replaces the left icon and the control goes busy */
  isLoading?: boolean
  /** Text shown while loading; the children stay when omitted */
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'lg',
    shape = 'pill',
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading
  const iconOnly = size === 'icon' || size === 'icon-sm'

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={motionTransitions.springSnappy}
      className={buttonClasses({ variant, size, shape, fullWidth, className })}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="size-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}

      {isLoading && loadingText ? (
        <span>{loadingText}</span>
      ) : iconOnly && isLoading ? null : (
        children
      )}

      {!isLoading && rightIcon && (
        <span className="shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </motion.button>
  )
})
