import Container from "../components/container";
import Layout from "../components/layout";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import router from "next/router";
import PostTitle from "../components/post-title";
import Head from "next/head";
import PostHeader from "../components/post-header";
import { useEffect, useState } from "react";

interface Quote {
  quote: string;
  attribution: string;
}

async function getQuotesFromCSV(): Promise<Quote[]> {
  const csvFilePath = path.join(process.cwd(), "public", "quotes.csv");
  const csvFileContent = fs.readFileSync(csvFilePath, "utf8");
  const { data } = Papa.parse(csvFileContent, { header: true });
  const quotes: Quote[] = data.filter((row: any) => row.quote !== "").map((row: any) => ({
    quote: row.quote,
    attribution: row.attribution || "Unknown",
  }));
  return quotes;
}

export async function getStaticProps() {
  // Step 3: Call the function in getStaticProps
  const quotes = await getQuotesFromCSV();

  return {
    props: {
      quotes,
    },
  };
}

const Quote = ({quote, attribution}: Quote) => {
  return (
    <div className="mb-8 p-6 border-l-4 border-teal-400 dark:border-teal-700">
      <blockquote className="text-lg text-gray-800 dark:text-gray-100 italic leading-relaxed mb-3">
        "{quote}"
      </blockquote>
      <cite className="text-sm text-gray-600 dark:text-gray-400 font-medium not-italic">
        — {attribution || "Unknown"}
      </cite>
    </div>
  )
}

// Step 4: Use the data in your component
export default function QuotesPage({ quotes }: { quotes: Quote[] }) {
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);

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
              <div className="max-w-4xl mx-auto">
                {randomQuote && (
                  <div className="mb-12 text-center">
                    <blockquote className="text-2xl text-gray-800 dark:text-gray-100 italic leading-relaxed mb-4 font-medium">
                      "{randomQuote.quote}"
                    </blockquote>
                    <cite className="text-lg text-gray-600 dark:text-gray-300 font-semibold not-italic">
                      — {randomQuote.attribution || "Unknown"}
                    </cite>
                  </div>
                )}
                <div className="space-y-6">
                  {quotes.map((quote, index) => (
                    <Quote key={index} quote={quote.quote} attribution={quote.attribution}/>
                  ))}
                </div>
              </div>
            </article>
          </>
      </Container>
    </Layout>
  );
}
