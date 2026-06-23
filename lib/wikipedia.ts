import type { WikiArticle } from '@/types'

export async function fetchNearby(
  lat: number,
  lng: number,
  radius: number
): Promise<WikiArticle[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
  })
  try {
    const res = await fetch(`/api/wikipedia?${params}`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
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
