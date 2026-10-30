'use client'

import React from 'react'
import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button'

/**
 * EasyUI MorphingButton, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/morphing-button`
 * Kept: a layout-stable control whose label morphs between idle, loading,
 * success and error without the button changing size. Changed: shares the
 * Button variants, success and error read in the current text colour so they
 * stay legible on every surface, and the live region announces the change.
 */

export type ButtonStatusState = 'idle' | 'loading' | 'success' | 'error'

export interface MorphingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  status?: ButtonStatusState
  idleText: string
  loadingText?: string
  successText?: string
  errorText?: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  idleIcon?: React.ReactNode
  successIcon?: React.ReactNode
  /** Colour the success icon in Success green; inherits the text colour otherwise */
  successTone?: 'inherit' | 'success'
  errorIcon?: React.ReactNode
  className?: string
}

export const MorphingButton: React.FC<MorphingButtonProps> = ({
  status = 'idle',
  idleText,
  loadingText = 'Working…',
  successText = 'Done',
  errorText = 'Something went wrong',
  variant = 'secondary',
  size = 'lg',
  fullWidth = false,
  idleIcon,
  successIcon = <Check size={16} aria-hidden="true" />,
  successTone = 'inherit',
  errorIcon = <AlertCircle size={16} aria-hidden="true" />,
  disabled = false,
  className,
  type = 'button',
  ...props
}) => {
  const isLoading = status === 'loading'

  const states: Record<ButtonStatusState, { icon: React.ReactNode; text: string; className?: string }> = {
    idle: { icon: idleIcon, text: idleText },
    loading: { icon: <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />, text: loadingText },
    success: { icon: successIcon, text: successText, className: 'font-semibold' },
    error: { icon: errorIcon, text: errorText, className: 'font-semibold' },
  }
  const state = states[status]

  return (
    <motion.button
      type={type}
      whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
      transition={motionTransitions.springSnappy}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-live="polite"
      className={buttonClasses({ variant, size, fullWidth, className: cn('overflow-hidden', className) })}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={status === 'idle' ? { opacity: 0, y: -6 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={status === 'idle' ? { opacity: 0, y: 6 } : { opacity: 0, scale: 0.85 }}
          transition={motionTransitions.springSnappy}
          className={cn('flex items-center gap-2', state.className)}
        >
          {state.icon && <span className={cn('shrink-0', status === 'success' && successTone === 'success' && 'text-success')}>{state.icon}</span>}
          <span>{state.text}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
