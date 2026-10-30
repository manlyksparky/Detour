'use client'

import { useCallback, useEffect, useState } from 'react'
import IntroLoader from '@/components/ui/intro-loader'
import { DETOUR_GREETINGS } from '@/lib/intro'

const SESSION_KEY = 'detour:intro-seen'

/**
 * Shows the Detour intro once per browser session, as a full-screen overlay
 * above whatever is rendered beneath it (so the map can load in parallel).
 */
export default function IntroGate() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) setShow(false)
    } catch {
      // sessionStorage unavailable (private mode, blocked storage) — just show it
    }
  }, [])

  const handleComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // ignore
    }
  }, [])

  if (!show) return null

  return <IntroLoader greetings={DETOUR_GREETINGS} onComplete={handleComplete} intervalMs={220} />
}
