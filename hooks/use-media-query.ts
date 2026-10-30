'use client'

import { useEffect, useState } from 'react'

/** Tracks a CSS media query. Renders `initial` on the server and first paint. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [query])

  return matches
}
