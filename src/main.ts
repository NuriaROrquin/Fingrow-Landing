import "./styles/tokens.css"
import "./styles/base.css"
import "./styles/sections.css"

import { ScrollTrigger, startSmoothScroll } from "./motion"
import { initDemo } from "./sections/demo"
import { initHealth } from "./sections/health"
import { initHero } from "./sections/hero"
import { initLinks, initNav } from "./sections/nav"
import { initCompany, initCta, initFaq, initSteps } from "./sections/outro"
import { initMarquee, initReveal } from "./sections/reveal"
import { initSprings } from "./sections/springs"
import { initTextReveals } from "./sections/text"
import { initTour } from "./sections/tour"

function hideMissingImages() {
  document.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
    const markMissing = () => {
      if (image.classList.contains("float-card")) {
        image.remove()
      } else {
        image.classList.add("is-missing")
      }
    }
    if (image.complete && image.naturalWidth === 0 && image.getAttribute("src")) markMissing()
    else image.addEventListener("error", markMissing, { once: true })
  })
}

function boot() {
  hideMissingImages()
  initLinks()
  startSmoothScroll()
  initNav()
  initHero()
  initReveal()
  initMarquee()
  initDemo()
  initTour()
  initHealth()
  initCompany()
  initSteps()
  initFaq()
  initCta()
  initTextReveals()
  initSprings()

  document.fonts.ready.then(() => ScrollTrigger.refresh())
  window.addEventListener("load", () => ScrollTrigger.refresh())

  let lastWidth = document.documentElement.clientWidth
  let refreshTimer = 0
  new ResizeObserver(() => {
    const width = document.documentElement.clientWidth
    if (width === lastWidth) return
    lastWidth = width
    window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250)
  }).observe(document.documentElement)
}

boot()
