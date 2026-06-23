'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="h-dvh bg-[#0D1117] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-3xl">🗺️</p>
      <h2 className="text-lg font-semibold text-[#E6EDF3]">Something went wrong</h2>
      <p className="text-sm text-[#8B949E]">The map couldn&apos;t load. Check your connection and try again.</p>
      <button
        onClick={reset}
        className="h-9 px-5 rounded-xl bg-[#F0A500] text-[#0D1117] text-sm font-medium hover:bg-[#FFC32B] transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
