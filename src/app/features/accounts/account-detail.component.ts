import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AccountService } from '../../core/services/account.service';
import { FinancialAccount, Transaction } from '../../core/models/account.model';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './account-detail.component.html',
})
export class AccountDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly account = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

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

    const existing = this.accountService.accounts().find(a => a.id === id);
    if (existing) {
      this.account.set(existing);
    }

    this.accountService.getTransactions(id).subscribe({
      next: (txs) => {
        this.transactions.set(txs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load transactions');
        this.loading.set(false);
      },
    });
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
