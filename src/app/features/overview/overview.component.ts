import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { UserCurrencyPipe } from '../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AccountType, WealthCategory, ACCOUNT_CATEGORY, WEALTH_CATEGORY_LABELS } from '../../core/models/account.model';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
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
  imports: [CurrencyPipe, DecimalPipe, RouterLink, DonutChartComponent, AddAccountModalComponent, UserCurrencyPipe],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  private readonly INVESTMENT_TYPES: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE', 'CRYPTO_WALLET',
  ];

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
        label: WEALTH_CATEGORY_LABELS[cat],
        value,
        color: DONUT_COLORS[cat],
      }));
  });

  ngOnInit(): void {
    this.accountService.loadSummaries();
    this.accountService.loadAccounts();
    this.accountService.loadPortfolioSummaries();
  }

  protected onAccountCreated(): void {
    this.accountService.loadSummaries();
    this.showModal.set(false);
  }
}
