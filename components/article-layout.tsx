import { ReactNode } from 'react'
import Container from './container'
import Layout from './layout'
import PostHeader from './post-header'
import markdownStyles from './markdown-styles.module.css'
import Link from 'next/link'
import { type MetaProps } from './meta'

type Props = {
  title: string
  meta: MetaProps
  publishedTime?: string
  modifiedTime?: string
  children: ReactNode
}

export default function ArticleLayout({ title, meta, publishedTime, modifiedTime, children }: Props) {
  return (
    <Layout meta={meta}>
      <Container>
        <nav aria-label="Main navigation" className="mx-auto mb-8 flex max-w-2xl flex-wrap gap-4 pr-12 text-sm">
          <Link className="underline" href="/">Patrick Auld</Link>
          <Link className="underline" href="/README">Personal README</Link>
          <Link className="underline" href="/quotes">Quotes</Link>
        </nav>
        <article className="mx-auto w-full max-w-2xl min-w-0">
          <PostHeader title={title} publishedTime={publishedTime} modifiedTime={modifiedTime} />
          <div className={markdownStyles.markdown}>{children}</div>
        </article>
      </Container>
    </Layout>
  )
}
