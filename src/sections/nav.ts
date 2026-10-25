import { APP_URL, CONTACT_EMAIL, CONTACT_SUBJECT } from "../config"
import { ScrollTrigger, scrollToTarget } from "../motion"

export function initLinks() {
  document.querySelectorAll<HTMLAnchorElement>("[data-app-link]").forEach((link) => {
    link.href = APP_URL
  })

  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`
  document.querySelectorAll<HTMLAnchorElement>("[data-contact-link]").forEach((link) => {
    link.href = mailto
  })
  document.querySelectorAll<HTMLElement>("[data-contact-email]").forEach((element) => {
    element.textContent = CONTACT_EMAIL
  })
  document.querySelectorAll<HTMLElement>("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear())
  })
}

export function initNav() {
  const nav = document.querySelector<HTMLElement>("[data-nav]")
  const toggle = document.querySelector<HTMLButtonElement>("[data-menu-toggle]")
  const menu = document.querySelector<HTMLElement>("[data-menu]")
  if (!nav || !toggle || !menu) return

  const setMenu = (open: boolean) => {
    toggle.setAttribute("aria-expanded", String(open))
    toggle.querySelector(".sr-only")!.textContent = open ? "Cerrar menú" : "Abrir menú"
    menu.hidden = !open
    nav.classList.toggle("is-scrolled", open || window.scrollY > 40)
  }

  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"))

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setMenu(false)
      toggle.focus()
    }
  })

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")!.slice(1)
      const target = id === "top" ? 0 : document.getElementById(id)
      if (target === null) return
      event.preventDefault()
      setMenu(false)
      scrollToTarget(target)
      if (typeof target !== "number") {
        target.setAttribute("tabindex", "-1")
        target.focus({ preventScroll: true })
      }
    })
  })

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const y = self.scroll()
      const menuOpen = !menu.hidden
      nav.classList.toggle("is-scrolled", menuOpen || y > 40)
      nav.classList.toggle("is-hidden", !menuOpen && self.direction === 1 && y > window.innerHeight * 0.9)
    },
  })
}
