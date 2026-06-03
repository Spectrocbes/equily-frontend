import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly showScrollTop = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.showScrollTop.set(window.scrollY > 400);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected readonly stats = [
    { value: '9+',   label: 'Account types supported' },
    { value: '100%', label: 'Data privacy' },
    { value: 'Free', label: 'Forever for personal use' },
  ];

  protected readonly features = [
    {
      icon: '📊',
      title: 'Portfolio tracking',
      description: 'Track holdings, P&L, average cost price, and fees across all your investment accounts in real time.',
    },
    {
      icon: '🏦',
      title: 'Regulatory compliance',
      description: 'Built-in deposit limit enforcement and account-specific rules — stay compliant automatically.',
    },
    {
      icon: '📥',
      title: 'Broker CSV import',
      description: 'Import your full transaction history from your broker in one click — no manual entry needed.',
    },
    {
      icon: '⚖️',
      title: 'Rebalancing engine',
      description: 'Coming soon — calculate exactly what to buy with available cash to reach your target allocation.',
    },
    {
      icon: '🌍',
      title: 'Geographic exposure',
      description: "Coming soon — visualise your portfolio's exposure by country, region, and asset class.",
    },
    {
      icon: '🔒',
      title: 'Secure by design',
      description: 'JWT RS256 authentication, encrypted tokens, and strict per-user data isolation.',
    },
  ];

  protected readonly accountTypes = [
    'Stocks', 'ETFs', 'Bonds', 'Crypto',
    'Savings accounts', 'Retirement accounts',
    'Real estate', 'Cash accounts',
  ];

  protected readonly security = [
    {
      icon: '🔐',
      title: 'JWT RS256 authentication',
      description: 'Industry-standard asymmetric key signing. Access tokens expire after 15 minutes.',
    },
    {
      icon: '🗄️',
      title: 'Strict data isolation',
      description: "Each user's data is completely isolated. No cross-user data access is possible at any layer.",
    },
    {
      icon: '#️⃣',
      title: 'Hashed sensitive tokens',
      description: 'Refresh, verification, and reset tokens are stored as SHA-256 hashes — never in plain text.',
    },
    {
      icon: '📁',
      title: 'Files never stored',
      description: 'Imported files are parsed in memory and immediately discarded — never persisted to disk or database.',
    },
  ];
}
