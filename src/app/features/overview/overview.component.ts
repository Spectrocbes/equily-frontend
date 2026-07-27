import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  AccountType, WealthCategory, ACCOUNT_CATEGORY, WEALTH_CATEGORY_LABELS, WEALTH_CATEGORY_ROUTE,
  ChartPeriod, PortfolioHistoryPoint, TopPerformer,
} from '../../core/models/account.model';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { EvolutionChartComponent } from '../../shared/components/evolution-chart/evolution-chart.component';
import { AddAccountModalComponent } from '../wealth/shared/add-account-modal.component';

const DONUT_COLORS: Record<WealthCategory, string> = {
  investments: '#6366f1',
  crypto:      '#f59e0b',
  savings:     '#10b981',
  cash:        '#64748b',
};

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CurrencyPipe, DecimalPipe, RouterLink,
    DonutChartComponent, EvolutionChartComponent,
    AddAccountModalComponent, UserCurrencyPipe, TranslatePipe,
  ],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  protected readonly accountService     = inject(AccountService);
  private readonly analyticsService     = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  protected readonly showModal          = signal(false);

  protected readonly historyPoints  = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading = signal(true);
  protected readonly topPerformers  = signal<TopPerformer[]>([]);

  private readonly INVESTMENT_TYPES: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE', 'CRYPTO_WALLET',
  ];

  protected readonly currentTotalWealth = computed(() => {
    const accounts = this.accountService.accounts();
    return accounts.reduce((sum, acc) => {
      if (acc.status === 'CLOSED') return sum;
      const category = ACCOUNT_CATEGORY[acc.accountType];
      if (category === 'investments' || category === 'crypto') {
        const summary = this.accountService.getPortfolioSummary(acc.id);
        return sum + (summary?.livePortfolioValue ?? 0) + acc.balance;
      }
      return sum + acc.balance;
    }, 0);
  });

  protected readonly totalWealth = computed(() => {
    const accounts = this.accountService.accounts();
    return accounts.reduce((sum, account) => {
      if (this.INVESTMENT_TYPES.includes(account.accountType)) {
        const summary = this.accountService.getPortfolioSummary(account.id);
        const portfolioVal = summary?.livePortfolioValue
          ?? account.portfolioValue ?? 0;
        return sum + portfolioVal + account.balance;
      }
      return sum + account.balance;
    }, 0);
  });

  protected readonly donutData = computed(() => {
    const accounts = this.accountService.accounts();
    const totals: Record<WealthCategory, number> = {
      investments: 0, crypto: 0, savings: 0, cash: 0,
    };

    for (const account of accounts) {
      const category = ACCOUNT_CATEGORY[account.accountType];
      const summary = this.accountService.getPortfolioSummary(account.id);
      const isInvestmentLike = category === 'investments' || category === 'crypto';
      const portfolioVal = isInvestmentLike
        ? (summary?.livePortfolioValue ?? account.portfolioValue ?? 0)
        : 0;
      totals[category] += portfolioVal + account.balance;
    }

    return (Object.entries(totals) as [WealthCategory, number][])
      .filter(([, value]) => value > 0)
      .map(([cat, value]) => ({
        category: cat,
        label: WEALTH_CATEGORY_LABELS[cat],
        labelKey: 'nav.' + cat,
        route: WEALTH_CATEGORY_ROUTE[cat],
        value,
        color: DONUT_COLORS[cat],
      }));
  });

  protected loadHistory(period: ChartPeriod): void {
    this.historyLoading.set(true);
    this.analyticsService.getPortfolioHistory(period).subscribe({
      next: pts => {
        this.historyPoints.set(pts);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  private loadTopPerformers(): void {
    this.analyticsService.getTopPerformers(5).subscribe({
      next: data => this.topPerformers.set(data),
    });
  }

  ngOnInit(): void {
    this.accountService.loadSummaries();
    this.accountService.loadAccounts();
    this.accountService.loadPortfolioSummaries();
    this.loadHistory('ONE_MONTH');
    this.loadTopPerformers();
  }

  protected onAccountCreated(): void {
    this.accountService.loadSummaries();
    this.showModal.set(false);
  }
}
