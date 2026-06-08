# Architecture

**Analysis Date:** 2026-06-08

## Pattern Overview

**Overall:** Client-Side Single Page Application (SPA) with Client-Side Routing.

**Key Characteristics:**
- Lazy-loaded layouts and page components using React code-splitting (`React.lazy` and `Suspense`)
- State managed locally in React components using `useState` and `useEffect` hooks
- Layout-based nesting for sub-views using React Router DOM `<Outlet />`
- Asymmetric responsive dashboards utilizing Recharts for data visualization and Motion for animated transitions

## Layers

**Routing Layer:**
- Purpose: Declares navigation mappings and handles code-splitting lazy load fallbacks
- Location: `src/App.tsx`
- Depends on: Pages and layouts
- Used by: React DOM entry point (`src/main.tsx`)

**Layout Layer:**
- Purpose: Encapsulates responsive container structures, sidebar navigation, and user context headers
- Location: `src/layouts/DashboardLayout.tsx`
- Depends on: Pages (rendered through `<Outlet />`), Lucide icons, Motion
- Used by: Routing layer

**View / Page Layer:**
- Purpose: Builds full page views corresponding to distinct URL segments (Landing, login, dashboards, campaign spaces, settings)
- Location: `src/pages/*.tsx`
- Depends on: Components, utils, third-party libraries (recharts, motion)
- Used by: Routing layer

**Component Layer:**
- Purpose: Reusable UI elements, modals, and widgets
- Location: `src/components/*.tsx` (e.g. `src/components/ExtractionModal.tsx`)
- Depends on: Lucide icons
- Used by: Page Layer

**Library / Utility Layer:**
- Purpose: Shared utility functions
- Location: `src/lib/utils.ts`
- Depends on: `clsx`, `tailwind-merge`
- Used by: Layouts and components for merging Tailwind class strings

## Data Flow

**Page Navigation Flow:**

1. User loads landing page `/` (`src/pages/Landing.tsx`)
2. Clicking "Sign In" routes to `/login` (`src/pages/Login.tsx`)
3. User enters mock credentials and clicks "Initialize Session"
4. Login page calls `navigate('/app')` (`src/pages/Login.tsx#L8-L11`)
5. Router maps to `src/layouts/DashboardLayout.tsx` which mounts the dashboard index view `/app` (`src/pages/CommandDashboard.tsx`)
6. Dashboard renders interactive stats charts (recharts) representing video metrics

**Campaign Extraction Flow:**

1. User navigates to `/app/campaigns` (`src/pages/CampaignWorkspace.tsx`)
2. User clicks "Extract Clips" to open modal (`src/components/ExtractionModal.tsx`)
3. Modal takes inputs (YouTube URL, instructions, styles) and triggers client-side mock loading states
4. Active workspaces update page state upon simulation completion

**State Management:**
- Component-scoped: All UI states (active views, configuration inputs, navigation states) are managed locally via React `useState` hooks.
- No global context providers (e.g. Redux, Zustand) or persistence layers are currently active in code.

## Key Abstractions

**Page Component:**
- Purpose: Wraps full-view page logic
- Examples: `src/pages/Landing.tsx`, `src/pages/Settings.tsx`
- Pattern: Default exports with lazy-loaded code-splitting imports in `src/App.tsx`

**Layout Wrapper:**
- Purpose: Provides consistent frame layout with shared components (sidebar navigation, responsive headers)
- Examples: `src/layouts/DashboardLayout.tsx`
- Pattern: Nesting subcomponents dynamically using `<Outlet />`

**Modal Widget:**
- Purpose: Temporary overlaid control views
- Examples: `src/components/ExtractionModal.tsx`
- Pattern: Controlled modals triggered by local state boolean flags

## Entry Points

**React DOM Mounting:**
- Location: `src/main.tsx`
- Triggers: Browser document initialization
- Responsibilities: Imports global stylesheet `index.css`, mounts App under StrictMode onto the root DOM element.

**Application Router:**
- Location: `src/App.tsx`
- Triggers: Mounted by React DOM
- Responsibilities: Lazy loads views, configures routes using `BrowserRouter` and `Routes`.

## Error Handling

**Strategy:** Code-split loading states are caught and handled gracefully at routing boundaries using React's `Suspense` fallback boundary.
There is currently no local error boundary (`ErrorBoundary`) pattern or external crash reporter (e.g. Sentry) integrated.

## Cross-Cutting Concerns

**Styling & Theming:**
- Built using Tailwind CSS v4 custom theme mappings defined in `src/index.css`
- Utilities for conditional class styling resolved using `cn()` abstraction in `src/lib/utils.ts`

**Animations:**
- Handled via declarative motion wrappers from `motion/react` (e.g. transitions for menus, card lists, timelines)

---

*Architecture analysis: 2026-06-08*
*Update when major patterns change*
