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
