import Head from 'next/head'
import Img from 'next/image'
import Layout from '../components/layout'

function TextStatement(props: { children: React.ReactNode }) {
  return (
    <p className="mt-1 max-w-2xl text-lg text-gray-700 dark:text-gray-300 pb-2">
      {props.children}
    </p>
  )
}

function AboutStatement() {
  return (
    <div>
      <TextStatement>I'm a <strong>Staff Engineer</strong> at <a className="underline" href="https://patreon.com">Patreon</a>.</TextStatement>
      <TextStatement>I keep a <strong>newsletter</strong> on <a className="underline" href="https://patrickauld.substack.com">decision making.</a></TextStatement>
      <TextStatement>I moonlight as a <strong>Futurist</strong> at <a className="underline" href="https://auldcellars.com">Auld Cellars</a>.</TextStatement>
      
      <p className="mt-1 max-w-2xl text-base text-gray-700 dark:text-gray-300 pb-2 pt-8"><a className="underline" href="/README" aria-label="Personal README of the site author">README</a> <a className="underline" href="mailto:patrick+homepage@patrickauld.com">email</a> <a className="underline" href="https://x.com/patrickauld" aria-label="Patrick Auld on X/Twitter">X</a> <a className="underline" href="https://bsky.app/profile/patrickauld.com" aria-label="Patrick Auld on Bluesky">bksy</a></p>
    </div>
  )
}

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>Patrick J Auld</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 h-screen content-center">
            <div className="max-w-800 overflow-x-hidden">
              <Img width="800" height="800" className="w-auto h-auto object-center" src="/profile.jpeg" alt="Headshot of Patrick J Auld" />
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-10 w-full lg:max-w-lg">
              <div className="mb-auto mt-auto max-w-lg">
                <h1 className="text-5xl pb-8 text-gray-900 dark:text-gray-100">Patrick J Auld</h1>
                <AboutStatement />
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
}
