import { gsap, prefersReducedMotion } from "../motion"

export function initReveal() {
  const stage = document.querySelector<HTMLElement>("[data-reveal-stage]")
  const screen = document.querySelector<HTMLElement>("[data-reveal-screen]")
  if (!stage || !screen || prefersReducedMotion) return

  gsap.fromTo(
    screen,
    { rotateX: 28, scale: 0.84, y: 40 },
    {
      rotateX: 0,
      scale: 1,
      y: 0,
      ease: "none",
      scrollTrigger: { trigger: stage, start: "top 92%", end: "top 18%", scrub: 0.6 },
    },
  )

  stage.querySelectorAll<HTMLElement>("[data-float]").forEach((card, index) => {
    const distance = Number(card.dataset.float ?? -80)
    gsap.fromTo(
      card,
      { autoAlpha: 0, x: index % 2 === 0 ? -50 : 50 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: stage, start: "top 45%", once: true },
      },
    )
    gsap.to(card, {
      y: distance,
      ease: "none",
      scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", scrub: true },
    })
  })
}

export function initMarquee() {
  const marquee = document.querySelector<HTMLElement>("[data-marquee]")
  const track = marquee?.querySelector<HTMLElement>(".marquee__track")
  if (!marquee || !track) return

  const clone = track.cloneNode(true) as HTMLElement
  clone.setAttribute("aria-hidden", "true")
  marquee.appendChild(clone)

  if (prefersReducedMotion) return

  const loop = gsap.to(marquee, { xPercent: -50, duration: 38, ease: "none", repeat: -1 })
  let settle: gsap.core.Tween | null = null

  gsap.timeline({
    scrollTrigger: {
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const boost = Math.min(Math.abs(self.getVelocity()) / 260, 5)
        const direction = self.direction === -1 ? -1 : 1
        settle?.kill()
        loop.timeScale(direction * (1 + boost))
        settle = gsap.to(loop, { timeScale: direction, duration: 0.9, ease: "power2.out", delay: 0.05 })
      },
    },
  })
}
