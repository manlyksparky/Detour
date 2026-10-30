'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'

/**
 * EasyUI SpringSelect, skinned for Detour.
 * Source: `npx shadcn@latest add Surajmaurya1/easyui/spring-select`
 * Kept: the menu rides a snappy spring and the chevron rotates a hair past
 * 180° before settling. Changed: notebook field styling at 44px, a label
 * that can be visually hidden, and a working listbox (focus moves into the
 * list on open, Home/End, aria-activedescendant, focus returns on close).
 */

export interface SpringSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SpringSelectProps {
  options: SpringSelectOption[]
  /** Controlled value */
  value?: string
  /** Uncontrolled initial value */
  defaultValue?: string
  placeholder?: string
  onChange?: (value: string) => void
  /** Accessible name; always rendered, visually hidden with `hideLabel` */
  label: string
  hideLabel?: boolean
  disabled?: boolean
  error?: string
  className?: string
  triggerClassName?: string
}

export const SpringSelect: React.FC<SpringSelectProps> = ({
  options,
  value,
  defaultValue,
  placeholder = 'Select…',
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  error,
  className,
  triggerClassName,
}) => {
  const uid = useId()
  const triggerId = `${uid}-trigger`
  const labelId = `${uid}-label`
  const listId = `${uid}-list`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const isControlled = value !== undefined
  const current = isControlled ? value : internalValue
  const currentOption = options.find((o) => o.value === current)

  useEffect(() => {
    if (!open) return
    const onDocPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [open])

  // Focus moves into the list on open so the arrow keys work straight away
  useEffect(() => {
    if (!open) return
    const selected = options.findIndex((o) => o.value === current)
    setActiveIndex(selected >= 0 ? selected : options.findIndex((o) => !o.disabled))
    listRef.current?.focus({ preventScroll: true })
  }, [open, options, current])

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  const select = (opt: SpringSelectOption) => {
    if (opt.disabled) return
    if (!isControlled) setInternalValue(opt.value)
    onChange?.(opt.value)
    close()
  }

  const move = (delta: number) => {
    setActiveIndex((i) => {
      let next = i
      for (let step = 0; step < options.length; step++) {
        next = (next + delta + options.length) % options.length
        if (!options[next].disabled) return next
      }
      return i
    })
  }

  const handleTriggerKey = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const handleListKey = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(options.findIndex((o) => !o.disabled))
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1 - [...options].reverse().findIndex((o) => !o.disabled))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) select(options[activeIndex])
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <label
        id={labelId}
        htmlFor={triggerId}
        className={cn('mb-1.5 block select-none text-xs font-medium text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={`${labelId} ${triggerId}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleTriggerKey}
        className={cn(
          'relative flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border bg-surface pl-3 pr-9 text-left text-sm font-medium text-ink transition-colors duration-150',
          open ? 'border-accent-strong' : error ? 'border-accent-strong' : 'border-line-field hover:border-accent-strong',
          disabled && 'cursor-not-allowed opacity-40',
          !currentOption && 'text-ink-3',
          triggerClassName
        )}
      >
        <span className="truncate">{currentOption?.label ?? placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 192 : 0 }}
          transition={motionTransitions.springSnappy}
          className="pointer-events-none absolute right-3 text-ink-3"
          aria-hidden="true"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            onKeyDown={handleListKey}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={motionTransitions.springSnappy}
            className="group focus-quiet absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-auto rounded-xl border border-line bg-surface py-1 shadow-float"
          >
            {options.map((opt, idx) => {
              const selected = opt.value === current
              return (
                <li
                  key={opt.value}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={opt.disabled || undefined}
                  onPointerMove={() => activeIndex !== idx && setActiveIndex(idx)}
                  onClick={() => select(opt)}
                  className={cn(
                    'mx-1 flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm',
                    selected ? 'font-medium text-accent-strong' : 'text-ink',
                    opt.disabled && 'cursor-not-allowed opacity-40',
                    // the highlighted option doubles as the keyboard focus indicator
                    activeIndex === idx &&
                      !opt.disabled &&
                      'bg-sunken group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-accent-strong'
                  )}
                >
                  <span className="flex flex-col">
                    <span className="leading-tight">{opt.label}</span>
                    {opt.description && <span className="mt-0.5 text-xs text-ink-2">{opt.description}</span>}
                  </span>
                  {selected && <Check size={16} className="shrink-0" aria-hidden="true" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionTransitions.springSnappy}
          className="mt-1.5 text-xs font-medium text-accent-strong"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
