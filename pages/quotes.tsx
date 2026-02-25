import Container from "../components/container";
import Layout from "../components/layout";
import Head from "next/head";
import Link from "next/link";
import PostHeader from "../components/post-header";
import { useEffect, useState } from "react";
import { getQuotesFromCSV, type QuoteRow } from "../lib/quotes";

export async function getStaticProps() {
  const quotes = getQuotesFromCSV();

  return {
    props: {
      quotes,
    },
  };
}

const QuoteCard = ({ id, quote, attribution }: QuoteRow) => {
  return (
    <Link href={`/quote/${id}`} className="block">
      <div className="mb-8 border-l-4 border-teal-400 p-6 dark:border-teal-700">
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
                  <Link href={`/quote/`} className="block">
                    <div className="mb-12 cursor-pointer text-center">
                    <blockquote className="mb-4 text-2xl font-medium italic leading-relaxed text-gray-800 dark:text-gray-100">
                      “{randomQuote.quote}”
                    </blockquote>
                    <cite className="text-lg font-semibold not-italic text-gray-600 dark:text-gray-300">
                      — {randomQuote.attribution || "Unknown"}
                    </cite>                    </div>
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
