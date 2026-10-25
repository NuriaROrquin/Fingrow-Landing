import { LEAF_PATHS } from "../config"
import { gsap, prefersReducedMotion } from "../motion"
import { bloom } from "./springs"

export function initCompany() {
  const shots = document.querySelector<HTMLElement>("[data-company]")
  const second = document.querySelector<HTMLElement>("[data-company-second]")
  if (!shots || !second || prefersReducedMotion) return

  gsap.fromTo(
    shots.firstElementChild,
    { y: 60, rotate: -1.5 },
    { y: 0, rotate: 0, ease: "none", scrollTrigger: { trigger: shots, start: "top bottom", end: "top 30%", scrub: 0.6 } },
  )
  gsap.fromTo(
    second,
    { y: 140, x: 40, autoAlpha: 0 },
    {
      y: -20,
      x: 0,
      autoAlpha: 1,
      ease: "none",
      scrollTrigger: { trigger: shots, start: "top 80%", end: "bottom 50%", scrub: 0.8 },
    },
  )
}

export function initSteps() {
  const section = document.querySelector<HTMLElement>("[data-steps]")
  const path = section?.querySelector<SVGPathElement>("[data-steps-path]")
  if (!section || !path || prefersReducedMotion) return

  const length = path.getTotalLength()
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

  const tl = gsap.timeline({ scrollTrigger: { trigger: section.querySelector(".steps__track"), start: "top 75%", once: true } })
  tl.to(path, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" })
  tl.from(
    section.querySelectorAll(".step"),
    { y: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.25 },
    0.1,
  )
  tl.from(
    section.querySelectorAll(".step__dot"),
    { scale: 0, duration: 0.7, ease: "expo.out", stagger: 0.25 },
    0.15,
  )
}

export function initFaq() {
  const list = document.querySelector<HTMLElement>("[data-faq]")
  if (!list) return

  list.querySelectorAll<HTMLDetailsElement>("details").forEach((details) => {
    const summary = details.querySelector("summary")!
    const body = details.querySelector<HTMLElement>(".faq__body")!
    summary.addEventListener("click", (event) => {
      if (prefersReducedMotion) return
      event.preventDefault()
      if (details.open) {
        gsap.to(body, {
          height: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            details.open = false
            gsap.set(body, { clearProps: "height" })
          },
        })
      } else {
        details.open = true
        gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.5, ease: "power3.out" })
      }
    })
  })
}

export function initCta() {
  const sprout = document.querySelector<SVGSVGElement>("[data-sprout]")
  if (!sprout || prefersReducedMotion) return

  const leaves = Array.from(sprout.querySelectorAll("path"))
  leaves.forEach((leaf, index) => gsap.set(leaf, { svgOrigin: LEAF_PATHS[index].base }))
  gsap.set(leaves, { scale: 0 })

  gsap.to(leaves, {
    scale: 1,
    duration: 1.3,
    ease: "expo.out",
    stagger: { each: 0.14, from: "end" },
    scrollTrigger: { trigger: sprout, start: "top 85%", once: true },
    onComplete: () => bloom(sprout, sprout, 22),
  })
}
