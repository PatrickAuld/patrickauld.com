import { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

const PostTitle = ({ children }: Props) => {
  return (
    <h1 className="text-6xl md:text-5xl lg:text-6xl mb-12 mt-12 text-center md:text-left">
      {children}
    </h1>
  )
}

export default PostTitle