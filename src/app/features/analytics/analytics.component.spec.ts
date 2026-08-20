import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AnalyticsComponent } from './analytics.component';
import { AnalyticsDashboardService } from '../../core/services/analytics-dashboard.service';
import { PreferencesService } from '../../core/services/preferences.service';
import {
  PerformanceSummary,
  AllocationBreakdown,
  RevenueEntry,
  FeesSummary,
  PortfolioIndicators,
} from '../../core/models/analytics.model';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

const performance: PerformanceSummary = {
  totalValue: 10000, totalInvested: 9000, totalPnl: 1000,
  totalPnlPercent: 11.11,
  returnsByPeriod: { ONE_MONTH: 2.5, YTD: -1.2 },
};
const allocationByType: AllocationBreakdown[] = [
  { category: 'PEA', value: 6000, weight: 60 },
  { category: 'Crypto', value: 4000, weight: 40 },
];
const geoAllocation: AllocationBreakdown[] = [
  { category: 'France', value: 5000, weight: 50 },
  { category: 'United States', value: 5000, weight: 50 },
];
const revenue: RevenueEntry[] = [
  { month: '2026-01', dividends: 100, interest: 20, total: 120 },
  { month: '2026-02', dividends: 50, interest: 0, total: 50 },
];
const fees: FeesSummary = {
  totalFees: 42, feesRatio: 0.42,
  feesByAccount: [{ accountName: 'Fortuneo PEA', fees: 42 }],
};
const indicators: PortfolioIndicators = {
  largestPosition: 'AAPL', largestPositionWeight: 25,
  distinctPositions: 8, cashRatio: 10, investedRatio: 90,
};

describe('AnalyticsComponent', () => {
  let fixture: ComponentFixture<AnalyticsComponent>;
  let component: AnalyticsComponent;
  let dashboardService: {
    getPerformance: jest.Mock;
    getAllocationByType: jest.Mock;
    getGeoAllocation: jest.Mock;
    getRevenue: jest.Mock;
    getFees: jest.Mock;
    getIndicators: jest.Mock;
  };

  function setup(): void {
    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    useTestTranslations();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    dashboardService = {
      getPerformance: jest.fn().mockReturnValue(of(performance)),
      getAllocationByType: jest.fn().mockReturnValue(of(allocationByType)),
      getGeoAllocation: jest.fn().mockReturnValue(of(geoAllocation)),
      getRevenue: jest.fn().mockReturnValue(of(revenue)),
      getFees: jest.fn().mockReturnValue(of(fees)),
      getIndicators: jest.fn().mockReturnValue(of(indicators)),
    };

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [
        provideTestTranslations(),
        { provide: AnalyticsDashboardService, useValue: dashboardService },
        {
          provide: PreferencesService,
          useValue: {
            currency: signal('EUR'),
            currencySymbol: signal('€'),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders loading spinner initially', () => {
    // Keep observables pending so loading stays true during the sync check.
    dashboardService.getPerformance.mockReturnValue(of(performance));
    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    useTestTranslations();
    // Before detectChanges/ngOnInit runs, loading defaults to true.
    expect(component['loading']()).toBe(true);
  });

  it('renders performance section after load', () => {
    setup();

    expect(component['loading']()).toBe(false);
    expect(component['performance']()).toEqual(performance);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Performance');
  });

  it('renders allocation by type with bars', () => {
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PEA');
    expect(compiled.textContent).toContain('Crypto');

    const bars = compiled.querySelectorAll('.bg-accent');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('renders geo allocation', () => {
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('France');
    expect(compiled.textContent).toContain('United States');
  });

  it('renders revenue with bar chart', () => {
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dividends');
    expect(compiled.textContent).toContain('Interest');
  });

  it('renders fees summary', () => {
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fortuneo PEA');
  });

  it('renders indicators', () => {
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('AAPL');
    expect(compiled.textContent).toContain('8');
  });

  it('barHeight returns correct proportional height', () => {
    setup();

    // max total among revenue() entries is 120 → scale = 160/120
    expect(component['barHeight'](120)).toBeCloseTo(160, 5);
    expect(component['barHeight'](60)).toBeCloseTo(80, 5);
  });

  it('barHeight enforces a minimum height for tiny values', () => {
    setup();

    expect(component['barHeight'](0.01)).toBe(4);
  });

  it('formatMonth formats correctly', () => {
    setup();

    expect(component['formatMonth']('2026-01')).toBe('Jan 26');
    expect(component['formatMonth']('2024-12')).toBe('Dec 24');
  });

  it('handles empty data gracefully', () => {
    dashboardService.getAllocationByType.mockReturnValue(of([]));
    dashboardService.getGeoAllocation.mockReturnValue(of([]));
    dashboardService.getRevenue.mockReturnValue(of([]));
    dashboardService.getFees.mockReturnValue(of({
      totalFees: 0, feesRatio: 0, feesByAccount: [],
    }));
    setup();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No data available');
    expect(compiled.textContent).toContain('No dividends or interest recorded yet');
    expect(compiled.textContent).toContain('No fees recorded');
  });

  it('sets loading to false when a request errors', () => {
    dashboardService.getPerformance.mockReturnValue(throwError(() => new Error('boom')));
    setup();

    expect(component['loading']()).toBe(false);
    expect(component['performance']()).toBeNull();
  });
});
