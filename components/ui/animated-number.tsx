'use client'

import React, { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * EasyUI AnimatedNumber, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/animated-number`
 * Kept: each digit column rolls on its own spring to the new value.
 * Changed: body family with tabular figures, inherits colour, and the
 * rolling columns are hidden from screen readers behind one spoken value.
 */

export interface AnimatedNumberProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  stiffness?: number
  damping?: number
  mass?: number
  /** Thousands separators */
  useGrouping?: boolean
  /** Roll up from zero on first render */
  animateOnMount?: boolean
  className?: string
}

const DigitColumn: React.FC<{
  digit: string
  stiffness: number
  damping: number
  mass: number
  fromZero: boolean
}> = ({ digit, stiffness, damping, mass, fromZero }) => {
  const isNumber = /^\d$/.test(digit)
  const numValue = isNumber ? parseInt(digit, 10) : 0

  const spring = useSpring(fromZero ? 0 : numValue, { stiffness, damping, mass })
  const y = useTransform(spring, (current) => `-${current * 10}%`)

  useEffect(() => {
    spring.set(numValue)
  }, [spring, numValue])

  if (!isNumber) return <span className="inline-block">{digit}</span>

  return (
    <span className="relative inline-block h-[1.15em] w-[0.6em] overflow-hidden text-center leading-[1.15em]">
      <motion.span style={{ y }} className="flex select-none flex-col">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="flex h-[1.15em] items-center justify-center">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  stiffness = 170,
  damping = 22,
  mass = 0.6,
  useGrouping = true,
  animateOnMount = false,
  className,
}) => {
  const fixed = Math.abs(value).toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const grouped = useGrouping ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : intPart
  const formatted = `${value < 0 ? '-' : ''}${grouped}${decPart !== undefined ? `.${decPart}` : ''}`
  const chars = formatted.split('')

  return (
    <span className={cn('inline-flex items-baseline tabular-nums', className)}>
      <span className="sr-only">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {prefix && <span className="mr-0.5">{prefix}</span>}
        <span className="inline-flex items-baseline overflow-hidden">
          {chars.map((char, index) => (
            <DigitColumn
              key={`${index}-${/\d/.test(char) ? 'num' : char}`}
              digit={char}
              stiffness={stiffness}
              damping={damping}
              mass={mass}
              fromZero={animateOnMount}
            />
          ))}
        </span>
        {suffix && <span className="ml-0.5">{suffix}</span>}
      </span>
    </span>
  )
}
