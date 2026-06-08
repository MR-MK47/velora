<!-- GSD:project-start source:PROJECT.md -->

## Project

**Velora**

Velora is a personal AI video compilation pipeline designed for a single Whop content creator. It automates the extraction of viral vertical clips (9:16) from long-form YouTube source videos, processes audio tracks, styles captions, and stages the assets on Google Drive for manual upload, all orchestrated with a zero-budget serverless frontend console and a Google Colab processing worker.

**Core Value:** Surgical vertical clip generation with zero-cost compute overhead, delivering high-agency content creation without manual video editing friction.

### Constraints

- **Budget**: $0 limit — all integrations and API models must run on free tiers.
- **Compute**: No local rendering — laptop runs only the web browser; all media rendering must be offloaded.
- **Storage**: Personal quota limit — files are stored on Google Drive to avoid Supabase storage limit caps.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 5.8 - Used for all application source code (`src/` files)
- JavaScript - Configuration files (e.g. build scripts, config files)

## Runtime

- Node.js (v20+ recommended) - Local development and build environment
- Web Browser - Execution environment for the React SPA
- npm 10.x
- Lockfile: `package-lock.json` present

## Frameworks

- React 19.0 - Component-based UI framework
- React Router DOM 7.3 - Client-side routing and layout orchestration
- Tailwind CSS v4.1 - Utility-first styling framework integrated via `@tailwindcss/vite`
- Motion (formerly Framer Motion) 12.2 - Micro-animations and transitions
- None configured yet
- Vite 6.2 - Build tool and development server

## Key Dependencies

- `@google/genai` (v2.4) - Google GenAI SDK for interacting with Gemini models
- `recharts` (v2.15) - Charts and dashboard analytics visualization
- `lucide-react` (v0.546) - Icon set for the UI
- `clsx` (v2.1) & `tailwind-merge` (v3.0) - Utilities for merging Tailwind classes dynamically
- `express` (v4.21) - Server framework (defined in package.json dependencies, not currently in active use)
- `dotenv` (v17.2) - Local environment variable management

## Configuration

- Configured using `.env` files (gitignored). `.env.example` details:
- `tsconfig.json` - TypeScript compiler parameters
- `vite.config.ts` - Vite bundler and dev-server configuration (includes CSS and React plugins)

## Platform Requirements

- Cross-platform (Windows, macOS, Linux) with Node.js and npm installed
- No complex local database dependencies required for UI setup
- Built as static frontend bundle (Vite build)
- Deployable to static hosts (Netlify, Vercel)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- PascalCase for React components and pages (e.g., `Landing.tsx`, `ExtractionModal.tsx`)
- camelCase for utility modules (e.g., `utils.ts`)
- kebab-case for config files (e.g., `package-lock.json`)
- camelCase for all functions (e.g., `handleLogin`, `triggerChange`, `cn`)
- prefix `handle` for event handlers (e.g., `handleResize`, `handleLogin`)
- prefix `toggle` for boolean state switchers (e.g., `toggleSidebar`)
- camelCase for variables (e.g., `isSidebarOpen`, `activeTab`, `hasChanges`)
- UPPER_SNAKE_CASE for local static mock data configurations (e.g., `chartData`)
- PascalCase for React components and props interface definitions when declared
- Explicit return typing for React component functions (e.g., `export default function DashboardLayout()`)

## Code Style

- 2-space indentation
- Semicolons are required at the end of statements
- Single quotes preferred for imports and non-JSX strings (e.g. `import { Link } from 'react-router-dom';`)
- Double quotes preferred inside JSX attributes (e.g. `className="flex min-h-screen"`)
- TypeScript compilation check scripts enabled: `npm run lint` running `tsc --noEmit`
- No complex ESLint files configured in root directory

## Import Organization

- Keep blank lines between separate import categories (external vs. internal/relative)
- No complex path alias imports configured except the root `@` maps to project root `.` (relative paths `../` are used in existing code)

## Error Handling

- Lazy-loaded components wrapped in standard React `<Suspense>` boundaries at layout route registration levels
- Loading spinners rendered as fallback markup indicators

## Function Design

- React page render trees kept under ~300 lines of descriptive TSX
- Extract complex component subdivisions if layout complexity scales
- Explicit JSX rendering return targets
- early-return conditional formatting utilized for clean responsive styling decisions (e.g., mobile overlays check)

## Module Design

- Default exports are preferred for all React page and layout components (`export default function Landing()`)
- Named exports are preferred for utility helpers (`export function cn(...)`)

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern Overview

- Lazy-loaded layouts and page components using React code-splitting (`React.lazy` and `Suspense`)
- State managed locally in React components using `useState` and `useEffect` hooks
- Layout-based nesting for sub-views using React Router DOM `<Outlet />`
- Asymmetric responsive dashboards utilizing Recharts for data visualization and Motion for animated transitions

## Layers

- Purpose: Declares navigation mappings and handles code-splitting lazy load fallbacks
- Location: `src/App.tsx`
- Depends on: Pages and layouts
- Used by: React DOM entry point (`src/main.tsx`)
- Purpose: Encapsulates responsive container structures, sidebar navigation, and user context headers
- Location: `src/layouts/DashboardLayout.tsx`
- Depends on: Pages (rendered through `<Outlet />`), Lucide icons, Motion
- Used by: Routing layer
- Purpose: Builds full page views corresponding to distinct URL segments (Landing, login, dashboards, campaign spaces, settings)
- Location: `src/pages/*.tsx`
- Depends on: Components, utils, third-party libraries (recharts, motion)
- Used by: Routing layer
- Purpose: Reusable UI elements, modals, and widgets
- Location: `src/components/*.tsx` (e.g. `src/components/ExtractionModal.tsx`)
- Depends on: Lucide icons
- Used by: Page Layer
- Purpose: Shared utility functions
- Location: `src/lib/utils.ts`
- Depends on: `clsx`, `tailwind-merge`
- Used by: Layouts and components for merging Tailwind class strings

## Data Flow

- Component-scoped: All UI states (active views, configuration inputs, navigation states) are managed locally via React `useState` hooks.
- No global context providers (e.g. Redux, Zustand) or persistence layers are currently active in code.

## Key Abstractions

- Purpose: Wraps full-view page logic
- Examples: `src/pages/Landing.tsx`, `src/pages/Settings.tsx`
- Pattern: Default exports with lazy-loaded code-splitting imports in `src/App.tsx`
- Purpose: Provides consistent frame layout with shared components (sidebar navigation, responsive headers)
- Examples: `src/layouts/DashboardLayout.tsx`
- Pattern: Nesting subcomponents dynamically using `<Outlet />`
- Purpose: Temporary overlaid control views
- Examples: `src/components/ExtractionModal.tsx`
- Pattern: Controlled modals triggered by local state boolean flags

## Entry Points

- Location: `src/main.tsx`
- Triggers: Browser document initialization
- Responsibilities: Imports global stylesheet `index.css`, mounts App under StrictMode onto the root DOM element.
- Location: `src/App.tsx`
- Triggers: Mounted by React DOM
- Responsibilities: Lazy loads views, configures routes using `BrowserRouter` and `Routes`.

## Error Handling

## Cross-Cutting Concerns

- Built using Tailwind CSS v4 custom theme mappings defined in `src/index.css`
- Utilities for conditional class styling resolved using `cn()` abstraction in `src/lib/utils.ts`
- Handled via declarative motion wrappers from `motion/react` (e.g. transitions for menus, card lists, timelines)

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
