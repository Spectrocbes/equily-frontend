# Equily Frontend — Progress

## 2026-05-24 — Project initialization
- Angular 18 LTS, Standalone Components, Signals + Services, TailwindCSS
- Dark/Light theme toggle with ThemeService (localStorage persistence)
- Tailwind configured: Equily palette (primary indigo, gain emerald, loss rose)
- Core models: FinancialAccount, Transaction, AccountType, TransactionType
- AccountService: Signals-based state (accounts, loading, error, totalBalance)
- ThemeService: dark/light toggle with system preference detection
- Proxy configured: /api → http://localhost:8080
- Font inline disabled in prod build (fonts.googleapis.com unreachable at build time)
- Next: layout (AppShell, Navbar with theme toggle, Sidebar)

## 2026-05-25 — CI/tooling setup (complete)
- Jest migration: Karma/Jasmine removed, jest-preset-angular@14 installed (Angular 18 compatible)
- setup-jest.ts uses new `setupZoneTestEnv()` API (deprecation warning resolved)
- ESLint configured via `@angular-eslint/schematics` (flat config, Angular 18)
- AccountService updated to use `inject()` instead of constructor injection
- GitHub Actions CI: lint → build → test:ci → SonarCloud (Node 22, pinned actions)
- Dependabot: weekly npm + GitHub Actions updates
- sonar-project.properties: projectKey=spectrocbes_equily-frontend
- Local pipeline: lint ✅ build ✅ 1 test ✅ lcov coverage written
- Next: layout (AppShell, Navbar with theme toggle, Sidebar)

## 2026-05-25 — App shell layout (complete)
- App shell implemented: Navbar + Sidebar + RouterOutlet
- NavbarComponent: logo Equily, dark/light toggle (ThemeService), user avatar placeholder
- SidebarComponent: 4 nav items (Accounts, Holdings, Analytics, Rebalance) with router active state
- 4 lazy-loaded feature components (accounts, holdings, analytics, rebalance)
- Dark mode working: toggle persisted in localStorage, dark class on `<html>`
- Tailwind palette extended: `primary-900` added for dark mode active states
- Build: 0 errors, 4 lazy chunks
- Next: Accounts page with real data from backend API

## 2026-05-25 — Accounts page (complete)
- Accounts page implemented with real API integration (AccountService signals)
- Loading skeleton (animate-pulse), error state, empty state, accounts grid
- Total balance card (primary indigo gradient) shown when accounts > 0
- Account cards: name, type label (French), balance (font-mono), transaction count
- `formatAccountType()` maps AccountType enum to French labels
- 7 unit tests for AccountsComponent (loading, error, empty, data, format)
- Build: 0 errors, accounts lazy chunk 7.64 kB
- Next: test visually with backend running, then Add Account modal

## 2026-05-27 — Transaction form fix + fees + UI polish (complete)
- Transaction form rewritten: `selectedType` signal replaces `type` form control
- `isFormValid` computed uses `toSignal(form.valueChanges)` for reactive validation
- `computedTotal` includes fees: qty × price + fees
- Fees field added (optional, default 0) for BUY/SELL transactions
- Fees always displayed in transaction list
- Balance delta animation: smoother fade-in, arrow icon (↑/↓), 4s duration
- Account cards: full card clickable via `<a [routerLink]>`, hover arrow
- 23 tests across 5 suites, lint clean, build 0 errors

## 2026-05-26 — Add Account modal + Account detail page (complete)
- All components refactored to `templateUrl` + `.html` file — no inline templates anywhere (CLAUDE.md updated)
- `broker` field mandatory in `FinancialAccount`, `CreateAccountRequest`, form, and API request
- `REAL_ESTATE` removed from modal account type list
- Add Account modal is a 2-step flow: step 1 collects fields (name, type, broker, initial balance), step 2 shows confirmation summary before POST
- `AccountService` has dedicated `modalLoading`/`modalError` signals, separate from list `loading`/`error`; `createAccount` manages its own loading state and reloads the list on success
- `onSubmit` has an `error:` handler — modal closes correctly on success, stays open with error message on failure
- Broker displayed on account cards below account name
- Account detail page (`/accounts/:id`): shows account header (type, name, balance) + transactions list with type badges, signed amounts, quantity × price breakdown
- `accounts/:id` lazy route added
- 14/14 tests pass, lint clean, build 0 errors
