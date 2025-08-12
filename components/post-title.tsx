import { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

const PostTitle = ({ children }: Props) => {
  return (
    <h1 className="text-6xl md:text-5xl lg:text-6xl mb-12 text-center md:text-left text-gray-900 dark:text-gray-100">
      {children}
    </h1>
  )
}

export default PostTitle