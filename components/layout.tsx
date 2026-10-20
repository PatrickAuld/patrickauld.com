import Meta, { type MetaProps } from './meta'
import DarkModeToggle from './dark-mode-toggle'

type Props = {
  meta?: MetaProps
  children: React.ReactNode
}

const Layout = ({ meta, children }: Props) => {
  return (
    <>
      <Meta {...meta} />
      <div className="min-h-screen w-screen bg-white text-gray-900 dark:bg-olive-900 dark:text-gray-100 transition-colors duration-200">
        <DarkModeToggle />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3 focus:text-gray-900">Skip to content</a>
        <main id="main-content" tabIndex={-1} className="w-full">{children}</main>
      </div>
    </>
  )
}

export default Layout
