'use client'

import type { WikiArticle } from '@/types'

interface SurpriseMeProps {
  articles: WikiArticle[]
  onSelect: (article: WikiArticle) => void
  disabled?: boolean
}

export default function SurpriseMe({ articles, onSelect, disabled }: SurpriseMeProps) {
  const handleClick = () => {
    if (articles.length === 0) return
    const idx = Math.floor(Math.random() * articles.length)
    onSelect(articles[idx])
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || articles.length === 0}
      title="Surprise me — random nearby place"
      className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[rgba(22,27,34,0.9)] backdrop-blur-md border border-[rgba(230,237,243,0.1)] text-sm font-medium text-[#E6EDF3] hover:border-[rgba(240,165,0,0.4)] hover:text-[#F0A500] transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span className="text-base">🎲</span>
      <span className="hidden sm:inline">Surprise Me</span>
    </button>
  )
}
