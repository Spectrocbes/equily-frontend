import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AnalyticsService } from './analytics.service';
import { PortfolioHistoryPoint, GeographicExposure, TopPerformer } from '../models/account.model';
import { UserPreferences } from '../models/account.model';

const mockPreferences: UserPreferences = {
  currency: 'EUR',
  locale: 'fr',
  supportedCurrencies: ['EUR'],
  eurToTargetRate: 1.0,
};

const mockHistoryPoints: PortfolioHistoryPoint[] = [
  { date: '2026-01-01', value: 10000, invested: 9000, pnl: 1000 },
  { date: '2026-01-02', value: 10500, invested: 9000, pnl: 1500 },
];

const mockGeoExposure: GeographicExposure[] = [
  { region: 'US', value: 8000, weight: 80 },
  { region: 'Europe', value: 2000, weight: 20 },
];

const mockTopPerformers: TopPerformer[] = [
  {
    ticker: 'AAPL',
    accountName: 'CTO Bourso',
    currentValue: 5000,
    totalInvested: 4000,
    pnl: 1000,
    pnlPercent: 25,
    dayChangePercent: 1.5,
  },
];

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
    // flush the preferences load triggered by PreferencesService init
    const prefReq = httpMock.match('/api/v1/preferences');
    prefReq.forEach(r => r.flush(mockPreferences));
  });

  afterEach(() => httpMock.verify());

  it('getAccountHistory calls /accounts/{id}/history with period and currency', () => {
    service.getAccountHistory('acc-123', 'ONE_MONTH').subscribe(pts => {
      expect(pts).toEqual(mockHistoryPoints);
    });

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/accounts/acc-123/history'
        && r.params.get('period') === 'ONE_MONTH'
        && r.params.get('currency') === 'EUR'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockHistoryPoints);
  });

  it('getPortfolioHistory calls correct endpoint with period and currency', () => {
    service.getPortfolioHistory('ONE_MONTH').subscribe(pts => {
      expect(pts).toEqual(mockHistoryPoints);
    });

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/history'
        && r.params.get('period') === 'ONE_MONTH'
        && r.params.get('currency') === 'EUR'
        && !r.params.has('accountType')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockHistoryPoints);
  });

  it('getPortfolioHistory omits accountType param when not provided', () => {
    service.getPortfolioHistory('ONE_YEAR').subscribe();

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/history' && !r.params.has('accountType')
    );
    expect(req.request.params.get('period')).toBe('ONE_YEAR');
    req.flush([]);
  });

  it('getPortfolioHistory passes accountType param when provided', () => {
    service.getPortfolioHistory('ONE_MONTH', 'INVESTMENT').subscribe(pts => {
      expect(pts).toEqual(mockHistoryPoints);
    });

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/history'
        && r.params.get('period') === 'ONE_MONTH'
        && r.params.get('currency') === 'EUR'
        && r.params.get('accountType') === 'INVESTMENT'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockHistoryPoints);
  });

  it('getGeographicExposure calls correct endpoint with accountId and currency', () => {
    service.getGeographicExposure('acc-123').subscribe(data => {
      expect(data).toEqual(mockGeoExposure);
    });

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/accounts/acc-123/geographic-exposure'
        && r.params.get('currency') === 'EUR'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockGeoExposure);
  });

  it('getTopPerformers calls correct endpoint with limit and currency', () => {
    service.getTopPerformers(5).subscribe(data => {
      expect(data).toEqual(mockTopPerformers);
    });

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/top-performers'
        && r.params.get('limit') === '5'
        && r.params.get('currency') === 'EUR'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockTopPerformers);
  });

  it('getTopPerformers uses default limit of 5', () => {
    service.getTopPerformers().subscribe();

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/top-performers'
    );
    expect(req.request.params.get('limit')).toBe('5');
    req.flush([]);
  });
});
