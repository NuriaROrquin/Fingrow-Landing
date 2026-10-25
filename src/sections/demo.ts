import { gsap, prefersReducedMotion, ScrollTrigger } from "../motion"

const BUDGET_LIMIT = 260000
const BUDGET_START = 142000
const SUPERMARKET = 18400

const pesos = (value: number) => `$ ${value.toLocaleString("es-AR")}`

const pendingLabel = (count: number) =>
  `${count} ${count === 1 ? "movimiento pendiente" : "movimientos pendientes"}`

export function initDemo() {
  const stage = document.querySelector<HTMLElement>("[data-demo]")
  if (!stage) return

  const query = (selector: string) => stage.querySelector<HTMLElement>(selector)!
  const messages = (n: number) => query(`[data-msg="${n}"]`)
  const typing = (n: number) => query(`[data-typing="${n}"]`)
  const row = (n: number) => query(`[data-row="${n}"]`)
  const count = query("[data-demo-count]")
  const status = query("[data-demo-status]")
  const budget = query("[data-demo-budget]")
  const budgetLabel = query("[data-demo-budget-label]")
  const cursor = query("[data-demo-cursor]")
  const flyer = query("[data-demo-flyer]")
  const inbox = query("[data-demo-inbox]")
  const chatItems = stage.querySelectorAll<HTMLElement>("[data-msg], [data-typing]")
  const rows = [row(1), row(2), row(3)]

  const setBudget = (spent: number) => {
    budgetLabel.textContent = `${pesos(spent)} de ${pesos(BUDGET_LIMIT)}`
  }

  if (prefersReducedMotion) {
    stage.querySelectorAll<HTMLElement>("[data-typing]").forEach((item) => (item.style.display = "none"))
    count.textContent = pendingLabel(3)
    return
  }

  const reset = () => {
    gsap.set(chatItems, { display: "none", autoAlpha: 0, y: 0, scale: 1 })
    gsap.set(rows, { clearProps: "all" })
    gsap.set(rows, { autoAlpha: 0, x: 24 })
    stage.querySelectorAll<HTMLElement>(".row__ok").forEach((button) => {
      button.textContent = "Revisar"
      button.classList.remove("is-done")
    })
    gsap.set(stage.querySelectorAll(".row__ok"), { autoAlpha: 0, scale: 1 })
    gsap.set(cursor, { autoAlpha: 0, x: 0, y: 0 })
    gsap.set(flyer, { autoAlpha: 0 })
    gsap.set(budget, { width: `${(BUDGET_START / BUDGET_LIMIT) * 100}%` })
    setBudget(BUDGET_START)
    count.textContent = pendingLabel(0)
    status.textContent = "en línea"
  }

  const center = (element: Element, container: Element = stage) => {
    const box = element.getBoundingClientRect()
    const origin = container.getBoundingClientRect()
    return { x: box.left - origin.left + box.width / 2, y: box.top - origin.top + box.height / 2 }
  }

  const fly = (from: Element, to: Element) => {
    const start = center(from)
    const end = center(to)
    gsap.fromTo(
      flyer,
      { x: start.x - 7, y: start.y - 7, autoAlpha: 1, scale: 1 },
      {
        keyframes: [
          { x: (start.x + end.x) / 2 - 7, y: Math.min(start.y, end.y) - 80, duration: 0.35, ease: "power1.out" },
          { x: end.x - 7, y: end.y - 7, duration: 0.35, ease: "power1.in" },
          { scale: 2.4, autoAlpha: 0, duration: 0.3, ease: "power2.out" },
        ],
      },
    )
  }

  const moveCursor = (target: Element, offsetX = 0) => {
    const point = center(target, inbox)
    gsap.to(cursor, { x: point.x - 4 + offsetX, y: point.y - 2, duration: 0.7, ease: "power2.inOut" })
  }

  const showMessage = (tl: gsap.core.Timeline, element: HTMLElement, at?: string | number) => {
    tl.set(element, { display: element.classList.contains("msg--audio") || element.classList.contains("msg--typing") ? "flex" : "block" }, at)
    tl.fromTo(element, { autoAlpha: 0, y: 14, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "expo.out" })
  }

  const botReply = (tl: gsap.core.Timeline, typingIndex: number, message: HTMLElement) => {
    tl.call(() => {
      status.textContent = "escribiendo..."
    })
    showMessage(tl, typing(typingIndex))
    tl.to({}, { duration: 0.9 })
    tl.set(typing(typingIndex), { display: "none" })
    tl.call(() => {
      status.textContent = "en línea"
    })
    showMessage(tl, message)
  }

  const propose = (tl: gsap.core.Timeline, from: () => Element, rowIndex: number) => {
    tl.call(() => fly(from(), rows[rowIndex - 1]), undefined, "+=0.15")
    tl.to({}, { duration: 0.75 })
    tl.to(rows[rowIndex - 1], { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out" })
    tl.call(() => {
      count.textContent = pendingLabel(rowIndex)
    })
  }

  const confirm = (tl: gsap.core.Timeline, rowIndex: number, remaining: number, onConfirm?: () => void) => {
    const target = rows[rowIndex - 1]
    const button = target.querySelector(".row__ok")!
    tl.call(() => moveCursor(button, 10))
    tl.to({}, { duration: 0.75 })
    tl.to(button, { autoAlpha: 1, duration: 0.2 })
    tl.to(cursor, { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1 })
    tl.to(button, { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, "<")
    tl.call(() => {
      button.textContent = "✓ Confirmado"
      button.classList.add("is-done")
    })
    tl.to(target, { x: 60, autoAlpha: 0, duration: 0.4, ease: "power2.in" }, "+=0.45")
    tl.to(target, { height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, borderWidth: 0, duration: 0.35, ease: "power2.inOut" })
    tl.call(() => {
      count.textContent = pendingLabel(remaining)
      onConfirm?.()
    })
  }

  const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6, onRepeat: reset })
  reset()

  showMessage(tl, messages(1), 0.4)
  botReply(tl, 1, messages(2))
  propose(tl, () => messages(2).querySelector(".msg__card")!, 1)

  showMessage(tl, messages(3), "+=0.5")
  botReply(tl, 2, messages(4))
  propose(tl, () => messages(4), 2)

  showMessage(tl, messages(5), "+=0.5")
  botReply(tl, 3, messages(6))
  propose(tl, () => messages(6), 3)

  tl.call(() => {
    const point = center(inbox, inbox)
    gsap.set(cursor, { x: point.x + 60, y: point.y + 120 })
  }, undefined, "+=0.4")
  tl.to(cursor, { autoAlpha: 1, duration: 0.3 })

  confirm(tl, 1, 2, () => {
    setBudget(BUDGET_START + SUPERMARKET)
    gsap.to(budget, { width: `${((BUDGET_START + SUPERMARKET) / BUDGET_LIMIT) * 100}%`, duration: 0.8, ease: "power3.out" })
  })
  confirm(tl, 2, 1)
  confirm(tl, 3, 0)

  tl.to(cursor, { autoAlpha: 0, duration: 0.3 }, "+=0.4")
  tl.to(chatItems, { autoAlpha: 0, duration: 0.5 }, "+=1.6")

  ScrollTrigger.create({
    trigger: stage,
    start: "top 75%",
    end: "bottom 15%",
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
  })
}
