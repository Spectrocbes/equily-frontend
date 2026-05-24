# Equily Frontend

## Project Overview
Angular 18 frontend for Equily — a personal wealth management tracker.
Communicates with the Equily backend REST API at `http://localhost:8080/api/v1`.

## Tech Stack
- **Framework**: Angular 18 LTS, Standalone Components
- **Styling**: TailwindCSS with custom Equily design system
- **State**: Angular Signals + Services (no NgRx)
- **HTTP**: Angular HttpClient with typed responses
- **Theme**: Dark/Light toggle (persisted in localStorage)
- **Language**: English UI

## Architecture
src/app/
├── core/                  ← singleton services, interceptors, guards
│   ├── services/          ← API services (AccountService, etc.)
│   └── interceptors/      ← HTTP interceptors (error handling, etc.)
├── features/              ← feature modules
│   └── accounts/          ← account list, account detail, transaction form
├── shared/                ← reusable components, pipes, directives
│   ├── components/        ← Button, Card, Badge, etc.
│   └── pipes/             ← currency format, percentage, etc.
└── layout/                ← AppShell, Navbar, Sidebar

## Design System

### Color Palette (Equily)
- **Primary**: Indigo (`#6366f1`) — actions, links, active states
- **Success**: Emerald (`#10b981`) — gains, positive values
- **Danger**: Rose (`#f43f5e`) — losses, negative values, errors
- **Warning**: Amber (`#f59e0b`) — warnings, neutral alerts
- **Neutral**: Slate scale — backgrounds, borders, text

### Dark Mode
- Dark bg: `slate-900` / `slate-800` / `slate-700`
- Light bg: `white` / `slate-50` / `slate-100`
- Toggle persisted in `localStorage` key `equily-theme`
- Applied via `dark` class on `<html>` element (Tailwind dark mode strategy)

### Typography
- Font: Inter (Google Fonts)
- Financial figures: monospace (`font-mono`) for alignment
- Positive values: `text-emerald-500`
- Negative values: `text-rose-500`

## API
Backend runs at `http://localhost:8080` (local) or `${BACKEND_URL}` (prod).
Proxy configured in `proxy.conf.json` for local dev.

All API types are defined in `src/app/core/models/`.

## Coding Conventions
- All components are Standalone (`standalone: true`)
- State managed with `signal()`, `computed()`, `effect()` in services
- HTTP calls return `Observable`, converted to Signal with `toSignal()` where needed
- No `any` type — strict TypeScript throughout
- Component files: `kebab-case.component.ts`
- Services: `kebab-case.service.ts`
- Always handle loading and error states in components

## Testing
- Unit tests: Jest (replaces Karma/Jasmine)
- Component tests: Angular Testing Library
- Coverage gate: ≥ 80% on new code