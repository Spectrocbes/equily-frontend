import {
  Component, OnInit, inject,
  signal, computed, WritableSignal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import {
  FinancialAccount, EnrichedHolding, Transaction, TransactionType, accountAgeYears,
  ACCOUNT_TYPE_LABELS,
} from '../../../core/models/account.model';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';
import { EditTransactionModalComponent } from '../shared/edit-transaction-modal.component';
import { CsvImportModalComponent } from '../shared/csv-import-modal.component';
import { DonutChartComponent, DonutSlice } from '../../../shared/components/donut-chart/donut-chart.component';

@Component({
  selector: 'app-investment-account-detail',
  standalone: true,
  imports: [
    CurrencyPipe, DecimalPipe, RouterLink,
    AddTransactionModalComponent, EditTransactionModalComponent,
    CsvImportModalComponent, DonutChartComponent,
  ],
  templateUrl: './investment-account-detail.component.html',
})
export class InvestmentAccountDetailComponent implements OnInit {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly account      = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading      = signal(false);
  protected readonly error        = signal<string | null>(null);

  protected readonly ACCOUNT_TYPE_LABELS   = ACCOUNT_TYPE_LABELS;
  protected readonly showTransactionModal  = signal(false);
  protected readonly showCsvModal         = signal(false);
  protected readonly editingTransaction   = signal<Transaction | null>(null);
  protected readonly activeTab           = signal<'holdings' | 'transactions'>('holdings');
  protected readonly pnlMode             = signal<'EUR' | 'PCT'>('EUR');

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

  protected readonly donutData = computed((): DonutSlice[] => {
    const total = this.totalInvested();
    if (total === 0) return [];
    const colors = [
      '#6366f1','#10b981','#f59e0b','#f43f5e',
      '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
    ];
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
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountService.getAccountById(id).subscribe({
      next: (acc) => {
        this.account.set(acc);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load account');
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

  protected onTransactionUpdated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
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

  protected onCsvImported(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  protected togglePnlMode(): void {
    this.pnlMode.set(this.pnlMode() === 'EUR' ? 'PCT' : 'EUR');
  }

  protected getBadgeClass(type: string): string {
    const map: Record<string, string> = {
      BUY:        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      SELL:       'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DIVIDEND:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      INTEREST:   'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  }
}
