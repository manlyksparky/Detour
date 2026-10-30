import { Suspense } from 'react'
import MapView from '@/components/MapView'
import IntroGate from '@/components/IntroGate'

export default function Page() {
  return (
    <div className="h-dvh bg-paper">
      <IntroGate />
      <Suspense fallback={<div className="h-full bg-paper" />}>
        <MapView />
      </Suspense>
    </div>
  )
}
