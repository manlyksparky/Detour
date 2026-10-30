'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { SIDEQUESTS } from '@/lib/sidequests'
import { cn } from '@/lib/utils'
import { motionTransitions } from '@/lib/motion-tokens'
import SidequestIcon from './SidequestIcon'

interface SidequestChipsProps {
  active: string | null
  onChange: (id: string | null) => void
  /** 32px chips inside panels, 36px when floating over the map */
  size?: 'sm' | 'md'
  /** Raised shadow for chips that float over the map */
  elevated?: boolean
  label?: string
  className?: string
}

/**
 * Theme chips. The selected wash glides between chips (EasyUI's shared
 * layout indicator, as in its pill navigation) and a check marks the
 * selection in addition to colour.
 */
export default function SidequestChips({
  active,
  onChange,
  size = 'sm',
  elevated = false,
  label = 'Sidequests',
  className,
}: SidequestChipsProps) {
  const layoutId = useId()

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {SIDEQUESTS.map((sq) => {
        const selected = active === sq.id
        return (
          <motion.button
            key={sq.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : sq.id)}
            whileTap={{ scale: 0.96 }}
            transition={motionTransitions.springSnappy}
            className={cn(
              'relative inline-flex cursor-pointer items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors',
              size === 'sm' ? 'h-8' : 'h-9',
              elevated && 'shadow-raised',
              selected ? 'border-accent-strong text-accent-strong' : 'border-line bg-surface text-ink-2 hover:text-ink'
            )}
          >
            {selected && (
              <motion.span
                layoutId={`${layoutId}-wash`}
                transition={motionTransitions.springMorph}
                className="absolute inset-0 rounded-full bg-accent-soft"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {selected ? (
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <SidequestIcon icon={sq.icon} size={16} strokeWidth={2} />
              )}
              {sq.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
