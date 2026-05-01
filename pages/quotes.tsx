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

function QuoteAttributionLine({ quote }: { quote: QuoteRow }) {
  const label = quote.attributionMeta?.label || quote.attribution || "Unknown";
  const url = quote.attributionMeta?.url;

  return (
    <cite className="text-sm font-medium not-italic text-gray-600 dark:text-gray-400">
      — {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-teal-300 underline-offset-2 hover:text-teal-700 dark:hover:text-teal-300"
          onClick={(event) => event.stopPropagation()}
        >
          {label}
        </a>
      ) : (
        label
      )}
    </cite>
  );
}

const QuoteCard = (quoteRow: QuoteRow) => {
  const { id, quote } = quoteRow;
  const slug = makeQuoteSlug({ quote, id, maxLen: 128 });

  return (
    <Link href={`/quote/${slug}`} className="block">
      <div className="mb-8 p-6">
        <blockquote className="mb-3 text-lg italic leading-relaxed text-gray-800 dark:text-gray-100">
          “{quote}”
        </blockquote>
        <QuoteAttributionLine quote={quoteRow} />
      </div>
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
        
          <>
            <article>
              <Head>
                <title>Quotes</title>
              </Head>
              <PostHeader title="Quotes" />
              <div className="max-w-2xl mx-auto">
                {randomQuote && (
                  <Link
                    href={`/quote/${makeQuoteSlug({
                      quote: randomQuote.quote,
                      id: randomQuote.id,
                      maxLen: 128,
                    })}`}
                    className="block"
                  >
                    <div className="mb-12 cursor-pointer text-center">
                      <blockquote className="mb-4 text-2xl font-medium italic leading-relaxed text-gray-800 dark:text-gray-100">
                        “{randomQuote.quote}”
                      </blockquote>
                      <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        <QuoteAttributionLine quote={randomQuote} />
                      </span>
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
          </>
      </Container>
    </Layout>
  );
}
