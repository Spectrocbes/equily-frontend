# GAPS.md — Honest audit of weaknesses

> Ordered by severity, most important first. Each item says what it is, where it lives, why it matters, and a small scoped fix. Facts verified against the code on 2026-07-07 (`main` at `ad91639`, 400/400 tests passing, coverage 69.2% statements / 56.3% branches).

---

## 1. `AccountService` — the most critical service — has zero tests
**Where:** `src/app/core/services/account.service.ts` (no `account.service.spec.ts` exists)
**Why it matters:** Every page depends on this service. It contains real logic (sorting, `loadSummaries()` forkJoin fan-out, error-message extraction, `reset()` user-data isolation) that can silently regress. The user-data-isolation guarantee (`reset()` clearing all signals on logout) is a privacy property with no test.
**Fix (single task):** Create `src/app/core/services/account.service.spec.ts` using `provideHttpClientTesting` (copy the structure of `preferences.service.spec.ts`). Cover at minimum: `loadAccounts` success/error + alphabetical sort, `createAccount` sets/clears `modalError`, `getTransactions`/`getEnrichedHoldings` pass `?currency`, and `reset()` clears every signal.

## 2. `auth.interceptor.ts` and `auth.guard.ts` untested
**Where:** `src/app/core/interceptors/auth.interceptor.ts`, `src/app/core/guards/auth.guard.ts`
**Why it matters:** The 401→refresh→retry flow is the highest-risk code in the app (it already caused a bug fixed on 2026-06-29 — the `/auth/me` Bearer-token regression). Nothing prevents the next regression.
**Fix:** Add `auth.interceptor.spec.ts` covering: token attached, unauthenticated paths skipped, 401 triggers refresh then retries with the new token, refresh failure logs out. Add a 3-case `auth.guard.spec.ts`.

## 3. Concurrent 401s each trigger their own refresh call (race condition)
**Where:** `src/app/core/interceptors/auth.interceptor.ts:35`
**Why it matters:** Detail pages fire 3–5 parallel requests (`loadAll` + history + geo + summaries). If the access token has just expired, **each** 401 independently calls `POST /auth/refresh`. If the backend rotates refresh tokens (it returns a new `refreshToken`), the second refresh may use an already-consumed token, fail, and call `authService.logout()` — randomly kicking the user out on page load.
**Fix:** In the interceptor (or `AuthService.refreshToken()`), share a single in-flight refresh: cache the refresh observable in a module-level variable with `shareReplay(1)`, clear it on complete/error, and have all 401 handlers wait on the same observable.

## 4. Massive copy-paste across the four account-detail components
**Where:** `investment-account-detail.component.ts` (471 lines), `crypto-account-detail.component.ts` (306), `savings-account-detail.component.ts` (191), `cash-account-detail.component.ts` (191) — plus their templates.
**Why it matters:** `openTxMenu()` (fixed-position 3-dot menu math), `requestDeleteTransaction`/`confirmDeleteTransaction`, `isPositive()`, `getBadgeClass()`/`txTypeClass()` (same map, two names), `badgeLabel()`, `getLinkedAccountName()`, `loadHistory()`, and the delta-animation logic are duplicated 3–4×, already diverging (investment's badge map has INTEREST; crypto's doesn't). Every transaction-row bugfix must be applied four times; the 2026-07-03 session notes show fixes repeatedly being "applied to all 4 detail components".
**Fix (do in slices, one task each):**
1. Extract a `TransactionRowMenuComponent` (or a base class/util) owning `openTxMenu` positioning + delete-confirm flow.
2. Move `isPositive`, `getBadgeClass`, `badgeLabel` into a shared `transaction-display.utils.ts` next to the model, and update the four components to import it.
3. Extract the shared "transaction list" template block into a `TransactionListComponent` with inputs (transactions, isClosed) and outputs (edit, delete).

## 5. Coverage is 69% against a stated 80% gate; savings/cash flows fully untested
**Where:** Untested files include both savings/cash detail components, `cash.component.ts`, `savings.component.ts`, `theme.service.ts`, `navbar`, `sidebar`, `app-layout`, `donut-chart`, `toast-container`, `landing`.
**Why it matters:** CLAUDE.md declares "Coverage gate: ≥ 80% on new code". Global is 69.2% statements / 56.3% branches. The savings/cash detail pages perform the same delete/edit mutations as the tested pages but have no safety net.
**Fix:** One task per component: clone the structure of `crypto-account-detail.component.spec.ts` for `savings-account-detail` and `cash-account-detail` (they're simpler — no holdings). Quick wins: `theme.service.spec.ts` and `donut-chart.component.spec.ts` are pure-logic and trivial to test.

## 6. `ng test` target in `angular.json` is broken (still Karma)
**Where:** `angular.json` → `projects.equily-frontend.architect.test` uses `@angular-devkit/build-angular:karma`; Karma is not installed.
**Why it matters:** Anyone (human or agent) running the idiomatic `ng test` gets a confusing failure. README.md also still documents Karma and `ng e2e`.
**Fix:** Delete the `test` architect target from `angular.json` (or repoint it to a jest builder), and update README.md's test section to `npm test`.

## 7. JWT access + refresh tokens in `localStorage` — XSS exfiltration risk (Severity: Medium)
**Where:** `src/app/core/services/auth.service.ts:12-13, 104-105`
**Why it matters:** Any XSS (including via a compromised npm dependency) can read both tokens and fully impersonate the user; a refresh token is long-lived. Angular's sanitization mitigates but doesn't eliminate this. This is a known architectural tradeoff for SPAs, but it should be a *documented decision*, ideally moving the refresh token to an httpOnly cookie backend-side.
**Fix (frontend-scoped):** Document the tradeoff in PROJECT.md and open a backend issue for httpOnly-cookie refresh. Frontend-only hardening: on `loadStoredUser()` JWT-decode failure, also remove the refresh token (today only the access token is removed, `auth.service.ts:122`), and clear both tokens in `clearSession()` on any 401-refresh failure path (already done via `logout()`).

## 8. `loadSummaries()` does an N+1 request fan-out to compute numbers the UI barely uses
**Where:** `src/app/core/services/account.service.ts:72-124`; consumed only by `OverviewComponent` (`overview.component.html:32-42` uses `summariesLoading` + `summaries().length` — just an account count).
**Why it matters:** On every Overview visit it fetches the account list **twice** (`loadAccounts()` at line 74 *and* its own un-currencied `GET` at line 78), then calls `GET /holdings/enriched` **for every investment/crypto account** in parallel — with live-price lookups backend-side — only to display "N accounts". With 10 accounts that's ~12 wasted requests per page view, and `forkJoin` means one failed holdings call drops *all* summaries silently.
**Fix:** In `OverviewComponent`, replace `loadSummaries()` usage with `accounts().length` / `loading()` (already loaded), then delete `loadSummaries()`, `_summaries`, `_summariesLoading`, and the `AccountSummary` plumbing if nothing else references it.

## 9. Overview `totalWealth` includes CLOSED accounts; the chart value excludes them
**Where:** `src/app/features/overview/overview.component.ts:47-71` — `currentTotalWealth` skips `status === 'CLOSED'`, `totalWealth` (used for the big header number and donut) does not.
**Why it matters:** After closing a PEA, the headline number and the evolution-chart tip disagree; the donut can also show a stale "investments" slice for an account whose balance was withdrawn (closed accounts should typically be zero-balance, but the two computeds implement *different definitions of wealth* — one will be wrong the day they diverge).
**Fix:** Add the `if (acc.status === 'CLOSED') return sum;` skip to `totalWealth` and `donutData`, or better, delete `totalWealth` and use `currentTotalWealth` everywhere (they differ only in the `portfolioValue` fallback — decide and unify).

## 10. Dead code inventory
**Where / what:**
- `AccountService.getAccountById()` (`account.service.ts:171`) — no production callers (only stubbed in two specs). Duplicate of `getAccount()` minus currency.
- `AccountService.totalBalance` computed (`account.service.ts:44`) — no callers in TS or templates.
- `ALLOWED_TRANSACTION_TYPES` (`account.model.ts:197`) — superseded by `ALLOWED_TX_TYPES`; no callers.
- `totalAccountValue()` (`account.model.ts:140`) — no callers.
- `features/holdings/holdings.component.*` — orphaned; no route references it.
- `AddTransactionModal.selectType()` vs `selectTypeAndConfirm()` (`add-transaction-modal.component.ts:464-470`) — identical bodies.
- `AddAccountModal.nextStep()` checks `['SAVINGS_ACCOUNT', 'INVESTMENT'].includes(accountType)` (`add-account-modal.component.ts:215`) — `'INVESTMENT'` is not an `AccountType`; half of that condition is unreachable.
- `jest.config.js` `moduleNameMapper` for `@app/`/`@env/` — no `paths` in tsconfig, no `src/environments/`; aliases don't work in app code and are unused.
**Why it matters:** Each is a trap for a smaller model (it *will* pick the dead constant or the dead method).
**Fix:** One PR deleting all of the above (update the two specs that stub `getAccountById` to stub `getAccount`). Each bullet is independently deletable.

## 11. Spec files are never type-checked
**Where:** `tsconfig.json` `isolatedModules: true` + jest-preset-angular ⇒ transpile-only for tests. Proof: `preferences.service.spec.ts:7-11` constructs a `UserPreferences` without the required `eurToTargetRate` field and the suite passes.
**Why it matters:** Model refactors won't surface stale test fixtures; tests keep passing against outdated shapes.
**Fix:** Add a `typecheck` script: `tsc -p tsconfig.spec.json --noEmit` and add it to CI after lint. Then fix the errors it reveals (start with the missing `eurToTargetRate`).

## 12. Committed build artifacts: `coverage-new/` is tracked in git
**Where:** `coverage-new/lcov-report/*` (14 files tracked); `.gitignore` covers `/coverage` and `/coverage-dp` but not `/coverage-new`. `coverage-dp/` and `dist/` also sit untracked in the working tree.
**Fix:** `git rm -r --cached coverage-new`, add `/coverage-new` (or better, `coverage*`) to `.gitignore`, delete the stale local `coverage-dp/`/`coverage-new/` folders.

## 13. `EditTransactionModal` builds its `FormGroup` inside a `computed()`
**Where:** `src/app/features/wealth/shared/edit-transaction-modal.component.ts:41-51`
**Why it matters:** A `computed()` that returns a **new FormGroup** whenever `transaction()` changes is a memoized-value abuse: the `valueChanges` subscriptions wired once in `ngOnInit` (lines 70-78) belong to the *first* form instance. If a parent ever rebinds `[transaction]` without destroying the modal, live-total updates silently stop. Works today only because parents always recreate the modal via `@if`.
**Fix:** Build the form once as a plain field; in `ngOnInit` (or an `effect`), `patchValue` from `transaction()`. Keep behavior identical otherwise.

## 14. Locale and currency-formatting inconsistencies
**Where:**
- `UserCurrencyPipe` hardcodes `new CurrencyPipe('en-US')` (`user-currency.pipe.ts:17`) while `UserPreferences.locale` exists and is user-editable in Settings — the locale preference has **no effect** on formatting.
- `DatePickerComponent.displayValue` and the min-date toast format with `'fr-FR'` (`date-picker.component.ts:121`, `add-transaction-modal.component.ts:540`), while transaction lists use Angular `DatePipe` defaults (en-US).
- `EUR_ONLY_SUB_TYPES` contains `'LDD'` (`account.model.ts:328`) which is not a valid `AccountSubType` (the real one is `'LDDS'`) — harmless but confusing.
**Why it matters:** A French user sees `$1,234.56`-style grouping with `€`, dd/mm dates in pickers but mm/dd elsewhere.
**Fix:** Pass `preferencesService.preferences().locale` into the `CurrencyPipe`/`toLocaleDateString` calls (one small task); delete the `'LDD'` entry after confirming the backend never sends it.

## 15. `UserCurrencyPipe` is impure and instantiates formatting on every change-detection cycle
**Where:** `src/app/shared/pipes/user-currency.pipe.ts` (`pure: false`)
**Why it matters:** Every monetary value in every visible template re-runs `CurrencyPipe.transform` on *any* CD tick (mousemoves during chart hover trigger CD). Fine at current scale, but it's the app-wide money formatter — the single hottest code path.
**Fix (small):** Keep impure (it must react to the currency signal) but memoize: cache `(value, digitsInfo, currency) → string` of the last call per pipe instance. Or long-term: convert call sites to a `formatCurrency` util reading the signal inside `computed()`s.

## 16. Silent error swallowing on analytics/summaries endpoints
**Where:** `loadPortfolioSummaries()` (`account.service.ts:199` — `error: () => {}`), `PreferencesService.load()` (`preferences.service.ts:29`), all `loadHistory`/`loadGeoExposure` handlers (set loading false, show nothing), `getPeaSummary().subscribe(...)` calls with no error callback (`investments.component.ts:124`, `add-transaction-modal.component.ts:430`).
**Why it matters:** If the backend is down, Overview shows **0 €** total wealth and empty charts with no indication anything failed — dangerous for a finance app (looks like your money is gone). An unhandled `getPeaSummary` error also logs an unhandled-rejection-style console error.
**Fix:** Add a single degraded-state signal (e.g. `dataStale` in `AccountService` set on any load error) and render a dismissible warning banner in `AppLayoutComponent` when set. Keep individual widgets fail-soft as today.

## 17. Route guard trusts a client-side-decoded, possibly-revoked token
**Where:** `auth.guard.ts` + `AuthService.loadStoredUser()` (`auth.service.ts:116-129`)
**Why it matters (Low severity):** `isAuthenticated()` is true if a non-expired-looking JWT exists in localStorage — no server validation at guard time. `APP_INITIALIZER` does validate via `/auth/me`, so the window is small (data calls will 401 anyway). It's UX-correct but means "authenticated" UI can flash for a revoked session.
**Fix:** No action needed beyond awareness; optionally have the guard also check that `loadCurrentUser()` completed (e.g. an `authReady` signal) before rendering protected layout.

## 18. Date handling edge cases
**Where:**
- `new Date().toISOString().split('T')[0]` is used ~8× for "today" (`add-transaction-modal.component.ts:246,337,529`, `add-account-modal.component.ts:110,151`, `investment-account-detail.component.ts:393`) — this is **UTC** today. A user in UTC+2 after 22:00 UTC... actually before 02:00 local gets *yesterday*; in the transaction modal, the date validator's future-date logic and `max` constraints can mismatch by a day around midnight.
- `date-picker.component.ts:33` parses `v + 'T12:00:00'` (noon hack) to dodge TZ issues — the hack works but is undocumented and not applied in `ngOnInit` (line 139: `new Date(val)` without the noon suffix — inconsistent).
- `accountAgeYears()` uses 365.25-day years (`account.model.ts:144`) — can disagree with the backend's calendar-date arithmetic exactly at the 5-year PEA boundary, which flips the forced-closure UX.
**Fix:** Add a `todayLocalISO()` util (build from `getFullYear/getMonth/getDate`) in a shared `date.utils.ts`, replace the 8 call sites, and use the noon-parse consistently inside the date picker. For the PEA boundary, prefer asking the backend (it already returns `peaOlderThan5Years` in `PeaWithdrawalSimulation`) over local recomputation where the decision matters.

## 19. `DatePickerComponent` reaches into the global DOM and mutates the parent form
**Where:** `date-picker.component.ts:182-186` — `document.querySelector('.year-scroll-container')` / `document.getElementById('year-…')`; the component also `setValue`s into `parentForm().get(controlName())` instead of implementing `ControlValueAccessor`.
**Why it matters:** Two date pickers open simultaneously would scroll the wrong list; `getElementById` with unscoped IDs breaks if two pickers render year lists. The parent-form coupling means the picker can't be used with `formControlName` and bypasses Angular's CVA contract (touched/dirty semantics are hand-rolled).
**Fix (scoped):** Replace the global queries with `@ViewChild`/`ElementRef`-scoped queries inside the component template. (CVA refactor is a bigger optional task — only worth it if the picker gets reused more widely.)

## 20. Placeholder/half-finished features
**Where:**
- `/analytics` and `/rebalance` are routed empty stubs (`analytics.component.ts`, `rebalance.component.ts` — 8 lines each). Sidebar links point at them; CLAUDE.md describes analytics as "global geographical exposure + insights" which does not exist yet ("Phase 6" for rebalance).
- Settings → "Appearance" and "Notifications" sections say "coming soon" (`settings.component.html:87,99`).
- `Transaction.transferDirection` INCOMING/OUTGOING and `PeaSummary.peaAccountId/peaPmeAccountId` fields are consumed only partially.
- `README.md` is the untouched Angular CLI boilerplate (Karma, `ng e2e`), contradicting reality.
**Why it matters:** A newcomer can't tell intended-but-unbuilt from broken.
**Fix:** Update README.md with real commands and a one-paragraph description (30-minute task). Leave the stubs, but add a `<!-- Phase 6 placeholder -->` comment in each stub template.

## 21. No e2e or integration tests; CI never exercises the real backend contract
**Where:** repo-wide; CI is lint → build → unit tests only.
**Why it matters:** The app's main risks are contract drift (field renames like the French→English `PeaWithdrawalSimulation` rename on 2026-06-12 required coordinated changes) and auth-flow regressions — both invisible to unit tests with mocked HTTP.
**Fix (first step, small):** Commit a `docs/api-contract.md` listing every endpoint + expected shape the frontend consumes (derivable from `account.service.ts`, `analytics.service.ts`, `auth.service.ts`, `preferences.service.ts`). This gives any model a checkable reference before a real e2e harness (Playwright) is invested in.

---

### Notes on things that look wrong but are fine
- French labels in an English UI are intentional (French financial products).
- `pure: false` on `UserCurrencyPipe` is required for currency-switch reactivity (see #15 for the mitigation).
- The `.claude/` directory is gitignored on purpose; `CLAUDE.md` is tracked.
- The last chart point being overwritten by `currentValue` in `EvolutionChartComponent` is a feature, not a bug.
