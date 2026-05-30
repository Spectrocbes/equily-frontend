import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, forkJoin, map, of } from 'rxjs';
import {
  FinancialAccount,
  Transaction,
  Holding,
  CreateAccountRequest,
  RecordTransactionRequest,
  AccountSummary,
  WealthCategory,
  ACCOUNT_CATEGORY,
  CsvBroker,
  CsvMode,
  CsvImportResponse,
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly apiUrl = '/api/v1/accounts';

  private readonly _accounts = signal<FinancialAccount[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _modalLoading = signal(false);
  private readonly _modalError = signal<string | null>(null);
  private readonly _summaries = signal<AccountSummary[]>([]);
  private readonly _summariesLoading = signal(false);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly modalLoading = this._modalLoading.asReadonly();
  readonly modalError = this._modalError.asReadonly();
  readonly summaries = this._summaries.asReadonly();
  readonly summariesLoading = this._summariesLoading.asReadonly();
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

  loadSummaries(): void {
    this._summariesLoading.set(true);
    this.loadAccounts();

    const investmentCategories: WealthCategory[] = ['investments', 'crypto'];

    this.http.get<FinancialAccount[]>(this.apiUrl).pipe(
      switchMap(accounts => {
        const investmentAccounts = accounts.filter(
          a => investmentCategories.includes(ACCOUNT_CATEGORY[a.accountType])
        );
        const savingsAccounts = accounts.filter(
          a => !investmentCategories.includes(ACCOUNT_CATEGORY[a.accountType])
        );

        if (investmentAccounts.length === 0) {
          const summaries: AccountSummary[] = accounts.map(a => ({
            account: a,
            totalInvested: 0,
            totalFeesPaid: 0,
          }));
          return of(summaries);
        }

        const holdingRequests = investmentAccounts.map(a =>
          this.http.get<Holding[]>(`${this.apiUrl}/${a.id}/holdings`).pipe(
            map(holdings => ({
              account: a,
              totalInvested: holdings.reduce((s, h) => s + h.totalInvested, 0),
              totalFeesPaid: holdings.reduce((s, h) => s + h.totalFeesPaid, 0),
            }))
          )
        );

        const savingsSummaries: AccountSummary[] = savingsAccounts.map(a => ({
          account: a,
          totalInvested: 0,
          totalFeesPaid: 0,
        }));

        return forkJoin(holdingRequests).pipe(
          map(investmentSummaries => [...investmentSummaries, ...savingsSummaries])
        );
      }),
      tap({
        next: summaries => {
          this._summaries.set(summaries);
          this._summariesLoading.set(false);
        },
        error: () => this._summariesLoading.set(false),
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

  getHoldings(accountId: string): Observable<Holding[]> {
    return this.http.get<Holding[]>(`${this.apiUrl}/${accountId}/holdings`);
  }

  reset(): void {
    this._accounts.set([]);
    this._summaries.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._modalLoading.set(false);
    this._modalError.set(null);
  }

  importCsv(
    accountId: string,
    file: File,
    broker: CsvBroker,
    mode: CsvMode
  ): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('broker', broker);
    formData.append('mode', mode);
    return this.http.post<CsvImportResponse>(
      `${this.apiUrl}/${accountId}/import/csv`,
      formData
    );
  }
}
