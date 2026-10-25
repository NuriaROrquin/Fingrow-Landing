import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger, SplitText)

export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

export { gsap, ScrollTrigger, SplitText }

let lenis: Lenis | null = null

export function startSmoothScroll() {
  if (prefersReducedMotion) return null
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
  lenis.on("scroll", ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function scrollToTarget(target: HTMLElement | number) {
  if (lenis) {
    lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -72, duration: 1.4 })
    return
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target })
  } else {
    target.scrollIntoView({ block: "start" })
  }
}
