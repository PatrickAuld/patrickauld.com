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
      <TextStatement>Currently, I'm a <b>Software Architect</b> at <a className="underline" href="https://construction.autodesk.com">Autodesk</a>.</TextStatement>
      <TextStatement>Though <a className="underline" href="https://mandias.xyz">Mandias</a>, I offer <b>coaching or mentoring</b>.</TextStatement>
      <TextStatement>I moonlight as a <b>Futurist</b> at <a className="underline" href="https://auldcellars.com">Auld Cellars</a>.</TextStatement>
      <p className="mt-1 max-w-2xl text-base text-gray-700 pb-2 pt-8">You can contact me though <a className="underline" href="mailto:patrick+homepage@patrickauld.com">email</a> and <a className="underline" href="https://twitter.com/patrickauld">Twitter</a>.</p>
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
            <div className="max-h-800 overflow-x-hidden">
              <Img width="800" height="800" className="w-auto h-auto object-center" src="/profile.jpeg" alt="Profile Headshot" />
            </div>
            <div className="flex bg-gray-100 p-10">
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
