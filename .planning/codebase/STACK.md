# Technology Stack

**Analysis Date:** 2026-06-08

## Languages

**Primary:**
- TypeScript 5.8 - Used for all application source code (`src/` files)

**Secondary:**
- JavaScript - Configuration files (e.g. build scripts, config files)

## Runtime

**Environment:**
- Node.js (v20+ recommended) - Local development and build environment
- Web Browser - Execution environment for the React SPA

**Package Manager:**
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0 - Component-based UI framework
- React Router DOM 7.3 - Client-side routing and layout orchestration

**Styling:**
- Tailwind CSS v4.1 - Utility-first styling framework integrated via `@tailwindcss/vite`

**Animation:**
- Motion (formerly Framer Motion) 12.2 - Micro-animations and transitions

**Testing:**
- None configured yet

**Build/Dev:**
- Vite 6.2 - Build tool and development server

## Key Dependencies

**Critical:**
- `@google/genai` (v2.4) - Google GenAI SDK for interacting with Gemini models
- `recharts` (v2.15) - Charts and dashboard analytics visualization
- `lucide-react` (v0.546) - Icon set for the UI
- `clsx` (v2.1) & `tailwind-merge` (v3.0) - Utilities for merging Tailwind classes dynamically

**Infrastructure:**
- `express` (v4.21) - Server framework (defined in package.json dependencies, not currently in active use)
- `dotenv` (v17.2) - Local environment variable management

## Configuration

**Environment:**
- Configured using `.env` files (gitignored). `.env.example` details:
  - `GEMINI_API_KEY` - Required for Gemini AI API calls
  - `APP_URL` - Hosted URL of the application

**Build:**
- `tsconfig.json` - TypeScript compiler parameters
- `vite.config.ts` - Vite bundler and dev-server configuration (includes CSS and React plugins)

## Platform Requirements

**Development:**
- Cross-platform (Windows, macOS, Linux) with Node.js and npm installed
- No complex local database dependencies required for UI setup

**Production:**
- Built as static frontend bundle (Vite build)
- Deployable to static hosts (Netlify, Vercel)

---

*Stack analysis: 2026-06-08*
*Update after major dependency changes*
