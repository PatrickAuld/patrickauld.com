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
      <div className="rounded-lg border border-black/5 bg-white/50 p-4 shadow-sm backdrop-blur transition hover:bg-white/70 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/25 sm:p-6">
        <blockquote className="mb-2 text-base italic leading-relaxed text-gray-800 dark:text-gray-100 sm:text-lg">
          “{quote}”
        </blockquote>
        <cite className="text-sm font-medium not-italic text-gray-600 dark:text-gray-300">
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
                <div className="mb-8 rounded-lg border border-black/5 bg-white/50 p-4 text-center shadow-sm backdrop-blur transition hover:bg-white/70 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/25 sm:mb-10 sm:p-6">
                  <blockquote className="mb-3 text-xl font-medium italic leading-relaxed text-gray-800 dark:text-gray-100 sm:text-2xl">
                    “{featuredQuote.quote}”
                  </blockquote>
                  <cite className="text-base font-semibold not-italic text-gray-600 dark:text-gray-300">
                    — {featuredQuote.attribution || "Unknown"}
                  </cite>
                </div>
              </Link>
            )}
            <div className="space-y-4 sm:space-y-6">
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
