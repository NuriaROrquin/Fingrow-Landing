import { mkdir, readdir, rename } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve(import.meta.dirname, "..")
const screensDir = path.join(root, "public", "screens")
const rawDir = path.join(root, "screens-raw")
const keepOriginals = process.argv.includes("--keep")

const maxWidthFor = (name) => {
  if (name.startsWith("card-")) return 1400
  if (name.startsWith("mobile-")) return 1170
  return 2400
}

await mkdir(rawDir, { recursive: true })

const files = (await readdir(screensDir)).filter((file) => file.toLowerCase().endsWith(".png"))

if (files.length === 0) {
  console.log("No hay PNG nuevos en public/screens.")
  process.exit(0)
}

for (const file of files) {
  const name = path.basename(file, path.extname(file))
  const source = path.join(screensDir, file)
  const target = path.join(screensDir, `${name}.webp`)
  const image = sharp(source)
  const { width = 0 } = await image.metadata()
  const maxWidth = maxWidthFor(name)
  await image
    .resize({ width: Math.min(width, maxWidth), withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toFile(target)
  if (!keepOriginals) await rename(source, path.join(rawDir, file))
  console.log(`${file} -> ${name}.webp`)
}
