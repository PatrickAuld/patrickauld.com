export function slugifyQuote(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function makeQuoteSlug({
  quote,
  id,
  maxLen = 128,
}: {
  quote: string;
  id: string;
  maxLen?: number;
}): string {
  const base = slugifyQuote(quote) || "quote";

  // Ensure uniqueness by suffixing a stable id.
  const suffix = id;
  const separator = "-";

  const maxBaseLen = Math.max(1, maxLen - (separator.length + suffix.length));
  const clippedBase = base.slice(0, maxBaseLen).replace(/-+$/g, "");

  return `${clippedBase}${separator}${suffix}`;
}

export function extractQuoteIdFromSlug(slug: string): string | null {
  // We suffix with a 12-char hex id.
  const m = slug.match(/-([a-f0-9]{12})$/);
  return m ? m[1] : null;
}
