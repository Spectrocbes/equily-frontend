import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
  private readonly _modalLoading = signal(false);
  private readonly _modalError = signal<string | null>(null);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly modalLoading = this._modalLoading.asReadonly();
  readonly modalError = this._modalError.asReadonly();
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

  createAccount(request: CreateAccountRequest): Observable<{ id: string }> {
    this._modalLoading.set(true);
    this._modalError.set(null);
    return this.http.post<{ id: string }>(this.apiUrl, request).pipe(
      tap({
        next: () => {
          this._modalLoading.set(false);
          this.loadAccounts();
        },
        error: (err) => {
          this._modalLoading.set(false);
          this._modalError.set(
            err.error?.message ?? err.message ?? 'Failed to create account'
          );
        }
      })
    );
  }

  recordTransaction(accountId: string, request: RecordTransactionRequest): Observable<void> {
    this._modalLoading.set(true);
    this._modalError.set(null);
    return this.http.post<void>(`${this.apiUrl}/${accountId}/transactions`, request).pipe(
      tap({
        next: () => {
          this._modalLoading.set(false);
          this.loadAccounts();
        },
        error: (err) => {
          this._modalLoading.set(false);
          this._modalError.set(
            err.error?.message ?? err.message ?? 'Failed to record transaction'
          );
        }
      })
    );
  }

  getAccountById(id: string): Observable<FinancialAccount> {
    return this.http.get<FinancialAccount>(`${this.apiUrl}/${id}`);
  }

  getTransactions(accountId: string) {
    return this.http.get<Transaction[]>(
      `${this.apiUrl}/${accountId}/transactions`
    );
  }
}
