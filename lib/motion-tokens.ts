import type { Transition } from "framer-motion";

/**
 * EasyUI Motion Design Tokens
 * Philosophy: Soft + physical + immediate + controlled
 *
 * Tuning philosophy (Apple HIG-inspired):
 *  - Critical-damping ratio around 0.85-1.0 for buttery, never-bouncy motion.
 *  - Stiffness chosen so the spring reaches ~95% of the target in 350-450ms.
 *  - Mass kept low (0.4-0.8) so motion feels light and immediate.
 *  - Stagger and duration for choreographed reveals.
 */

export const motionTransitions = {
  // Gentle fluid transitions (for tabs, smooth accordion, dialog fades)
  // ~400ms to settle, near-critical damping — no overshoot, no oscillation.
  springGentle: {
    type: "spring",
    stiffness: 170,
    damping: 26,
    mass: 0.9,
  } as Transition,

  // Smooth standard motion
  // Slightly underdamped (~0.85) for the slightest organic feel on cards.
  springSmooth: {
    type: "spring",
    stiffness: 200,
    damping: 28,
    mass: 0.85,
  } as Transition,

  // Snappy responsive feedback (for buttons, hover indicators, dock icons)
  // High stiffness, low mass — settles in ~200ms with a subtle settle.
  springSnappy: {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.5,
  } as Transition,

  // Morphing shared layout (for layoutId dialogs, expanding search, tabs background)
  // Tuned to feel continuous — long settle, no overshoot, like a fluid surface.
  springMorph: {
    type: "spring",
    stiffness: 220,
    damping: 32,
    mass: 1.0,
  } as Transition,

  // Responsive bounce physics (for magnetic pull return, toasts stack)
  // Slightly underdamped for that tiny satisfying overshoot.
  springResponsive: {
    type: "spring",
    stiffness: 320,
    damping: 24,
    mass: 0.7,
  } as Transition,

  // Soft spring for natural-feeling follow / smoothing
  // (used as a default in useSpring when the caller didn't specify)
  springSoft: {
    type: "spring",
    stiffness: 150,
    damping: 22,
    mass: 0.9,
  } as Transition,

  // Subtle ease for standard property transitions (color, opacity)
  // Custom cubic-bezier similar to Apple's "emphasized" curve.
  easeSoft: {
    duration: 0.32,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  // Snappy ease for fast property transitions
  easeFast: {
    duration: 0.2,
    ease: [0.2, 0, 0, 1],
  } as Transition,

  // Exponential ease-out for page-level moments (intro exit, sheet settle)
  easeOutExpo: {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,
};

/* ─── Detour additions ─────────────────────────────────────
 * Kept alongside the EasyUI tokens so both the EasyUI components in
 * components/ui and Detour's own screens animate with one voice. */

/** True when the visitor has asked the OS for less motion. Safe on the server. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Map camera duration that respects reduced motion. */
export function cameraDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
