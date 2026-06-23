'use client'

import { SIDEQUESTS } from '@/lib/sidequests'

interface SidequestsProps {
  active: string | null
  onSelect: (id: string | null) => void
}

export default function Sidequests({ active, onSelect }: SidequestsProps) {
  return (
    <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
      {SIDEQUESTS.map((sq) => (
        <button
          key={sq.id}
          onClick={() => onSelect(active === sq.id ? null : sq.id)}
          className={`shrink-0 flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium transition-colors ${
            active === sq.id
              ? 'bg-[#F0A500] text-[#0D1117]'
              : 'bg-[rgba(255,255,255,0.06)] text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[rgba(255,255,255,0.1)]'
          }`}
        >
          <span>{sq.icon}</span>
          <span>{sq.label}</span>
        </button>
      ))}
    </div>
  )
}
