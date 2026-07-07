# PROJECT.md — Equily Frontend

> Architecture and orientation guide. For operational rules (commands, conventions, gotchas), see `CLAUDE.md`. For known weaknesses and tech debt, see `GAPS.md`. For the full session-by-session build history, see `docs/decisions/progress.md`.

## What this is

Equily is a **personal wealth management tracker** built by and for a single developer (Kevin), tracking real personal finances. It is strongly oriented toward **French financial products**: PEA and PEA-PME (tax-advantaged stock plans with deposit caps and 5-year withdrawal rules), Livret A / LDDS / LEP / Livret Jeune (regulated savings accounts with deposit ceilings), Assurance Vie, PER, Compte Titres — plus crypto wallets and ordinary checking accounts. The domain logic embedded in the UI (deposit limits, PEA closure tax simulation at 12.8% IR + 17.2% PS, forced-closure rules for PEA withdrawals before 5 years, linked checking accounts for PEA) mirrors actual French tax law.

This repository is the **frontend only**. It is an Angular 18 SPA that talks to a separate backend (`equily-backend`, a REST API at `http://localhost:8080`) which owns all persistence, price fetching (Yahoo Finance / CoinGecko per the roadmap), FX conversion, and business-rule enforcement. The frontend re-implements some rules (deposit caps, transaction-type restrictions) purely for UX — the backend is the authority and returns 422s when rules are violated.

## Tech stack and why

| Piece | Choice | Evident reasoning |
|---|---|---|
| Framework | Angular 18 LTS, 100% standalone components | Modern Angular without NgModules; every component declares `standalone: true` and lazy-loads via `loadComponent` |
| State | Angular Signals in singleton services | Deliberate "no NgRx" decision (see CLAUDE.md). Services hold `signal()`s; components read them via `computed()`. Simple app, one user, no need for a store |
| HTTP | `HttpClient` + functional interceptor | JWT bearer injection + 401→refresh→retry in `auth.interceptor.ts` |
| Styling | TailwindCSS 3 + small custom palette | Utility-first; dark mode via `class` strategy on `<html>`. Almost zero component SCSS |
| Charts | D3 v7 (evolution chart) + hand-rolled SVG (donut) | D3 only where needed (time-series line/area with hover); the donut is plain SVG stroke-dasharray math — no chart library dependency |
| Tests | Jest + jest-preset-angular (replaced Karma) | Faster CI; 400 tests across 27 suites as of 2026-07 |
| Lint | ESLint flat config + angular-eslint + template accessibility rules | |
| CI | GitHub Actions: lint → build → test:ci → SonarCloud | Quality gate lives in SonarCloud (`spectrocbes_equily-frontend`) |
| Forms | Reactive Forms, often bridged to signals via `toSignal(form.valueChanges)` | Enables `computed()` validation like `isFormValid` |

There is **no SSR, no i18n framework, no environment file system** (see "Surprises" below), and **no e2e test setup**.

## Architecture

```
                 ┌────────────────────────────────────────────────┐
                 │ AppComponent = bare <router-outlet>            │
                 └──────────────┬─────────────────────────────────┘
        ┌───────────────────────┴──────────────────────────┐
        │                                                  │
 AuthLayoutComponent (public, full-screen)     AppLayoutComponent (authGuard)
   /home      landing page                       Navbar + Sidebar + Toasts + outlet
   /login /register /verify-email                  /overview      global summary
   /forgot-password /reset-password                /wealth/...    (child routes, lazy)
                                                   /analytics     (placeholder stub)
                                                   /rebalance     (placeholder stub)
                                                   /settings      currency prefs
```

`/wealth` child routes (all lazy, in `wealth.routes.ts`): `investments`, `investments/:id`, `crypto`, `crypto/:id`, `savings`, `savings/:id`, `cash`, `cash/:id`. Every `AccountType` maps to one of four `WealthCategory` values (`investments | crypto | savings | cash`) via `ACCOUNT_CATEGORY` in `src/app/core/models/account.model.ts` — that file is the **single source of truth** for the domain vocabulary (types, labels, category→route maps, deposit limits, allowed transaction types, EUR-only rules).

### Data flow

```
Component (ngOnInit) ──calls──▶ Service method
                                   │  HttpClient GET/POST (relative URL /api/v1/…)
                                   │  authInterceptor adds Bearer token; on 401 → refresh → retry
                                   ▼
                             Backend :8080  (dev: via proxy.conf.json  /api + /auth)
                                   │
Service `signal()` ◀── tap/subscribe sets state
        │
Component `computed()` ◀── derives view state ──▶ template (@if/@for control flow)
```

Two state styles coexist deliberately:
- **Shared/global state** lives in services: `AccountService` (accounts list, portfolio summaries, modal loading/error), `PreferencesService` (currency/locale), `AuthService` (current user), `ThemeService`, `ToastService`.
- **Page-local state** (the loaded account, its transactions, holdings, chart points, open-modal flags) lives in component-level `signal()`s and is refetched on every navigation and after every mutation. There is **no client-side cache invalidation scheme** — the pattern after any write is "reload everything": `loadAll(id)` + `loadHistory()` + `loadGeoExposure()` + `loadPortfolioSummaries()`.

### Core services (`src/app/core/services/`)

- **`AccountService`** — the workhorse. CRUD for accounts and transactions, transfers (`POST /api/v1/transfers`), CSV import (multipart), PEA summary/closure-simulation/close, enriched holdings (live prices), portfolio summaries. Holds the shared `accounts` signal that many components and modals read (e.g. the transfer-destination dropdown, linked-checking-account lookups). `reset()` clears everything on logout so user data never leaks across sessions.
- **`AuthService`** — JWT access+refresh tokens in `localStorage` (`equily_access_token` / `equily_refresh_token`). On app start, `APP_INITIALIZER` blocks bootstrap on `loadCurrentUser()` (GET `/auth/me`), so guards see correct auth state on first navigation. Decodes the JWT payload client-side only to pre-populate the user display name.
- **`PreferencesService`** — user display currency (EUR/USD/GBP/CHF). Nearly **every** API call passes `?currency=` from this service; the backend converts amounts. Loaded after login and on app init.
- **`AnalyticsService`** — history (`/api/v1/analytics/history`, per-account variant), geographic exposure, top performers.

### The currency model (important to internalize)

The backend stores transactions with a native currency and converts to the user's display currency on read. The frontend rule: **French regulated products are EUR-only** (`isEurOnlyAccount()` — PEA/PEA-PME/CTO/PER/AV and all Livret sub-types); everything else uses the user's preferred currency. Transactions carry both `totalAmount` (display currency) and `totalAmountNative`; templates show the native amount as a secondary line when it differs. `UserCurrencyPipe` (impure pipe, re-evaluates when the currency signal changes) is the standard way to render money.

### The modal system (`src/app/features/wealth/shared/`)

All wealth mutations happen through shared standalone modal components: `AddAccountModal` (2-step: form → confirm), `AddTransactionModal` (the most complex component in the app, 654 lines), `EditTransactionModal`, `DeleteTransactionModal`, `CsvImportModal`, `PeaClosureModal`, `PeaWithdrawalBreakdownModal`. Conventions they share:
- Rendered conditionally by the parent (`@if (showModal()) { <app-... /> }`), communicate via `output()` events (`closed`, `created`, `updated`).
- Backdrop close uses the **mousedown+mouseup pair pattern** (not click) so drag-selecting text inside the modal can't accidentally close it.
- Success/failure feedback via `ToastService`; backend 422 messages are extracted with the `typeof err.error === 'string' ? err.error : err.error?.message` idiom.

`AddTransactionModal` encodes the hairiest business logic in the app: allowed transaction types per account category (`ALLOWED_TX_TYPES`), deposit-limit warnings (including **combined** PEA+PEA-PME caps from `GET /accounts/summary/pea`), SELL restricted to held tickers with max-quantity validation, TRANSFER with internal/external modes and per-type destination filtering, PEA forced-closure detection (<5y + no holdings + WITHDRAWAL/TRANSFER → emits `peaClosureRequested` instead of submitting), PEA ≥5y withdrawal tax-breakdown flow, and min-date constraints from `openedAt` of both source and destination accounts.

### Key design decisions you can infer

1. **Backend is authoritative; frontend duplicates rules only to warn early.** Deposit limits (`DEPOSIT_LIMITS`) explicitly "mirror backend DepositLimits constants". Submits are still blocked client-side where the rule is certain, but 422 handling exists everywhere.
2. **Templates always in separate `.html` files** — enforced project rule, no inline templates anywhere.
3. **Reload-over-cache**: after any mutation, refetch from the server rather than patching local state. Trades extra requests for correctness — sensible for a single-user app.
4. **Signals-first, RxJS only at the HTTP boundary** (plus `toSignal` bridges for form `valueChanges`).
5. **Four parallel detail pages instead of one generic one** (investment/crypto/savings/cash). They were copy-pasted and diverged; investment is the richest (holdings, donut, geo exposure, PEA flows), savings/cash are transactions-only. This is the biggest source of duplication — see GAPS.md.
6. **Charts sync to live values**: `EvolutionChartComponent` takes a `currentValue` input and overwrites the last history point with it, so the chart tip always matches the live header number.
7. **Fixed-position floating UI** (transaction 3-dot menus, date-picker calendar) computed from `getBoundingClientRect()` to escape `overflow-hidden` ancestors — repeated hand-rolled pattern, no CDK overlay.

## Critical paths (change with care)

1. **`src/app/core/models/account.model.ts`** — every feature imports from it. Adding an `AccountType` requires touching `ACCOUNT_CATEGORY`, `ACCOUNT_TYPE_LABELS`, `ALLOWED_TRANSACTION_TYPES`/`ALLOWED_TX_TYPES`, possibly `EUR_ONLY_*` and route maps, and it must match the backend enum exactly.
2. **`auth.interceptor.ts` + `AuthService` + `APP_INITIALIZER` wiring** — subtle and already bitten once: the interceptor must skip *exactly* the `UNAUTHENTICATED_PATHS` list (not all `/auth/*`, because `GET /auth/me` needs the Bearer token). Breaking this breaks app bootstrap.
3. **`AddTransactionModal`** — 654 lines of interacting computeds; the PEA closure/withdrawal branching in `onSubmit()` is easy to regress. It has the largest spec (961 lines); run it after any change.
4. **`AccountService.reset()` on logout** — the user-data-isolation guarantee. Any new stateful signal added to `AccountService` must also be cleared in `reset()`.
5. **`account.service.ts` URL + currency conventions** — every read passes `?currency`. Forgetting it shows wrong-currency amounts silently.

Safe to change casually: templates/styling of list pages, landing page, placeholder pages (`analytics`, `rebalance`, `holdings`), toast styling, donut colors.

## Surprises and traps for newcomers

- **`ng test` does not work.** `angular.json` still declares the Karma builder, but Karma isn't installed. Tests run via `npm test` (Jest).
- **There is no `src/environments/`.** API URLs are relative (`/api/v1/...`, `/auth/...`); dev uses `proxy.conf.json`, prod assumes same-origin reverse proxying. The `@env/` mapping in `jest.config.js` and the `${BACKEND_URL}` mention in CLAUDE.md are vestigial/aspirational.
- **Spec files are not type-checked.** Root `tsconfig.json` sets `isolatedModules: true`, so jest-preset-angular transpiles specs without full type checking (e.g. `preferences.service.spec.ts` builds a `UserPreferences` missing the required `eurToTargetRate` field and still passes). Only `ng build` type-checks, and it only covers app code.
- **Two "allowed transaction types" constants exist**: `ALLOWED_TX_TYPES` (keyed by category-ish strings, used by `AddTransactionModal`) is the live one; `ALLOWED_TRANSACTION_TYPES` (keyed by `AccountType`) is dead.
- **`features/holdings/` is an orphan** — no route points to it; it's a leftover stub from the pre-`/wealth` navigation. `analytics` and `rebalance` are routed but placeholder stubs ("Phase 6").
- **Mixed language**: UI is English but French product labels are intentional (`Compte Courant`, `Livret A`); dates sometimes format with `fr-FR`. Don't "fix" French product names to English.
- **`docs/decisions/progress.md`** is a meticulous append-only session log (with dates, test counts, and rationale). Maintaining it after each work session is the de-facto convention — new entries are appended at the bottom (mostly chronological).
- **Backend error bodies come in two shapes**: plain string (422 business-rule violations) or `{ message }` — hence the scattered `typeof err.error === 'string'` checks.
- **The branch model**: work happens on `feat/*` branches merged to `main` via PRs; ~30 old feature branches are never deleted.
