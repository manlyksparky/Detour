'use client'

import Image from 'next/image'
import type { WikiArticle } from '@/types'
import { formatDistance } from '@/lib/geo'

interface ArticleCardProps {
  article: WikiArticle
  isSelected: boolean
  isInTour: boolean
  onClick: () => void
}

export default function ArticleCard({ article, isSelected, isInTour, onClick }: ArticleCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition-all duration-150 ${
        isSelected
          ? 'border-detour-orange shadow-md'
          : 'border-gray-100 hover:shadow-md hover:border-gray-200'
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
          {article.thumbnail ? (
            <div className="relative w-full h-full">
              <Image
                src={article.thumbnail}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <svg className="text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
              {article.title}
            </h3>
            {/* Heart / tour indicator */}
            <div className="shrink-0 mt-0.5">
              {isInTour ? (
                <svg className="text-detour-orange" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="text-gray-300 hover:text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </div>
          </div>

          {/* Distance */}
          <p className="flex items-center gap-1 text-detour-orange text-xs font-medium mt-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {formatDistance(article.distance)}
          </p>

          {/* Extract snippet */}
          {article.extract && (
            <p className="text-gray-500 text-xs leading-relaxed mt-1 line-clamp-2">
              {article.extract}
            </p>
          )}

          {/* Read article link */}
          <span className="inline-flex items-center gap-0.5 text-detour-orange text-xs font-medium mt-2">
            Read article
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  )
}
