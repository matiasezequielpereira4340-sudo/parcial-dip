// Genera los PNG del PWA a partir de public/icon.svg (usa el Chromium preinstalado).
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync } from 'node:fs'
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8')
const browser = await chromium.launch()
for (const s of [192, 512]) {
  const p = await browser.newPage({ viewport: { width: s, height: s } })
  await p.setContent(`<style>*{margin:0}svg{width:${s}px;height:${s}px;display:block}</style>${svg}`)
  await p.screenshot({ path: new URL(`../public/icon-${s}.png`, import.meta.url).pathname, omitBackground: true })
}
await browser.close()
