import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RebalancingService } from './rebalancing.service';
import { PreferencesService } from './preferences.service';
import { TargetAllocation, RebalancingSuggestion } from '../models/account.model';
import { signal } from '@angular/core';

describe('RebalancingService', () => {
  let service: RebalancingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PreferencesService, useValue: { currency: signal('EUR') } },
      ],
    });
    service = TestBed.inject(RebalancingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAllocations calls GET /api/v1/rebalancing/accounts/:id/allocations', () => {
    const mock: TargetAllocation[] = [{ category: 'US', targetPercent: 60 }];
    let result: TargetAllocation[] | undefined;

    service.getAllocations('acc-1').subscribe(r => (result = r));

    const req = httpMock.expectOne('/api/v1/rebalancing/accounts/acc-1/allocations');
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(result).toEqual(mock);
  });

  it('saveAllocations calls PUT with the allocations payload', () => {
    const allocations: TargetAllocation[] = [
      { category: 'US', targetPercent: 60 },
      { category: 'EU', targetPercent: 40 },
    ];

    service.saveAllocations('acc-1', allocations).subscribe();

    const req = httpMock.expectOne('/api/v1/rebalancing/accounts/acc-1/allocations');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ allocations });
    req.flush(null);
  });

  it('saveDcaAmount calls PUT /api/v1/accounts/:id/dca-amount', () => {
    service.saveDcaAmount('acc-1', 250).subscribe();

    const req = httpMock.expectOne('/api/v1/accounts/acc-1/dca-amount');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ amount: 250 });
    req.flush(null);
  });

  it('getSuggestions calls GET with dcaAmount and currency params', () => {
    const mock: RebalancingSuggestion[] = [
      {
        category: 'US', targetPercent: 60, currentPercent: 50,
        currentValue: 500, deviationPercent: -10, suggestedAmount: 100,
      },
    ];
    let result: RebalancingSuggestion[] | undefined;

    service.getSuggestions('acc-1', 200).subscribe(r => (result = r));

    const req = httpMock.expectOne(
      r => r.url === '/api/v1/rebalancing/accounts/acc-1/suggestions'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('dcaAmount')).toBe('200');
    expect(req.request.params.get('currency')).toBe('EUR');
    req.flush(mock);

    expect(result).toEqual(mock);
  });
});
