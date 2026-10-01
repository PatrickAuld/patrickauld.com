import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import ArticleLayout from '../components/article-layout'
import PostBody from '../components/post-body'
import { getPostBySlug, getAllPosts } from '../lib/api'
import PostType from '../types/post'
import Head from 'next/head'
import markdownToHtml from '../lib/markdownToHtml'

type Props = {
  post: PostType
}

const Post = ({ post }: Props) => {
  const router = useRouter()
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <ArticleLayout title={router.isFallback ? 'Loading…' : post.title}>
      <Head>
        <title>{`${post.title} | Patrick Auld`}</title>
      </Head>
      {!router.isFallback && <PostBody content={post.content} />}
    </ArticleLayout>
  )
}


export default Post

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const post = getPostBySlug(params.slug, [
    'title',
    'slug',
    'content',
  ])
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  }
}

export async function getStaticPaths() {
  const posts = getAllPosts(['slug'])

  return {
    paths: posts.map((posts) => {
      return {
        params: {
          slug: posts.slug,
        },
      }
    }),
    fallback: false,
  }
}