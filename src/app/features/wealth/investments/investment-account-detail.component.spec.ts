import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WritableSignal, Signal } from '@angular/core';
import { InvestmentAccountDetailComponent } from './investment-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EnrichedHolding, FinancialAccount, Transaction } from '../../../core/models/account.model';

interface EnrichedSignals {
  enrichedHoldings: WritableSignal<EnrichedHolding[]>;
  totalMarketValue: Signal<number>;
  totalUnrealizedPnl: Signal<number>;
  totalUnrealizedPnlPct: Signal<number>;
  hasSomeLivePrices: Signal<boolean>;
}

const mockAccount: FinancialAccount = {
  id: 'acc-1', name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 5000, currency: 'EUR', transactionCount: 1,
  broker: 'Fortuneo', depositLimit: 150000, totalDeposits: 5000, remainingCapacity: 145000,
  openedAt: null, portfolioValue: null,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'BUY', ticker: 'AAPL',
  quantity: 10, pricePerUnit: 150,
  totalAmount: 1505, currency: 'EUR',
  date: '2026-01-15', fees: 5, description: null,
};

const mockEnrichedHolding: EnrichedHolding = {
  ticker: 'AAPL', quantity: 10, averageCostPrice: 150, totalInvested: 1500,
  totalFeesPaid: 5, currentPrice: 200, currency: 'USD',
  marketValue: 2000, unrealizedPnl: 500, unrealizedPnlPct: 33.33,
  dayChangePercent: null, priceAvailable: true,
};

describe('InvestmentAccountDetailComponent', () => {
  let fixture: ComponentFixture<InvestmentAccountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAccountDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AccountService,
          useValue: {
            getAccount:           jest.fn().mockReturnValue(of(mockAccount)),
            getAccountById:       jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions:      jest.fn().mockReturnValue(of([mockTransaction])),
            getEnrichedHoldings:  jest.fn().mockReturnValue(of([mockEnrichedHolding])),
            recordTransaction:    jest.fn().mockReturnValue(of(undefined)),
            loadAccounts:         jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('acc-1') } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentAccountDetailComponent);
    fixture.detectChanges();
  });

  it('displays account name', () => {
    expect(fixture.nativeElement.textContent).toContain('Mon PEA');
  });

  it('displays holding ticker in Holdings tab', () => {
    expect(fixture.nativeElement.textContent).toContain('AAPL');
  });

  it('shows transactions tab on click', () => {
    const tabs = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const txTab = Array.from(tabs).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Transactions')
    ) as HTMLButtonElement;
    txTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('transactions');
  });

  it('redirects to /wealth/investments when no id', () => {
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(spy).toHaveBeenCalledWith(['/wealth/investments']);
  });

  it('computes totalCashOut correctly', () => {
    expect(fixture.componentInstance.totalCashOut()).toBe(1505);
  });

  it('toggles P&L mode between EUR and PCT', () => {
    expect(fixture.componentInstance.pnlMode()).toBe('EUR');
    fixture.componentInstance.togglePnlMode();
    expect(fixture.componentInstance.pnlMode()).toBe('PCT');
    fixture.componentInstance.togglePnlMode();
    expect(fixture.componentInstance.pnlMode()).toBe('EUR');
  });

  // EnrichedHoldings computed tests

  it('initializes enrichedHoldings signal as empty before ngOnInit', () => {
    const freshFixture = TestBed.createComponent(InvestmentAccountDetailComponent);
    expect((freshFixture.componentInstance as unknown as EnrichedSignals).enrichedHoldings()).toEqual([]);
  });

  it('totalMarketValue uses marketValue when priceAvailable', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'AAPL', quantity: 10, averageCostPrice: 150, totalInvested: 1500,
        totalFeesPaid: 5, currentPrice: 200, currency: 'USD',
        marketValue: 2000, unrealizedPnl: 500, unrealizedPnlPct: 33.33,
        dayChangePercent: null, priceAvailable: true },
    ]);
    expect(comp.totalMarketValue()).toBe(2000);
  });

  it('totalMarketValue falls back to totalInvested when price unavailable', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'MSFT', quantity: 5, averageCostPrice: 100, totalInvested: 500,
        totalFeesPaid: 2, currentPrice: null, currency: null,
        marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null,
        dayChangePercent: null, priceAvailable: false },
    ]);
    expect(comp.totalMarketValue()).toBe(500);
  });

  it('totalUnrealizedPnl sums only priceAvailable holdings', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'AAPL', quantity: 10, averageCostPrice: 150, totalInvested: 1500,
        totalFeesPaid: 5, currentPrice: 200, currency: 'USD',
        marketValue: 2000, unrealizedPnl: 500, unrealizedPnlPct: 33.33,
        dayChangePercent: null, priceAvailable: true },
      { ticker: 'MSFT', quantity: 5, averageCostPrice: 100, totalInvested: 500,
        totalFeesPaid: 2, currentPrice: null, currency: null,
        marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null,
        dayChangePercent: null, priceAvailable: false },
    ]);
    expect(comp.totalUnrealizedPnl()).toBe(500);
  });

  it('hasSomeLivePrices returns true when at least one holding has price', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'AAPL', priceAvailable: true, quantity: 1, averageCostPrice: 100,
        totalInvested: 100, totalFeesPaid: 0, currentPrice: 110, currency: 'USD',
        marketValue: 110, unrealizedPnl: 10, unrealizedPnlPct: 10, dayChangePercent: null },
      { ticker: 'MSFT', priceAvailable: false, quantity: 1, averageCostPrice: 50,
        totalInvested: 50, totalFeesPaid: 0, currentPrice: null, currency: null,
        marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null, dayChangePercent: null },
    ]);
    expect(comp.hasSomeLivePrices()).toBe(true);
  });

  it('totalUnrealizedPnlPct computed correctly', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'AAPL', priceAvailable: true, quantity: 10, averageCostPrice: 150,
        totalInvested: 1500, totalFeesPaid: 5, currentPrice: 200, currency: 'USD',
        marketValue: 2000, unrealizedPnl: 500, unrealizedPnlPct: 33.33, dayChangePercent: null },
    ]);
    // 500 / 1500 * 100
    expect(comp.totalUnrealizedPnlPct()).toBeCloseTo(33.33, 1);
  });

  it('totalUnrealizedPnlPct returns 0 when no live prices', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'MSFT', priceAvailable: false, quantity: 1, averageCostPrice: 50,
        totalInvested: 50, totalFeesPaid: 0, currentPrice: null, currency: null,
        marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null, dayChangePercent: null },
    ]);
    expect(comp.totalUnrealizedPnlPct()).toBe(0);
  });

  it('hasSomeLivePrices returns false when no holdings have price', () => {
    const comp = fixture.componentInstance as unknown as EnrichedSignals;
    comp.enrichedHoldings.set([
      { ticker: 'MSFT', priceAvailable: false, quantity: 1, averageCostPrice: 50,
        totalInvested: 50, totalFeesPaid: 0, currentPrice: null, currency: null,
        marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null, dayChangePercent: null },
    ]);
    expect(comp.hasSomeLivePrices()).toBe(false);
  });
});
