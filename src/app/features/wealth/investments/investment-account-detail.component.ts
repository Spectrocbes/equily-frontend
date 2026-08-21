import {
  Component, OnInit, inject,
  signal, computed, WritableSignal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { AccountService } from '../../../core/services/account.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import {
  FinancialAccount, EnrichedHolding, Transaction, TransactionType, accountAgeYears,
  CURRENCY_SYMBOLS, PeaWithdrawalSimulation,
  ChartPeriod, PortfolioHistoryPoint, GeographicExposure,
} from '../../../core/models/account.model';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';
import { EditTransactionModalComponent } from '../shared/edit-transaction-modal.component';
import { DeleteTransactionModalComponent } from '../shared/delete-transaction-modal.component';
import { CsvImportModalComponent } from '../shared/csv-import-modal.component';
import { PeaClosureModalComponent } from '../shared/pea-closure-modal.component';
import { PeaWithdrawalBreakdownModalComponent } from '../shared/pea-withdrawal-breakdown-modal.component';
import { DeleteAccountModalComponent } from '../shared/delete-account-modal.component';
import { DonutChartComponent, DonutSlice } from '../../../shared/components/donut-chart/donut-chart.component';
import { getDonutPalette } from '../../../shared/utils/chart-tokens.util';
import { ThemeService } from '../../../core/services/theme.service';
import { RegionFlagComponent } from '../../../shared/components/region-flag/region-flag.component';

import { BrokerLogoComponent } from '../../../shared/components/broker-logo/broker-logo.component';

@Component({
  selector: 'app-investment-account-detail',
  standalone: true,
  imports: [
    BrokerLogoComponent,
    RegionFlagComponent,
    CurrencyPipe, DatePipe, DecimalPipe, RouterLink,
    AddTransactionModalComponent, EditTransactionModalComponent,
    DeleteTransactionModalComponent,
    CsvImportModalComponent, PeaClosureModalComponent,
    PeaWithdrawalBreakdownModalComponent, DeleteAccountModalComponent,
    DonutChartComponent, EvolutionChartComponent, UserCurrencyPipe, TranslatePipe,
  ],
  templateUrl: './investment-account-detail.component.html',
})
export class InvestmentAccountDetailComponent implements OnInit {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly accountService   = inject(AccountService);
  private readonly analyticsService = inject(AnalyticsService);
  protected readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);
  private readonly translate    = inject(TranslateService);
  private readonly themeService = inject(ThemeService);

  protected readonly account      = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading      = signal(false);
  protected readonly error        = signal<string | null>(null);

  protected readonly CURRENCY_SYMBOLS    = CURRENCY_SYMBOLS;
  protected readonly showTransactionModal  = signal(false);
  protected readonly showCsvModal         = signal(false);
  protected readonly editingTransaction   = signal<Transaction | null>(null);
  protected readonly activeTab           = signal<'holdings' | 'transactions'>('holdings');
  protected readonly pnlMode             = signal<'EUR' | 'PCT'>('EUR');

  protected readonly pnlLabel = computed(() => {
    const sym = CURRENCY_SYMBOLS[this.preferencesService.currency()]
      ?? this.preferencesService.currency();
    return this.pnlMode() === 'EUR' ? `(${sym})` : '(%)';
  });

  protected readonly enrichedHoldings   = signal<EnrichedHolding[]>([]);
  protected readonly pricesLoading      = signal(false);

  protected readonly totalMarketValue = computed(() =>
    this.enrichedHoldings().reduce(
      (sum, h) => sum + (h.marketValue ?? h.totalInvested), 0
    )
  );

  protected readonly totalUnrealizedPnl = computed(() =>
    this.enrichedHoldings()
      .filter(h => h.priceAvailable)
      .reduce((sum, h) => sum + (h.unrealizedPnl ?? 0), 0)
  );

  protected readonly hasSomeLivePrices = computed(() =>
    this.enrichedHoldings().some(h => h.priceAvailable)
  );

  protected readonly totalUnrealizedPnlPct = computed(() => {
    const holdings = this.enrichedHoldings().filter(h => h.priceAvailable);
    if (holdings.length === 0) return 0;
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    if (totalInvested === 0) return 0;
    return (this.totalUnrealizedPnl() / totalInvested) * 100;
  });

  protected readonly cashDelta          = signal<number | null>(null);
  protected readonly cashDeltaPositive  = signal(true);
  protected readonly portfolioDelta     = signal<number | null>(null);
  protected readonly portfolioDeltaPositive = signal(true);

  protected readonly totalInvested = computed(() =>
    this.enrichedHoldings().reduce((s, h) => s + h.totalInvested, 0)
  );
  protected readonly totalFeesPaid = computed(() =>
    this.enrichedHoldings().reduce((s, h) => s + h.totalFeesPaid, 0)
  );
  protected readonly totalCashOut = computed(() =>
    this.totalInvested() + this.totalFeesPaid()
  );

  protected readonly accountAgeYears = computed(() =>
    accountAgeYears(this.account()?.openedAt ?? null)
  );

  protected readonly isPea = computed(() =>
    this.account()?.subType === 'PEA' || this.account()?.subType === 'PEA_PME'
  );

  protected readonly linkedCheckingAccount = computed(() => {
    const linkedId = this.account()?.linkedCheckingAccountId;
    if (!linkedId) return null;
    return this.accountService.accounts().find(a => a.id === linkedId) ?? null;
  });

  protected readonly isClosed = computed(() =>
    this.account()?.status === 'CLOSED'
  );

  protected readonly peaUnder5Years = computed(() => {
    if (!this.isPea()) return false;
    const years = accountAgeYears(this.account()?.openedAt ?? null);
    return years !== null && years < 5;
  });

  protected readonly txMenuOpenId          = signal<string | null>(null);
  protected readonly txMenuPosition        = signal<{ top: number; right: number } | null>(null);
  protected readonly deletingTransaction   = signal<Transaction | null>(null);
  protected readonly deletingTxId          = computed(() => this.deletingTransaction()?.id ?? null);
  protected readonly deleteLoading         = signal(false);

  protected readonly historyPoints   = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading  = signal(true);
  protected readonly currentPeriod   = signal<ChartPeriod>('ONE_MONTH');
  protected readonly geoExposure     = signal<GeographicExposure[]>([]);
  protected readonly geoLoading      = signal(false);

  protected readonly currentPortfolioValue = computed(() => {
    const acc = this.account();
    if (!acc) return null;
    const summary = this.accountService.getPortfolioSummary(acc.id);
    return (summary?.livePortfolioValue ?? 0) + acc.balance;
  });

  protected readonly showClosureModal             = signal(false);
  protected readonly simulation                   = signal<PeaWithdrawalSimulation | null>(null);
  protected readonly closureLoading               = signal(false);
  protected readonly accountMenuOpen              = signal(false);
  protected readonly showWithdrawalBreakdownModal = signal(false);
  protected readonly withdrawalBreakdown          = signal<PeaWithdrawalSimulation | null>(null);
  protected readonly withdrawalLoading            = signal(false);
  protected readonly showDeleteAccountModal       = signal(false);
  protected readonly accountDeleteLoading         = signal(false);

  protected readonly donutData = computed((): DonutSlice[] => {
    this.themeService.isDark(); // establish reactivity so palette updates on theme toggle
    const total = this.totalInvested();
    if (total === 0) return [];
    const colors = getDonutPalette();
    return this.enrichedHoldings().map((h, i) => ({
      label: h.ticker,
      value: h.totalInvested,
      color: colors[i % colors.length],
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/wealth/investments']); return; }
    this.loadAll(id);
    this.loadHistory('ONE_MONTH');
    this.loadGeoExposure(id);
  }

  protected loadHistory(period: ChartPeriod): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.currentPeriod.set(period);
    this.historyLoading.set(true);
    this.analyticsService.getAccountHistory(id, period).subscribe({
      next: pts => {
        this.historyPoints.set(pts);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false),
    });
  }

  private loadGeoExposure(accountId: string): void {
    this.geoLoading.set(true);
    this.analyticsService.getGeographicExposure(accountId).subscribe({
      next: data => {
        this.geoExposure.set(data);
        this.geoLoading.set(false);
      },
      error: () => this.geoLoading.set(false),
    });
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    const currency = this.preferencesService.currency();

    if (this.accountService.accounts().length === 0) {
      this.accountService.loadAccounts();
    }

    this.accountService.getAccount(id, currency).subscribe({
      next: (acc) => {
        this.account.set(acc);
        if (acc.status === 'CLOSED') {
          this.activeTab.set('transactions');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? this.translate.instant('validation.failedToLoadAccount'));
        this.loading.set(false);
      },
    });

    this.accountService.getTransactions(id).subscribe({
      next: (t) => this.transactions.set(t),
    });

    this.pricesLoading.set(true);
    this.accountService.getEnrichedHoldings(id).subscribe({
      next: (h) => {
        this.enrichedHoldings.set(h);
        this.pricesLoading.set(false);
      },
      error: () => {
        this.pricesLoading.set(false);
      },
    });
  }

  protected onTransactionCreated(type: TransactionType, amount: number): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.loadHistory(this.currentPeriod());
    this.loadGeoExposure(id);
    this.accountService.loadPortfolioSummaries();

    switch (type) {
      case 'DEPOSIT':
      case 'DIVIDEND':
      case 'INTEREST':
        this.showDelta(this.cashDelta, this.cashDeltaPositive, amount, true);
        break;
      case 'WITHDRAWAL':
        this.showDelta(this.cashDelta, this.cashDeltaPositive, amount, false);
        break;
      case 'BUY':
        this.showDelta(this.cashDelta, this.cashDeltaPositive, amount, false);
        this.showDelta(this.portfolioDelta, this.portfolioDeltaPositive, amount, true);
        break;
      case 'SELL':
        this.showDelta(this.cashDelta, this.cashDeltaPositive, amount, true);
        this.showDelta(this.portfolioDelta, this.portfolioDeltaPositive, amount, false);
        break;
    }
  }

  protected onTransactionEditClick(tx: Transaction): void {
    this.editingTransaction.set(tx);
  }

  protected openTxMenu(txId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (this.txMenuOpenId() === txId) {
      this.txMenuOpenId.set(null);
      this.txMenuPosition.set(null);
      return;
    }
    const button     = event.currentTarget as HTMLElement;
    const rect       = button.getBoundingClientRect();
    const menuHeight = 90;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top: number;
    if (spaceBelow >= menuHeight) {
      top = rect.bottom + 4;
    } else if (spaceAbove >= menuHeight) {
      top = rect.top - menuHeight - 4;
    } else {
      top = Math.max(8, window.innerHeight / 2 - menuHeight / 2);
    }
    this.txMenuOpenId.set(txId);
    this.txMenuPosition.set({ top, right: window.innerWidth - rect.right });
  }

  protected requestDeleteTransaction(tx: Transaction): void {
    this.txMenuOpenId.set(null);
    this.deletingTransaction.set(tx);
  }

  protected confirmDeleteTransaction(): void {
    const tx        = this.deletingTransaction();
    const accountId = this.route.snapshot.paramMap.get('id')!;
    if (!tx) return;

    this.deleteLoading.set(true);
    this.accountService.deleteTransaction(accountId, tx.id).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('validation.transactionDeleted'));
        this.deletingTransaction.set(null);
        this.deleteLoading.set(false);
        this.loadAll(accountId);
        this.loadHistory(this.currentPeriod());
        this.loadGeoExposure(accountId);
        this.accountService.loadPortfolioSummaries();
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.failedToDeleteTransaction');
        this.toastService.error(msg);
        this.deleteLoading.set(false);
      },
    });
  }

  protected onTransactionUpdated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.loadHistory(this.currentPeriod());
    this.loadGeoExposure(id);
    this.accountService.loadPortfolioSummaries();
  }

  private showDelta(
    deltaSignal: WritableSignal<number | null>,
    positiveSignal: WritableSignal<boolean>,
    amount: number,
    positive: boolean
  ): void {
    deltaSignal.set(amount);
    positiveSignal.set(positive);
    setTimeout(() => deltaSignal.set(null), 4000);
  }

  protected onPeaClosureRequested(): void {
    this.showTransactionModal.set(false);
    setTimeout(() => this.loadClosureSimulation(), 150);
  }

  protected onPeaOver5yWithdrawalRequested(amount: number): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.showTransactionModal.set(false);
    this.withdrawalLoading.set(true);
    this.accountService.getPeaClosureSimulation(id, amount).subscribe({
      next: (sim) => {
        this.withdrawalBreakdown.set(sim);
        this.withdrawalLoading.set(false);
        this.showWithdrawalBreakdownModal.set(true);
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.cannotSimulateWithdrawal');
        this.toastService.error(msg);
        this.withdrawalLoading.set(false);
      },
    });
  }

  protected loadClosureSimulation(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.accountService.getPeaClosureSimulation(id).subscribe({
      next: (s) => {
        this.simulation.set(s);
        this.showClosureModal.set(true);
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.cannotSimulateClosure');
        this.toastService.error(msg);
      },
    });
  }

  protected confirmWithdrawal(): void {
    const id     = this.route.snapshot.paramMap.get('id')!;
    const amount = this.withdrawalBreakdown()!.withdrawalAmount;
    this.withdrawalLoading.set(true);
    this.accountService.recordTransaction(id, {
      type: 'WITHDRAWAL',
      totalAmount: amount,
      currency: 'EUR',
      fees: 0,
      date: new Date().toISOString().split('T')[0],
    }).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('validation.withdrawalRecorded'));
        this.showWithdrawalBreakdownModal.set(false);
        this.withdrawalBreakdown.set(null);
        this.withdrawalLoading.set(false);
        this.loadAll(id);
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.failedToRecordWithdrawal');
        this.toastService.error(msg);
        this.withdrawalLoading.set(false);
      },
    });
  }

  protected confirmClosure(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.closureLoading.set(true);
    this.accountService.closePea(id).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('validation.peaClosedSuccessfully'));
        this.showClosureModal.set(false);
        this.showTransactionModal.set(false);
        this.simulation.set(null);
        this.closureLoading.set(false);
        this.loadAll(id);
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.failedToClosePea');
        this.toastService.error(msg);
        this.closureLoading.set(false);
      },
    });
  }

  protected confirmDeleteAccount(): void {
    const account = this.account();
    if (!account) return;

    this.accountDeleteLoading.set(true);
    this.accountService.deleteAccount(account.id).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('validation.accountDeleted'));
        this.accountDeleteLoading.set(false);
        this.showDeleteAccountModal.set(false);
        this.accountService.loadAccounts();
        this.accountService.loadPortfolioSummaries();
        this.router.navigate(['/wealth/investments']);
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('validation.failedToDeleteAccount');
        this.toastService.error(msg);
        this.accountDeleteLoading.set(false);
        this.showDeleteAccountModal.set(false);
      },
    });
  }

  protected onCsvImported(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.loadHistory(this.currentPeriod());
  }

  protected togglePnlMode(): void {
    this.pnlMode.set(this.pnlMode() === 'EUR' ? 'PCT' : 'EUR');
  }

  protected isPositive(type: TransactionType, direction?: string | null): boolean {
    if (type === 'TRANSFER') return direction === 'INCOMING';
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL'].includes(type);
  }

  protected hasAmountBreakdown(tx: Transaction): boolean {
    return (!!tx.quantity && !!tx.pricePerUnit)
      || tx.nativeCurrency !== this.preferencesService.currency();
  }

  protected getBadgeClass(type: string): string {
    const map: Record<string, string> = {
      BUY:        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      SELL:       'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DIVIDEND:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      INTEREST:   'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
      TRANSFER:   'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      PAYMENT:    'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  }

  protected badgeLabel(type: string): string {
    return this.translate.instant('transaction.badgeLabel.' + type);
  }

  protected getLinkedAccountName(linkedAccountId: string | null): string | null {
    if (!linkedAccountId) return null;
    const acc = this.accountService.accounts().find(a => a.id === linkedAccountId);
    return acc?.name ?? null;
  }
}
