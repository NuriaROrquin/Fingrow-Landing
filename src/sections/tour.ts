import { gsap, ScrollTrigger, scrollToTarget } from "../motion"

const STACK_GAP = 34
const HOLD_AT_END = 0.6

const stackState = (depth: number) => ({
  x: 0,
  y: -depth * STACK_GAP,
  rotation: 0,
  scale: 1 - depth * 0.06,
  autoAlpha: depth > 2 ? 0 : 1,
  "--dim": Math.min(depth * 0.16, 0.48),
})

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

type Chapter = { item: HTMLLIElement; button: HTMLButtonElement; fill: HTMLElement; text: HTMLElement }

function buildNav(nav: HTMLElement, cards: HTMLElement[]): Chapter[] {
  return cards.map((card, index) => {
    const caption = card.querySelector("figcaption")!
    const item = document.createElement("li")
    item.className = "chapter"

    const button = document.createElement("button")
    button.type = "button"
    button.className = "chapter__button"
    const number = document.createElement("span")
    number.className = "chapter__index"
    number.textContent = String(index + 1).padStart(2, "0")
    const name = document.createElement("span")
    name.className = "chapter__name"
    name.textContent = caption.querySelector("h3")!.textContent
    const bar = document.createElement("span")
    bar.className = "chapter__bar"
    const fill = document.createElement("i")
    bar.appendChild(fill)
    button.append(number, name, bar)

    const text = document.createElement("div")
    text.className = "chapter__text"
    const inner = document.createElement("span")
    inner.textContent = caption.querySelector("p")!.textContent
    text.appendChild(inner)

    item.append(button, text)
    nav.appendChild(item)
    return { item, button, fill, text }
  })
}

function setupDeck(section: HTMLElement, pin: HTMLElement, digits: HTMLElement, cards: HTMLElement[], chapters: Chapter[]) {
  section.classList.add("tour--deck")
  const total = cards.length
  const spots = cards.map((card) => card.querySelector<HTMLElement>(".spot")!)
  const labels = cards.map((card) => card.querySelector<HTMLElement>(".spot-label")!)

  cards.forEach((card, index) => {
    card.style.zIndex = String(total - index)
    gsap.set(card, stackState(index))
  })
  gsap.set(spots, { autoAlpha: 0, scale: 1.12 })
  gsap.set(labels, { autoAlpha: 0, y: 12 })

  const deal = gsap.timeline({ defaults: { ease: "power2.out" } })
  cards.forEach((card, index) => {
    deal.to(spots[index], { autoAlpha: 1, scale: 1, duration: 0.25 }, index + 0.05)
    deal.to(labels[index], { autoAlpha: 1, y: 0, duration: 0.2 }, index + 0.15)
    if (index === total - 1) return
    deal.to([spots[index], labels[index]], { autoAlpha: 0, duration: 0.12 }, index + 0.62)
    deal.to(card, { x: "-34%", y: -80, rotation: -8, duration: 0.36, ease: "power2.in" }, index + 0.64)
    deal.to(card, { autoAlpha: 0, duration: 0.2, ease: "power1.in" }, index + 0.7)
    for (let next = index + 1; next < total; next++) {
      deal.to(cards[next], { ...stackState(next - index - 1), duration: 0.36, ease: "power3.inOut" }, index + 0.64)
    }
  })
  deal.to({}, { duration: HOLD_AT_END })

  let active = -1
  const activate = (index: number) => {
    if (index === active) return
    const previous = chapters[active]
    active = index
    chapters.forEach((chapter, i) => chapter.item.classList.toggle("is-active", i === index))
    if (previous) gsap.to(previous.text, { height: 0, duration: 0.35, ease: "power2.inOut", overwrite: true })
    gsap.to(chapters[index].text, { height: "auto", duration: 0.5, ease: "power3.out", overwrite: true })
    gsap.to(digits, { yPercent: (-100 / total) * index, duration: 0.7, ease: "expo.out", overwrite: true })
  }

  const lastLength = deal.duration() - (total - 1)
  const sync = () => {
    const time = deal.time()
    chapters.forEach((chapter, i) => {
      const progress = i === total - 1 ? (time - i) / lastLength : time - i
      gsap.set(chapter.fill, { scaleX: clamp01(progress) })
    })
    activate(Math.min(total - 1, Math.floor(time)))
  }
  deal.eventCallback("onUpdate", sync)
  sync()

  const trigger = ScrollTrigger.create({
    trigger: pin,
    start: "top top",
    end: () => `+=${window.innerHeight * 0.85 * total}`,
    pin: true,
    scrub: 0.7,
    animation: deal,
    invalidateOnRefresh: true,
  })

  const jumps = chapters.map((chapter, index) => {
    const jump = () => {
      const progress = (index + 0.4) / deal.duration()
      scrollToTarget(trigger.start + (trigger.end - trigger.start) * progress)
    }
    chapter.button.addEventListener("click", jump)
    return () => chapter.button.removeEventListener("click", jump)
  })

  return () => {
    jumps.forEach((remove) => remove())
    section.classList.remove("tour--deck")
    cards.forEach((card) => (card.style.zIndex = ""))
    chapters.forEach((chapter) => chapter.item.classList.remove("is-active"))
  }
}

function setupCarousel(stage: HTMLElement, cards: HTMLElement[], animated: boolean) {
  if (!animated) return
  const spots = cards.map((card) => card.querySelectorAll<HTMLElement>(".spot, .spot-label"))
  spots.forEach((group) => gsap.set(group, { autoAlpha: 0, scale: 1.08 }))

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const index = cards.indexOf(entry.target as HTMLElement)
        gsap.to(spots[index], { autoAlpha: 1, scale: 1, duration: 0.6, ease: "expo.out", stagger: 0.12, delay: 0.15 })
        observer.unobserve(entry.target)
      }),
    { root: stage, threshold: 0.6 },
  )
  cards.forEach((card) => observer.observe(card))
  return () => observer.disconnect()
}

export function initTour() {
  const section = document.querySelector<HTMLElement>("[data-tour]")
  const pin = section?.querySelector<HTMLElement>("[data-tour-pin]")
  const nav = section?.querySelector<HTMLElement>("[data-tour-nav]")
  const stage = section?.querySelector<HTMLElement>("[data-tour-stage]")
  const digits = section?.querySelector<HTMLElement>("[data-tour-digits]")
  if (!section || !pin || !nav || !stage || !digits) return

  const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-tour-card]"))
  const chapters = buildNav(nav, cards)

  gsap.matchMedia().add(
    {
      deck: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      motion: "(prefers-reduced-motion: no-preference)",
    },
    (context) => {
      const { deck, motion } = context.conditions as { deck: boolean; motion: boolean }
      return deck ? setupDeck(section, pin, digits, cards, chapters) : setupCarousel(stage, cards, motion)
    },
  )
}
