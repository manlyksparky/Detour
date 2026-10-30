'use client'

import React, { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'
import { runInputClearDissolve } from '@/lib/transitions/input-clear-dissolve'

/**
 * EasyUI IOSSearchBar, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/ios-search-bar`
 * Kept: the pill that brightens on focus, the clear button that scales in
 * when there is text, Escape to leave the field, the hidden native cancel
 * control, 16px type so iOS does not zoom. Changed: fluid width by default
 * (pass collapsedWidth/expandedWidth for the grow-on-focus behaviour), a
 * required visually hidden label, an `invalid` state, and a `trailing` slot
 * for the submit control so the bar can live inside a search form.
 *
 * Clearing runs transitions.dev's "Input clear with dissolve": the text
 * flies down and blurs out, an ink streak flares under each word, and the
 * placeholder drops in. The field keeps a mirror of its value for that, and
 * the native placeholder is drawn by the `.t-clear-placeholder` layer.
 */

export interface IOSSearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size' | 'type'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  /** Accessible name of the field (visually hidden) */
  label: string
  /** Pill for floating use, 12px corners inside panels */
  shape?: 'pill' | 'rounded'
  /** Float shadow and hairline border for use over the map */
  elevated?: boolean
  invalid?: boolean
  /** Width at rest; omit for a fluid bar */
  collapsedWidth?: number | string
  /** Width while focused or filled; omit for a fluid bar */
  expandedWidth?: number | string
  /** Control rendered inside the bar after the input, e.g. a submit button */
  trailing?: React.ReactNode
  className?: string
}

export const IOSSearchBar = forwardRef<HTMLInputElement, IOSSearchBarProps>(function IOSSearchBar(
  {
    value,
    onChange,
    onClear,
    label,
    shape = 'pill',
    elevated = false,
    invalid = false,
    collapsedWidth,
    expandedWidth,
    trailing,
    className,
    placeholder = 'Search…',
    disabled,
    id,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
  },
  forwardedRef
) {
  const [focused, setFocused] = useState(false)
  const [clearing, setClearing] = useState(false)
  const localRef = useRef<HTMLInputElement | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const clearingText = useRef('')
  const cancelDissolve = useRef<(() => void) | null>(null)
  const reducedMotion = useReducedMotion()
  const generatedId = useId()
  const inputId = id ?? generatedId

  const setRefs = (node: HTMLInputElement | null) => {
    localRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  useEffect(() => () => cancelDissolve.current?.(), [])

  const animatesWidth = collapsedWidth !== undefined && expandedWidth !== undefined
  const expanded = focused || value.length > 0
  const hasValue = value.length > 0
  const mirrorText = (clearing ? clearingText.current : value).replace(/ /g, ' ')

  const handleClear = () => {
    if (!value || clearing) return
    const input = localRef.current
    // The clear control unmounts once the field is empty, so focus always
    // returns to the field: from the caret or from the control itself.
    const keepFocus = true
    const targets = { wrap: wrapRef.current, input, mirror: mirrorRef.current, placeholder: placeholderRef.current, glow: glowRef.current }
    const canDissolve = !reducedMotion && Object.values(targets).every(Boolean)

    clearingText.current = value
    onChange('')
    onClear?.()

    if (!canDissolve) {
      if (keepFocus) input?.focus({ preventScroll: true })
      return
    }
    setClearing(true)
    cancelDissolve.current = runInputClearDissolve(targets as Parameters<typeof runInputClearDissolve>[0], {
      text: value,
      onDone: () => {
        cancelDissolve.current = null
        setClearing(false)
        if (keepFocus) requestAnimationFrame(() => localRef.current?.focus({ preventScroll: true }))
      },
    })
  }

  // Keep the caret in the field while the clear button is pressed
  const keepFocus = (e: React.PointerEvent | React.MouseEvent) => {
    if (document.activeElement === localRef.current) e.preventDefault()
  }

  return (
    <motion.div
      animate={animatesWidth ? { width: expanded ? expandedWidth : collapsedWidth } : undefined}
      transition={motionTransitions.springSmooth}
      className={cn('relative flex items-center', !animatesWidth && 'w-full', className)}
    >
      <div
        className={cn(
          'flex h-11 w-full items-center gap-1 border bg-surface pl-3 pr-1 transition-[border-color,box-shadow] duration-200',
          'has-[input:focus-visible]:outline has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-strong',
          shape === 'pill' ? 'rounded-full' : 'rounded-xl',
          elevated ? 'border-line shadow-float' : 'border-line-field',
          invalid && 'border-accent-strong',
          disabled && 'opacity-60'
        )}
      >
        <Search
          size={16}
          className={cn('shrink-0 transition-colors', focused ? 'text-ink' : 'text-ink-3')}
          aria-hidden="true"
        />

        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>

        {/* transitions.dev .t-clear: input + mirror + placeholder + glow */}
        <div
          ref={wrapRef}
          className={cn(
            't-clear min-w-0 flex-1 self-stretch text-base md:text-sm',
            hasValue && 'has-value',
            // React owns the class list, so the clearing state lives here too
            clearing && 'is-clearing'
          )}
        >
          <input
            ref={setRefs}
            id={inputId}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') localRef.current?.blur()
              onKeyDown?.(e)
            }}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className="focus-quiet h-full w-full bg-transparent text-ink caret-ink disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
            {...props}
          />
          <div ref={mirrorRef} className="t-clear-mirror select-none text-ink" aria-hidden="true">
            {mirrorText}
          </div>
          <div ref={placeholderRef} className="t-clear-placeholder select-none text-ink-3" aria-hidden="true">
            {placeholder}
          </div>
          <div ref={glowRef} className="t-clear-glow" aria-hidden="true" />
        </div>

        <AnimatePresence>
          {hasValue && !disabled && (
            <motion.button
              type="button"
              onClick={handleClear}
              onPointerDown={keepFocus}
              onMouseDown={keepFocus}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              aria-label="Clear search"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            >
              <X size={14} aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        {trailing}
      </div>
    </motion.div>
  )
})
