# USC RateMyPlate

A web app for USC students to rate dining hall dishes. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- Daily menu from USC Village, Parkside, and Everybody's Kitchen
- 5-star rating system with comments
- USC email-only authentication (@usc.edu)
- OpenAI-powered comment moderation
- Automated daily menu scraping via Playwright

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Scraper**: Playwright (headless Chromium)
- **Deployment**: Vercel
- **CI**: GitHub Actions (daily menu fetch)

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/brandoncuii/usc-rate-my-dhall.git
   cd usc-rate-my-dhall
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` from the example:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase project URL and keys.

4. Set up the database by running `supabase/schema.sql` in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Running the Menu Scraper

The scraper fetches today's menu from the USC Hospitality website:

```bash
npm run fetch-menu
```

This requires Playwright's Chromium browser. Install it with:

```bash
npx playwright install chromium
```

In production, the scraper runs daily at 3 AM Pacific via a GitHub Action.

## Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start development server       |
| `npm run build`      | Production build               |
| `npm run start`      | Start production server        |
| `npm run lint`       | Run ESLint                     |
| `npm run format`     | Format code with Prettier      |
| `npm run typecheck`  | Run TypeScript type checking   |
| `npm run fetch-menu` | Scrape today's menu and insert |

## Project Structure

```
app/
├── components/       # Shared React components
│   ├── AuthForm.tsx        # Sign in / sign up form
│   ├── AuthProvider.tsx    # Auth context provider
│   ├── CommentSection.tsx  # Rating + comment UI (shared)
│   ├── DishCard.tsx        # Today's dish card
│   ├── Header.tsx          # Shared navigation header
│   ├── PreviousItemCard.tsx # Expandable past dish card
│   ├── RatingInput.tsx     # Star rating input
│   ├── StarRating.tsx      # Star rating display
│   └── UserNav.tsx         # Auth buttons / user info
├── hooks/
│   └── useRating.ts        # Shared rating logic hook
├── api/
│   ├── cron/fetch-menu/    # Vercel cron → GitHub Action trigger
│   └── moderate/           # OpenAI content moderation
├── all-menu-items/         # Previous menu items page
├── my-ratings/             # User's rating history
└── page.tsx                # Home — today's menu
lib/
├── supabase.ts             # Server-side Supabase client
├── supabase-browser.ts     # Client-side Supabase client
├── supabase-admin.ts       # Admin client (service role key)
└── types.ts                # TypeScript interfaces
scripts/
├── fetch-menu.ts           # Scraper entry point
├── scraper/                # Playwright scraper modules
│   ├── config.ts
│   ├── date-picker.ts
│   ├── parser.ts
│   └── scrape.ts
├── db/
│   └── upsert-dishes.ts    # Database insertion logic
└── utils/
    └── date.ts             # Pacific timezone helper
supabase/
└── schema.sql              # Full database schema (run this for fresh setup)
```

## Environment Variables

See [`.env.example`](.env.example) for all required and optional variables.

| Variable                        | Required | Description                       |
| ------------------------------- | -------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes\*    | Service role key for menu writes  |
| `OPENAI_API_KEY`                | No       | Enables comment moderation        |
| `CRON_SECRET`                   | No       | Vercel cron auth                  |
| `GITHUB_PAT`                    | No       | GitHub Action trigger from Vercel |

\* Required for the menu scraper. Falls back to anon key with a warning.
