import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserPreferences, CURRENCY_SYMBOLS } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/preferences';

  private readonly _preferences = signal<UserPreferences>({
    currency: 'EUR',
    locale: 'fr',
    supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF'],
    eurToTargetRate: 1.0,
  });

  readonly preferences = this._preferences.asReadonly();
  readonly currency = computed(() => this._preferences().currency);
  readonly currencySymbol = computed(
    () => CURRENCY_SYMBOLS[this.currency()] ?? this.currency()
  );
  readonly eurToTargetRate = computed(() => this._preferences().eurToTargetRate);

  load(): void {
    this.http.get<UserPreferences>(this.apiUrl).subscribe({
      next: (p) => this._preferences.set(p),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }

  update(currency: string, locale: string): Observable<UserPreferences> {
    return this.http
      .put<UserPreferences>(this.apiUrl, { currency, locale })
      .pipe(tap((p) => this._preferences.set(p)));
  }
}
