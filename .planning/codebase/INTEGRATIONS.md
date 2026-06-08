# External Integrations

**Analysis Date:** 2026-06-08

## APIs & External Services

**Google AI Studio / Gemini API:**
- Integration status: Core service connection implemented in frontend configuration
- SDK/Client: `@google/genai` (Node.js/React SDK)
- Auth: API key stored in `GEMINI_API_KEY` (configured locally via `.env`)
- Purpose: Used for context brief summaries, hook selection, and CapCut editing guides (planned)

**Groq API (Planned):**
- Purpose: Transcription via Whisper Large v3, execution of director/caption/code/chat-edit agents via Llama 3.3 70B
- Auth: To be configured in user settings (`groq_key` column in settings schema)

**Freesound API (Planned):**
- Purpose: Search query matching for hook SFX, hook music, and background music in agentic clip mode
- Auth: To be configured in user settings (`freesound_key` column in settings schema)

## Data Storage

**PostgreSQL on Supabase (Planned):**
- Purpose: Relational database storing users, settings, campaigns, clips, schedule, series, and analytics
- Connection: Supabase Client SDK (`@supabase/supabase-js`)
- Configuration inputs (configured via Settings view): Project URL, Service Role API Key (bypasses RLS)

**Google Drive API (Planned):**
- Purpose: Asset storage for final vertical MP4 clips, SRT subtitles, audio tracks, and chat history
- SDK/Client: Service Account integration
- Configuration inputs (configured via Settings view): Drag-and-drop `credentials.json` service account descriptor file, and root folder ID

## Authentication & Identity

**Supabase Auth (Planned):**
- Integration status: Sign In (`Login.tsx`) and Sign Up (`Signup.tsx`) pages currently implement client-side routing redirects directly to the `/app` layout without executing backend authentication.

## CI/CD & Deployment

**Hosting:**
- Deployment target: Netlify (configured for SPA hosting / Next.js serverless functions in target design, currently running as Vite client-only SPA)

## Environment Configuration

**Development:**
- Required env vars:
  - `GEMINI_API_KEY` - API key for Google AI Studio GenAI calls
  - `APP_URL` - Root hosting URL
- Secrets location: local `.env` file (gitignored, configured against `.env.example`)

---

*Integration audit: 2026-06-08*
*Update when adding/removing external services*
