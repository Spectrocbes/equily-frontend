import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import { PreferencesService } from './preferences.service';
import {
  PerformanceSummary,
  AllocationBreakdown,
  RevenueEntry,
  FeesSummary,
  PortfolioIndicators,
} from '../models/analytics.model';

describe('AnalyticsDashboardService', () => {
  let service: AnalyticsDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PreferencesService, useValue: { currency: signal('EUR') } },
      ],
    });
    service = TestBed.inject(AnalyticsDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getPerformance calls GET /api/v1/analytics/dashboard/performance with currency', () => {
    const mock: PerformanceSummary = {
      totalValue: 1000, totalInvested: 900, totalPnl: 100,
      totalPnlPercent: 11.11, returnsByPeriod: { ONE_MONTH: 2.5 },
    };
    let result: PerformanceSummary | undefined;

    service.getPerformance().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/performance'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getAllocationByType calls GET /api/v1/analytics/dashboard/allocation/account-type with currency', () => {
    const mock: AllocationBreakdown[] = [{ category: 'PEA', value: 500, weight: 50 }];
    let result: AllocationBreakdown[] | undefined;

    service.getAllocationByType().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/allocation/account-type'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getGeoAllocation calls GET /api/v1/analytics/dashboard/allocation/geographic with currency', () => {
    const mock: AllocationBreakdown[] = [{ category: 'France', value: 300, weight: 30 }];
    let result: AllocationBreakdown[] | undefined;

    service.getGeoAllocation().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/allocation/geographic'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getRevenue calls GET /api/v1/analytics/dashboard/revenue with currency', () => {
    const mock: RevenueEntry[] = [{ month: '2026-01', dividends: 10, interest: 5, total: 15 }];
    let result: RevenueEntry[] | undefined;

    service.getRevenue().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/revenue'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getFees calls GET /api/v1/analytics/dashboard/fees with currency', () => {
    const mock: FeesSummary = {
      totalFees: 42, feesRatio: 0.5,
      feesByAccount: [{ accountName: 'Fortuneo PEA', fees: 42 }],
    };
    let result: FeesSummary | undefined;

    service.getFees().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/fees'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('getIndicators calls GET /api/v1/analytics/dashboard/indicators with currency', () => {
    const mock: PortfolioIndicators = {
      largestPosition: 'AAPL', largestPositionWeight: 25,
      distinctPositions: 8, cashRatio: 10, investedRatio: 90,
    };
    let result: PortfolioIndicators | undefined;

    service.getIndicators().subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/analytics/dashboard/indicators'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });
});
