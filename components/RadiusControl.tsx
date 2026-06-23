'use client'

import { useCallback } from 'react'
import { RADIUS_MIN, RADIUS_MAX } from '@/lib/constants'

interface RadiusControlProps {
  radius: number
  onChange: (radius: number) => void
}

function formatLabel(m: number): string {
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

export default function RadiusControl({ radius, onChange }: RadiusControlProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value))
    },
    [onChange]
  )

  const pct = ((radius - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100

  return (
    <div className="flex items-center gap-2 bg-[rgba(22,27,34,0.9)] backdrop-blur-md border border-[rgba(230,237,243,0.1)] rounded-xl px-3 py-2 shadow-lg">
      <svg className="text-[#8B949E] shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>

      <div className="relative flex items-center">
        <input
          type="range"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={50}
          value={radius}
          onChange={handleChange}
          className="w-28 h-1 appearance-none cursor-pointer rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, #F0A500 ${pct}%, rgba(230,237,243,0.15) ${pct}%)`,
          }}
        />
      </div>

      <span className="text-xs font-medium text-[#F0A500] tabular-nums w-10 text-right shrink-0">
        {formatLabel(radius)}
      </span>
    </div>
  )
}
