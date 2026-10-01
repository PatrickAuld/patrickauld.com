import { ReactNode } from 'react'
import Container from './container'
import Layout from './layout'
import PostHeader from './post-header'
import markdownStyles from './markdown-styles.module.css'

export default function ArticleLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Layout>
      <Container>
        <article className="mx-auto w-full max-w-2xl min-w-0">
          <PostHeader title={title} />
          <div className={markdownStyles.markdown}>{children}</div>
        </article>
      </Container>
    </Layout>
  )
}
