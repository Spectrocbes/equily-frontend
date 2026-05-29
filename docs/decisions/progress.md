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

## 2026-05-27 — Transaction form fix + fees + UI polish (complete)
- Transaction form rewritten: `selectedType` signal replaces `type` form control
- `isFormValid` computed uses `toSignal(form.valueChanges)` for reactive validation
- `computedTotal` includes fees: qty × price + fees
- Fees field added (optional, default 0) for BUY/SELL transactions
- Fees always displayed in transaction list
- Balance delta animation: smoother fade-in, arrow icon (↑/↓), 4s duration
- Account cards: full card clickable via `<a [routerLink]>`, hover arrow
- 23 tests across 5 suites, lint clean, build 0 errors

## 2026-05-27 — Holdings tab in account detail (complete)
- `Holding` interface added to `account.model.ts` (ticker, quantity, averageCostPrice, currency, totalInvested)
- `AccountService.getHoldings(accountId)` added — GET `/accounts/:id/holdings`
- `AccountDetailComponent`: `activeTab` signal (`'transactions' | 'holdings'`), `holdings`/`holdingsLoading` signals, `totalInvested` computed
- Tab switcher with count badges sits between account header and content panel
- Holdings table: ticker (font-mono), quantity (8 decimal places), avg cost (includes fees), total invested; footer row shows sum of all positions
- Skeleton loader (animate-pulse) and empty state ("No open positions") handled
- Holdings reloaded alongside transactions on `onTransactionCreated()`
- 26 tests, 0 failures (+3 new: default tab, tab switch, empty holdings message)
- Build 0 errors, lint clean

## 2026-05-27 — Holdings fees separation (complete)
- `Holding` interface: `totalFeesPaid` added (cumulative brokerage fees on BUY transactions); `averageCostPrice` is now pure fiscal (excludes fees)
- Holdings table expanded to 5 columns: Ticker, Quantity, Avg Cost, Position Value, Fees Paid
- Fees Paid column shown in amber when `> 0`, slate when zero
- Footer replaced with 3-line breakdown: Position value / Total fees paid / Total cash out
- `totalFeesPaid` and `totalCashOut` computed signals added to `AccountDetailComponent`
- Subtitle updated: "Average cost excludes fees"
- 27 tests, lint clean, build 0 errors

## 2026-05-29 — Phase 1.5 Session 1: navigation refactor (complete)
- New routes: `/overview`, `/wealth/investments`, `/wealth/crypto`, `/wealth/savings`, `/wealth/cash`
- `wealth.routes.ts`: lazy-loaded child routes under `/wealth`
- `ACCOUNT_CATEGORY` + `WEALTH_CATEGORY_LABELS` + `WEALTH_CATEGORY_ROUTE` maps added to `account.model.ts`
- `SidebarComponent`: Wealth accordion with collapsible sub-items, no emoji icons; `routerLinkActive` single-line fix (InvalidCharacterError)
- `OverviewComponent`: total wealth card + SVG donut allocation chart + placeholders (evolution, top performance); Add Account button (all types)
- `DonutChartComponent`: SVG-based, signal inputs (`data`, `total`, `size`)
- `InvestmentsComponent`: accordion per account, clickable name → detail route, Add Account button (investment types only)
- Crypto/Savings/Cash: placeholder pages with filtered Add Account buttons
- `AddAccountModalComponent`: `allowedTypes` input + `filteredAccountTypes` computed; moved to `features/wealth/shared/`
- `features/accounts/` folder deleted; modals preserved in `wealth/shared/`
- 13/13 tests, lint clean, build 0 errors, 11 lazy chunks
- Next: Session 2 — investment account detail page (`/wealth/investments/:id`)

## 2026-05-29 — Phase 1.5 Session 2: investment account detail page (complete)
- `/wealth/investments/:id`: account header (name, broker, type, balance + delta animation), evolution placeholder, donut allocation by holding, geographical exposure placeholder
- Holdings: flat table rows (no accordion) — ticker, quantity, avg cost, invested, market value placeholder
- `plMode` signal (`'euro' | 'percent'`) — P&L toggle placeholder until Phase 2 live prices
- Investments list: accordion removed; full row is a clickable `<a [routerLink]>` → detail page
- Balance delta animation carried over (flash + arrow, 4 s timeout)
- 19/19 tests, lint clean, build 0 errors, 13 lazy chunks
- Next: Session 3 — savings/cash pages + overview polish

## 2026-05-29 — CSV import UI (complete)
- `CsvBroker`, `CsvMode`, `CsvImportResponse` types added to `account.model.ts`
- `AccountService.importCsv()`: multipart FormData POST to `/:id/import/csv`
- `CsvImportModalComponent`: broker selector, mode selector (OPERATIONS / POSITIONS), file picker, result summary
- Import CSV button added to `InvestmentAccountDetailComponent` and `CryptoAccountDetailComponent`; reloads data via `onCsvImported()` on success
- Result step: imported / skipped / errors counts + collapsible error details list
- 28/28 tests, lint clean, build 0 errors, 15 lazy chunks
- Next: test visually with real BoursoBank CSV files

## 2026-05-29 — Phase 1.5 Session 3: savings/cash/crypto pages + overview polish (complete)
- `AccountSummary` interface added to `account.model.ts`; `loadSummaries()` added to `AccountService` — forkJoin parallel holdings fetch for investment/crypto accounts
- Overview: `totalWealth = totalInvested + cashBalance` (investments/crypto) + `balance` (savings/cash); loading skeleton on total wealth card; `summaries().length` for account count
- Investment/Crypto detail header: "Portfolio Value" (totalInvested, primary large) + "Cash Available" (account.balance, secondary with left-border divider)
- Savings page: balance list with broker + accountType + transaction count per row, total footer
- Cash page: same structure as Savings
- Crypto page: full-row clickable `<a [routerLink]>` → detail, chevron, evolution placeholder; matches Investments layout
- `CryptoAccountDetailComponent`: full implementation mirroring investment detail (holdings table, donut, transactions, delta animation, Add Transaction modal)
- Navbar logo wrapped in `<a routerLink="/overview">` (`RouterLink` added to `NavbarComponent`)
- 22/22 tests, lint clean, build 0 errors, 14 lazy chunks
- Next: Phase 2 — Market Data (live prices via Yahoo Finance + CoinGecko)
