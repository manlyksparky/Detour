'use client'

import Image from 'next/image'
import { MapPin, Heart, ChevronRight } from 'lucide-react'
import type { WikiArticle } from '@/types'
import { formatDistance } from '@/lib/geo'

interface ArticleCardProps {
  article: WikiArticle
  isSelected: boolean
  isInTour: boolean
  onClick: () => void
}

/**
 * The title is the real control; a stretched pseudo-element makes the whole
 * card clickable without nesting a heading inside a button.
 */
export default function ArticleCard({ article, isSelected, isInTour, onClick }: ArticleCardProps) {
  return (
    <article
      aria-current={isSelected ? 'true' : undefined}
      className={`relative flex gap-3 rounded-2xl border bg-surface p-4 shadow-card transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-accent-strong focus-within:ring-offset-2 focus-within:ring-offset-paper ${
        isSelected ? 'border-accent' : 'border-line hover:border-line-strong hover:shadow-raised'
      }`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sunken">
        {article.thumbnail ? (
          <Image src={article.thumbnail} alt="" fill sizes="64px" className="object-cover" unoptimized />
        ) : (
          <MapPin className="absolute inset-0 m-auto text-ink-2" size={20} aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm font-semibold leading-snug text-ink line-clamp-2">
            <button
              type="button"
              onClick={onClick}
              className="focus-quiet cursor-pointer text-left after:absolute after:inset-0 after:rounded-2xl after:content-['']"
            >
              {article.title}
            </button>
          </h3>
          {isInTour && (
            <span className="shrink-0 text-accent-strong" title="In your walking tour">
              <Heart size={16} fill="currentColor" aria-hidden="true" />
              <span className="sr-only">In your walking tour</span>
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-accent-strong">
          <MapPin size={12} aria-hidden="true" />
          {formatDistance(article.distance)} away
        </p>

        {article.extract && (
          <p className="mt-1 text-xs leading-relaxed text-ink-2 line-clamp-2">{article.extract}</p>
        )}
      </div>

      {isSelected && (
        <ChevronRight className="shrink-0 self-center text-accent-strong" size={18} aria-hidden="true" />
      )}
    </article>
  )
}
