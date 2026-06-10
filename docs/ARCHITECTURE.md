# Architecture

> **Status:** Current — reflects active codebase architecture.
> **Master Plan reference:** Supersedes §3 "Next.js 14 App Router" for API routing. All other §3 stack decisions (Supabase, Tailwind, Recharts, Zustand) remain unchanged.

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  BROWSER  (Vite/React 19 SPA — Netlify CDN)                    │
│  ├── React Router (client-side routing, no SSR)                │
│  ├── Supabase JS client (reads + Realtime subscriptions)       │
│  └── fetch() calls to /api/* → Netlify Functions               │
└──────────────────────┬────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼────────────────────────────────────────┐
│  NETLIFY  (Free tier)                                         │
│  ├── Static assets: dist/ (built by Vite)                     │
│  ├── netlify/functions/*.ts — serverless API routes:          │
│  │   /api/ingest, /api/generate-brief, /api/upload-cover      │
│  │   /api/edit-chat, /api/render-preview ...                  │
│  │   /api/schedule-post, /api/generate-caption ...            │
│  │   /api/save-settings, /api/test-connection                 │
│  └── Redirect: /* → /index.html (SPA fallback)                │
└──────────────────────┬────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼────────────────────────────────────────┐
│  SUPABASE  (Free tier)                                        │
│  ├── PostgreSQL: all tables                                    │
│  ├── Auth: email/password, session, RLS policies              │
│  ├── Vault: encrypted API key storage (Groq, Gemini, etc.)    │
│  └── Realtime: broadcasts INSERT/UPDATE on clips table        │
└──────────────────────┬────────────────────────────────────────┘
                       │ WebSocket (Colab connects OUT — no Ngrok)
┌──────────────────────▼────────────────────────────────────────┐
│  GOOGLE COLAB  (T4 GPU, keep browser tab open)                │
│  ├── Realtime listener: wakes on QUEUED clip INSERT           │
│  ├── Pipeline: yt-dlp → Whisper → ffmpeg → agents → render   │
│  ├── Updates Supabase current_step after every step           │
│  └── Uploads all assets to Google Drive                       │
└──────────────────────────────────────────────────────────────┘
```

**Data flow per clip:**
```
Browser → /api/ingest → Gemini selects hooks → INSERT QUEUED rows → Supabase
Supabase Realtime → Colab wakes → processes clip
Colab → UPDATE current_step per step → Supabase → Realtime → browser card updates live
Colab → Drive upload → UPDATE status=DONE + drive URLs → Supabase → Realtime → browser card shows link
```

---

## Frontend: Vite + React 19 SPA

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Build tool | Vite 6 | Fast HMR, Tailwind v4 plugin, established |
| Framework | React 19 + react-router-dom 7 | Client-side routing only; no SSR needed for an admin console |
| Styling | Tailwind CSS 4 | Via `@tailwindcss/vite` plugin |
| State | Zustand 4 (planned) + local `useState` | Per Master Plan |
| Charts | Recharts | Per Master Plan |
| Deploy | Netlify (`netlify.toml` SPA redirect) | Zero cost, CDN |

---

## Backend API: Netlify Functions

All API routes from Master Plan §8 are implemented as [Netlify Functions](https://docs.netlify.com/functions/overview/) (serverless TypeScript).

### Function Structure

```
netlify/functions/
├── ingest/
│   └── ingest.ts              POST /api/ingest
├── generate-brief/
│   └── generate-brief.ts      POST /api/generate-brief
├── upload-cover/
│   └── upload-cover.ts        POST /api/upload-cover
├── edit-chat/
│   └── edit-chat.ts           POST /api/edit-chat
├── render-preview/
│   └── render-preview.ts      POST /api/render-preview
├── reject-clip/
│   └── reject-clip.ts         POST /api/reject-clip
├── restore-clip/
│   └── restore-clip.ts        POST /api/restore-clip
├── delete-clip/
│   └── delete-clip.ts         POST /api/delete-clip
├── delete-campaign/
│   └── delete-campaign.ts     POST /api/delete-campaign
├── schedule-post/
│   └── schedule-post.ts       POST /api/schedule-post
├── generate-caption/
│   └── generate-caption.ts    POST /api/generate-caption
├── update-schedule/
│   └── update-schedule.ts     PUT /api/update-schedule
├── mark-uploaded/
│   └── mark-uploaded.ts       POST /api/mark-uploaded
├── cancel-schedule/
│   └── cancel-schedule.ts     DELETE /api/cancel-schedule
├── save-settings/
│   └── save-settings.ts       POST /api/save-settings
├── test-connection/
│   └── test-connection.ts     POST /api/test-connection
└── _shared/
    ├── supabase-admin.ts      Service-role Supabase client
    ├── cors.ts                CORS headers helper
    ├── validate.ts            Request validation helpers
    ├── respond.ts             Response envelope helpers (success/error)
    └── types.ts               Shared types and Zod schemas
```

### Function Invocation

Each function:
1. Validates the HTTP method and request body
2. Authenticates via the `Authorization` header (Supabase JWT from session)
3. Executes the business logic using the Supabase admin client
4. Returns a JSON response with CORS headers

---

## Decision Record

### D-ARCH-01: Replace Next.js API Routes with Netlify Functions

**Context:** The Master Plan (§3) specifies Next.js 14 App Router for both frontend rendering and API routes. However, the actual codebase is a Vite + React 19 SPA with client-side routing. The API routes from Master Plan §8 (clip ingestion, editing, content planning, settings) do not exist.

**Decision:** Keep the Vite SPA as-is. Implement all API routes as Netlify Functions (TypeScript serverless functions). Do not migrate to Next.js.

**Rationale:**

| Factor | Netlify Functions | Next.js Migration |
|--------|------------------|-------------------|
| Frontend rewrite | None | Entire routing, build system, SSR |
| API timeout | 10s sync / 15min background | 10s sync / 15min background (same Netlify infra) |
| Time to first API | Days (additive, isolated) | Weeks (migration + testing) |
| Risk of regression | Low (no frontend changes) | Medium (entire SPA restructured) |
| Master Plan alignment | Documented divergence | Exact match |
| Deployment model | SPA + Functions (2 artifacts) | Single Next.js artifact |

**Trade-offs accepted:**
- The Master Plan now has a documented divergence. Future agents reading the Master Plan §3 must also read this document.
- Two deployment artifacts (Vite build + Functions) instead of one Next.js build. Netlify handles this transparently via `netlify.toml`.
- No SSR for the landing page. Acceptable for a single-user admin console — SEO is not a requirement.

**Status:** Declared 2026-06-09. Applied to all Phase 3 planning going forward.

### D-ARCH-02: Symmetric Architecture

The frontend and backend use the **same language (TypeScript)** and **same types** where possible. Shared validation schemas (Zod) live in `netlify/functions/_shared/` and are mirrored by TypeScript interfaces in `src/lib/types/`. This keeps the two layers in sync without a shared monorepo package.

---

## Divergence from Master Plan

| Master Plan Spec | Current Architecture | Impact |
|------------------|---------------------|--------|
| Next.js 14 App Router | Vite + React 19 SPA | No SSR; API routes via Netlify Functions |
| `app/api/*/route.ts` | `netlify/functions/*/*.ts` | Same HTTP endpoints, different file layout |
| All-in-one framework | Decoupled SPA + Functions | Two deploy artifacts, shared types |

Everything else in §3 (Supabase JS v2, Tailwind, Recharts, Zustand, wavesurfer.js, react-big-calendar) remains as specified.

---

*Document created: 2026-06-09*
*Next review: After Phase 3 completion*
