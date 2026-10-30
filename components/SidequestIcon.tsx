import { Flame, Landmark, Drama, Trees, type LucideProps } from 'lucide-react'
import type { SidequestIcon as IconKey } from '@/types'

const ICONS = { flame: Flame, landmark: Landmark, drama: Drama, trees: Trees } as const

export default function SidequestIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = ICONS[icon]
  return <Icon aria-hidden="true" {...props} />
}
