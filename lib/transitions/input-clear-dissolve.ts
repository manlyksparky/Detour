/**
 * "Input clear with dissolve" from transitions.dev
 * https://transitions.dev/detail.html?t=input-clear-with-dissolve
 *
 * The typed text flies down, blurs and fades while a soft streak ignites
 * under each word and the placeholder falls in from above. The envelope of
 * the streak cannot be a static keyframe, so this runs per frame. Timing,
 * distance and blur are read from the `--clear-*` and `--glow-*` variables
 * in app/globals.css on every call, so tuning there applies on the next
 * clear without a reload.
 */

export interface DissolveTargets {
  /** The .t-clear wrapper, sized like the text area of the field */
  wrap: HTMLElement
  input: HTMLInputElement
  mirror: HTMLElement
  placeholder: HTMLElement
  glow: HTMLElement
}

export interface DissolveOptions {
  /** The text that was in the field; the mirror shows it while it flies out */
  text: string
  /** Streak colour as "r,g,b"; light surfaces multiply, so use the ink */
  rgb?: string
  onDone?: () => void
}

const root = () => document.documentElement

const num = (name: string, fallback: number): number => {
  const v = parseFloat(getComputedStyle(root()).getPropertyValue(name))
  return Number.isFinite(v) ? v : fallback
}

/** Minimal cubic-bezier(x1,y1,x2,y2) sampler so the JS easing matches CSS. */
function bezier(str: string): (t: number) => number {
  const m = String(str).match(/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/)
  if (!m) return (t) => t
  const [x1, y1, x2, y2] = m.slice(1).map(parseFloat)
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  return (t) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    let s = t
    for (let i = 0; i < 8; i++) {
      const dx = ((ax * s + bx) * s + cx) * s - t
      const d = (3 * ax * s + 2 * bx) * s + cx
      if (Math.abs(dx) < 1e-6 || d === 0) break
      s -= dx / d
    }
    return ((ay * s + by) * s + cy) * s
  }
}

let measure: CanvasRenderingContext2D | null = null

/** One radial-gradient stack per word, anchored to the bottom of the field. */
function buildGlow(wrap: HTMLElement, input: HTMLInputElement, text: string, rgb: string): string {
  measure ??= document.createElement('canvas').getContext('2d')
  if (!measure) return ''
  measure.font = getComputedStyle(input).font
  const w = wrap.clientWidth || 280
  const padLeft = parseFloat(getComputedStyle(input).paddingLeft) || 0
  const spread = num('--glow-spread', 1.5)
  const layers: string[] = []
  let x = 0
  text.split(/(\s+)/).forEach((seg) => {
    const segW = measure!.measureText(seg).width
    if (seg.trim()) {
      const cx = padLeft + x + segW / 2
      const hw = Math.max(segW * 0.45, 8) * spread
      const parts: [number, number, number, number][] = [
        [0, 0.8, 7, 0.22],
        [hw * 0.45, 0.55, 8, 0.18],
        [-hw * 0.4, 0.65, 6, 0.16],
        [hw * 0.15, 0.9, 5, 0.14],
      ]
      parts.forEach(([dx, rwm, rh, a]) => {
        const lx = (((cx + dx) / w) * 100).toFixed(2)
        layers.push(
          `radial-gradient(ellipse ${Math.max(hw * rwm, 2).toFixed(1)}px ${rh}px at ${lx}% 100%, rgba(${rgb},${a}), transparent)`
        )
      })
    }
    x += segW
  })
  return layers.join(', ')
}

/**
 * Run the dissolve. The caller has already emptied the input's value and
 * will keep the mirror's text equal to `text` until `onDone` fires.
 * Returns a cancel function for unmounts.
 */
export function runInputClearDissolve(
  { wrap, input, mirror, placeholder, glow }: DissolveTargets,
  { text, rgb = '28,25,23', onDone }: DissolveOptions
): () => void {
  const total = num('--clear-dur', 1000)
  const outDur = num('--clear-out-dur', 400)
  const inDur = num('--clear-in-dur', 400)
  const outFly = num('--clear-out-fly', 12)
  const inFly = num('--clear-in-fly', 12)
  const blur = num('--clear-blur', 2)
  const delay = num('--glow-delay', 50)
  const peakAt = num('--glow-peak-at', 0.15)
  const gOp = num('--glow-opacity', 0.42)
  const easeOut = bezier(getComputedStyle(root()).getPropertyValue('--clear-out-ease'))
  const easeIn = bezier(getComputedStyle(root()).getPropertyValue('--clear-in-ease'))

  wrap.classList.add('is-clearing')
  glow.style.background = buildGlow(wrap, input, text, rgb)
  glow.style.opacity = '0'
  placeholder.style.transform = `translateY(-${inFly}px)`
  placeholder.style.opacity = '0.9'
  placeholder.style.filter = `blur(${blur}px)`

  let frame = 0
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    wrap.classList.remove('is-clearing')
    mirror.style.cssText = ''
    placeholder.style.cssText = ''
    glow.style.opacity = '0'
    glow.style.background = ''
    onDone?.()
  }

  const t0 = performance.now()
  const tick = (now: number) => {
    const el = now - t0
    const eo = easeOut(Math.min(1, el / outDur))
    mirror.style.transform = `translateY(${(eo * outFly).toFixed(1)}px)`
    mirror.style.opacity = (1 - eo).toFixed(3)
    mirror.style.filter = `blur(${(eo * blur).toFixed(1)}px)`

    const ei = easeIn(Math.min(1, el / inDur))
    placeholder.style.transform = `translateY(${(-inFly + ei * inFly).toFixed(1)}px)`
    placeholder.style.opacity = (0.9 + ei * 0.1).toFixed(3)
    placeholder.style.filter = `blur(${(blur - ei * blur).toFixed(1)}px)`

    let g = 0
    if (el > delay) {
      const gp = Math.min(1, (el - delay) / Math.max(1, total - delay))
      g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt)
    }
    glow.style.opacity = (g * gOp).toFixed(3)

    if (el < total) frame = requestAnimationFrame(tick)
    else finish()
  }
  frame = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frame)
    finish()
  }
}
