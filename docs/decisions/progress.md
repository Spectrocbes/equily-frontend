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

## 2026-05-30 — Phase 5.5a: deposit limit UI (complete)
- `AccountSubType` type + `ACCOUNT_SUB_TYPE_LABELS` + `ACCOUNT_TYPE_SUB_TYPES` + `DEPOSIT_LIMITS` constants added to `account.model.ts`
- `FinancialAccount`: `subType`, `depositLimit`, `totalDeposits`, `remainingCapacity` fields added
- `AddAccountModal`: dynamic sub-type selector driven by selected account type
- `AddTransactionModal`: deposit warning banner (info / amber / rose severity) + submit blocked when limit exceeded
- Investment account rows: mini progress bar + remaining capacity indicator
- 46/46 tests, lint clean, build 0 errors

## 2026-05-30 — Phase 5 complete: user data isolation (complete)
- `AccountService.reset()` clears all signal state (accounts, summaries, loading, errors) on logout
- `AuthService.logout()` calls `accountService.reset()` before clearing the session — no previous user's data leaks to the next login
- `proxy.conf.json`: `/auth` proxied to backend alongside `/api`
- 39/39 tests, lint clean, build 0 errors
- Phase 5 complete — full auth + data isolation
- Next: Phase 2 — Market Data (live prices via Yahoo Finance + CoinGecko)

## 2026-05-29 — Phase 5 Auth UI (complete)
- `AuthService`: JWT decode on init, token storage (localStorage), login/register/logout/refresh
- `authInterceptor`: Bearer header injection + 401→refresh→retry flow
- `authGuard`: redirects unauthenticated users to `/login`
- `LoginComponent`: reactive form, error handling (401), loading state
- `RegisterComponent`: 3-field form (displayName, email, password), conflict handling (409)
- `NavbarComponent`: dynamic avatar initial from `displayName`, user menu dropdown with sign out
- `app.routes.ts`: `/login` + `/register` public, all other routes wrapped in `authGuard`
- 38/38 tests, lint clean, build 0 errors, 17 lazy chunks
- Next: test end-to-end with backend running

## 2026-05-31 — Phase 5.5b: email verification + password reset UI (complete)
- `AuthService`: +4 methods — `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`
- `VerifyEmailComponent`: auto-verifies on `?token=` param; post-register "check your email" state with resend button
- `RegisterComponent`: redirects to `/verify-email?email=xxx` after success (instead of `/overview`)
- `LoginComponent`: 403 → unverified email banner with resend link; "Forgot password?" link added below password field
- `ForgotPasswordComponent`: email form, always shows success state (no email enumeration)
- `ResetPasswordComponent`: reads token from URL, password + confirm with mismatch validator, 3s redirect to login on success
- 3 new public routes: `/verify-email`, `/forgot-password`, `/reset-password`
- 58/58 tests, lint clean, build 0 errors

## 2026-06-01 — Responsive layout refactor (complete)
- Removed all `position: fixed` from navbar and sidebar — pure flex layout, no manual `pt-16`/`ml-64` offsets
- `AppLayoutComponent`: `sidebarOpen` signal, mobile overlay backdrop (click/keydown to close), `p-4 lg:p-6` main padding
- `NavbarComponent`: hamburger button (`lg:hidden`, emits `menuToggled`), logo text `hidden sm:block`, `px-4 lg:px-6`
- `SidebarComponent`: responsive drawer — `fixed` + `translate-x` on mobile, `lg:relative lg:translate-x-0` on desktop; mobile close button
- All page components: headers use `flex-col sm:flex-row` — stack on mobile, row on desktop
- `InvestmentAccountDetailComponent`: account header `flex-col lg:flex-row`, header values `flex-col sm:flex-row`, tabs `overflow-x-auto`, holdings table `overflow-x-auto min-w-[640px]`, transaction fees/qty `hidden sm:block` on mobile
- Base font: 14 px mobile, 16 px at `lg:` breakpoint via `@screen lg` in `styles.scss`
- All template URLs separated from component TS files (CLAUDE.md compliance)
- 58/58 tests, lint clean, build 0 errors

## 2026-06-01 — UI layout fixes + landing page (complete)
- Two-layout architecture: `AuthLayoutComponent` (full-screen, scrollable) + `AppLayoutComponent` (navbar + sidebar, overflow-hidden)
- `AppComponent` stripped to bare `<router-outlet>`; navbar/sidebar moved into `AppLayoutComponent`
- `LandingComponent`: hero, stats bar, features grid (6 cards), account types, security section, about, footer
- Split-screen login + register pages: form panel left, visual panel right (gradient + checklist); hidden on mobile
- `AuthHeaderComponent`: shared clickable logo (`/home`) used by all auth pages — single source of truth
- Landing route changed from `path: ''` to `path: 'home'`; root `''` redirects to `home`; wildcard redirects to `overview`
- Global overflow fix: `html/body` no longer has `overflow: hidden`; only `AppLayoutComponent` root div carries it
- Auth pages (`/home`, `/login`, `/register`, etc.) scroll freely via `AuthLayoutComponent` `min-h-screen` wrapper
- Scroll-to-top button on landing: appears after 400 px scroll via `@HostListener('window:scroll')`, smooth scroll on click
- Anchor nav via `scrollIntoView` — no `href="#section"` links that pollute browser history
- All public-facing marketing copy generalized — no French-specific terms, no competitor mentions on landing/auth pages
- About section rewritten: professional product tone replacing personal-project framing
- 58/58 tests, lint clean, build 0 errors

## 2026-06-03 — Session A frontend: openedAt field + PEA age display (complete)
- `FinancialAccount`: `openedAt: string | null` added; `accountAgeYears()` helper exported from `account.model.ts`
- `CreateAccountRequest`: `openedAt: string | null` added; `AccountService.createAccount()` passes it through
- `AddAccountModalComponent`: `openedAt` date picker shown for PEA/PEA-PME/CTO/PER/AV types; defaults to today; `[max]="today()"` prevents future dates; confirmation step shows formatted date
- `InvestmentAccountDetailComponent`: age badge in header — emerald (≥5 years, withdrawal rules lifted) or amber (<5 years, PEA withdrawal rules apply)
- `account.model.spec.ts` created (3 tests for `accountAgeYears`); modal spec updated (+3 tests: shows/hides openedAt, defaults to today)
- 76/76 tests, lint clean, build 0 errors

## 2026-06-03 — UX fixes from functional testing (complete)
- Cash + Savings account detail pages (`/wealth/cash/:id`, `/wealth/savings/:id`): header, balance, Transactions tab, Add Transaction modal (DEPOSIT/WITHDRAWAL only)
- Clickable account rows in `cash.component.html` + `savings.component.html` via `<a [routerLink]>`
- Form validation: errors shown only on submit attempt (`submitted` signal + `showError()` helper) — applied to LoginComponent, RegisterComponent, AddAccountModalComponent, ForgotPasswordComponent, ResetPasswordComponent
- Login tab order: `tabindex="-1"` on "Forgot password?" link removes it from keyboard tab sequence while keeping it clickable
- Modal backdrop: `(mousedown)` + `(mouseup)` pattern replaces `(click)` — prevents accidental close when dragging from inside the modal to outside; applied to AddAccountModal, AddTransactionModal, CsvImportModal
- Custom broker dropdown in `AddAccountModalComponent` replaces native `<select>` (which ignored dark theme); `@HostListener('document:click')` closes it on outside click
- Number input spinner arrows removed globally via `styles.scss` (`-webkit-appearance: none`, `-moz-appearance: textfield`)
- Fees field: clears zero on focus, restores zero on blur (`onFeesFocus` / `onFeesBlur`)
- Date validation in `AddTransactionModalComponent`: custom validator blocks years < 1900 or > 9999; `dateWarning` computed shows amber warning for future dates (non-blocking)
- 65/65 tests, lint clean, build 0 errors

## 2026-06-05 — UX polish + portfolioValue in investments list (complete)
- Fix 1: savings progress bar uses `account.balance` (not `totalDeposits`) for savings sub-types; label shows "balance" not "deposits so far"; "left" → "remaining"
- Fix 2: `ACCOUNT_TYPE_LABELS` map applied throughout all templates — no raw technical strings (`PEA`, `SAVINGS_ACCOUNT`, etc.) visible in the UI
- Fix 3: sub-type selector hidden in `AddAccountModal` when only one option exists (auto-selected internally); `showSubType` gated on `> 1` options
- Fix 4: brokerage fees field shown only for BUY/SELL in `EditTransactionModal` (`@if type === 'BUY' || 'SELL'`)
- Fix 5: CSV import error handler uses `ToastService` (not inline error signal); spec updated to assert `toastService.error()` called
- Fix 6: POSITIONS import result subtracts 1 from imported count (auto-deposit not shown); "+ 1 auto-deposit" note displayed when applicable
- Fix 7: `portfolioValue: number | null` added to `FinancialAccount`; `totalAccountValue()` helper exported from model; `investments.component` updated — account row shows portfolio value only (no cash), header total shows portfolio large + cash discrete, footer total shows portfolio only; `overview.component` uses `accounts()` + `portfolioValue` (not `totalInvested`) for all wealth computations; `loadAccounts()` called in `ngOnInit`
- 84/84 tests, lint clean, build 0 errors

## 2026-06-06 — Phase 2 frontend: live prices in holdings table (complete)
- `EnrichedHolding` interface added to `account.model.ts` (ticker, quantity, averageCostPrice, totalInvested, totalFeesPaid, currentPrice, currency, marketValue, unrealizedPnl, unrealizedPnlPct, priceAvailable)
- `AccountService.getEnrichedHoldings(accountId)` added — GET `/accounts/:id/holdings/enriched`
- `InvestmentAccountDetailComponent`: `enrichedHoldings` + `pricesLoading` signals; `totalMarketValue`, `totalUnrealizedPnl`, `hasSomeLivePrices` computed signals
- Holdings table replaced: 7 columns (Asset, Quantity, Avg cost, Live price, Market value, P&L); live price + % change per row when `priceAvailable`; "at cost" fallback with label when no price
- Loading spinner shown during enriched price fetch; fails silently on error (table falls back to cost basis)
- Summary footer: total market value + total unrealised P&L (colour-coded, shown only when at least one live price available)
- 99/99 tests, lint clean, build 0 errors

## 2026-06-06 — EditTransactionModal: real-time total, frontend validation, UX hardening (complete)
- BUY/SELL: quantity + pricePerUnit fields shown; DEPOSIT/WITHDRAWAL/DIVIDEND/INTEREST: totalAmount field shown; type shown as read-only badge
- Live signals (`liveQuantity`, `livePricePerUnit`, `liveFees`) fed via `valueChanges` subscriptions in `ngOnInit` — `computedTotal` reacts in real time
- `computedTotal` shown only when `> 0` (hidden while fields are empty)
- Frontend validation before API call: qty > 0, price > 0, amount > 0, fees ≥ 0, date required — each failure shows a specific toast; no null values sent to backend
- Generic error toast on API failure — internal error details not exposed to UI
- Form validators: `Validators.min(0.01)` on amount/qty/price, `Validators.min(0)` on fees
- Labels use wrap-control pattern (`<label><span>text</span><input/></label>`) — satisfies `label-has-associated-control` in both CLI ESLint and VS Code IDE plugin
- 93/93 tests, lint clean, build 0 errors

## 2026-06-04 — Transaction edit, INTEREST type, PEA combined warning, UX fixes (complete)
- Age badge in `InvestmentAccountDetailComponent` conditioned on `subType === 'PEA' || 'PEA_PME'` only (was shown for all investment accounts)
- `AddAccountModal`: subType auto-selected when only one option available; `Validators.required` applied dynamically when sub-types exist; "(optional)" label removed; validation error shown on submit
- `PeaSummary` interface + `AccountService.getPeaSummary()` added (GET `/accounts/summary/pea`); `AddTransactionModal` loads it on init for PEA/PEA-PME accounts and shows combined PEA+PEA-PME deposit warning when both accounts exist
- `INTEREST` added to `TransactionType`; `availableTransactionTypes` computed in `AddTransactionModal` filters by `accountSubType` — savings sub-types get DEPOSIT/WITHDRAWAL/INTEREST, cash gets DEPOSIT/WITHDRAWAL, investments get the full set; buttons show human-readable labels
- `EditTransactionModalComponent` created — edits totalAmount/date/fees/description; type + ticker shown as read-only badge; PUT `/accounts/:id/transactions/:id`; toast on success/error
- Hover-revealed edit button on transaction rows in investment, cash, and savings detail pages (`group` + `opacity-0 group-hover:opacity-100`)
- "Accounts" `<h2>` section header added before accounts list in `savings.component.html` and `cash.component.html`
- 84/84 tests, lint clean, build 0 errors

## 2026-06-09 — feat/multi-currency-historical-fx: multi-currency UI complete
- `AddTransactionModal`: `transactionCurrency` computed (EUR forced for French accounts); `isEurForced` shows EUR-only warning when user currency ≠ EUR; P&L toggle label uses user currency symbol
- `AddAccountModal`: `initialBalanceCurrency` computed; currency passed in payload; initial balance field clears zero on focus, restores on blur
- `RegisterComponent`: 2-step flow with currency selection
- All monetary values use `userCurrency` pipe throughout
- Currency audit: `AccountService.getAccount(id, currency)` added; 4 detail pages (investment, savings, cash, crypto) pass `?currency` param when loading account
- 172/172 tests, lint clean, build 0 errors

## 2026-06-15 — PEA closure rules, SELL UX, UI polish (complete)
- PEA ≥5y withdrawal: two-step UX via `PeaWithdrawalBreakdownModalComponent` — displays gain ratio, taxable gain, PS 17.2% tax, IR exempt confirmation; amount calculated on withdrawal amount from `peaOver5yWithdrawalRequested` event
- `AddTransactionModal`: SELL ticker replaced with dropdown limited to held positions (`holdings` input → `heldTickers` computed); quantity field shows `(max: N)` hint, validates with `Validators.max()` via `onSellTickerChange()`; `isFormValid` rejects quantity exceeding held amount
- `[holdings]="enrichedHoldings()"` wired to `AddTransactionModal` in investment and crypto detail pages
- UI fixes: SELL ticker `<select>` uses `appearance-none` + SVG chevron wrapper for consistent arrow positioning; Active/Closed tab bar rewritten with `flex items-center gap-2`, `leading-none` badges, `-mb-px` alignment; removed stray `mb-3` from active accounts list
- `AddAccountModal.onSubmit()`: success toast added; error handling updated to `typeof err.error === 'string'` check for 422 plain-string bodies (cardinality/deposit cap violations)
- 256/256 tests, lint clean, build 0 errors

## 2026-06-12 — Session B frontend: PEA closure UX redesign (complete)
- `AddTransactionModal`: `peaWithdrawalForcedClosure` computed — triggers when PEA/PEA-PME account is <5 years old, has 0 holdings, and WITHDRAWAL is selected; shows amber warning, forces `totalAmount = account.balance`, changes submit button to "Continue →" which opens the closure modal directly
- 3-dot account menu on `InvestmentAccountDetailComponent`: "Close PEA" action; hidden for non-PEA/PEA-PME accounts and already-closed accounts
- `PeaClosureModalComponent`: adapts display for <5y (full closure — flat tax 31.4%, irreversible warning) vs ≥5y (partial withdrawal — PS 17.2% only, IR exempt); `PeaWithdrawalSimulation` interface fields renamed from French to English (`valeurLiquidative` → `liquidationValue`, `enPerte` → `atLoss`, etc.)
- Tax accordion: IR (12.8%) + PS (17.2%) breakdown for <5y; PS only with "IR exempt ✓" for ≥5y; no-tax banner when `atLoss`
- Closed accounts: Holdings tab, Allocation donut, and Geographical Exposure sections hidden; "Closed" rose badge shown in account header; detail page defaults to Transactions tab
- `InvestmentsComponent`: open and closed accounts rendered in separate labelled sections
- 222/222 tests, lint clean, build 0 errors

## 2026-06-08 — feat/multi-currency-historical-fx: multi-currency transaction UI (complete)
- `Transaction` interface: `currency` replaced by `nativeCurrency`; added `totalAmountNative` (in original currency) and `feesNative` (fees in original currency)
- `RecordTransactionRequest`: `priceCurrency`/`totalCurrency` replaced by single `currency` field
- `AddTransactionModalComponent`: injects `PreferencesService`; amount, price-per-unit, and fees fields show dynamic currency label `(EUR)` and symbol suffix; `onSubmit` sends `currency: preferencesService.currency()` in payload
- Transaction list in all 4 detail pages (investment, crypto, savings, cash): uses `isPositive()` for sign/colour; shows `totalAmountNative` as a secondary monospace line when `nativeCurrency !== userCurrency`
- `RegisterComponent`: 2-step flow — step 1 collects name/email/password, step 2 selects currency preference (EUR/USD/GBP/CHF); `onSubmit` calls `authService.register()` then `preferencesService.update()` via `switchMap`
- 161/161 tests, lint clean, build 0 errors

## 2026-06-20 — feat/transfer-between-accounts: frontend complete
- TRANSFER + PAYMENT transaction types wired end-to-end across all account types
- `ALLOWED_TX_TYPES` per account type: SAVINGS gets TRANSFER+INTEREST only; CASH gets all 8; PEA/CTO/AV/PER get BUY/SELL/DIVIDEND/INTEREST/TRANSFER; CRYPTO gets BUY/SELL/DIVIDEND/TRANSFER
- Custom dropdown for CASH_ACCOUNT type selection: pill chip + "Change" button UX replaces native `<select>`; click-outside via `closeTypeDropdown()` auto-confirms if type already selected
- TRANSFER form: internal/external toggle; destination filtered to open accounts of compatible type, excluding source; available balance hint shown for BUY + TRANSFER
- PEA TRANSFER: linked checking account shown read-only; forced closure flow for accounts <5 years old
- Destination capacity info shown for regulated accounts (PEA, Livrets) when transferring in
- Available balance displayed for BUY + TRANSFER source accounts
- Initial deposit field restricted to CASH_ACCOUNT only in `AddAccountModal`
- Transaction rows: consistent height (`min-h-[52px]`, `items-center`), fixed-width columns, `divide-y` separators; 3-dot container always present to prevent column shift on closed accounts
- PAYMENT + TRANSFER: recipient/external address rendered below description (⇄ linked account, → external address)
- Click-outside closes all modals (backdrop mousedown/mouseup pattern)
- All 4 detail components updated: investment, crypto, savings, cash
- 334/334 tests, lint clean, build 0 errors

## 2026-06-18 — feat/transfer-between-accounts Sprint 2: TRANSFER UI (complete)
- `TransactionType`: `TRANSFER` + `PAYMENT` added to model
- `FinancialAccount`: `linkedCheckingAccountId: string | null` field added
- `Transaction`: `transferId`, `linkedAccountId`, `externalAddress` fields added
- `ALLOWED_TX_TYPES`: per-account-type filtering constant (replaces `ALLOWED_TRANSACTION_TYPES` for modal use); PEA/PME/CTO/PER/AV get BUY/SELL/DIVIDEND/INTEREST/TRANSFER; SAVINGS gets TRANSFER/INTEREST; CASH gets all 8 types; CRYPTO gets BUY/SELL/DIVIDEND/TRANSFER
- `AccountService.executeTransfer()`: POST `/api/v1/transfers` with `TransferRequest` payload
- `AddTransactionModal`: TRANSFER form with internal/external toggle; internal mode shows account dropdown filtered to destination accounts (excludes source + closed); external mode shows optional address field; `availableBalance` hint shown for BUY and TRANSFER; `submitTransfer()` routes to `executeTransfer()` instead of `recordTransaction()`
- `AddAccountModal`: linked checking account selector for PEA/PEA-PME creation; amber warning when no checking accounts available; `linkedCheckingAccountId` passed in `CreateAccountRequest`
- Transaction history: TRANSFER rows show linked account name (⇄) or external address (→); PAYMENT rows show optional beneficiary address; applied across all 4 detail pages (investment, crypto, savings, cash)
- 300/300 tests, lint clean, build 0 errors

## 2026-06-17 — feat/delete-transaction: delete transaction UI (complete)
- `DeleteTransactionModalComponent`: confirmation modal with permanent-deletion warning, transaction details (type, date, amount), loading state
- 3-dot menu (⋮) on transaction rows: Edit + Delete actions; Edit wired to existing `EditTransactionModal`
- Fixed-position dropdown via `getBoundingClientRect` — escapes `overflow-hidden` ancestors entirely; `txMenuPosition` signal stores `{ top, right }` calculated from button coords
- Smart vertical positioning: opens downward when `spaceBelow ≥ 90px`, upward when not, centers as fallback
- Hover animation: amount div shifts left (`group-hover:mr-9`) to reveal ⋮ button which fades + slides in from right (`translate-x-2 → translate-x-0`); button is `w-8 h-8`
- 3-dot menu and delete confirmation hidden on CLOSED accounts
- Crypto detail gained full edit transaction support (`editingTransaction` signal, `onTransactionEditClick`, `EditTransactionModalComponent`) to match other 3 components
- Applied to all 4 detail components (investment, crypto, savings, cash)
- 279/279 tests, lint clean, build 0 errors

## 2026-06-29 — Phase 3 charts (complete)
- `EvolutionChartComponent`: D3.js line+area chart, period selector (1D/1W/1M/YTD/1Y/ALL), hover cursor + tooltip, subtle horizontal grid lines (no Y-axis labels)
- `currentValue` input syncs last chart point with live header value across all pages; y-axis domain clamped to minimum 0
- All 4 detail pages (investment, crypto, savings, cash): per-account evolution chart with `currentAccountValue` computed
- All 4 list sub-pages (investments, crypto, savings, cash): per-type evolution chart (`INVESTMENT/CRYPTO/SAVINGS/CASH`) with `currentValue` bound to live header total
- Overview: global evolution chart (`currentTotalWealth` computed, skips closed accounts) + top performers widget; `@for` tracker uses `ticker + '_' + accountName` to avoid NG0955 duplicate key error
- Investment detail: geographic exposure section with progress bars
- Chart reloads on transaction create / delete / update; chart reloads after account creation in all 4 list components
- Auth interceptor narrowed: `UNAUTHENTICATED_PATHS` list replaces broad `/auth/` skip so `GET /auth/me` receives Bearer token; `loadCurrentUser()` returns `Promise<void>` (always resolves) to block `APP_INITIALIZER` until user state is ready
- 390/390 tests, lint clean, build 0 errors

## 2026-07-03 — feat/balance-validation-and-fixes (complete)
- Toast 422 errors: extracts `err.error?.message` for backend messages
- PEA closure modal: destination account card (same style as transfer modal)
- Badge overflow: `WITHDRAWAL` → `WITHDRAW` via `badgeLabel()`
- Geo exposure reloads after BUY/SELL/DIVIDEND/TRANSFER/DELETE
- `loadPortfolioSummaries()` called after transactions for live price sync
- Crypto detail: geographical exposure section removed
- Date picker: instant scroll to current year (double rAF + scrollTop)
- Date picker: `goBackToYearMode()` restores year position
- `investment-account-detail`: `loadAccounts()` on init for `linkedCheckingAccount`
- 400/400 tests, lint clean, build 0 errors

## 2026-07-10 — feat/delete-account (complete)
- `DeleteAccountModalComponent` with confirmation + warning
- Delete button in 3-dot menu of all 4 detail pages
- PEA/PEA-PME: "Delete account" hidden (Close PEA only)
- Closed PEA: 3-dot menu button hidden entirely
- After deletion: `loadAccounts()` + `loadPortfolioSummaries()` + navigate back
- 457/457 tests, lint clean, build 0 errors

## 2026-07-14 — feat/broker-list-and-ticker-search (complete)
- `brokers.ts`: `TRADITIONAL_BROKERS` + `CRYPTO_BROKERS` separated; `getBrokersForAccountType()` filters by account type
- Custom broker dropdown in `AddAccountModalComponent` replaces the native `<select>` — search input + keyboard navigation (ArrowUp/ArrowDown/Enter/Escape); "Other" always sorted last with a visual separator
- `TickerSearchService`: `GET /api/v1/market-data/search` with 300ms debounce, empty-array fallback on error
- `TickerAutocompleteComponent`: fixed positioning (escapes modal `overflow` via `getBoundingClientRect()`), keyboard navigation, selected-ticker pill UX
- Replaces the plain ticker `<input>` for BUY transactions in `AddTransactionModal`; SELL keeps its held-tickers-only dropdown (business rule, left untouched)
- 496/496 tests, lint clean, build 0 errors

## 2026-07-20 — feat/transaction-modal-ux (complete)
- Default transaction type per account (BUY for INVESTMENT/CRYPTO, TRANSFER for SAVINGS/CASH)
- From card: merged source account + available balance in one compact card
- `formatSubType()`: human-readable subtype labels (LIVRET_A → Livret A, etc.)
- Destination dropdown: custom styled (not native select)
- Confirmation step: amount hero + details card + Edit/Confirm buttons
- `TickerAutocompleteComponent`: `host: { class: 'block' }` fix for inline display
- Field order: type → from → ticker/destination → amount → date → description
- 535/535 tests, lint clean, build 0 errors

## 2026-07-25 — feat/email-sanitization — input sanitization (complete)
- `sanitize.ts`: `normalizeEmail`, `normalizeText`, `normalizeTextOrUndefined`
- Email: normalized on blur + on submit in login, register, forgot-password
- Text fields: trim + collapse spaces in `displayName`, `name`, `ticker`, `description`, `externalAddress`
- `maxlength` attributes on all text inputs (255 email, 72 password, 100 displayName, 255 name/description, 20 ticker)
- `FormControl` validators on numeric fields (min on totalAmount, pricePerUnit, quantity, fees)
- Register: 409 → toast "An account with this email already exists"
- 570/570 tests, lint clean, build 0 errors

## 2026-07-25 — feat/ui-polish-pass (complete)
- Custom scrollbar utility (`.custom-scrollbar`) applied globally
- SELL: clickable "Max: X" button fills quantity
- Edit transaction modal: From card, DatePicker, `formatSubType()`
- Allocation + geo exposure: scrollable with max-height
- Transaction row hover: visible in dark mode (`slate-700/30`)
- Transition-colors audit on all buttons
- Dark mode consistency audit (no gaps found)
- 576/576 tests, lint clean, build 0 errors

## 2026-07-26 — feat/i18n: EN/FR internationalization complete
- Phase A: fixed 6 spec suites broken by missing `TranslateService` (added `provideTestTranslations()`/`useTestTranslations()` from `src/testing/translate-testing.ts`); fixed `label-has-associated-control` lint error in settings language section (`<label>` → `<h2>`)
- Phase B: migrated all remaining components to `| translate` — 3 detail pages (cash/savings/crypto, matching investment's pattern), all 8 shared modals (add/edit/delete account & transaction, csv-import, pea-closure, pea-withdrawal-breakdown), shared components (date-picker incl. localized month/day names via signals + `onLangChange` subscription, ticker-autocomplete, evolution-chart, donut-chart), settings page, landing page (full marketing copy + data-driven sections), analytics stub, app-layout aria-label
- Toast/validation messages across all touched `.ts` files switched from string literals to `translate.instant()`
- `en.json`/`fr.json` grown from 323 → 498 keys each, verified in sync after every batch; stale/mismatched pre-drafted PEA tax-rate copy (17.2%/30%) corrected to match actual current UI values (18.6%/31.4%)
- `formatSubType()` French product-name maps (Livret A, PEA, Compte Titres, etc.) deliberately left untranslated per CLAUDE.md; language-picker labels ("English"/"Français") also left untranslated (shown in their own language)
- `analytics`/`rebalance` left as Phase 6 stubs, `holdings` left as dead/orphaned code — untouched per CLAUDE.md
- 582/582 tests, lint clean, build 0 errors

## 2026-07-27 — feat/i18n: HttpBackend loader fix + badge translation cleanup (complete)
- ngx-translate v18 with `provideTranslateService` + `HttpBackend` loader (`useHttpBackend: true`) — breaks the `TranslateHttpLoader` → `authInterceptor` → `AuthService` → `PreferencesService` → `TranslateService` circular dependency (NG0200) by bypassing all HTTP interceptors for translation file loads
- 498 translation keys in `en.json` + `fr.json`, fully in sync
- All components migrated: auth, layout, pages, detail pages, modals, shared
- `formatSubType()` (add/edit transaction modals) and `badgeLabel()` (all 4 detail pages) use `translate.instant()`
- Account type/subType badges translated everywhere (`'accountType.' + type` / `'subType.' + type` via the `translate` pipe); `ACCOUNT_TYPE_LABELS`/`ACCOUNT_SUB_TYPE_LABELS` removed from `account.model.ts` as dead code once templates no longer referenced them
- Date picker: localized month/day names
- Evolution chart: localized period labels (1J/1S/1M/YTD/1A/MAX)
- Settings: language selector (English / Français)
- `PreferencesService`: `translate.use()` on locale change
- Fixed double-space rendering bug in account header badges (cash/savings/crypto/investment detail pages) — separate multi-line `<span>` elements each contributed their own whitespace text node; collapsed to single-line spans/merged text
- 582/582 tests, lint clean, build 0 errors

## 2026-07-28 — feat/rebalancing-engine (complete)
- `RebalancingService`: `getAllocations`/`saveAllocations` (`/api/v1/rebalancing/accounts/:id/allocations`), `getSuggestions` (`/api/v1/rebalancing/accounts/:id/suggestions`), `saveDcaAmount` (`/api/v1/accounts/:id/dca-amount` — lives on `FinancialAccountController`, not under `/rebalancing`)
- `RebalanceComponent`: account picker (investment/crypto types only, excludes closed), target allocation editor (add/remove category rows, live total validation against 100%), DCA amount input, suggestions list
- Category dropdown: region list for PEA/CTO/PER/AV, token list for Crypto accounts (`availableCategories` computed on `isCrypto`)
- After-DCA predictions: suggestions show `currentPercent → afterDcaPercent (target X%)`, emerald when the DCA moves the category closer to target
- Over-weighted categories (`suggestedAmount === 0` but `currentPercent > targetPercent + 2`) shown in amber with "Will reduce with future DCAs" instead of a false "On target"
- Suggested tickers rendered as pills under each suggestion row
- DCA amount input: focus clears a `0` value, blur restores it; default DCA amount persisted per account via `saveDcaAmount()` and reloaded via `accountService.loadAccounts()` so `selectAccount()` doesn't read a stale `defaultDcaAmount`
- i18n: 22 `rebalancing.*` keys added to `en.json` + `fr.json` (title, subtitle, account/allocation/DCA copy, buy/sell/onTarget/overweighted states, afterDca, suggestedTickers)
- 619/619 tests, lint clean, build 0 errors
