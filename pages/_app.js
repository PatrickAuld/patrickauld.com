import "../styles/globals.css";

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../lib/gtag'
import { Analytics } from '@vercel/analytics/react'

const enableVercelAnalytics = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV)

const App = ({ Component, pageProps }) => {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Component {...pageProps} />
      {enableVercelAnalytics ? <Analytics /> : null}
    </>
  )
}

export default App
