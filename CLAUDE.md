# Patrick Auld's Personal Website

## Project Overview
This is the personal website for Patrick Auld (patrickauld.com), built as a statically generated blog/portfolio site.

## Technology Stack
- **Framework**: Next.js 15.4.1 with TypeScript
- **Styling**: Tailwind CSS 3.4.4
- **Content**: Markdown-based blog posts with gray-matter frontmatter
- **Deployment**: Vercel
- **Node.js**: v22.17.1 (LTS)
- **Dependencies** : Yarn

## Key Features
- Static site generation (SSG) with Next.js
- Markdown blog post support
- Responsive design with Tailwind CSS
- TypeScript for type safety
- CSV-based quotes page
- Resume PDF serving

## Project Structure
```
├── components/          # React components
│   ├── container.tsx    # Layout container
│   ├── layout.tsx       # Main layout wrapper
│   ├── post-*.tsx       # Blog post components
│   └── meta.tsx         # SEO metadata
├── lib/                 # Utility functions
│   ├── api.tsx          # Content API functions
│   ├── markdownToHtml.tsx # Markdown processing
│   └── gtag.js          # Google Analytics
├── pages/               # Next.js pages
│   ├── index.tsx        # Homepage
│   ├── [slug].tsx       # Dynamic blog posts
│   └── quotes.tsx       # Quotes page
├── _posts/              # Markdown blog posts
├── public/              # Static assets
└── types/               # TypeScript definitions
```

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Content Management
- Blog posts are stored as Markdown files in `_posts/`
- Posts use gray-matter for frontmatter (title, date, etc.)
- Static assets go in `public/`
- Quotes are managed via CSV file in `public/quotes.csv`

## Build Process
- Static site generation via `next build`
- Markdown processing with unified/remark
- TypeScript compilation
- Tailwind CSS processing

## Notes for AI Assistant
- This is a personal website, not a commercial project
- Content is primarily blog posts and personal information
- The site uses a minimal, clean design approach
- No user authentication or dynamic backend features
- Focus on performance and SEO optimization
