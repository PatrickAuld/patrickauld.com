import type { GetServerSideProps } from 'next'
import { getAllPosts } from '../lib/api'
import { getQuotesFromCSV } from '../lib/quotes'
import { makeQuoteSlug } from '../lib/quote-slug'
import { siteUrl } from '../lib/site'

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[character]!)
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const pages: { path: string; modified?: string }[] = [
    { path: '/' },
    { path: '/quotes' },
    ...getAllPosts(['slug', 'date', 'updated']).map((post) => ({
      path: `/${encodeURIComponent(post.slug)}`,
      modified: post.updated || post.date,
    })),
    ...getQuotesFromCSV().map((quote) => ({
      path: `/quote/${makeQuoteSlug({ quote: quote.quote, id: quote.id, maxLen: 128 })}`,
    })),
  ]
  const urls = pages.map(({ path, modified }) =>
    `<url><loc>${escapeXml(siteUrl(path))}</loc>${modified ? `<lastmod>${escapeXml(modified)}</lastmod>` : ''}</url>`
  ).join('')

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`)
  return { props: {} }
}

export default function Sitemap() { return null }
