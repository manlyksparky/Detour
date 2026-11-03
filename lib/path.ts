import type { LatLng } from '@/types'
import { haversineDistance } from './geo'

/** Compass bearing from a to b in degrees, 0 = north, clockwise. */
export function bearingBetween(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180
  const dLng = (b.lng - a.lng) * toRad
  const y = Math.sin(dLng) * Math.cos(b.lat * toRad)
  const x =
    Math.cos(a.lat * toRad) * Math.sin(b.lat * toRad) -
    Math.sin(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Shortest-arc interpolation between two bearings. */
export function lerpAngle(from: number, to: number, t: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return (from + delta * t + 360) % 360
}

export interface Path {
  coords: [number, number][]
  /** Cumulative metres at each coordinate */
  cum: number[]
  total: number
}

/** Cumulative distances along a [lng, lat] polyline. */
export function buildPath(coords: [number, number][]): Path {
  const cum = [0]
  for (let i = 1; i < coords.length; i++) {
    const a = { lng: coords[i - 1][0], lat: coords[i - 1][1] }
    const b = { lng: coords[i][0], lat: coords[i][1] }
    cum.push(cum[i - 1] + haversineDistance(a, b))
  }
  return { coords, cum, total: cum[cum.length - 1] ?? 0 }
}

/** The point `metres` along the path, clamped to its ends. */
export function pointAlong(path: Path, metres: number): LatLng {
  const { coords, cum, total } = path
  if (coords.length === 0) return { lat: 0, lng: 0 }
  if (coords.length === 1 || metres <= 0) return { lng: coords[0][0], lat: coords[0][1] }
  if (metres >= total) {
    const last = coords[coords.length - 1]
    return { lng: last[0], lat: last[1] }
  }
  // binary search for the segment containing `metres`
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= metres) lo = mid
    else hi = mid
  }
  const segLen = cum[hi] - cum[lo] || 1
  const t = (metres - cum[lo]) / segLen
  return {
    lng: coords[lo][0] + (coords[hi][0] - coords[lo][0]) * t,
    lat: coords[lo][1] + (coords[hi][1] - coords[lo][1]) * t,
  }
}
