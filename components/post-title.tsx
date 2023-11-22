import { ReactNode } from 'react'

export default function PostTitle({ children }: { children?: ReactNode }) {
  return (
    <h1 className="text-6xl md:text-5xl lg:text-6xl mb-12 mt-12 text-center md:text-left">
      {children}
    </h1>
  )
}