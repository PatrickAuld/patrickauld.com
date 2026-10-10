import dynamic from 'next/dynamic'
import { parseShowcase } from '../lib/watch-showcase'

const WatchShowcase = dynamic(() => import('./watch-showcase'))

export default function PostBody({ content }: { content: string }) {
  const parts = content.split(/<!--\s*watch-showcase\s+([\s\S]*?)\s*-->/g)
  return <>{parts.map((part, index) => index % 2
    ? <WatchShowcase key={index} {...parseShowcase(part)} />
    : <div key={index} dangerouslySetInnerHTML={{ __html: part }} />)}</>
}
