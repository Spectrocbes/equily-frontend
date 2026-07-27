import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AccountType, ACCOUNT_CATEGORY,
  ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent, UserCurrencyPipe, EvolutionChartComponent, TranslatePipe],
  templateUrl: './crypto.component.html',
})
export class CryptoComponent implements OnInit {
  protected readonly accountService     = inject(AccountService);
  protected readonly analyticsService   = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  protected readonly showModal          = signal(false);
  protected readonly historyPoints      = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading     = signal(false);
  protected readonly currentPeriod      = signal<ChartPeriod>('ONE_MONTH');

  protected readonly allowedTypes: AccountType[] = ['CRYPTO_WALLET'];

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'crypto'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected readonly totalCryptoValue = computed(() => {
    const cryptoAccounts = this.accounts();
    const accountIds     = new Set(cryptoAccounts.map(a => a.id));
    const summaries      = this.accountService.portfolioSummaries();
    if (summaries.length > 0) {
      return summaries
        .filter(s => accountIds.has(s.accountId))
        .reduce((sum, s) => sum + s.livePortfolioValue, 0);
    }
    return cryptoAccounts.reduce((sum, a) => sum + (a.portfolioValue ?? 0), 0);
  });

  protected readonly currentCryptoValue = computed(() =>
    this.accounts().reduce((sum, acc) => {
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

  protected loadHistory(period: ChartPeriod): void {
    this.currentPeriod.set(period);
    if (this.accounts().length === 0) {
      this.historyPoints.set([]);
      return;
    }
    this.historyLoading.set(true);
    this.analyticsService.getPortfolioHistory(period, 'CRYPTO').subscribe({
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
    this.loadHistory('ONE_MONTH');
  }
}
