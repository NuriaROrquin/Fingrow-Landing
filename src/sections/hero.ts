import { LEAF_PATHS, LEAF_VIEWBOX } from "../config"
import { gsap, prefersReducedMotion, ScrollTrigger } from "../motion"
import type { LeafField } from "../scene/leaf-field"
import { splitHeading } from "./text"

function showStaticMark(hero: HTMLElement) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", `0 0 ${LEAF_VIEWBOX.width} ${LEAF_VIEWBOX.height}`)
  svg.setAttribute("aria-hidden", "true")
  svg.classList.add("hero__fallback")
  LEAF_PATHS.forEach((leaf) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("d", leaf.d)
    path.setAttribute("fill", leaf.color)
    svg.appendChild(path)
  })
  hero.appendChild(svg)
}

function playIntro(hero: HTMLElement, title: HTMLElement) {
  const intro = gsap.timeline({ delay: 0.1 })

  splitHeading(title, (words) => {
    const tween = gsap.from(words, { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.06 })
    intro.add(tween, 0.1)
    return tween
  })

  intro.from(
    hero.querySelectorAll("[data-hero-fade]"),
    { y: 24, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.1 },
    0.5,
  )

  gsap.to(hero.querySelector(".hero__inner"), {
    yPercent: -12,
    autoAlpha: 0,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "20% top", end: "85% top", scrub: true },
  })
}

function animateField(hero: HTMLElement, canvas: HTMLCanvasElement, field: LeafField) {
  gsap.to(field.uniforms.uMorph, { value: 1, duration: 3, ease: "power3.inOut", delay: 0.1 })

  let running = true
  const tick = (time: number) => field.render(time)
  gsap.ticker.add(tick)

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onToggle: (self) => {
      if (self.isActive && !running) {
        gsap.ticker.add(tick)
        running = true
      } else if (!self.isActive && running) {
        gsap.ticker.remove(tick)
        running = false
      }
    },
  })

  gsap.to(field.uniforms.uChart, {
    value: 1,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom 15%", scrub: 0.8 },
  })

  gsap.to(canvas, {
    yPercent: 18,
    autoAlpha: 0.15,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "35% top", end: "bottom top", scrub: true },
  })

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect()
    field.setPointer((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5)
  })
  hero.addEventListener("pointerleave", () => field.setPointer(0, 0))
}

export async function initHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]")
  const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-canvas]")
  const title = hero?.querySelector<HTMLElement>("[data-split]")
  if (!hero || !canvas || !title) return

  if (!prefersReducedMotion) playIntro(hero, title)

  const { createLeafField } = await import("../scene/leaf-field")
  const field = createLeafField(canvas)
  if (!field) {
    canvas.remove()
    showStaticMark(hero)
    return
  }

  let resizeFrame = 0
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      field.resize()
      if (prefersReducedMotion) field.render(0)
    })
  })

  if (prefersReducedMotion) {
    field.uniforms.uMorph.value = 1
    field.render(0)
    return
  }

  animateField(hero, canvas, field)
}
