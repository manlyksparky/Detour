import type { LatLng, RouteLeg, TourStop } from '@/types'

/** Street-level walking legs between consecutive points, or null when routing is unavailable. */
export async function fetchWalkingRoute(points: LatLng[]): Promise<RouteLeg[] | null> {
  if (points.length < 2) return null
  const q = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';')
  try {
    const res = await fetch(`/api/route?points=${encodeURIComponent(q)}`)
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data?.legs) ? (data.legs as RouteLeg[]) : null
  } catch {
    return null
  }
}

/** Replace straight-line leg estimates with the routed distance and time. */
export function applyLegsToStops(stops: TourStop[], legs: RouteLeg[]): TourStop[] {
  return stops.map((stop, i) => {
    const leg = legs[i]
    if (!leg) return stop
    return { ...stop, distFromPrev: leg.distance, timeFromPrev: Math.round(leg.duration / 60) }
  })
}
