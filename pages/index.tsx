import Img from 'next/image'
import Layout from '../components/layout'
import { SITE_DESCRIPTION, siteUrl } from '../lib/site'

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
      <h2 className="text-2xl mb-4 text-gray-900 dark:text-gray-100">Who is Patrick Auld?</h2>
      <TextStatement>I'm a <strong>Principal Engineer</strong> at <a className="underline" href="https://roblox.com">Roblox</a>.</TextStatement>
      <TextStatement>I keep a <strong>newsletter</strong> on <a className="underline" href="https://patrickauld.substack.com">decision making.</a></TextStatement>
      <TextStatement>I moonlight as a <strong>Futurist</strong> at <a className="underline" href="https://auldcellars.com">Auld Cellars</a>.</TextStatement>
      
      <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">Role as of <time dateTime="2026-10-20">October 20, 2026</time>.</p>
      <nav aria-label="Main navigation" className="mt-1 max-w-2xl text-base text-gray-700 dark:text-gray-300 pb-2 pt-8">
        <a className="underline" href="/README" aria-label="Personal README of the site author">Personal README</a><br />
        <a className="underline" href="/quotes" aria-label="Patrick Auld's quotes">Quotes I like</a>
      </nav>
    </div>
  )
}

export default function Home() {
  return (
    <Layout meta={{
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url: siteUrl(),
        name: 'Patrick J Auld',
        description: SITE_DESCRIPTION,
        mainEntity: {
          '@type': 'Person',
          '@id': siteUrl('/#patrick-auld'),
          name: 'Patrick J Auld',
          url: siteUrl(),
          image: siteUrl('/profile.jpeg'),
          jobTitle: 'Principal Engineer',
          worksFor: { '@type': 'Organization', name: 'Roblox', url: 'https://roblox.com' },
          sameAs: ['https://x.com/patrickauld', 'https://www.linkedin.com/in/patrickauld'],
        },
      },
    }}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen content-center">
            <div className="flex items-center justify-center">
              <Img width="800" height="800" className="w-full h-auto max-w-full object-cover" src="/profile.jpeg" alt="Headshot of Patrick J Auld" />
            </div>
            <div className="flex flex-col h-full bg-gray-100 dark:bg-olive-800 p-10 w-full lg:max-w-lg">
              <div className="flex-1 flex items-center">
                <div className="max-w-lg">
                  <h1 className="text-5xl pb-8 text-gray-900 dark:text-gray-100">Patrick J Auld</h1>
                  <AboutStatement />
                </div>
              </div>
              <footer className="pt-6 text-base text-gray-700 dark:text-gray-300">
                <div className="inline-flex items-center gap-4">
                  <a className="underline" href="mailto:patrick+homepage@patrickauld.com">email</a>
                  <a
                    className="underline"
                    href="https://x.com/patrickauld"
                    aria-label="Patrick Auld on X/Twitter"
                  >
                    X
                  </a>
                  <a
                    className="underline"
                    href="https://www.linkedin.com/in/patrickauld"
                    aria-label="Patrick Auld on LinkedIn"
                  >
                    LinkedIn
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </div>
    </Layout>
  )
}
