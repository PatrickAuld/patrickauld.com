import Meta from './meta'
import DarkModeToggle from './dark-mode-toggle'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ preview, children }: Props) => {
  return (
    <>
      <Meta />
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <DarkModeToggle />
        <main className="w-full">{children}</main>
      </div>
    </>
  )
}

export default Layout