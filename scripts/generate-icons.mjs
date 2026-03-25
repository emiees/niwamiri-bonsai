import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/favicon.svg')
const svg = readFileSync(svgPath)

const sizes = [192, 512]
for (const size of sizes) {
  const out = resolve(__dirname, `../public/icons/icon-${size}.png`)
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(out)
  console.log(`✓ icon-${size}.png`)
}
