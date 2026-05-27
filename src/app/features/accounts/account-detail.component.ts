import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AccountService } from '../../core/services/account.service';
import { FinancialAccount, Transaction, Holding } from '../../core/models/account.model';
import { AddTransactionModalComponent } from './add-transaction-modal.component';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, AddTransactionModalComponent],
  templateUrl: './account-detail.component.html',
})
export class AccountDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly account = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly holdings = signal<Holding[]>([]);
  protected readonly loading = signal(false);
  protected readonly holdingsLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showTransactionModal = signal(false);
  protected readonly balanceDelta = signal<number | null>(null);
  protected readonly balanceFlash = signal<'gain' | 'loss' | null>(null);
  protected readonly activeTab = signal<'transactions' | 'holdings'>('transactions');

  protected readonly totalInvested = computed(() =>
    this.holdings().reduce((sum, h) => sum + h.totalInvested, 0)
  );

  protected readonly totalFeesPaid = computed(() =>
    this.holdings().reduce((sum, h) => sum + h.totalFeesPaid, 0)
  );

  protected readonly totalCashOut = computed(() =>
    this.totalInvested() + this.totalFeesPaid()
  );

  private previousBalance: number | null = null;
  private deltaTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/accounts']);
      return;
    }
    this.loadAccount(id);
  }

  private loadAccount(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.accountService.getAccountById(id).subscribe({
      next: (account) => {
        if (this.previousBalance !== null && this.previousBalance !== account.balance) {
          const delta = account.balance - this.previousBalance;
          this.balanceDelta.set(delta);
          this.balanceFlash.set(delta > 0 ? 'gain' : 'loss');

          if (this.deltaTimeout) clearTimeout(this.deltaTimeout);
          this.deltaTimeout = setTimeout(() => {
            this.balanceDelta.set(null);
            this.balanceFlash.set(null);
          }, 4000);
        }
        this.previousBalance = account.balance;
        this.account.set(account);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load account');
        this.loading.set(false);
      },
    });

    this.accountService.getTransactions(id).subscribe({
      next: (txs) => this.transactions.set(txs),
      error: (err) => this.error.set(err.message ?? 'Failed to load transactions'),
    });

    this.holdingsLoading.set(true);
    this.accountService.getHoldings(id).subscribe({
      next: (h) => {
        this.holdings.set(h);
        this.holdingsLoading.set(false);
      },
      error: () => this.holdingsLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.deltaTimeout) clearTimeout(this.deltaTimeout);
  }

  protected onTransactionCreated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAccount(id);
  }

  protected getBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      BUY:        'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      SELL:       'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DIVIDEND:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return classes[type] ?? 'bg-slate-100 text-slate-600';
  }
}
