import Head from 'next/head'
import Img from 'next/image'

function TextStatement(props: { children: React.ReactNode }) {
  return (
    <p className="mt-1 max-w-2xl text-lg text-gray-700 pb-2">
      {props.children}
    </p>
  )
}

function AboutStatement() {
  return (
    <div>
      <TextStatement>I'm working on <b>early stage prototypes</b> that are currently in stealth mode.</TextStatement>
      <TextStatement>Through <a className="underline" href="https://mandias.xyz">Mandias</a>, I offer <b>coaching or mentoring</b>.</TextStatement>
      <TextStatement><a className="underline" href="https://patrickauld.substack.com">It Depends</a> is my <b>newsletter</b> on decision making.</TextStatement>
      <TextStatement>I moonlight as a <b>Futurist</b> at <a className="underline" href="https://auldcellars.com">Auld Cellars</a>.</TextStatement>
      <TextStatement>You can read <b>how I work</b> on my <a className="underline" href="/README">Personal README</a>.</TextStatement>
      <p className="mt-1 max-w-2xl text-base text-gray-700 pb-2 pt-8">You can contact me though <a className="underline" href="mailto:patrick+homepage@patrickauld.com">email</a> and <a className="underline" href="https://x.com/patrickauld">X (Twitter)</a>.</p>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <Head>
        <title>Patrick J Auld</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main >
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 h-screen content-center">
            <div className="max-w-800 overflow-x-hidden">
              <Img width="800" height="800" className="w-auto h-auto object-center" src="/profile.jpeg" alt="Profile Headshot" />
            </div>
            <div className="flex bg-gray-100 p-10 w-full lg:max-w-lg">
              <div className="mb-auto mt-auto max-w-lg">
                <h1 className="text-5xl pb-8">Patrick J Auld</h1>
                <AboutStatement />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div >
  )
}
