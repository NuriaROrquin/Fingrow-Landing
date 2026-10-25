import * as THREE from "three"
import { LEAF_PATHS, LEAF_VIEWBOX } from "../config"

const SVG_CENTER = { x: LEAF_VIEWBOX.width / 2, y: LEAF_VIEWBOX.height / 2 }
const SVG_SCALE = 5.8 / LEAF_VIEWBOX.height

type Targets = {
  cloud: Float32Array
  leaves: Float32Array
  chart: Float32Array
  colors: Float32Array
  seeds: Float32Array
  sizes: Float32Array
}

function sampleLeaves(count: number): { points: Float32Array; colors: Float32Array } {
  const ctx = document.createElement("canvas").getContext("2d")!
  const shapes = LEAF_PATHS.map((leaf) => ({ path: new Path2D(leaf.d), color: new THREE.Color(leaf.color) }))
  const points = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const white = new THREE.Color("#ffffff")
  const tint = new THREE.Color()

  let filled = 0
  while (filled < count) {
    const x = Math.random() * LEAF_VIEWBOX.width
    const y = Math.random() * LEAF_VIEWBOX.height
    const shape = shapes.find((s) => ctx.isPointInPath(s.path, x, y))
    if (!shape) continue

    const wx = (x - SVG_CENTER.x) * SVG_SCALE
    const wy = -(y - SVG_CENTER.y) * SVG_SCALE
    const cup = -0.05 * (wx * wx) + 0.18
    points[filled * 3] = wx
    points[filled * 3 + 1] = wy
    points[filled * 3 + 2] = cup + (Math.random() - 0.5) * 0.22

    tint.copy(shape.color).lerp(white, Math.random() * 0.18)
    colors[filled * 3] = tint.r
    colors[filled * 3 + 1] = tint.g
    colors[filled * 3 + 2] = tint.b
    filled++
  }

  return { points, colors }
}

function chartPoint(index: number, out: Float32Array, offset: number) {
  const bars = 11
  const bar = index % bars
  const growth = (bar + 1) / bars
  const height = 0.6 + Math.pow(growth, 1.6) * 5.2
  const width = 0.42
  const gap = 0.2
  const startX = -((bars * width + (bars - 1) * gap) / 2)
  const x = startX + bar * (width + gap) + Math.random() * width
  const y = -2.9 + Math.random() * height
  const z = (Math.random() - 0.5) * 0.5
  out[offset] = x
  out[offset + 1] = y
  out[offset + 2] = z
}

function buildTargets(count: number): Targets {
  const leafCount = Math.floor(count * 0.86)
  const { points: leafPoints, colors: leafColors } = sampleLeaves(leafCount)
  const cloud = new Float32Array(count * 3)
  const leaves = new Float32Array(count * 3)
  const chart = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const dust = new THREE.Color("#b9aee6")

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 3 + Math.pow(Math.random(), 0.6) * 7
    cloud[i3] = Math.sin(phi) * Math.cos(theta) * radius * 1.3
    cloud[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.75
    cloud[i3 + 2] = Math.cos(phi) * radius * 0.7

    seeds[i] = Math.random()

    if (i < leafCount) {
      leaves[i3] = leafPoints[i3]
      leaves[i3 + 1] = leafPoints[i3 + 1]
      leaves[i3 + 2] = leafPoints[i3 + 2]
      colors[i3] = leafColors[i3]
      colors[i3 + 1] = leafColors[i3 + 1]
      colors[i3 + 2] = leafColors[i3 + 2]
      sizes[i] = 0.7 + Math.random() * 0.8
      chartPoint(i, chart, i3)
    } else {
      leaves[i3] = cloud[i3] * 1.25
      leaves[i3 + 1] = cloud[i3 + 1] * 1.25
      leaves[i3 + 2] = cloud[i3 + 2] * 1.1 - 2
      chart[i3] = cloud[i3] * 1.4
      chart[i3 + 1] = cloud[i3 + 1] * 1.4
      chart[i3 + 2] = cloud[i3 + 2] - 3
      colors[i3] = dust.r
      colors[i3 + 1] = dust.g
      colors[i3 + 2] = dust.b
      sizes[i] = 0.35 + Math.random() * 0.5
    }
  }

  return { cloud, leaves, chart, colors, seeds, sizes }
}

const vertexShader = `
  uniform float uTime;
  uniform float uMorph;
  uniform float uChart;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aLeaf;
  attribute vec3 aChart;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;

  float stagger(float progress, float seed) {
    float start = seed * 0.45;
    return smoothstep(start, start + 0.55, progress);
  }

  void main() {
    float morph = stagger(uMorph, aSeed);
    float chart = stagger(uChart, 1.0 - aSeed);
    vec3 p = mix(position, aLeaf, morph);
    p = mix(p, aChart, chart);

    float drift = 0.035 + (1.0 - morph) * 0.25 + chart * 0.02;
    p.x += sin(uTime * 0.7 + aSeed * 40.0) * drift;
    p.y += cos(uTime * 0.6 + aSeed * 31.0) * drift;
    p.z += sin(uTime * 0.5 + aSeed * 17.0) * drift;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uSize * uPixelRatio * (10.0 / -mvPosition.z);

    vColor = aColor;
    vAlpha = 0.55 + morph * 0.45;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.15, d) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export type LeafField = {
  uniforms: {
    uTime: { value: number }
    uMorph: { value: number }
    uChart: { value: number }
  }
  group: THREE.Group
  render: (time: number) => void
  resize: () => void
  setPointer: (x: number, y: number) => void
  dispose: () => void
}

export function createLeafField(canvas: HTMLCanvasElement): LeafField | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" })
  } catch {
    return null
  }

  const isSmall = window.matchMedia("(max-width: 719px)").matches
  const count = isSmall ? 7000 : 15000
  const targets = buildTargets(count)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(targets.cloud, 3))
  geometry.setAttribute("aLeaf", new THREE.BufferAttribute(targets.leaves, 3))
  geometry.setAttribute("aChart", new THREE.BufferAttribute(targets.chart, 3))
  geometry.setAttribute("aColor", new THREE.BufferAttribute(targets.colors, 3))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(targets.seeds, 1))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(targets.sizes, 1))

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uChart: { value: 0 },
    uSize: { value: isSmall ? 3.2 : 3.6 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  })

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 16)

  const group = new THREE.Group()
  const points = new THREE.Points(geometry, material)
  group.add(points)
  scene.add(group)

  const pointer = { x: 0, y: 0 }
  const eased = { x: 0, y: 0 }

  const layout = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const aspect = width / Math.max(height, 1)
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)

    if (aspect < 0.85) {
      group.position.set(0, 3.05, 0)
      group.scale.setScalar(0.5)
    } else if (aspect < 1.35) {
      group.position.set(2.6, 0.4, 0)
      group.scale.setScalar(0.72)
    } else {
      group.position.set(Math.min(4.9, aspect * 2.65), 0.1, 0)
      group.scale.setScalar(0.92)
    }
  }

  layout()

  const render = (time: number) => {
    uniforms.uTime.value = time
    eased.x += (pointer.x - eased.x) * 0.05
    eased.y += (pointer.y - eased.y) * 0.05
    group.rotation.y = Math.sin(time * 0.25) * 0.18 + eased.x * 0.4
    group.rotation.x = eased.y * 0.22 - uniforms.uChart.value * 0.25
    renderer.render(scene, camera)
  }

  return {
    uniforms,
    group,
    render,
    resize: layout,
    setPointer: (x, y) => {
      pointer.x = x
      pointer.y = y
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}
