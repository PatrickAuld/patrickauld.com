import ArticleLayout from "../components/article-layout";
import QuoteContent from "../components/quote-content";
import Head from "next/head";
import { useEffect, useState } from "react";
import { getQuotesFromCSV, type QuoteRow } from "../lib/quotes";

export async function getStaticProps() {
  const quotes = getQuotesFromCSV();

  return {
    props: {
      quotes: JSON.parse(JSON.stringify(quotes)),
    },
  };
}

export default function QuotesPage({ quotes }: { quotes: QuoteRow[] }) {
  const [randomQuote, setRandomQuote] = useState<QuoteRow | null>(null);

  useEffect(() => {
    if (quotes.length > 0) {
      setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [quotes]);

  return (
    <ArticleLayout title="Quotes">
      <Head>
        <title>Quotes</title>
      </Head>
      {randomQuote && <QuoteContent quote={randomQuote} linked />}
      {quotes.map((quote) => <QuoteContent key={quote.id} quote={quote} linked />)}
    </ArticleLayout>
  );
}
