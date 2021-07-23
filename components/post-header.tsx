import PostTitle from './post-title'

export default function PostHeader(props: { title: string }) {
  return (
    <>
      <div className="max-w-2xl mx-auto">
        <PostTitle>{props.title}</PostTitle>
      </div>
    </>
  )
}
