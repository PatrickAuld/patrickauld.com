import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/quote', destination: '/quotes', permanent: true },
      {
        source: '/quote/the-needs-of-the-now-strangling-the-wants-of-the-past-f7111ef805e8',
        destination: '/quote/the-needs-of-the-now-strangling-the-wants-of-the-past-831e802412b4',
        permanent: true,
      },
    ]
  },
}

export default config
