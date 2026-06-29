import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import {
  FinancialAccount, Transaction, TransactionType,
  ACCOUNT_TYPE_LABELS, ACCOUNT_SUB_TYPE_LABELS,
  ChartPeriod, PortfolioHistoryPoint,
} from '../../../core/models/account.model';
import { AddTransactionModalComponent } from '../shared/add-transaction-modal.component';
import { EditTransactionModalComponent } from '../shared/edit-transaction-modal.component';
import { DeleteTransactionModalComponent } from '../shared/delete-transaction-modal.component';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';

@Component({
  selector: 'app-cash-account-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, AddTransactionModalComponent, EditTransactionModalComponent, DeleteTransactionModalComponent, UserCurrencyPipe, EvolutionChartComponent],
  templateUrl: './cash-account-detail.component.html',
})
export class CashAccountDetailComponent implements OnInit {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly accountService   = inject(AccountService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly toastService     = inject(ToastService);
  protected readonly preferencesService = inject(PreferencesService);

  protected readonly account      = signal<FinancialAccount | null>(null);
  protected readonly transactions = signal<Transaction[]>([]);
  protected readonly loading      = signal(true);
  protected readonly error        = signal<string | null>(null);
  protected readonly ACCOUNT_TYPE_LABELS     = ACCOUNT_TYPE_LABELS;
  protected readonly ACCOUNT_SUB_TYPE_LABELS = ACCOUNT_SUB_TYPE_LABELS;
  protected readonly showTransactionModal    = signal(false);
  protected readonly editingTransaction      = signal<Transaction | null>(null);
  protected readonly cashDelta               = signal<number | null>(null);
  protected readonly cashDeltaPositive       = signal<boolean>(true);
  protected readonly allowedTypes: TransactionType[] = ['DEPOSIT', 'WITHDRAWAL'];
  protected readonly historyPoints   = signal<PortfolioHistoryPoint[]>([]);
  protected readonly historyLoading  = signal(true);
  protected readonly currentPeriod   = signal<ChartPeriod>('ONE_MONTH');

  protected readonly isClosed            = computed(() => this.account()?.status === 'CLOSED');

  protected readonly currentAccountValue = computed(() =>
    this.account()?.balance ?? null
  );

  protected readonly txMenuOpenId        = signal<string | null>(null);
  protected readonly txMenuPosition      = signal<{ top: number; right: number } | null>(null);
  protected readonly deletingTransaction = signal<Transaction | null>(null);
  protected readonly deletingTxId        = computed(() => this.deletingTransaction()?.id ?? null);
  protected readonly deleteLoading       = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/wealth/cash']); return; }
    this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadHistory(this.currentPeriod());
    const currency = this.preferencesService.currency();
    this.accountService.getAccount(id, currency).subscribe({
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

  protected onTransactionCreated(type: string, amount: number): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
    this.cashDeltaPositive.set(type !== 'WITHDRAWAL');
    this.cashDelta.set(amount);
    setTimeout(() => this.cashDelta.set(null), 4000);
  }

  protected onTransactionEditClick(tx: Transaction): void {
    this.editingTransaction.set(tx);
  }

  protected onTransactionUpdated(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
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
        this.toastService.success('Transaction deleted');
        this.deletingTransaction.set(null);
        this.deleteLoading.set(false);
        this.loadAll(accountId);
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : 'Failed to delete transaction';
        this.toastService.error(msg);
        this.deleteLoading.set(false);
      },
    });
  }

  protected isPositive(type: TransactionType, direction?: string | null): boolean {
    if (type === 'TRANSFER') return direction === 'INCOMING';
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL'].includes(type);
  }

  protected txTypeClass(type: string): string {
    const map: Record<string, string> = {
      DEPOSIT:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      WITHDRAWAL: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
      INTEREST:   'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
      TRANSFER:   'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
      PAYMENT:    'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    };
    return map[type] ?? 'bg-slate-100 text-slate-600';
  }

  protected getLinkedAccountName(linkedAccountId: string | null): string | null {
    if (!linkedAccountId) return null;
    const acc = this.accountService.accounts().find(a => a.id === linkedAccountId);
    return acc?.name ?? null;
  }
}
