import type { WikiArticle } from '@/types'

/** Places near a point, or null when the lookup failed (as opposed to finding none). */
export async function fetchNearby(
  lat: number,
  lng: number,
  radius: number
): Promise<WikiArticle[] | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
  })
  try {
    const res = await fetch(`/api/wikipedia?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export async function fetchSummary(
  pageid: number,
  title: string
): Promise<Partial<WikiArticle>> {
  const params = new URLSearchParams({
    pageid: pageid.toString(),
    title,
  })
  try {
    const res = await fetch(`/api/wikipedia?${params}`)
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}
