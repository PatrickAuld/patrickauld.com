# patrickauld.com

Personal Site for patrickauld.com

Stack is NextJS, Tailwind CSS, TypeScript, deployed to Vercel.

## Content and discoverability

Core content is rendered into HTML by Next.js. Keep essential copy, quote attributions, and navigation available without JavaScript. Use one H1 per page and H2s for sections; give controls accessible names and images useful alt text.

Shared metadata lives in `components/meta.tsx`. Supply each page's title, description, and canonical path. `pages/sitemap.xml.tsx` includes the homepage, Markdown posts, quotes collection, and every individual quote. `public/robots.txt` allows crawling, including Meta-WebIndexer, and advertises the sitemap.

Markdown frontmatter supports `description`, `date` (original publication), and `updated` (last substantive edit), using ISO dates. These appear in HTML metadata and the visible byline; the sitemap uses `updated` or the publication date. Preserve original publication dates and only change `updated` when content changes. Do not stamp every deployment with a fresh date. Quote pages do not invent publication dates for the quoted works.

Review time-sensitive facts such as the homepage role every 30–90 days and update their visible “as of” date when verified. Check internal links with `yarn test:e2e`; periodically check outbound links as well, distinguishing a broken destination from bot blocking or a login requirement.
