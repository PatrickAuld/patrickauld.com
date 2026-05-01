import { type QuoteRow } from "../lib/quotes";

export default function QuoteAttribution({
  quote,
  className,
  linkClassName,
}: {
  quote: QuoteRow;
  className: string;
  linkClassName?: string;
}) {
  const label = quote.attributionMeta?.label || quote.attribution || "Unknown";
  const url = quote.attributionMeta?.url;

  return (
    <cite className={className}>
      — {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          {label}
        </a>
      ) : (
        label
      )}
    </cite>
  );
}
