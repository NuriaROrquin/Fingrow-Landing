import { hover, motionValue, press, springValue, type MotionValue, type SpringOptions } from "motion"
import { animate } from "motion/mini"
import { LEAF_PATHS } from "../config"
import { prefersReducedMotion } from "../motion"

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches

const SOFT: SpringOptions = { stiffness: 170, damping: 18, mass: 0.7 }
const PLAYFUL: SpringOptions = { stiffness: 380, damping: 11, mass: 0.7 }
const LIFT = { type: "spring", stiffness: 500, damping: 32, mass: 0.6 } as const
const SHEEN = { duration: 0.85, ease: [0.22, 1, 0.36, 1] } as const

type Springs<K extends string> = { target: Record<K, MotionValue<number>>; current: Record<K, MotionValue<number>> }

function springs<K extends string>(initial: Record<K, number>, options: SpringOptions, render: (values: Record<K, number>) => void): Springs<K> {
  const keys = Object.keys(initial) as K[]
  const target = {} as Record<K, MotionValue<number>>
  const current = {} as Record<K, MotionValue<number>>
  let queued = false
  const flush = () => {
    queued = false
    render(Object.fromEntries(keys.map((key) => [key, current[key].get()])) as Record<K, number>)
  }
  keys.forEach((key) => {
    target[key] = motionValue(initial[key])
    current[key] = springValue(target[key], options)
    current[key].on("change", () => {
      if (queued) return
      queued = true
      queueMicrotask(flush)
    })
  })
  return { target, current }
}

function initButtons() {
  document.querySelectorAll<HTMLElement>(".btn").forEach((button) => {
    const icon = button.querySelector("svg")
    const sheen = button.matches(".btn--primary, .btn--light") ? document.createElement("span") : null
    if (sheen) {
      sheen.className = "btn__sheen"
      sheen.setAttribute("aria-hidden", "true")
      button.prepend(sheen)
    }

    hover(button, () => {
      animate(button, { translate: "0 -2px" }, LIFT)
      if (icon) animate(icon, { translate: "0 3px" }, LIFT)
      if (sheen) animate(sheen, { transform: ["translateX(-120%)", "translateX(120%)"] }, SHEEN)
      return () => {
        animate(button, { translate: "0 0" }, LIFT)
        if (icon) animate(icon, { translate: "0 0" }, LIFT)
      }
    })

    press(button, () => {
      animate(button, { scale: "0.97" }, LIFT)
      return () => animate(button, { scale: "1" }, LIFT)
    })
  })
}

function initTilt() {
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((area) => {
    const maxTilt = Number(area.dataset.tilt || 6)
    const frame = area.querySelector<HTMLElement>(".browser") ?? area
    const glare = document.createElement("span")
    glare.className = "tilt-glare"
    glare.setAttribute("aria-hidden", "true")
    frame.appendChild(glare)

    const { target } = springs({ rx: 0, ry: 0, glow: 0 }, SOFT, ({ rx, ry, glow }) => {
      area.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg)`
      glare.style.opacity = String(glow)
    })

    area.addEventListener("pointermove", (event) => {
      const box = area.getBoundingClientRect()
      const nx = (event.clientX - box.left) / box.width
      const ny = (event.clientY - box.top) / box.height
      target.ry.set((nx - 0.5) * maxTilt)
      target.rx.set((0.5 - ny) * maxTilt)
      const frameBox = frame.getBoundingClientRect()
      glare.style.setProperty("--gx", `${((event.clientX - frameBox.left) / frameBox.width) * 100}%`)
      glare.style.setProperty("--gy", `${((event.clientY - frameBox.top) / frameBox.height) * 100}%`)
    })

    hover(area, () => {
      target.glow.set(1)
      return () => {
        target.rx.set(0)
        target.ry.set(0)
        target.glow.set(0)
      }
    })
  })
}

const BLOOM_DIRECTION = [-1, 1, -0.7, 0.7]

export function bloom(svg: SVGSVGElement, trigger: Element = svg, strength = 14) {
  if (prefersReducedMotion || !finePointer) return
  const leaves = Array.from(svg.querySelectorAll<SVGPathElement>("path"))
  const controls = leaves.map((leaf, index) => {
    const [x, y] = LEAF_PATHS[index].base.split(" ")
    leaf.style.transformBox = "view-box"
    leaf.style.transformOrigin = `${x}px ${y}px`
    return springs({ rotate: 0, scale: 1 }, PLAYFUL, ({ rotate, scale }) => {
      leaf.style.transform = `rotate(${rotate}deg) scale(${scale})`
    }).target
  })

  hover(trigger, () => {
    controls.forEach((leaf, index) => {
      leaf.rotate.set(BLOOM_DIRECTION[index] * strength)
      leaf.scale.set(1.08)
    })
    return () =>
      controls.forEach((leaf) => {
        leaf.rotate.set(0)
        leaf.scale.set(1)
      })
  })
}

export function springNeedle(needle: SVGElement, initialAngle: number) {
  const angle = motionValue(initialAngle)
  const current = springValue(angle, { stiffness: 120, damping: 8, mass: 0.9 })
  current.on("change", (value) => {
    needle.style.transform = `rotate(${value}deg)`
  })
  needle.style.transform = `rotate(${initialAngle}deg)`
  return (value: number) => angle.set(value)
}

export function initSprings() {
  if (prefersReducedMotion) return
  document.documentElement.classList.add("has-springs")
  initButtons()
  if (!finePointer) return
  initTilt()
  document.querySelectorAll<HTMLElement>(".brand").forEach((brand) => {
    const mark = brand.querySelector<SVGSVGElement>(".brand__mark")
    if (mark) bloom(mark, brand)
  })
  const avatar = document.querySelector<SVGSVGElement>(".phone__avatar svg")
  if (avatar) bloom(avatar, avatar.parentElement!, 18)
}
