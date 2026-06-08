import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, forkJoin, map, of } from 'rxjs';
import {
  FinancialAccount,
  Transaction,
  EnrichedHolding,
  CreateAccountRequest,
  RecordTransactionRequest,
  AccountSummary,
  AccountPortfolioSummary,
  WealthCategory,
  ACCOUNT_CATEGORY,
  CsvBroker,
  CsvMode,
  CsvImportResponse,
  PeaSummary,
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
  private readonly _portfolioSummaries = signal<AccountPortfolioSummary[]>([]);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly modalLoading = this._modalLoading.asReadonly();
  readonly modalError = this._modalError.asReadonly();
  readonly summaries = this._summaries.asReadonly();
  readonly summariesLoading = this._summariesLoading.asReadonly();
  readonly portfolioSummaries = this._portfolioSummaries.asReadonly();
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
          const sorted = [...accounts].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          this._accounts.set(sorted);
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
          this.http.get<EnrichedHolding[]>(`${this.apiUrl}/${a.id}/holdings/enriched`).pipe(
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

  getEnrichedHoldings(accountId: string): Observable<EnrichedHolding[]> {
    return this.http.get<EnrichedHolding[]>(
      `${this.apiUrl}/${accountId}/holdings/enriched`
    );
  }

  loadPortfolioSummaries(): void {
    this.http.get<AccountPortfolioSummary[]>(
      `${this.apiUrl}/portfolio-summary`
    ).subscribe({
      next: (s) => this._portfolioSummaries.set(s),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }

  getPortfolioSummary(accountId: string): AccountPortfolioSummary | undefined {
    return this._portfolioSummaries().find(s => s.accountId === accountId);
  }

  reset(): void {
    this._accounts.set([]);
    this._summaries.set([]);
    this._portfolioSummaries.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._modalLoading.set(false);
    this._modalError.set(null);
  }

  getPeaSummary(): Observable<PeaSummary> {
    return this.http.get<PeaSummary>(`${this.apiUrl}/summary/pea`);
  }

  updateTransaction(
    accountId: string,
    transactionId: string,
    data: {
      totalAmount?: number;
      quantity?: number;
      pricePerUnit?: number;
      date: string;
      fees: number;
      description?: string;
    }
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${accountId}/transactions/${transactionId}`,
      data
    );
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
