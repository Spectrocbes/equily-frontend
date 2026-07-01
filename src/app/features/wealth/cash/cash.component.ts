import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AccountType, ACCOUNT_CATEGORY, ACCOUNT_TYPE_LABELS,
  ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent, UserCurrencyPipe, EvolutionChartComponent],
  templateUrl: './cash.component.html',
})
export class CashComponent implements OnInit {
  protected readonly accountService     = inject(AccountService);
  protected readonly analyticsService   = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  protected readonly showModal          = signal(false);
  protected readonly historyPoints      = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading     = signal(false);
  protected readonly currentPeriod      = signal<ChartPeriod>('ONE_MONTH');

  protected readonly allowedTypes: AccountType[] = ['CASH_ACCOUNT'];
  protected readonly ACCOUNT_TYPE_LABELS = ACCOUNT_TYPE_LABELS;

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'cash'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected readonly currentCashValue = computed(() =>
    this.accounts().reduce((sum, acc) => sum + acc.balance, 0)
  );

  protected loadHistory(period: ChartPeriod): void {
    this.currentPeriod.set(period);
    if (this.accounts().length === 0) {
      this.historyPoints.set([]);
      return;
    }
    this.historyLoading.set(true);
    this.analyticsService.getPortfolioHistory(period, 'CASH').subscribe({
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
    this.loadHistory('ONE_MONTH');
  }
}
