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
