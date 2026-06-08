import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UserCurrencyPipe } from './user-currency.pipe';
import { PreferencesService } from '../../core/services/preferences.service';

function createPrefsServiceMock(currency = 'EUR') {
  const _currency = signal(currency);
  return {
    currency: () => _currency(),
    _setCurrency: (c: string) => _currency.set(c),
  };
}

describe('UserCurrencyPipe', () => {
  let pipe: UserCurrencyPipe;
  let prefsService: ReturnType<typeof createPrefsServiceMock>;

  beforeEach(() => {
    prefsService = createPrefsServiceMock();
    TestBed.configureTestingModule({
      providers: [
        UserCurrencyPipe,
        { provide: PreferencesService, useValue: prefsService },
      ],
    });
    pipe = TestBed.inject(UserCurrencyPipe);
  });

  it('formats an EUR value with € symbol', () => {
    const result = pipe.transform(1234.56);
    expect(result).toContain('€');
    expect(result).toContain('1');
  });

  it('formats a USD value with $ symbol when currency is USD', () => {
    prefsService._setCurrency('USD');
    const result = pipe.transform(1234.56);
    expect(result).toContain('$');
  });

  it('returns — for null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('respects the digitsInfo parameter', () => {
    const result = pipe.transform(1234.5, '1.0-0');
    expect(result).not.toContain('.');
    expect(result).toContain('1');
  });

  it('formats GBP value with £ symbol', () => {
    prefsService._setCurrency('GBP');
    const result = pipe.transform(500);
    expect(result).toContain('£');
  });
});
