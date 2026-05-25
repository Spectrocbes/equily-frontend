import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import {
  FinancialAccount,
  Transaction,
  CreateAccountRequest,
  RecordTransactionRequest
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = '/api/v1/accounts';

  private readonly _accounts = signal<FinancialAccount[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalBalance = computed(() =>
    this._accounts().reduce((sum, a) => sum + a.balance, 0)
  );

  private readonly http = inject(HttpClient);

  loadAccounts(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<FinancialAccount[]>(this.apiUrl).pipe(
      tap({
        next: (accounts) => {
          this._accounts.set(accounts);
          this._loading.set(false);
        },
        error: (err) => {
          this._error.set(err.message ?? 'Failed to load accounts');
          this._loading.set(false);
        }
      })
    ).subscribe();
  }

  createAccount(request: CreateAccountRequest) {
    return this.http.post<string>(this.apiUrl, request).pipe(
      tap(() => this.loadAccounts())
    );
  }

  recordTransaction(accountId: string, request: RecordTransactionRequest) {
    return this.http
      .post<void>(`${this.apiUrl}/${accountId}/transactions`, request)
      .pipe(tap(() => this.loadAccounts()));
  }

  getTransactions(accountId: string) {
    return this.http.get<Transaction[]>(
      `${this.apiUrl}/${accountId}/transactions`
    );
  }
}
