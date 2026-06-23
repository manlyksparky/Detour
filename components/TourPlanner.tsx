'use client'

import { useRouter } from 'next/navigation'
import { encodeStops } from '@/lib/tour'

interface TourPlannerProps {
  stopIds: number[]
  lat: number
  lng: number
  radius: number
}

export default function TourPlanner({ stopIds, lat, lng, radius }: TourPlannerProps) {
  const router = useRouter()

  if (stopIds.length === 0) return null

  const handleViewTour = () => {
    const params = new URLSearchParams({
      stops: encodeStops(stopIds),
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    })
    router.push(`/tour?${params}`)
  }

  return (
    <button
      onClick={handleViewTour}
      className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[#F0A500] text-[#0D1117] text-sm font-semibold hover:bg-[#FFC32B] transition-colors shadow-lg"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 12h18M3 6h18M3 18h18" />
      </svg>
      Tour ({stopIds.length})
    </button>
  )
}
