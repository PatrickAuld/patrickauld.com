import Link from 'next/link'
import QuoteAttribution from './quote-attribution'
import { type QuoteRow } from '../lib/quotes'
import { makeQuoteSlug } from '../lib/quote-slug'

export default function QuoteContent({ quote, linked = false }: { quote: QuoteRow; linked?: boolean }) {
  return (
    <blockquote>
      <p>
        {linked ? (
          <Link href={`/quote/${makeQuoteSlug({ quote: quote.quote, id: quote.id, maxLen: 128 })}`}>
            “{quote.quote}”
          </Link>
        ) : `“${quote.quote}”`}
      </p>
      <QuoteAttribution quote={quote} className="block not-italic" />
    </blockquote>
  )
}
