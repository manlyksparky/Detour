import type { WikiArticle } from '@/types'
import { NextRequest } from 'next/server'

interface GeoSearchPage {
  pageid: number
  title: string
  lat: number
  lon: number
  dist: number
}

interface WikiSummaryResponse {
  extract?: string
  thumbnail?: { source: string }
  content_urls?: { desktop?: { page?: string } }
  coordinates?: { lat: number; lon: number }
}

interface MobileSectionItem {
  toclevel?: number
  line?: string
  text?: string
}

function cleanWikiHtml(html: string): string {
  return html
    .replace(/href="\/wiki\//g, 'href="https://en.wikipedia.org/wiki/')
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .trim()
}

const summaryCache = new Map<number, Partial<WikiArticle>>()

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // Batch mode: fetch summaries for multiple pageids at once
  const pageIdsParam = searchParams.get('pageids')
  if (pageIdsParam) {
    const ids = pageIdsParam.split(',').map(Number).filter(Boolean)
    if (ids.length === 0) return Response.json([])

    try {
      const batchUrl = new URL('https://en.wikipedia.org/w/api.php')
      batchUrl.searchParams.set('action', 'query')
      batchUrl.searchParams.set('pageids', ids.join('|'))
      batchUrl.searchParams.set('prop', 'extracts|pageimages|info')
      batchUrl.searchParams.set('exintro', 'true')
      batchUrl.searchParams.set('explaintext', 'true')
      batchUrl.searchParams.set('exsentences', '3')
      batchUrl.searchParams.set('pithumbsize', '400')
      batchUrl.searchParams.set('inprop', 'url')
      batchUrl.searchParams.set('format', 'json')
      batchUrl.searchParams.set('origin', '*')

      const res = await fetch(batchUrl.toString(), {
        headers: { 'User-Agent': 'LondonDetour/1.0 (personal project)' },
      })
      if (!res.ok) return Response.json([])

      const data = await res.json()
      const pages = data.query?.pages ?? {}

      const results: Partial<WikiArticle>[] = Object.values(pages).map((p: unknown) => {
        const page = p as {
          pageid: number
          title: string
          extract?: string
          thumbnail?: { source: string }
          fullurl?: string
        }
        const result: Partial<WikiArticle> = {
          pageid: page.pageid,
          title: page.title,
          extract: page.extract ?? '',
          url: page.fullurl,
        }
        if (page.thumbnail?.source) result.thumbnail = page.thumbnail.source
        return result
      })

      return Response.json(results)
    } catch {
      return Response.json([])
    }
  }

  const pageIdParam = searchParams.get('pageid')
  const titleParam = searchParams.get('title')

  if (pageIdParam) {
    const pageid = parseInt(pageIdParam)

    if (summaryCache.has(pageid)) {
      return Response.json(summaryCache.get(pageid))
    }

    let resolvedTitle = titleParam ?? ''

    if (!resolvedTitle) {
      try {
        const infoUrl = new URL('https://en.wikipedia.org/w/api.php')
        infoUrl.searchParams.set('action', 'query')
        infoUrl.searchParams.set('pageids', pageid.toString())
        infoUrl.searchParams.set('format', 'json')
        infoUrl.searchParams.set('origin', '*')
        const infoRes = await fetch(infoUrl.toString(), {
          headers: { 'User-Agent': 'LondonDetour/1.0 (personal project)' },
        })
        if (infoRes.ok) {
          const infoData = await infoRes.json()
          resolvedTitle = infoData.query?.pages?.[pageid]?.title ?? ''
        }
      } catch {
        return Response.json({})
      }
    }

    if (!resolvedTitle) return Response.json({})

    const ua = { 'User-Agent': 'LondonDetour/1.0 (personal project)' }
    const encodedTitle = encodeURIComponent(resolvedTitle)

    // Fetch mobile-sections (rich HTML) and REST summary (extract + coordinates) in parallel
    const [sectionsRes, summaryRes] = await Promise.allSettled([
      fetch(`https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodedTitle}`, { headers: ua }),
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`, { headers: ua }),
    ])

    const summaryData: WikiSummaryResponse =
      summaryRes.status === 'fulfilled' && summaryRes.value.ok
        ? await summaryRes.value.json()
        : {}

    const summary: Partial<WikiArticle> = {
      pageid,
      title: resolvedTitle,
      extract: summaryData.extract,
      thumbnail: summaryData.thumbnail?.source,
      url: summaryData.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodedTitle}`,
      lat: summaryData.coordinates?.lat ?? 0,
      lng: summaryData.coordinates?.lon ?? 0,
    }

    if (sectionsRes.status === 'fulfilled' && sectionsRes.value.ok) {
      try {
        const s = await sectionsRes.value.json()
        const lead = s.lead ?? {}
        const remaining: MobileSectionItem[] = s.remaining?.sections ?? []

        const heroUrl =
          lead.image?.urls?.['1024'] ??
          lead.image?.urls?.['800'] ??
          lead.image?.urls?.['640'] ??
          lead.image?.urls?.['320']

        if (heroUrl) summary.heroImage = heroUrl
        if (lead.description) summary.description = lead.description
        if (lead.sections?.[0]?.text) summary.leadText = cleanWikiHtml(lead.sections[0].text)

        const SKIP = new Set(['See also', 'References', 'External links', 'Notes',
          'Further reading', 'Bibliography', 'Citations', 'Footnotes'])
        summary.sections = remaining
          .filter((sec) => sec.toclevel === 1 && sec.text && !SKIP.has(sec.line ?? ''))
          .slice(0, 5)
          .map((sec) => ({ title: sec.line ?? '', text: cleanWikiHtml(sec.text ?? '') }))
      } catch {
        // sections enrichment failed; plain summary is still returned below
      }
    }

    summaryCache.set(pageid, summary)
    return Response.json(summary)
  }

  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radiusParam = searchParams.get('radius')

  if (!lat || !lng || !radiusParam) {
    return Response.json({ error: 'Missing required params: lat, lng, radius' }, { status: 400 })
  }

  const radius = Math.min(parseInt(radiusParam), 10000)
  const geoUrl = new URL('https://en.wikipedia.org/w/api.php')
  geoUrl.searchParams.set('action', 'query')
  geoUrl.searchParams.set('list', 'geosearch')
  geoUrl.searchParams.set('gscoord', `${lat}|${lng}`)
  geoUrl.searchParams.set('gsradius', radius.toString())
  geoUrl.searchParams.set('gslimit', '50')
  geoUrl.searchParams.set('format', 'json')
  geoUrl.searchParams.set('origin', '*')

  try {
    const res = await fetch(geoUrl.toString(), {
      headers: { 'User-Agent': 'LondonDetour/1.0 (personal project)' },
    })

    if (!res.ok) return Response.json([])

    const data = await res.json()
    const pages: GeoSearchPage[] = data.query?.geosearch ?? []
    if (pages.length === 0) return Response.json([])

    // Batch-enrich with thumbnails + short extracts in one follow-up call
    const enrichUrl = new URL('https://en.wikipedia.org/w/api.php')
    enrichUrl.searchParams.set('action', 'query')
    enrichUrl.searchParams.set('pageids', pages.map((p) => p.pageid).join('|'))
    enrichUrl.searchParams.set('prop', 'pageimages|extracts')
    enrichUrl.searchParams.set('exintro', 'true')
    enrichUrl.searchParams.set('explaintext', 'true')
    enrichUrl.searchParams.set('exsentences', '2')
    enrichUrl.searchParams.set('pithumbsize', '200')
    enrichUrl.searchParams.set('format', 'json')
    enrichUrl.searchParams.set('origin', '*')

    let enriched: Record<number, { thumbnail?: { source: string }; extract?: string }> = {}
    try {
      const enrichRes = await fetch(enrichUrl.toString(), {
        headers: { 'User-Agent': 'LondonDetour/1.0 (personal project)' },
      })
      if (enrichRes.ok) {
        const enrichData = await enrichRes.json()
        enriched = enrichData.query?.pages ?? {}
      }
    } catch {
      // thumbnails are best-effort; continue with geo data only
    }

    const articles: WikiArticle[] = pages.map((p) => ({
      pageid: p.pageid,
      title: p.title,
      lat: p.lat,
      lng: p.lon,
      distance: p.dist,
      thumbnail: enriched[p.pageid]?.thumbnail?.source,
      extract: enriched[p.pageid]?.extract ?? '',
    }))

    return Response.json(articles)
  } catch {
    return Response.json([])
  }
}
