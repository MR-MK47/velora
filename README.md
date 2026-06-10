<div align="center">
  <br/>
  <h1>Velora</h1>
  <p><strong>AI-Powered Video Production Automation</strong></p>
  <p>
    <em>Automatically extract, analyze, and schedule short-form clips from long-form YouTube content using Gemini AI.</em>
  </p>
  <br/>
</div>

---

## Overview

Velora is a full-stack web application that ingests YouTube videos, uses Google Gemini to identify viral-worthy segments, and produces ready-to-publish short-form clips. It is built for content creators, marketers, and media teams who want to repurpose long-form video into platform-optimised shorts, Reels, and TikToks at scale.

### How It Works

1. **Create a Campaign** — Define a project and its content brief.
2. **Extract Clips** — Submit a YouTube URL. Velora fetches the transcript, analyses it with Gemini AI, and identifies high-potential segments.
3. **Review & Score** — Each clip receives a virality score. Filter, sort, and preview your clips.
4. **Schedule & Publish** — *(Coming soon)* Schedule clips for cross-platform publishing.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | [Vite 6](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) | Fast dev server, modern UI, type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [Motion](https://motion.dev/) | Utility-first styling, declarative animations |
| **Backend API** | [Netlify Functions](https://docs.netlify.com/functions/overview/) (serverless) | YouTube transcript fetching, Gemini AI orchestration |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime) | User auth, data storage, real-time clip updates |
| **AI** | [Google Gemini API](https://ai.google.dev/) (`@google/genai`) | Transcript analysis, clip segmentation, virality scoring |
| **Secrets** | [Supabase Vault](https://supabase.com/docs/guides/database/vault) (via `pgsodium`) | Encrypted storage for API keys |
| **Worker** | Google Colab / Python worker | Background video processing pipeline |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project ([create one free](https://supabase.com/dashboard))
- A Google Gemini API key ([get one here](https://ai.google.dev/))
- A Netlify account ([optional, for deployment](https://netlify.com/))

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/velora.git
cd velora

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
```

Edit `.env` with your Supabase project credentials:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (safe for frontend) |
| `SUPABASE_URL` | Same as above (used by Netlify Functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-side only) |

```bash
# 4. Apply database migrations
# Run each SQL file in supabase/migrations/ against your Supabase project
# via the Supabase SQL Editor or the Supabase CLI:
#   supabase db push

# 5. Start the development server
npm run dev
```

The app starts at `http://localhost:5173`.

### Running Netlify Functions Locally

```bash
npm run dev:netlify
```

This starts both the Vite dev server and the Netlify Functions runtime so the `/api/ingest` endpoint is available.

---

## Project Structure

```
velora/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   ├── hooks/               # React hooks (useClips, useCampaigns, useAuth)
│   ├── layouts/             # Dashboard layout with sidebar navigation
│   ├── lib/                 # Utilities, API client, Supabase client, types
│   ├── pages/               # Route pages (Dashboard, Campaigns, Settings, Schedule)
│   └── App.tsx              # Root router with lazy-loaded routes
├── netlify/
│   └── functions/           # Serverless functions
│       ├── _shared/         # Shared auth, Supabase admin client, types
│       └── ingest.ts        # YouTube ingestion + Gemini AI pipeline
├── supabase/
│   └── migrations/          # Database DDL, RLS policies, Vault functions
├── workers/                 # Python Colab worker scripts
├── netlify.toml             # Netlify deployment configuration
└── vite.config.ts           # Vite build configuration
```

---

## Database Migrations

All schema changes are versioned in `supabase/migrations/`:

| Migration | Description |
|-----------|-------------|
| `001_initial_schema.sql` | 7 tables (users, settings, campaigns, clips, etc.), RLS policies, trigger |
| `002_vault_functions.sql` | Supabase Vault-backed secret CRUD functions |
| `003_fix_rls_and_virality.sql` | Fixes recursive RLS, adds `is_admin()` helper, `virality_score` guard |
| `004_add_campaign_brief.sql` | Adds `campaign_brief` column to campaigns |

---

## Deployment

Velora deploys seamlessly to Netlify:

```bash
# Build the frontend
npm run build

# Deploy to Netlify (requires Netlify CLI)
npx netlify deploy --prod
```

The `netlify.toml` configures build commands, function settings, and redirects automatically.

---

## License

[MIT](LICENSE)
