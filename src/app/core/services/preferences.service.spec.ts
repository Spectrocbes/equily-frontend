import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
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
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    });
    service = TestBed.inject(PreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
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

  it('load() switches the translate language to fr for a fr locale', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush({ ...mockPreferences, locale: 'fr-FR' });
    expect(translate.getCurrentLang()).toBe('fr');
  });

  it('load() switches the translate language to en for a non-fr locale', () => {
    service.load();
    httpMock.expectOne('/api/v1/preferences').flush({ ...mockPreferences, locale: 'en-US' });
    expect(translate.getCurrentLang()).toBe('en');
  });

  it('update() switches the translate language to match the new locale', () => {
    service.update('EUR', 'fr').subscribe();
    httpMock.expectOne('/api/v1/preferences').flush({ ...mockPreferences, locale: 'fr' });
    expect(translate.getCurrentLang()).toBe('fr');
  });
});
