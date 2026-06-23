import { Suspense } from 'react'
import TourView from '@/components/TourView'

export default function TourPage() {
  return (
    <div className="min-h-dvh bg-[#0D1117]">
      <Suspense fallback={<div className="h-dvh bg-[#0D1117] flex items-center justify-center text-[#8B949E] text-sm">Loading tour…</div>}>
        <TourView />
      </Suspense>
    </div>
  )
}
