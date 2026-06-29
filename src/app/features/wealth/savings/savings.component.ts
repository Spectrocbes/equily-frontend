import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AccountType, ACCOUNT_CATEGORY, FinancialAccount,
  ACCOUNT_TYPE_LABELS, ACCOUNT_SUB_TYPE_LABELS, ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent, UserCurrencyPipe, EvolutionChartComponent],
  templateUrl: './savings.component.html',
})
export class SavingsComponent implements OnInit {
  protected readonly accountService     = inject(AccountService);
  protected readonly analyticsService   = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  protected readonly showModal          = signal(false);
  protected readonly historyPoints      = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading     = signal(false);
  protected readonly currentPeriod      = signal<ChartPeriod>('ONE_MONTH');

  protected readonly allowedTypes: AccountType[] = ['SAVINGS_ACCOUNT'];
  protected readonly ACCOUNT_TYPE_LABELS     = ACCOUNT_TYPE_LABELS;
  protected readonly ACCOUNT_SUB_TYPE_LABELS = ACCOUNT_SUB_TYPE_LABELS;

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'savings'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected readonly currentSavingsValue = computed(() =>
    this.accounts().reduce((sum, acc) => sum + acc.balance, 0)
  );

  protected depositPercent(account: FinancialAccount): number {
    if (!account.depositLimit || account.depositLimit === 0) return 0;
    const isSavings = ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE']
      .includes(account.subType ?? '');
    const used = isSavings ? account.balance : (account.totalDeposits ?? 0);
    return Math.min(100, (used / account.depositLimit) * 100);
  }

  protected loadHistory(period: ChartPeriod): void {
    this.currentPeriod.set(period);
    if (this.accounts().length === 0) {
      this.historyPoints.set([]);
      return;
    }
    this.historyLoading.set(true);
    this.analyticsService.getPortfolioHistory(period, 'SAVINGS').subscribe({
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
