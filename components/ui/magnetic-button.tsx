'use client'

import React, { forwardRef, useRef } from 'react'
import { motion, useReducedMotion, useSpring, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button'

/**
 * EasyUI MagneticButton, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/magnetic-button`
 * Kept: the proximity pull on spring coordinates and the tap compression.
 * Changed: shares the Button variants, drops the blurred hover glow (the
 * No-Blur rule) and stays still for visitors who prefer reduced motion.
 */

export interface MagneticButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode
  /** How far the button follows the pointer, as a fraction of the offset */
  strength?: number
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(function MagneticButton(
  { children, strength = 0.3, variant = 'primary', size = 'lg', className, disabled, ...props },
  forwardedRef
) {
  const localRef = useRef<HTMLButtonElement | null>(null)
  const reducedMotion = useReducedMotion()

  const springX = useSpring(0, { stiffness: 280, damping: 20 })
  const springY = useSpring(0, { stiffness: 280, damping: 20 })

  const setRefs = (node: HTMLButtonElement | null) => {
    localRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!localRef.current || disabled || reducedMotion) return
    const { left, top, width, height } = localRef.current.getBoundingClientRect()
    springX.set((e.clientX - (left + width / 2)) * strength)
    springY.set((e.clientY - (top + height / 2)) * strength)
  }

  const handleMouseLeave = () => {
    springX.set(0)
    springY.set(0)
  }

  return (
    <motion.button
      ref={setRefs}
      type="button"
      disabled={disabled}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={motionTransitions.springSnappy}
      className={buttonClasses({ variant, size, className: cn('select-none', className) })}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  )
})
