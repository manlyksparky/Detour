import Link from 'next/link'
import { NotFound } from '@/components/ui/not-found'

export default function NotFoundPage() {
  return (
    <NotFound
      LinkComponent={Link}
      homeHref="/"
      homeLabel="Back to the map"
      title="This page took a wrong turn."
      description="There is nothing at this address. Head back to the map and pick a direction."
      documentTitle="Page not found · Detour"
    />
  )
}
