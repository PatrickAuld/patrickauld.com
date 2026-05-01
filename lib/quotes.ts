import fs from "fs";
import path from "path";
import crypto from "crypto";
import Papa from "papaparse";

export type QuoteAttribution = {
  label: string;
  url?: string;
};

export type QuoteRow = {
  id: string;
  quote: string;
  attribution: string;
  attributionLink?: string;
  attributionMeta: QuoteAttribution;
};

function makeQuoteId(quote: string, attribution: string): string {
  // Stable id derived from content.
  const h = crypto
    .createHash("sha1")
    .update(`${quote}::${attribution}`, "utf8")
    .digest("hex");
  return h.slice(0, 12);
}

function parseAttribution(attribution: string, attributionLink?: string): QuoteAttribution {
  const label = attribution.trim() || "Unknown";
  const url = attributionLink?.trim();

  return url ? { label, url } : { label };
}

export function getQuotesFromCSV(): QuoteRow[] {
  const csvFilePath = path.join(process.cwd(), "public", "quotes.csv");
  const csvFileContent = fs.readFileSync(csvFilePath, "utf8");

  const { data } = Papa.parse<Record<string, string>>(csvFileContent, {
    header: true,
    skipEmptyLines: true,
  });

  return (data ?? [])
    .map((row) => {
      const quote = (row.quote ?? "").trim();
      const attribution = (row.attribution ?? "Unknown").trim() || "Unknown";
      const attributionLink = (row.attributionLink ?? "").trim() || undefined;
      return {
        id: makeQuoteId(quote, attribution),
        quote,
        attribution,
        attributionLink,
        attributionMeta: parseAttribution(attribution, attributionLink),
      };
    })
    .filter((q) => q.quote.length > 0);
}

export function getQuoteById(id: string): QuoteRow | null {
  const quotes = getQuotesFromCSV();
  return quotes.find((q) => q.id === id) ?? null;
}
