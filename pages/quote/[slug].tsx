import Container from "../../components/container";
import Layout from "../../components/layout";
// No title header on quote pages
import Head from "next/head";
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

  return {
    props: {
      quote,
    },
  };
}

export default function QuotePage({ quote }: { quote: QuoteRow | null }) {
  if (!quote) return null;

  const title = "Patrick J Auld";
  const description = `${quote.quote} — ${quote.attribution}`;

  return (
    <Layout>
      <Container>
        <article>
          <Head>
            <title>{title}</title>
            <meta name="description" content={description} />
          </Head>
          <div className="mx-auto max-w-2xl">
            <div className="border-b border-neutral-200 pb-8">
              <blockquote className="mb-4 text-3xl italic leading-relaxed text-gray-800 sm:text-4xl">
                “{quote.quote}”
              </blockquote>
              <cite className="text-base font-semibold not-italic text-gray-600 sm:text-lg">
                — {quote.attribution || "Unknown"}
              </cite>
            </div>

            <div className="pt-6">
              <Link
                className="text-sm text-teal-700 underline decoration-teal-300 underline-offset-2 hover:text-teal-800"
                href="/quotes"
              >
                ← Back to all quotes
              </Link>
            </div>
          </div>
        </article>
      </Container>
    </Layout>
  );
}
