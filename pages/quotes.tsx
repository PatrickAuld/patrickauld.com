import Container from "../components/container";
import Layout from "../components/layout";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import router from "next/router";
import PostTitle from "../components/post-title";
import Head from "next/head";
import PostHeader from "../components/post-header";

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
    attribution: row.attribution,
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
      <div>
        <p className="mt-1 max-w-2xl text-lg text-gray-700 dark:text-gray-300 pb-2">{quote}</p>
        <p className="mt-1 max-w-2xl text-md text-gray-700 dark:text-gray-300 pb-2">- {attribution || "Unknown"}</p>
      </div>

  )
}

// Step 4: Use the data in your component
export default function QuotesPage({ quotes }: { quotes: Quote[] }) {
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
                    {quotes.map((quote, index) => (
                      <Quote key={index} quote={quote.quote} attribution={quote.attribution}/>
                    ))}
                  </div>
            </article>
          </>
      </Container>
    </Layout>
  );
}
