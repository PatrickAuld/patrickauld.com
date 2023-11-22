import PostTitle from './post-title'

export default function PostHeader({ title }: { title: string }) {
  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PostTitle>{title}</PostTitle>
      </div>
    </>
  )
}
