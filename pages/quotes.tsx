import ArticleLayout from "../components/article-layout";
import QuoteContent from "../components/quote-content";
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
    <ArticleLayout title="Quotes" meta={{
      title: 'Quotes | Patrick Auld',
      description: 'Patrick Auld’s collection of favorite quotes on decision making, creativity, leadership, and life, with attributions and links to individual quotes.',
      path: '/quotes',
    }}>
      <h2>What does Patrick Auld like to quote?</h2>
      <p>A collection of words I return to about decision making, creativity, leadership, and life. Each quote includes its attribution and a link to its own page.</p>
      {randomQuote && <QuoteContent quote={randomQuote} linked />}
      {quotes.map((quote) => <QuoteContent key={quote.id} quote={quote} linked />)}
    </ArticleLayout>
  );
}
