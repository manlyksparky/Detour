import type { RouteLeg } from '@/types'

/**
 * Walking routes between tour points, along the streets.
 * Proxies a Valhalla server (the public OpenStreetMap demo by default) so the
 * browser never talks to it directly and identical requests are served from
 * memory. Set ROUTING_URL to your own Valhalla endpoint for production use.
 */

const ROUTING_URL = process.env.ROUTING_URL ?? 'https://valhalla1.openstreetmap.de/route'
const MAX_POINTS = 20
/** Locations per upstream request; the public demo refuses more than 10 */
const MAX_LOCATIONS = Math.max(2, Number(process.env.ROUTING_MAX_LOCATIONS) || 10)
const TIMEOUT_MS = 9000
const CACHE_MAX = 200
const cache = new Map<string, RouteLeg[]>()

function remember(key: string, legs: RouteLeg[]) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, legs)
}

/** Google polyline decoder; Valhalla encodes its shapes at 1e6 precision. */
function decodeShape(encoded: string, precision = 1e6): [number, number][] {
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0
  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    coords.push([lng / precision, lat / precision])
  }
  return coords
}

function parsePoints(param: string | null): { lat: number; lng: number }[] | null {
  if (!param) return null
  const points = param.split(';').map((pair) => {
    const [lat, lng] = pair.split(',').map(Number)
    return { lat, lng }
  })
  if (points.length < 2 || points.length > MAX_POINTS) return null
  if (!points.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180))
    return null
  return points
}

/** GET /api/route?points=lat,lng;lat,lng;… → { legs: RouteLeg[] } */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const points = parsePoints(searchParams.get('points'))
  if (!points) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';')
  const cached = cache.get(key)
  if (cached) return Response.json({ legs: cached }, { headers: { 'Cache-Control': 'public, max-age=86400' } })

  try {
    const legs = await routeInChunks(points)
    remember(key, legs)
    return Response.json({ legs }, { headers: { 'Cache-Control': 'public, max-age=86400' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Routing unavailable'
    return Response.json({ error: message }, { status: 502 })
  }
}

/**
 * The demo server allows ten locations per request, so a long tour is routed
 * in overlapping windows (each window starts where the previous one ended)
 * and the legs are stitched back in order.
 */
async function routeInChunks(points: { lat: number; lng: number }[]): Promise<RouteLeg[]> {
  const legs: RouteLeg[] = []
  let from = 0
  while (from < points.length - 1) {
    const to = Math.min(points.length - 1, from + MAX_LOCATIONS - 1)
    legs.push(...(await routeWindow(points.slice(from, to + 1))))
    from = to
  }
  return legs
}

async function routeWindow(points: { lat: number; lng: number }[]): Promise<RouteLeg[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(ROUTING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Detour walking tours (contact via repository)' },
      body: JSON.stringify({
        locations: points.map((p) => ({ lat: p.lat, lon: p.lng, type: 'break' })),
        costing: 'pedestrian',
        units: 'kilometers',
        directions_type: 'none',
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Routing service responded ${res.status}`)

    const data = await res.json()
    const rawLegs: unknown = data?.trip?.legs
    if (!Array.isArray(rawLegs) || rawLegs.length !== points.length - 1) {
      throw new Error('No route between these points')
    }
    return rawLegs.map((leg) => ({
      distance: Math.round(((leg?.summary?.length as number) ?? 0) * 1000),
      duration: Math.round((leg?.summary?.time as number) ?? 0),
      coordinates: decodeShape(String(leg?.shape ?? '')),
    }))
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Routing timed out')
    throw error
  } finally {
    clearTimeout(timer)
  }
}
