'use client'

import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold text-ink">Detour couldn&apos;t draw this page</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          This usually happens when the browser blocks the map or the connection drops partway
          through loading. Trying again fixes most cases.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={reset}
          leftIcon={<RotateCw size={16} />}
          className="mt-6"
        >
          Try again
        </Button>
      </div>
    </main>
  )
}
