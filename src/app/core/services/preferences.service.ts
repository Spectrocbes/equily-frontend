import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserPreferences, CURRENCY_SYMBOLS } from '../models/account.model';

function langFromLocale(locale: string): string {
  return locale.startsWith('fr') ? 'fr' : 'en';
}

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly apiUrl = '/api/v1/preferences';

  private readonly defaultPreferences: UserPreferences = {
    currency: 'EUR',
    locale: 'fr',
    supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF'],
    eurToTargetRate: 1.0,
  };

  private readonly _preferences = signal<UserPreferences>(this.defaultPreferences);

  readonly preferences = this._preferences.asReadonly();
  readonly currency = computed(() => this._preferences().currency);
  readonly locale = computed(() => this._preferences().locale);
  readonly currencySymbol = computed(
    () => CURRENCY_SYMBOLS[this.currency()] ?? this.currency()
  );
  readonly eurToTargetRate = computed(() => this._preferences().eurToTargetRate);

  load(): void {
    this.http.get<UserPreferences>(this.apiUrl).subscribe({
      next: (p) => {
        this._preferences.set(p);
        this.translate.use(langFromLocale(p.locale));
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }

  update(currency: string, locale: string): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(this.apiUrl, { currency, locale }).pipe(
      tap((p) => {
        this._preferences.set(p);
        this.translate.use(langFromLocale(p.locale));
      })
    );
  }

  reset(): void {
    this._preferences.set(this.defaultPreferences);
  }
}
