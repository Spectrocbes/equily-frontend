import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WritableSignal, Signal } from '@angular/core';
import { CryptoAccountDetailComponent } from './crypto-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EnrichedHolding, FinancialAccount, Transaction } from '../../../core/models/account.model';

interface CryptoSignals {
  enrichedHoldings: WritableSignal<EnrichedHolding[]>;
  totalMarketValue: Signal<number>;
  totalUnrealizedPnl: Signal<number>;
  totalUnrealizedPnlPct: Signal<number>;
  hasSomeLivePrices: Signal<boolean>;
}

const mockAccount: FinancialAccount = {
  id: 'crypto-1', name: 'My Wallet', accountType: 'CRYPTO_WALLET',
  subType: 'CRYPTO_WALLET', balance: 100, currency: 'EUR', transactionCount: 2,
  broker: 'Ledger', depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'BUY', ticker: 'BTC',
  quantity: 0.5, pricePerUnit: 30000,
  totalAmount: 15000, currency: 'EUR',
  date: '2026-01-10', fees: 10, description: null,
};

const mockHoldingWithPrice: EnrichedHolding = {
  ticker: 'BTC', quantity: 0.5, averageCostPrice: 30000, totalInvested: 15000,
  totalFeesPaid: 10, currentPrice: 40000, currency: 'EUR',
  marketValue: 20000, unrealizedPnl: 5000, unrealizedPnlPct: 33.33,
  dayChangePercent: 2.5, priceAvailable: true,
};

const mockHoldingNoPrice: EnrichedHolding = {
  ticker: 'ETH', quantity: 2, averageCostPrice: 2000, totalInvested: 4000,
  totalFeesPaid: 5, currentPrice: null, currency: null,
  marketValue: null, unrealizedPnl: null, unrealizedPnlPct: null,
  dayChangePercent: null, priceAvailable: false,
};

describe('CryptoAccountDetailComponent', () => {
  let fixture: ComponentFixture<CryptoAccountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptoAccountDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            getAccountById:      jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions:     jest.fn().mockReturnValue(of([mockTransaction])),
            getEnrichedHoldings: jest.fn().mockReturnValue(of([mockHoldingWithPrice])),
            loadAccounts:        jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('crypto-1') } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptoAccountDetailComponent);
    fixture.detectChanges();
  });

  it('displays account name', () => {
    expect(fixture.nativeElement.textContent).toContain('My Wallet');
  });

  it('displays holding ticker in Holdings tab', () => {
    expect(fixture.nativeElement.textContent).toContain('BTC');
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

  it('redirects to /wealth/crypto when no id', () => {
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(spy).toHaveBeenCalledWith(['/wealth/crypto']);
  });

  it('enrichedHoldings signal initialized empty before ngOnInit', () => {
    const freshFixture = TestBed.createComponent(CryptoAccountDetailComponent);
    expect((freshFixture.componentInstance as unknown as CryptoSignals).enrichedHoldings()).toEqual([]);
  });

  it('totalMarketValue uses marketValue when priceAvailable', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingWithPrice]);
    expect(comp.totalMarketValue()).toBe(20000);
  });

  it('totalMarketValue falls back to totalInvested when price unavailable', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingNoPrice]);
    expect(comp.totalMarketValue()).toBe(4000);
  });

  it('totalUnrealizedPnl sums only priceAvailable holdings', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingWithPrice, mockHoldingNoPrice]);
    expect(comp.totalUnrealizedPnl()).toBe(5000);
  });

  it('hasSomeLivePrices returns true when at least one holding has price', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingWithPrice, mockHoldingNoPrice]);
    expect(comp.hasSomeLivePrices()).toBe(true);
  });

  it('hasSomeLivePrices returns false when no holdings have price', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingNoPrice]);
    expect(comp.hasSomeLivePrices()).toBe(false);
  });

  it('totalUnrealizedPnlPct computed correctly', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingWithPrice]);
    // 5000 / 15000 * 100 = 33.33
    expect(comp.totalUnrealizedPnlPct()).toBeCloseTo(33.33, 1);
  });

  it('totalUnrealizedPnlPct returns 0 when no live prices', () => {
    const comp = fixture.componentInstance as unknown as CryptoSignals;
    comp.enrichedHoldings.set([mockHoldingNoPrice]);
    expect(comp.totalUnrealizedPnlPct()).toBe(0);
  });

  it('pnlMode defaults to EUR', () => {
    expect(fixture.componentInstance.pnlMode()).toBe('EUR');
  });

  it('togglePnlMode switches between EUR and PCT', () => {
    fixture.componentInstance.togglePnlMode();
    expect(fixture.componentInstance.pnlMode()).toBe('PCT');
    fixture.componentInstance.togglePnlMode();
    expect(fixture.componentInstance.pnlMode()).toBe('EUR');
  });
});
