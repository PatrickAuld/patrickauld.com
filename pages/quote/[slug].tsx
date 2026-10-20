import ArticleLayout from "../../components/article-layout";
import QuoteContent from "../../components/quote-content";
import Link from "next/link";
import { getQuotesFromCSV, getQuoteById, type QuoteRow } from "../../lib/quotes";
import { extractQuoteIdFromSlug, makeQuoteSlug } from "../../lib/quote-slug";

export async function getStaticPaths() {
  const quotes = getQuotesFromCSV();
  return {
    paths: quotes.map((q) => ({
      params: {
        slug: makeQuoteSlug({ quote: q.quote, id: q.id, maxLen: 128 }),
      },
    })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: {
  params: { slug: string };
}) {
  const id = extractQuoteIdFromSlug(params.slug);
  const quote = id ? getQuoteById(id) : null;
  if (!quote) return { notFound: true };

  return {
    props: {
      quote: quote ? JSON.parse(JSON.stringify(quote)) : null,
    },
  };
}

export default function QuotePage({ quote }: { quote: QuoteRow }) {
  const excerpt = quote.quote.length > 70 ? `${quote.quote.slice(0, 67).trimEnd()}…` : quote.quote;
  const title = `“${excerpt}” — ${quote.attribution} | Patrick Auld`;
  const description = `${quote.quote} — ${quote.attribution}`;

  return (
    <ArticleLayout title="Quotes" meta={{
      title, description,
      path: `/quote/${makeQuoteSlug({ quote: quote.quote, id: quote.id, maxLen: 128 })}`,
    }}>
      <QuoteContent quote={quote} />
      <p><Link href="/quotes">← Back to all quotes</Link></p>
    </ArticleLayout>
  );
}
