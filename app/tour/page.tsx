import { Suspense } from 'react'
import TourView from '@/components/TourView'
import { Loader } from '@/components/ui/loader'

export default function TourPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <Suspense
        fallback={
          <div className="flex h-dvh flex-col items-center justify-center gap-3 text-sm text-ink-2">
            <Loader variant="arc" size={28} label="Loading your tour" />
            <span aria-hidden="true">Loading your tour…</span>
          </div>
        }
      >
        <TourView />
      </Suspense>
    </div>
  )
}
