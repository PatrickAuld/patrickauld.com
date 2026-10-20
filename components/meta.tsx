import Head from 'next/head'
import { SITE_DESCRIPTION, siteUrl } from '../lib/site'

export type MetaProps = {
  title?: string
  description?: string
  path?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  structuredData?: Record<string, unknown>
}

export default function Meta({
  title = 'Patrick J Auld', description = SITE_DESCRIPTION, path = '/',
  type = 'website', publishedTime, modifiedTime, structuredData,
}: MetaProps) {
  const url = siteUrl(path)
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} key="description" />
      <link rel="canonical" href={url} key="canonical" />
      <meta property="og:site_name" content="Patrick J Auld" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={siteUrl('/profile.jpeg')} />
      <meta property="og:image:alt" content="Headshot of Patrick J Auld" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={siteUrl('/profile.jpeg')} />
      <meta name="twitter:image:alt" content="Headshot of Patrick J Auld" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }} />}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}
