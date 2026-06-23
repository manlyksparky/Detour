import type { Sidequest, WikiArticle } from '@/types'

export const SIDEQUESTS: Sidequest[] = [
  {
    id: 'hidden-histories',
    label: 'Hidden Histories',
    icon: '🕯️',
    keywords: [
      'plague', 'execution', 'riot', 'battle', 'buried', 'forgotten',
      'ancient', 'medieval', 'massacre', 'cemetery', 'burial', 'gallows',
      'dungeon', 'prison', 'condemned', 'siege', 'bombing', 'blitz',
      'fire of london', 'murder', 'skull', 'roman', 'saxon',
    ],
  },
  {
    id: 'architects-buildings',
    label: 'Architects & Buildings',
    icon: '🏛️',
    keywords: [
      'church', 'cathedral', 'station', 'bridge', 'tower', 'hall',
      'designed', 'listed', 'victorian', 'georgian', 'baroque', 'gothic',
      'warehouse', 'bank', 'exchange', 'abbey', 'palace', 'museum',
      'library', 'hospital', 'wren', 'pugin', 'hawksmoor', 'foster',
    ],
  },
  {
    id: 'literary-cultural',
    label: 'Literary & Cultural',
    icon: '🎭',
    keywords: [
      'pub', 'theatre', 'theater', 'music', 'studio', 'born', 'lived',
      'wrote', 'painted', 'film', 'poetry', 'novel', 'author', 'artist',
      'gallery', 'venue', 'club', 'concert', 'opera', 'cinema', 'dickens',
      'shakespeare', 'woolf', 'keats', 'pepys', 'johnson',
    ],
  },
  {
    id: 'parks-green',
    label: 'Parks & Green Spaces',
    icon: '🌳',
    keywords: [
      'park', 'garden', 'common', 'heath', 'green', 'forest', 'nature',
      'meadow', 'wood', 'botanical', 'square', 'grove', 'woodland',
      'river', 'canal', 'reservoir', 'field', 'royal park', 'allotment',
    ],
  },
]

export function filterBySidequest(
  articles: WikiArticle[],
  sidequestId: string
): WikiArticle[] {
  const sq = SIDEQUESTS.find((s) => s.id === sidequestId)
  if (!sq) return articles
  return articles.filter((a) => {
    const text = (a.title + ' ' + (a.extract ?? '')).toLowerCase()
    return sq.keywords.some((kw) => text.includes(kw.toLowerCase()))
  })
}
