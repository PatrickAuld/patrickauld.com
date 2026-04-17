import Container from "../components/container";
import Layout from "../components/layout";
import Head from "next/head";
import Link from "next/link";
import PostHeader from "../components/post-header";
import { getQuotesFromCSV, type QuoteRow } from "../lib/quotes";
import { makeQuoteSlug } from "../lib/quote-slug";

export async function getStaticProps() {
  const quotes = getQuotesFromCSV();
  const featuredQuote = quotes.length
    ? quotes[Math.floor(Math.random() * quotes.length)]
    : null;

  return {
    props: {
      quotes,
      featuredQuote,
    },
  };
}

const QuoteCard = ({ id, quote, attribution }: QuoteRow) => {
  const slug = makeQuoteSlug({ quote, id, maxLen: 128 });

  return (
    <Link href={`/quote/${slug}`} className="block">
      <div className="mb-8 p-6">
        <blockquote className="mb-3 text-lg italic leading-relaxed text-gray-800 dark:text-gray-100">
          “{quote}”
        </blockquote>
        <cite className="text-sm font-medium not-italic text-gray-600 dark:text-gray-400">
          — {attribution || "Unknown"}
        </cite>
      </div>
    </Link>
  );
};

export default function QuotesPage({
  quotes,
  featuredQuote,
}: {
  quotes: QuoteRow[];
  featuredQuote: QuoteRow | null;
}) {
  return (
    <Layout>
      <Container>
        <article>
          <Head>
            <title>Quotes</title>
          </Head>
          <PostHeader title="Quotes" />
          <div className="mx-auto max-w-2xl">
            {featuredQuote && (
              <Link
                href={`/quote/${makeQuoteSlug({
                  quote: featuredQuote.quote,
                  id: featuredQuote.id,
                  maxLen: 128,
                })}`}
                className="block"
              >
                <div className="mb-12 cursor-pointer text-center">
                  <blockquote className="mb-4 text-2xl font-medium italic leading-relaxed text-gray-800 dark:text-gray-100">
                    “{featuredQuote.quote}”
                  </blockquote>
                  <cite className="text-lg font-semibold not-italic text-gray-600 dark:text-gray-300">
                    — {featuredQuote.attribution || "Unknown"}
                  </cite>
                </div>
              </Link>
            )}
            <div className="space-y-6">
              {quotes.map((q) => (
                <QuoteCard
                  key={q.id}
                  id={q.id}
                  quote={q.quote}
                  attribution={q.attribution}
                />
              ))}
            </div>
          </div>
        </article>
      </Container>
    </Layout>
  );
}
