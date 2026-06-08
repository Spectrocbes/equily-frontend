import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PreferencesService } from '../../core/services/preferences.service';

/**
 * Formats a number using the user's reference currency from PreferencesService.
 * Usage: {{ value | userCurrency }} or {{ value | userCurrency:'1.0-0' }}
 * Falls back to EUR if preferences not loaded.
 */
@Pipe({
  name: 'userCurrency',
  standalone: true,
  pure: false, // impure — re-evaluates when currency signal changes
})
export class UserCurrencyPipe implements PipeTransform {
  private readonly preferencesService = inject(PreferencesService);
  private readonly currencyPipe = new CurrencyPipe('en-US');

  transform(value: number | null | undefined, digitsInfo = '1.2-2'): string {
    if (value === null || value === undefined) return '—';
    const currency = this.preferencesService.currency();
    return this.currencyPipe.transform(value, currency, 'symbol', digitsInfo) ?? '—';
  }
}
