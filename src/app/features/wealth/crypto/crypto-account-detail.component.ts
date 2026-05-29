import {
  Component, OnInit, OnDestroy, inject,
  signal, computed
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { FinancialAccount, Holding, Transaction } from '../../../core/models/account.model';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';
import { CsvImportModalComponent } from '../shared/csv-import-modal.component';
import { DonutChartComponent, DonutSlice } from '../../../shared/components/donut-chart/donut-chart.component';

@Component({
  selector: 'app-crypto-account-detail',
  standalone: true,
  imports: [
    CurrencyPipe, DecimalPipe, RouterLink,
    AddTransactionModalComponent, CsvImportModalComponent, DonutChartComponent
  ],
  templateUrl: './crypto-account-detail.component.html',
})
export class CryptoAccountDetailComponent implements OnInit, OnDestroy {
  private readonly route    = inject(ActivatedRoute);
  private readonly router   = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly account      = signal<FinancialAccount | null>(null);
  protected readonly holdings     = signal<Holding[]>([]);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading      = signal(false);
  protected readonly error        = signal<string | null>(null);

  protected readonly showTransactionModal = signal(false);
  protected readonly showCsvModal        = signal(false);
  protected readonly activeTab           = signal<'holdings' | 'transactions'>('holdings');
  protected readonly plMode              = signal<'euro' | 'percent'>('euro');

  protected readonly balanceDelta = signal<number | null>(null);
  protected readonly balanceFlash = signal<'gain' | 'loss' | null>(null);
  private previousBalance: number | null = null;
  private deltaTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly totalInvested = computed(() =>
    this.holdings().reduce((s, h) => s + h.totalInvested, 0)
  );
  protected readonly totalFeesPaid = computed(() =>
    this.holdings().reduce((s, h) => s + h.totalFeesPaid, 0)
  );
  protected readonly totalCashOut = computed(() =>
    this.totalInvested() + this.totalFeesPaid()
  );

  protected readonly donutData = computed((): DonutSlice[] => {
    const total = this.totalInvested();
    if (total === 0) return [];
    const colors = [
      '#f59e0b','#6366f1','#10b981','#f43f5e',
      '#3b82f6','#8b5cf6','#ec4899','#14b8a6',
    ];
    return this.holdings().map((h, i) => ({
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

  ngOnDestroy(): void {
    if (this.deltaTimeout) clearTimeout(this.deltaTimeout);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountService.getAccountById(id).subscribe({
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
        this.error.set(err.message ?? 'Failed to load account');
        this.loading.set(false);
      },
    });

    this.accountService.getHoldings(id).subscribe({
      next: (h) => this.holdings.set(h),
    });

    this.accountService.getTransactions(id).subscribe({
      next: (t) => this.transactions.set(t),
    });
  }

  protected onTransactionCreated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  protected onCsvImported(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  protected togglePlMode(): void {
    this.plMode.update(m => m === 'euro' ? 'percent' : 'euro');
  }

  protected getBadgeClass(type: string): string {
    const map: Record<string, string> = {
      BUY:        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      SELL:       'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DIVIDEND:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  }
}
