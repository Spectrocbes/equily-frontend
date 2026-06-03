import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { FinancialAccount, Transaction, TransactionType } from '../../../core/models/account.model';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';

@Component({
  selector: 'app-cash-account-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddTransactionModalComponent],
  templateUrl: './cash-account-detail.component.html',
})
export class CashAccountDetailComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly accountService = inject(AccountService);

  protected readonly account      = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading      = signal(true);
  protected readonly error        = signal<string | null>(null);
  protected readonly showTransactionModal = signal(false);
  protected readonly allowedTypes: TransactionType[] = ['DEPOSIT', 'WITHDRAWAL'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/wealth/cash']); return; }
    this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.accountService.getAccountById(id).subscribe({
      next: (acc) => { this.account.set(acc); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load account');
        this.loading.set(false);
      },
    });
    this.accountService.getTransactions(id).subscribe({
      next: (t) => this.transactions.set(t),
    });
  }

  protected onTransactionCreated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  protected getBadgeClass(type: string): string {
    const map: Record<string, string> = {
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  }
}
