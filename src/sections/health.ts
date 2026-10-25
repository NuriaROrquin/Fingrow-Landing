import { gsap, prefersReducedMotion } from "../motion"
import { springNeedle } from "./springs"

const BANDS = [
  { from: 80, name: "Saludable", color: "var(--band-healthy)" },
  { from: 60, name: "Estable", color: "var(--band-stable)" },
  { from: 40, name: "Frágil", color: "var(--band-fragile)" },
  { from: 0, name: "Crítica", color: "var(--band-critical)" },
]

const SEGMENTS = [
  { selector: ".gauge__seg--critical", start: 0, length: 39 },
  { selector: ".gauge__seg--fragile", start: 40, length: 19 },
  { selector: ".gauge__seg--stable", start: 60, length: 19 },
  { selector: ".gauge__seg--healthy", start: 80, length: 20 },
]

const START_SCORE = 31
const END_SCORE = 84

export function initHealth() {
  const section = document.querySelector<HTMLElement>("[data-health]")
  const needle = section?.querySelector<SVGLineElement>("[data-gauge-needle]")
  const value = section?.querySelector<HTMLElement>("[data-gauge-value]")
  const band = section?.querySelector<HTMLElement>("[data-gauge-band]")
  const factors = section?.querySelector<HTMLElement>("[data-factors]")
  if (!section || !needle || !value || !band || !factors) return

  const angleOf = (score: number) => -90 + score * 1.8
  const setNeedle = prefersReducedMotion
    ? (angle: number) => (needle.style.transform = `rotate(${angle}deg)`)
    : springNeedle(needle, angleOf(START_SCORE))

  const render = (score: number) => {
    const rounded = Math.round(score)
    const current = BANDS.find((b) => rounded >= b.from)!
    setNeedle(angleOf(score))
    value.textContent = String(rounded)
    if (band.textContent !== current.name) band.textContent = current.name
    band.style.setProperty("--band-color", current.color)
  }

  const segments = SEGMENTS.map((segment) => {
    const path = section.querySelector<SVGPathElement>(segment.selector)!
    path.style.strokeDashoffset = String(-segment.start)
    return { path, length: segment.length }
  })

  const bars = factors.querySelectorAll<HTMLElement>(".bar > span")

  if (prefersReducedMotion) {
    segments.forEach(({ path, length }) => (path.style.strokeDasharray = `${length} 100`))
    render(END_SCORE)
    return
  }

  render(START_SCORE)

  const draw = gsap.timeline({ scrollTrigger: { trigger: section, start: "top 70%", once: true } })
  segments.forEach(({ path, length }, index) => {
    draw.fromTo(
      path,
      { strokeDasharray: "0 100" },
      { strokeDasharray: `${length} 100`, duration: 0.5, ease: "power2.out" },
      index * 0.18,
    )
  })
  draw.from(bars, { scaleX: 0, transformOrigin: "left center", duration: 1, ease: "expo.out", stagger: 0.12 }, 0.3)

  const score = { value: START_SCORE }
  gsap.to(score, {
    value: END_SCORE,
    ease: "none",
    onUpdate: () => render(score.value),
    scrollTrigger: { trigger: section, start: "top 55%", end: "bottom 70%", scrub: 0.8 },
  })
}
