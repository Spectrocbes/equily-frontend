import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PreferencesService } from './preferences.service';
import { UserPreferences } from '../models/account.model';

const mockPreferences: UserPreferences = {
  currency: 'USD',
  locale: 'en',
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF'],
};

describe('PreferencesService', () => {
  let service: PreferencesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('defaults to EUR currency before API responds', () => {
    expect(service.currency()).toBe('EUR');
  });

  it('load() fetches /api/v1/preferences and updates the preferences signal', () => {
    service.load();
    const req = httpMock.expectOne('/api/v1/preferences');
    expect(req.request.method).toBe('GET');
    req.flush(mockPreferences);

    expect(service.preferences()).toEqual(mockPreferences);
    expect(service.currency()).toBe('USD');
  });

  it('load() keeps defaults when API returns an error', () => {
    service.load();
    const req = httpMock.expectOne('/api/v1/preferences');
    req.error(new ProgressEvent('error'));

    expect(service.currency()).toBe('EUR');
  });

  it('update() calls PUT /api/v1/preferences and updates the signal', () => {
    const updated: UserPreferences = { ...mockPreferences, currency: 'GBP' };
    let result: UserPreferences | undefined;

    service.update('GBP', 'en').subscribe((p) => (result = p));

    const req = httpMock.expectOne('/api/v1/preferences');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ currency: 'GBP', locale: 'en' });
    req.flush(updated);

    expect(result).toEqual(updated);
    expect(service.currency()).toBe('GBP');
  });

  it('currencySymbol returns € for EUR', () => {
    expect(service.currencySymbol()).toBe('€');
  });

  it('currencySymbol returns $ for USD after load', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush(mockPreferences);
    expect(service.currencySymbol()).toBe('$');
  });

  it('currencySymbol returns £ for GBP', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush({
      ...mockPreferences,
      currency: 'GBP',
    });
    expect(service.currencySymbol()).toBe('£');
  });

  it('currencySymbol returns CHF for CHF', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush({
      ...mockPreferences,
      currency: 'CHF',
    });
    expect(service.currencySymbol()).toBe('CHF');
  });

  it('currencySymbol falls back to the currency code when symbol is unknown', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush({
      ...mockPreferences,
      currency: 'JPY',
    });
    expect(service.currencySymbol()).toBe('JPY');
  });
});
