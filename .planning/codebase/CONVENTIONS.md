# Coding Conventions

**Analysis Date:** 2026-06-08

## Naming Patterns

**Files:**
- PascalCase for React components and pages (e.g., `Landing.tsx`, `ExtractionModal.tsx`)
- camelCase for utility modules (e.g., `utils.ts`)
- kebab-case for config files (e.g., `package-lock.json`)

**Functions:**
- camelCase for all functions (e.g., `handleLogin`, `triggerChange`, `cn`)
- prefix `handle` for event handlers (e.g., `handleResize`, `handleLogin`)
- prefix `toggle` for boolean state switchers (e.g., `toggleSidebar`)

**Variables:**
- camelCase for variables (e.g., `isSidebarOpen`, `activeTab`, `hasChanges`)
- UPPER_SNAKE_CASE for local static mock data configurations (e.g., `chartData`)

**Types & Interfaces:**
- PascalCase for React components and props interface definitions when declared
- Explicit return typing for React component functions (e.g., `export default function DashboardLayout()`)

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons are required at the end of statements
- Single quotes preferred for imports and non-JSX strings (e.g. `import { Link } from 'react-router-dom';`)
- Double quotes preferred inside JSX attributes (e.g. `className="flex min-h-screen"`)

**Linting:**
- TypeScript compilation check scripts enabled: `npm run lint` running `tsc --noEmit`
- No complex ESLint files configured in root directory

## Import Organization

**Order:**
1. React core hooks and React Router hooks/libraries (e.g. `import { useState } from 'react';`)
2. Icon packages (e.g. `lucide-react`)
3. Classnames utilities and animations (e.g. `import { cn } from '../lib/utils';`, `import { motion } from 'motion/react';`)
4. Relative subcomponents and models

**Grouping:**
- Keep blank lines between separate import categories (external vs. internal/relative)
- No complex path alias imports configured except the root `@` maps to project root `.` (relative paths `../` are used in existing code)

## Error Handling

**Patterns:**
- Lazy-loaded components wrapped in standard React `<Suspense>` boundaries at layout route registration levels
- Loading spinners rendered as fallback markup indicators

## Function Design

**Size:**
- React page render trees kept under ~300 lines of descriptive TSX
- Extract complex component subdivisions if layout complexity scales

**Return Values:**
- Explicit JSX rendering return targets
- early-return conditional formatting utilized for clean responsive styling decisions (e.g., mobile overlays check)

## Module Design

**Exports:**
- Default exports are preferred for all React page and layout components (`export default function Landing()`)
- Named exports are preferred for utility helpers (`export function cn(...)`)

---

*Convention analysis: 2026-06-08*
*Update when patterns change*
