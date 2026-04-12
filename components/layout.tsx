import Meta from './meta'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ preview, children }: Props) => {
  return (
    <>
      <Meta />
      <div className="min-h-screen bg-white text-gray-900">
        <main className="w-full">{children}</main>
      </div>
    </>
  )
}

export default Layout
