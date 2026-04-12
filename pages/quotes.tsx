import Container from "../components/container";
import Layout from "../components/layout";
import Head from "next/head";
import Link from "next/link";
import PostHeader from "../components/post-header";
import { useEffect, useState } from "react";
import { getQuotesFromCSV, type QuoteRow } from "../lib/quotes";
import { makeQuoteSlug } from "../lib/quote-slug";

export async function getStaticProps() {
  const quotes = getQuotesFromCSV();

  return {
    props: {
      quotes,
    },
  };
}

const QuoteCard = ({ id, quote, attribution }: QuoteRow) => {
  const slug = makeQuoteSlug({ quote, id, maxLen: 128 });

  return (
    <Link href={`/quote/${slug}`} className="block border-t border-neutral-200 py-6 first:border-t-0 first:pt-0 hover:opacity-80">
      <blockquote className="mb-3 text-xl italic leading-relaxed text-gray-800 sm:text-2xl">
        “{quote}”
      </blockquote>
      <cite className="text-sm font-medium not-italic text-gray-600">
        — {attribution || "Unknown"}
      </cite>
    </Link>
  );
};

export default function QuotesPage({ quotes }: { quotes: QuoteRow[] }) {
  const [randomQuote, setRandomQuote] = useState<QuoteRow | null>(null);

  useEffect(() => {
    // Select a random quote for the top of the page on client side
    if (quotes.length > 0) {
      const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setRandomQuote(selectedQuote);
    }
  }, [quotes]);

  return (
    <Layout>
      <Container>
        <article>
          <Head>
            <title>Quotes</title>
          </Head>
          <PostHeader title="Quotes" />
          <div className="mx-auto max-w-2xl">
            {randomQuote && (
              <Link
                href={`/quote/${makeQuoteSlug({
                  quote: randomQuote.quote,
                  id: randomQuote.id,
                  maxLen: 128,
                })}`}
                className="block border-b border-neutral-200 pb-8 hover:opacity-80"
              >
                <blockquote className="mb-4 text-2xl italic leading-relaxed text-gray-800 sm:text-3xl">
                  “{randomQuote.quote}”
                </blockquote>
                <cite className="text-base font-semibold not-italic text-gray-600 sm:text-lg">
                  — {randomQuote.attribution || "Unknown"}
                </cite>
              </Link>
            )}
            <div className="pt-8">
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
