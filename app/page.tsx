import { Suspense } from 'react'
import MapView from '@/components/MapView'

export default function Page() {
  return (
    <div className="h-dvh bg-[#0D1117]">
      <Suspense fallback={<div className="h-full bg-[#0D1117]" />}>
        <MapView />
      </Suspense>
    </div>
  )
}
