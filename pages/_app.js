import "tailwindcss/tailwind.css";

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../lib/gtag'

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

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const setBodyClass = (e) => {
      document.body.classList[e.matches ? 'add' : 'remove']('dark');
    };
    setBodyClass(darkModeQuery);
    darkModeQuery.addListener(setBodyClass);
    return () => {
      darkModeQuery.removeListener(setBodyClass);
    };
  }, []);

  return <Component {...pageProps} />
}

export default App
