# Codebase Concerns

**Analysis Date:** 2026-06-08

## Tech Debt

**Bypassed Authentication Logic:**
- Issue: Login form submission bypasses validation entirely and redirects to `/app`.
- Files: `src/pages/Login.tsx#L8-L11` (and similarly `src/pages/Signup.tsx`)
- Why: Rapid prototyping of the dashboard layout without having a backend database configuration yet.
- Impact: Security bypass. Anyone can navigate or get redirected into admin panels without authentication.
- Fix approach: Implement proper auth service logic calling Supabase Auth API endpoint on form submission.

**Ephemeral State Storage:**
- Issue: Active workspace updates, campaigns list modifications, and settings changes are stored in local component `useState` variables.
- Files: `src/pages/CampaignWorkspace.tsx`, `src/pages/Settings.tsx`
- Why: Prototyping page states before database sync is introduced.
- Impact: State is completely lost when the browser tab is refreshed or navigates away.
- Fix approach: Introduce global state stores (e.g., Zustand) or synchronize actions directly with Supabase database tables.

**Relative Import Path Usage:**
- Issue: Components reference files using relative directory walking (`../lib/utils`, `../layouts/DashboardLayout`) instead of path aliases.
- Files: Multiple files across `src/` (e.g., `src/pages/Landing.tsx#L4`, `src/layouts/DashboardLayout.tsx#L3`)
- Why: Fast file additions without standardizing import structure.
- Impact: Refactoring folder layouts or moving files requires updating fragile relative import paths.
- Fix approach: Standardize imports using the root path alias `@/` configured in `vite.config.ts`.

## Known Bugs

**Vite HMR Conditional Disabling:**
- Symptoms: Development hot-reloads do not trigger automatically if `DISABLE_HMR` env is flag-active.
- Trigger: Set by AI Studio to save CPU cycles during automated agent code modifications.
- File: `vite.config.ts#L15-L20`
- Workaround: Manually reload the page during manual browser testing.
- Root cause: Conditional `hmr` and `watch` settings in Vite configuration script.

## Security Considerations

**API Key Storage Client-Side:**
- Risk: Service Role API Key and Gemini API Key are processed and configured in client-side text inputs.
- Files: `src/pages/Settings.tsx#L126-L152`
- Current mitigation: None (only mock forms exist).
- Recommendations: Avoid processing the Supabase Service Role key on the client side at all. Move all AI orchestrations and database service actions to secure backend routes (serverless functions or worker nodes) to protect secret keys from exposure.

**Lack of Route Guard Verification:**
- Risk: Users can bypass authentication checks and access private routes (`/app`, `/app/campaigns`, `/app/settings`) by entering direct URLs.
- Files: `src/App.tsx#L25-L29`
- Current mitigation: None. Route definitions are publicly accessible without checking session tokens.
- Recommendations: Implement a route guard wrapper component that checks the active Supabase session before rendering private layout routes.

## Performance Bottlenecks

**Lazy Splitting Suspense Waterfall:**
- Problem: Individual pages are loaded lazily when navigating, showing a general fallback loading indicator.
- File: `src/App.tsx#L20`
- Measurement: 100ms-500ms navigation delay depending on asset size and network latency.
- Cause: Component bundle files are fetched sequentially on demand.
- Improvement path: Preload critical page assets (like Dashboard and Campaigns) or implement a smoother micro-animated skeleton loader instead of a simple spinner.

## Fragile Areas

**Responsive Layout with Recharts Canvases:**
- File: `src/pages/CommandDashboard.tsx#L33-L78`
- Why fragile: Chart elements wrapped in Recharts responsive containers collapse or distort aspect ratios if sidebar transitions change layout widths dynamically.
- Common failures: Recharts charts overflow page bounds or fail to resize to smaller viewport changes.
- Safe modification: Enforce fixed aspect ratios or trigger chart updates upon sidebar toggle animations.

## Scaling Limits

**Static Client limits:**
- Current capacity: N/A (the client app is static).
- Scaling path: When implementing the video cutting pipeline, serverless routes will hit platform execution execution limits (Netlify serverless timeouts). Heavy media processing must be offloaded to Google Colab or dedicated backend worker nodes.

## Dependencies at Risk

**React 19 Compatibility Warnings:**
- Risk: Using React 19.x with Recharts 2.x and Framer Motion elements might trigger deprecated lifecycle warnings.
- Impact: Console spam or component crash during render.
- Migration plan: Keep libraries updated or lock compatibility versions in `package.json`.

## Missing Critical Features

**Database Table Sync:**
- Problem: There is no active database integration.
- Current workaround: The UI uses hardcoded mock arrays (e.g. `chartData`).
- Blocks: Core content manager dashboard, planner schedule, user campaigns storage.

**Video Processing Worker Connection:**
- Problem: The video cutting workflow (yt-dlp, Whisper transcription, ffmpeg rendering) is entirely missing.
- Blocks: Core product value proposition.

## Test Coverage Gaps

**Zero Automated Testing:**
- What's not tested: Entire codebase (0% test coverage).
- Risk: Design modifications, routing updates, or component edits can introduce silent regressions.
- Priority: High.
- Difficulty to test: Testing setup needs to be initialized from scratch in `package.json`.

---

*Concerns audit: 2026-06-08*
*Update as issues are fixed or new ones discovered*
