import { LONDON_BOUNDS, LONDON_CENTER } from './constants'
import type { LatLng, WikiArticle, TourStop } from '@/types'

export const TOUR_MAX_STOPS = 15
export const WALKING_SPEED_MPM = 80 // metres per minute ≈ 4.8 km/h

export function isWithinLondon(lat: number, lng: number): boolean {
  return (
    lat >= LONDON_BOUNDS.south &&
    lat <= LONDON_BOUNDS.north &&
    lng >= LONDON_BOUNDS.west &&
    lng <= LONDON_BOUNDS.east
  )
}

export function getUserLocation(): Promise<LatLng> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(LONDON_CENTER)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        resolve(isWithinLondon(lat, lng) ? { lat, lng } : LONDON_CENTER)
      },
      () => resolve(LONDON_CENTER),
      { timeout: 5000 }
    )
  })
}

export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function nearestNeighbourOrder(
  stops: WikiArticle[],
  start: LatLng
): WikiArticle[] {
  if (stops.length <= 1) return stops
  const remaining = [...stops]
  const ordered: WikiArticle[] = []
  let current = start
  while (remaining.length > 0) {
    let closestIdx = 0
    let closestDist = Infinity
    remaining.forEach((stop, i) => {
      const d = haversineDistance(current, { lat: stop.lat, lng: stop.lng })
      if (d < closestDist) {
        closestDist = d
        closestIdx = i
      }
    })
    const next = remaining.splice(closestIdx, 1)[0]
    ordered.push(next)
    current = { lat: next.lat, lng: next.lng }
  }
  return ordered
}

export function calculateWalkingTime(meters: number): number {
  return Math.max(0, Math.round(meters / WALKING_SPEED_MPM))
}

export function computeTourStops(
  articles: WikiArticle[],
  startLat: number,
  startLng: number
): TourStop[] {
  if (articles.length === 0) return []

  // Select closest TOUR_MAX_STOPS articles by distance from center
  const selected = [...articles]
    .sort((a, b) => a.distance - b.distance)
    .slice(0, TOUR_MAX_STOPS)

  // Order with nearest-neighbour heuristic starting from center
  const ordered = nearestNeighbourOrder(selected, { lat: startLat, lng: startLng })

  // Annotate each stop with distance + time from the previous
  return ordered.map((article, i) => {
    const prev = i === 0
      ? { lat: startLat, lng: startLng }
      : { lat: ordered[i - 1].lat, lng: ordered[i - 1].lng }
    const distFromPrev = Math.round(haversineDistance(prev, { lat: article.lat, lng: article.lng }))
    return {
      ...article,
      order: i + 1,
      distFromPrev,
      timeFromPrev: calculateWalkingTime(distFromPrev),
    }
  })
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}
