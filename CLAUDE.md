# Equily Frontend

## Project Overview
Angular 18 frontend for Equily — a personal wealth management tracker focused on French financial products (PEA, Livrets, Assurance Vie, PER, CTO) plus crypto and cash.
Communicates with the Equily backend REST API at `http://localhost:8080` (all persistence, prices, FX, and business rules live there; the frontend mirrors some rules for UX only).

📖 **Read `PROJECT.md` for architecture, data flow, and design decisions.**
⚠️ **Read `GAPS.md` for the audited list of known bugs, tech debt, and untested areas — check it before assuming code is trustworthy.**
📜 `docs/decisions/progress.md` is the append-only session log — **append an entry there after every completed work session** (date, what changed, test count).

## Commands
| Task | Command | Notes |
|---|---|---|
| Dev server | `npm start` | http://localhost:4200, proxies `/api` + `/auth` to :8080 (`proxy.conf.json`). Backend must be running for data. |
| Build | `npm run build` | Production config by default; this is also the only full type-check of app code |
| Test | `npm test` | Jest with coverage. **`ng test` is BROKEN** (angular.json still points at Karma, which isn't installed) |
| Test (watch) | `npm run test:watch` | |
| Single spec | `npx jest src/app/path/to/file.spec.ts` | |
| Lint | `npm run lint` | ESLint flat config, includes template + accessibility rules |
| CI | `.github/workflows/ci.yml` | lint → build → test:ci → SonarCloud. No deploy step exists. |

Definition of done for any change: `npm run lint` clean + `npm run build` 0 errors + `npm test` all green.

## Tech Stack
- **Framework**: Angular 18 LTS, Standalone Components (no NgModules anywhere)
- **Styling**: TailwindCSS with custom Equily design system
- **State**: Angular Signals + Services (no NgRx)
- **HTTP**: Angular HttpClient with typed responses
- **Charts**: D3 v7 (evolution chart only); donut chart is hand-rolled SVG
- **Theme**: Dark/Light toggle (persisted in localStorage key `equily-theme`)
- **Language**: English UI (French product labels like "Compte Courant" are intentional — do not translate them)

## Architecture
src/app/
├── core/                  ← singleton services, interceptors, guards
│   ├── models/            ← account.model.ts = single source of truth for domain types/labels/rules
│   ├── services/          ← AccountService, AuthService, PreferencesService, AnalyticsService, ThemeService
│   ├── interceptors/      ← auth.interceptor.ts (Bearer + 401→refresh→retry)
│   └── guards/            ← auth.guard.ts
├── features/
│   ├── overview/          ← global wealth summary
│   ├── wealth/            ← investments / crypto / savings / cash (list + detail each)
│   │   └── shared/        ← ALL mutation modals (add/edit/delete transaction, add account, CSV, PEA closure)
│   ├── auth/              ← login, register, verify-email, password reset
│   ├── landing/           ← public marketing page (/home)
│   ├── settings/          ← currency preference
│   ├── analytics/, rebalance/  ← routed placeholder stubs (Phase 6 — leave alone unless asked)
│   └── holdings/          ← ORPHANED stub, not routed (dead code)
├── shared/
│   ├── components/        ← date-picker, donut-chart, evolution-chart
│   ├── pipes/             ← user-currency.pipe.ts (standard way to render money)
│   └── toast/             ← ToastService + container
├── layouts/               ← AuthLayoutComponent (public) + AppLayoutComponent (guarded, navbar+sidebar)
└── layout/                ← navbar/, sidebar/ (yes, both `layout/` and `layouts/` exist)

## Route Structure
/home /login /register /verify-email /forgot-password /reset-password   → AuthLayout (public)
/overview                     → Global wealth summary
/wealth/{investments|crypto|savings|cash}         → list pages
/wealth/{investments|crypto|savings|cash}/:id     → detail pages
/analytics /rebalance         → placeholder stubs
/settings                     → currency prefs
AccountType → category/route mapping lives in `src/app/core/models/account.model.ts` (`ACCOUNT_CATEGORY`, `WEALTH_CATEGORY_ROUTE`).

## Coding Conventions (actually followed)
- All components `standalone: true`, lazy-loaded via `loadComponent`/`loadChildren`
- **Component files are always separated**: `templateUrl` + `.html` file, never inline `template`. Same for styles: `styleUrl` + `.scss` only if styles exist. No inline `styles`.
- DI via `inject()`, never constructor parameters
- State: `signal()` + `computed()`; service signals are private `_foo` + public `readonly foo = this._foo.asReadonly()`
- Forms: Reactive Forms; bridge to signals with `toSignal(form.valueChanges, { initialValue: form.getRawValue() })`, then write `computed()` validators like `isFormValid`
- Component members referenced from templates are `protected readonly`
- No `any` — strict TypeScript throughout
- Files: `kebab-case.component.ts` / `kebab-case.service.ts`
- Always handle loading and error states in components (skeleton with `animate-pulse`, error state, empty state)
- Money rendering: `{{ value | userCurrency }}` (respects the user's display currency signal)
- Mutations happen in modals in `features/wealth/shared/`; parent shows them with `@if (showModal()) { … }` and listens to `(closed)` / `(created)` / `(updated)` outputs
- After any mutation: reload everything (`loadAll(id)`, `loadHistory(...)`, `loadPortfolioSummaries()`, geo exposure where relevant) — no local state patching
- Error toasts: extract backend messages with `typeof err.error === 'string' ? err.error : err.error?.message ?? '<fallback>'` (422s return plain strings)
- Modal backdrop close uses the `(mousedown)`+`(mouseup)` pair pattern — never plain `(click)` (prevents drag-out accidental close)
- New template control flow (`@if`/`@for` with `track`), not `*ngIf`/`*ngFor`

## Gotchas (things that look wrong or will bite you)
- **`ng test` fails** — Karma was removed; always use `npm test` (Jest).
- **Spec files are NOT type-checked** (`isolatedModules` + jest transpile-only). A spec can pass with stale types. Only `npm run build` type-checks, and only app code.
- **Auth interceptor skip-list is exact**: `UNAUTHENTICATED_PATHS` must NOT include `/auth/me` — it needs the Bearer token (this was a real bug once). Don't "simplify" to skipping all `/auth/*`.
- **`APP_INITIALIZER` blocks bootstrap** on `AuthService.loadCurrentUser()`; it must always resolve (never reject) or the app white-screens.
- **Every data read must pass `?currency`** from `PreferencesService.currency()` — forgetting it silently shows wrong-currency amounts.
- **EUR-only accounts**: PEA/PEA-PME/CTO/PER/AV and Livret sub-types always transact in EUR regardless of user currency — use `isEurOnlyAccount()` from the model.
- **Two allowed-tx-type constants exist**: use `ALLOWED_TX_TYPES`; `ALLOWED_TRANSACTION_TYPES` is dead (see GAPS.md #10 before adding to either).
- **No `src/environments/`** — API URLs are relative; dev proxy handles routing. The `@app/`/`@env/` jest aliases are vestigial; don't use them in imports.
- **UTC-today trap**: `new Date().toISOString().split('T')[0]` is UTC, not local — see GAPS.md #18 before copying that idiom again.
- **Add a signal to `AccountService`? Also clear it in `reset()`** — that method is the user-data-isolation guarantee on logout.
- **`AddTransactionModal` is a minefield** (654 lines of interacting computeds: PEA forced closure, combined deposit caps, SELL max-quantity, transfer destination filtering). Run `npx jest src/app/features/wealth/shared/add-transaction-modal.component.spec.ts` after touching it.
- Floating UI (3-dot menus, date-picker calendar) uses fixed positioning computed from `getBoundingClientRect()` to escape `overflow-hidden` ancestors — keep that pattern if you touch those.
- The four detail components (investment/crypto/savings/cash) are copy-pasted variants — a fix to transaction rows usually must be applied to **all four** (until GAPS.md #4 is executed).
- The evolution chart deliberately overwrites its last data point with the `currentValue` input so chart tip = live header value. Not a bug.

## Rules
- **Never change without care**: `account.model.ts` (everything imports it; must stay in sync with backend enums), `auth.interceptor.ts`, `AuthService`, `AccountService.reset()`, `proxy.conf.json`.
- New `AccountType`s require updating: `ACCOUNT_CATEGORY`, `ACCOUNT_TYPE_LABELS`, `ALLOWED_TX_TYPES`, possibly `EUR_ONLY_*`, `ACCOUNT_TYPE_SUB_TYPES`, `DEPOSIT_LIMITS` — and the backend must know the enum value.
- Frontend validation is UX-only; the backend re-validates and returns 422 with a message — always handle it.
- Don't commit build artifacts (`dist/`, `coverage*/` — note `coverage-new/` is currently wrongly tracked, GAPS.md #12).
- Work on `feat/*` branches; PRs to `main`; keep the session log (`docs/decisions/progress.md`) updated with test counts.

## Design System

### Color Palette (Equily)
- **Primary**: Indigo (`#6366f1`) — actions, links, active states (Tailwind `primary-*` custom scale)
- **Success**: Emerald (`#10b981`) — gains, positive values (`gain` alias)
- **Danger**: Rose (`#f43f5e`) — losses, negative values, errors (`loss` alias)
- **Warning**: Amber (`#f59e0b`) — warnings, deposit-limit alerts
- **Neutral**: Slate scale — backgrounds, borders, text

### Dark Mode
- Dark bg: `slate-900` / `slate-800` / `slate-700`; Light bg: `white` / `slate-50` / `slate-100`
- Toggle persisted in `localStorage` key `equily-theme`, applied via `dark` class on `<html>` (Tailwind `darkMode: 'class'`)
- Every new UI element needs both light and dark variants (`dark:` prefixes)

### Typography
- Font: Inter (Google Fonts); base font 14px mobile / 16px at `lg:`
- Financial figures: monospace (`font-mono`) for alignment
- Positive values: `text-emerald-500`; negative values: `text-rose-500`

## Testing
- Unit tests: Jest (`jest-preset-angular`, jsdom, `setup-jest.ts` mocks `matchMedia`)
- HTTP testing: `provideHttpClient(), provideHttpClientTesting()` + `HttpTestingController` — copy `preferences.service.spec.ts` as the template
- Component tests use TestBed with service mocks via `{ provide: X, useValue: { … jest.fn() } }`
- Coverage gate: ≥ 80% on new code (global is currently ~69% — don't make it worse; untested hot spots listed in GAPS.md #1/#2/#5)
