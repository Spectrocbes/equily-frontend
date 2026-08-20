import {
  Component, OnInit, OnDestroy, inject,
  signal, computed
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import {
  FinancialAccount, EnrichedHolding, Transaction, TransactionType,
  CURRENCY_SYMBOLS,
  ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';
import { EditTransactionModalComponent } from '../shared/edit-transaction-modal.component';
import { DeleteTransactionModalComponent } from '../shared/delete-transaction-modal.component';
import { CsvImportModalComponent } from '../shared/csv-import-modal.component';
import { DeleteAccountModalComponent } from '../shared/delete-account-modal.component';
import { DonutChartComponent, DonutSlice } from '../../../shared/components/donut-chart/donut-chart.component';
import { getDonutPalette } from '../../../shared/utils/chart-tokens.util';
import { ThemeService } from '../../../core/services/theme.service';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

@Component({
  selector: 'app-crypto-account-detail',
  standalone: true,
  imports: [
    CurrencyPipe, DatePipe, DecimalPipe, RouterLink,
    AddTransactionModalComponent, EditTransactionModalComponent,
    DeleteTransactionModalComponent, CsvImportModalComponent,
    DeleteAccountModalComponent,
    DonutChartComponent, EvolutionChartComponent, UserCurrencyPipe, TranslatePipe,
  ],
  templateUrl: './crypto-account-detail.component.html',
})
export class CryptoAccountDetailComponent implements OnInit, OnDestroy {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly accountService   = inject(AccountService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toastService     = inject(ToastService);
  private readonly translate        = inject(TranslateService);
  protected readonly preferencesService = inject(PreferencesService);
  private readonly themeService     = inject(ThemeService);

  protected readonly CURRENCY_SYMBOLS    = CURRENCY_SYMBOLS;

  protected readonly account          = signal<FinancialAccount | null>(null);
  protected readonly enrichedHoldings = signal<EnrichedHolding[]>([]);
  protected readonly transactions     = signal<Transaction[]>([]);
  protected readonly loading          = signal(false);
  protected readonly error            = signal<string | null>(null);
  protected readonly pricesLoading    = signal(false);

  protected readonly showTransactionModal = signal(false);
  protected readonly showCsvModal        = signal(false);
  protected readonly activeTab           = signal<'holdings' | 'transactions'>('holdings');
  protected readonly pnlMode             = signal<'EUR' | 'PCT'>('EUR');

  protected readonly isClosed            = computed(() => this.account()?.status === 'CLOSED');

  protected readonly currentAccountValue = computed(() => {
    const id = this.account()?.id;
    if (!id) return null;
    const summary = this.accountService.getPortfolioSummary(id);
    return (summary?.livePortfolioValue ?? 0) + (this.account()?.balance ?? 0);
  });

  protected readonly editingTransaction  = signal<Transaction | null>(null);
  protected readonly txMenuOpenId        = signal<string | null>(null);
  protected readonly txMenuPosition      = signal<{ top: number; right: number } | null>(null);
  protected readonly deletingTransaction = signal<Transaction | null>(null);
  protected readonly deletingTxId        = computed(() => this.deletingTransaction()?.id ?? null);
  protected readonly deleteLoading       = signal(false);

  protected readonly accountMenuOpen        = signal(false);
  protected readonly showDeleteAccountModal = signal(false);
  protected readonly accountDeleteLoading   = signal(false);

  protected readonly pnlLabel = computed(() => {
    const sym = CURRENCY_SYMBOLS[this.preferencesService.currency()]
      ?? this.preferencesService.currency();
    return this.pnlMode() === 'EUR' ? `(${sym})` : '(%)';
  });

  protected readonly historyPoints   = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading  = signal(true);
  protected readonly currentPeriod   = signal<ChartPeriod>('ONE_MONTH');

  protected readonly balanceDelta = signal<number | null>(null);
  protected readonly balanceFlash = signal<'gain' | 'loss' | null>(null);
  private previousBalance: number | null = null;
  private deltaTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly totalInvested = computed(() =>
    this.enrichedHoldings().reduce((s, h) => s + h.totalInvested, 0)
  );
  protected readonly totalFeesPaid = computed(() =>
    this.enrichedHoldings().reduce((s, h) => s + h.totalFeesPaid, 0)
  );

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
    if (!id) { this.router.navigate(['/wealth/crypto']); return; }
    this.loadAll(id);
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

  ngOnDestroy(): void {
    if (this.deltaTimeout) clearTimeout(this.deltaTimeout);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadHistory(this.currentPeriod());

    const currency = this.preferencesService.currency();
    this.accountService.getAccount(id, currency).subscribe({
      next: (acc) => {
        if (this.previousBalance !== null && this.previousBalance !== acc.balance) {
          const delta = acc.balance - this.previousBalance;
          this.balanceDelta.set(delta);
          this.balanceFlash.set(delta > 0 ? 'gain' : 'loss');
          if (this.deltaTimeout) clearTimeout(this.deltaTimeout);
          this.deltaTimeout = setTimeout(() => {
            this.balanceDelta.set(null);
            this.balanceFlash.set(null);
          }, 4000);
        }
        this.previousBalance = acc.balance;
        this.account.set(acc);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? this.translate.instant('validation.failedToLoadAccount'));
        this.loading.set(false);
      },
    });

    this.pricesLoading.set(true);
    this.accountService.getEnrichedHoldings(id).subscribe({
      next: (h) => {
        this.enrichedHoldings.set(h);
        this.pricesLoading.set(false);
      },
      error: () => this.pricesLoading.set(false),
    });

    this.accountService.getTransactions(id).subscribe({
      next: (t) => this.transactions.set(t),
    });
  }

  protected onTransactionCreated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.accountService.loadPortfolioSummaries();
  }

  protected onTransactionEditClick(tx: Transaction): void {
    this.editingTransaction.set(tx);
  }

  protected onTransactionUpdated(): void {
    this.editingTransaction.set(null);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.accountService.loadPortfolioSummaries();
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
        this.router.navigate(['/wealth/crypto']);
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
