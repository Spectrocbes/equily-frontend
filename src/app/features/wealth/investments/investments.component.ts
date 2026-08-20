import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AccountType, ACCOUNT_CATEGORY, FinancialAccount,
  PeaSummary, ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

import { BrokerLogoComponent } from '../../../shared/components/broker-logo/broker-logo.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [
    BrokerLogoComponent,
    CurrencyPipe, DatePipe, RouterLink,
    AddAccountModalComponent, UserCurrencyPipe, EvolutionChartComponent, TranslatePipe,
  ],
  templateUrl: './investments.component.html',
})
export class InvestmentsComponent implements OnInit {
  protected readonly accountService     = inject(AccountService);
  protected readonly analyticsService   = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  protected readonly showModal          = signal(false);
  protected readonly peaSummary         = signal<PeaSummary | null>(null);
  protected readonly activeAccountTab   = signal<'active' | 'closed'>('active');
  protected readonly animatedProgress   = signal(false);
  protected readonly historyPoints      = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading     = signal(false);
  protected readonly currentPeriod      = signal<ChartPeriod>('ONE_MONTH');

  protected readonly allowedTypes: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE',
  ];
  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'investments'
    )
  );

  protected readonly openAccounts = computed(() =>
    this.accounts().filter(a => a.status !== 'CLOSED')
  );

  protected readonly closedAccounts = computed(() =>
    this.accounts().filter(a => a.status === 'CLOSED')
  );

  protected readonly total = computed(() =>
    this.openAccounts().reduce((s, a) => s + (a.portfolioValue ?? 0) + a.balance, 0)
  );

  protected readonly totalPortfolioValue = computed(() => {
    const summaries  = this.accountService.portfolioSummaries();
    const accountIds = new Set(this.openAccounts().map(a => a.id));
    if (summaries.length > 0) {
      return summaries
        .filter(s => accountIds.has(s.accountId))
        .reduce((sum, s) => sum + s.livePortfolioValue, 0);
    }
    return this.openAccounts().reduce((sum, a) => sum + (a.portfolioValue ?? 0), 0);
  });

  protected readonly totalCash = computed(() =>
    this.openAccounts().reduce((sum, a) => sum + a.balance, 0)
  );

  protected readonly currentInvestmentsValue = computed(() =>
    this.openAccounts().reduce((sum, acc) => {
      const summary = this.accountService.getPortfolioSummary(acc.id);
      return sum + (summary?.livePortfolioValue ?? 0) + acc.balance;
    }, 0)
  );

  protected liveValue(accountId: string): number {
    return this.accountService.getPortfolioSummary(accountId)
      ?.livePortfolioValue ?? 0;
  }

  protected isPriceAvailable(accountId: string): boolean {
    return this.accountService.getPortfolioSummary(accountId)
      ?.priceAvailable ?? false;
  }

  protected progressPercent(account: FinancialAccount): number {
    const limit    = account.depositLimit;
    const deposits = account.depositNote
      ? (account.ownDeposits ?? 0)
      : (account.totalDeposits ?? 0);
    if (!limit || limit === 0) return 0;
    return Math.min((deposits / limit) * 100, 100);
  }

  protected loadHistory(period: ChartPeriod): void {
    this.currentPeriod.set(period);
    if (this.openAccounts().length === 0) {
      this.historyPoints.set([]);
      return;
    }
    this.historyLoading.set(true);
    this.analyticsService.getPortfolioHistory(period, 'INVESTMENT').subscribe({
      next: pts => {
        this.historyPoints.set(pts);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.loadHistory(this.currentPeriod());
  }

  ngOnInit(): void {
    this.accountService.loadAccounts();
    this.accountService.loadPortfolioSummaries();
    this.accountService.getPeaSummary().subscribe(s => this.peaSummary.set(s));
    setTimeout(() => this.animatedProgress.set(true), 100);
    this.loadHistory('ONE_MONTH');
  }
}
