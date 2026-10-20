import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import ArticleLayout from '../components/article-layout'
import PostBody from '../components/post-body'
import { getPostBySlug, getAllPosts } from '../lib/api'
import PostType from '../types/post'
import markdownToHtml from '../lib/markdownToHtml'
import { SITE_DESCRIPTION } from '../lib/site'

type Props = {
  post: PostType
}

const Post = ({ post }: Props) => {
  const router = useRouter()
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <ArticleLayout title={router.isFallback ? 'Loading…' : post.title}
      publishedTime={post.date} modifiedTime={post.updated}
      meta={{
        title: `${post.title} | Patrick Auld`,
        description: post.description || SITE_DESCRIPTION,
        path: `/${encodeURIComponent(post.slug)}`,
        type: 'article', publishedTime: post.date, modifiedTime: post.updated,
      }}>
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
    'description',
    'date',
    'updated',
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
