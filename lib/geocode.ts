import type { LatLng } from '@/types'
import { LONDON_BOUNDS } from './constants'

/**
 * Nominatim client for the browser.
 * Requests are serialised with a 1.1 s gap (usage policy is 1 req/s) and cached
 * by URL so re-opening the same article never re-fetches.
 */
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const MIN_GAP_MS = 1100

const cache = new Map<string, Promise<unknown>>()
let chain: Promise<unknown> = Promise.resolve()
let lastAt = 0

function throttled<T>(run: () => Promise<T>): Promise<T> {
  const next = chain.then(async () => {
    const wait = Math.max(0, lastAt + MIN_GAP_MS - Date.now())
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    lastAt = Date.now()
    return run()
  })
  chain = next.catch(() => undefined)
  return next
}

function getJson<T>(url: string): Promise<T | null> {
  if (!cache.has(url)) {
    cache.set(
      url,
      throttled(async () => {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(`Nominatim ${res.status}`)
        return res.json()
      }).catch(() => null)
    )
  }
  return cache.get(url) as Promise<T | null>
}

export interface NominatimAddress {
  road?: string
  suburb?: string
  city_district?: string
  quarter?: string
  neighbourhood?: string
  village?: string
  town?: string
  city?: string
  postcode?: string
}

export async function reverseGeocode(lat: number, lng: number, zoom = 17): Promise<NominatimAddress | null> {
  const url = `${NOMINATIM}/reverse?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}&format=jsonv2&zoom=${zoom}`
  const data = await getJson<{ address?: NominatimAddress }>(url)
  return data?.address ?? null
}

/** Street-level line for the drawer, e.g. "Charing Cross, Covent Garden, WC2N 5DN". */
export function formatAddress(a: NominatimAddress | null): string {
  if (!a) return ''
  return [a.road, a.suburb ?? a.city_district ?? a.quarter ?? a.neighbourhood, a.postcode]
    .filter(Boolean)
    .join(', ')
}

/** Neighbourhood-level name for tour titles, e.g. "Westminster". */
export function areaName(a: NominatimAddress | null): string {
  if (!a) return 'London'
  return a.suburb ?? a.city_district ?? a.quarter ?? a.village ?? a.town ?? a.city ?? 'London'
}

/** Geocode a free-text place, constrained to London. Returns null when nothing matches. */
export async function geocodePlace(query: string): Promise<LatLng | null> {
  const b = LONDON_BOUNDS
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'gb',
    viewbox: `${b.west},${b.north},${b.east},${b.south}`,
    bounded: '1',
  })
  const data = await getJson<Array<{ lat: string; lon: string }>>(`${NOMINATIM}/search?${params}`)
  const hit = data?.[0]
  if (!hit) return null
  return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) }
}
