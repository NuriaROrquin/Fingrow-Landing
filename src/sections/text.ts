import { gsap, prefersReducedMotion, SplitText } from "../motion"

export function splitHeading(element: HTMLElement, onReady: (words: Element[]) => gsap.core.Animation | void) {
  return SplitText.create(element, {
    type: "lines,words",
    linesClass: "split-line",
    wordsClass: "split-word",
    mask: "lines",
    autoSplit: true,
    onSplit: (self) => onReady(self.words),
  })
}

export function initTextReveals() {
  if (prefersReducedMotion) return

  document.querySelectorAll<HTMLElement>("[data-split]").forEach((heading) => {
    if (heading.closest("[data-hero]")) return
    splitHeading(heading, (words) =>
      gsap.from(words, {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.045,
        scrollTrigger: { trigger: heading, start: "top 86%", once: true },
      }),
    )
  })

  document.querySelectorAll<HTMLElement>("[data-fade]").forEach((element) => {
    gsap.from(element, {
      y: 28,
      autoAlpha: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: element, start: "top 88%", once: true },
    })
  })

  document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((list) => {
    gsap.from(list.children, {
      y: 32,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: list, start: "top 84%", once: true },
    })
  })
}
