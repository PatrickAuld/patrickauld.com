#!/usr/bin/env node
// Takes a full-page screenshot of each route in ROUTES_JSON against
// SCREENSHOT_BASE_URL, writing PNGs plus a manifest.json into the output dir.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const baseUrl = process.env.SCREENSHOT_BASE_URL
const routesJson = process.env.ROUTES_JSON
const outDir = process.env.SCREENSHOT_OUT_DIR || '.pr-screenshots'

if (!baseUrl) {
  console.error('SCREENSHOT_BASE_URL is required')
  process.exit(1)
}
if (!routesJson) {
  console.error('ROUTES_JSON is required')
  process.exit(1)
}

const routes = JSON.parse(routesJson)

if (routes.length === 0) {
  console.log('No routes to screenshot.')
  process.exit(0)
}

fs.mkdirSync(outDir, { recursive: true })

function routeToFilename(route) {
  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')
  return `${slug}.png`
}

const manifest = []
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}
)
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()

for (const route of routes) {
  const url = new URL(route, baseUrl).toString()
  const file = routeToFilename(route)
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.screenshot({ path: path.join(outDir, file), fullPage: true })
    manifest.push({ route, file, status: response ? response.status() : null })
  } catch (err) {
    console.error(`Failed to screenshot ${route}: ${err.message}`)
    manifest.push({ route, file: null, error: err.message })
  }
}

await browser.close()

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify(manifest, null, 2))
