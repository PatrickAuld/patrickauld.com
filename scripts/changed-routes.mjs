#!/usr/bin/env node
// Maps files changed in a PR to the site routes they affect, so CI can
// screenshot only the pages impacted by a change.
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'

const ROOT = process.cwd()
const MAX_ROUTES = 8

function slugifyQuote(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function makeQuoteSlug({ quote, id, maxLen = 128 }) {
  const base = slugifyQuote(quote) || 'quote'
  const separator = '-'
  const maxBaseLen = Math.max(1, maxLen - (separator.length + id.length))
  const clippedBase = base.slice(0, maxBaseLen).replace(/-+$/g, '')
  return `${clippedBase}${separator}${id}`
}

function makeQuoteId(quote, attribution) {
  return crypto.createHash('sha1').update(`${quote}::${attribution}`, 'utf8').digest('hex').slice(0, 12)
}

function firstQuoteSlug() {
  const csvPath = path.join(ROOT, 'public', 'quotes.csv')
  if (!fs.existsSync(csvPath)) return null
  const content = fs.readFileSync(csvPath, 'utf8')
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true })
  const row = (data || []).find((r) => (r.quote || '').trim().length > 0)
  if (!row) return null
  const quote = row.quote.trim()
  const attribution = (row.attribution || 'Unknown').trim() || 'Unknown'
  const id = makeQuoteId(quote, attribution)
  return makeQuoteSlug({ quote, id })
}

function firstPostSlug() {
  const postsDir = path.join(ROOT, '_posts')
  if (!fs.existsSync(postsDir)) return null
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'))
  if (files.length === 0) return null
  return files[0].replace(/\.md$/, '')
}

const baseSha = process.env.BASE_SHA
const headSha = process.env.HEAD_SHA

if (!baseSha || !headSha) {
  console.error('BASE_SHA and HEAD_SHA env vars are required')
  process.exit(1)
}

const diffOutput = execSync(`git diff --name-status ${baseSha} ${headSha}`, { cwd: ROOT }).toString()

const changes = diffOutput
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .map((line) => {
    const parts = line.split('\t')
    const status = parts[0][0]
    const file = parts[parts.length - 1]
    return { status, file }
  })
  .filter(({ status }) => status !== 'D')

const routes = new Set()
let globalChange = false

const GLOBAL_PREFIXES = ['components/', 'lib/', 'styles/']
const GLOBAL_FILES = new Set(['pages/_app.tsx', 'pages/_document.tsx', 'tailwind.config.js', 'postcss.config.js'])

for (const { file } of changes) {
  if (file === 'pages/index.tsx') {
    routes.add('/')
  } else if (file === 'pages/quotes.tsx') {
    routes.add('/quotes')
  } else if (file === 'pages/quote/index.tsx') {
    routes.add('/quote')
  } else if (file === 'pages/quote/[slug].tsx') {
    const slug = firstQuoteSlug()
    if (slug) routes.add(`/quote/${slug}`)
  } else if (file === 'pages/[slug].tsx') {
    const slug = firstPostSlug()
    if (slug) routes.add(`/${slug}`)
  } else if (file.startsWith('_posts/') && file.endsWith('.md')) {
    routes.add(`/${path.basename(file, '.md')}`)
  } else if (file === 'public/quotes.csv') {
    routes.add('/quotes')
    const slug = firstQuoteSlug()
    if (slug) routes.add(`/quote/${slug}`)
  } else if (GLOBAL_FILES.has(file) || GLOBAL_PREFIXES.some((prefix) => file.startsWith(prefix))) {
    globalChange = true
  }
}

if (globalChange) {
  routes.add('/')
  routes.add('/quotes')
  const postSlug = firstPostSlug()
  if (postSlug) routes.add(`/${postSlug}`)
}

const result = Array.from(routes).slice(0, MAX_ROUTES)

console.log(JSON.stringify(result))
