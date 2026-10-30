'use client'

import { MotionConfig } from 'framer-motion'

/**
 * One switch for every framer-motion animation in the app: visitors who ask
 * the OS for less motion get instant transforms and layout changes while
 * opacity fades stay, so nothing pops in without a cue.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
