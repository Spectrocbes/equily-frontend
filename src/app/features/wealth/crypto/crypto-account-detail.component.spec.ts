import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WritableSignal, Signal } from '@angular/core';
import { CryptoAccountDetailComponent } from './crypto-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import {
  ChartPeriod, EnrichedHolding, FinancialAccount, PortfolioHistoryPoint, Transaction,
} from '../../../core/models/account.model';

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
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'BUY', ticker: 'BTC',
  quantity: 0.5, pricePerUnit: 30000,
  totalAmount: 15000, totalAmountNative: 15000, nativeCurrency: 'EUR',
  date: '2026-01-10', fees: 10, feesNative: 10, description: null,
  transferId: null, linkedAccountId: null, externalAddress: null, transferDirection: null,
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
        provideHttpClient(),
        {
          provide: AccountService,
          useValue: {
            getAccount:          jest.fn().mockReturnValue(of(mockAccount)),
            getAccountById:      jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions:     jest.fn().mockReturnValue(of([mockTransaction])),
            getEnrichedHoldings:  jest.fn().mockReturnValue(of([mockHoldingWithPrice])),
            deleteTransaction:    jest.fn().mockReturnValue(of(undefined)),
            getPortfolioSummary:  jest.fn().mockReturnValue(null),
            loadAccounts:         jest.fn(),
            loadPortfolioSummaries: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            getAccountHistory: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: ToastService,
          useValue: { error: jest.fn(), success: jest.fn() },
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

  it('does not render a geographic exposure section', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Geographical Exposure');
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

  it('openTxMenu opens downward when enough space below', () => {
    const comp = fixture.componentInstance as unknown as {
      txMenuOpenId: WritableSignal<string | null>;
      txMenuPosition: WritableSignal<{ top: number; right: number } | null>;
      openTxMenu: (id: string, e: MouseEvent) => void;
    };
    const mockButton = {
      getBoundingClientRect: () => ({ bottom: 100, right: 200, top: 80, left: 150, width: 50, height: 20 }),
    } as HTMLElement;
    const event = { stopPropagation: jest.fn(), currentTarget: mockButton } as unknown as MouseEvent;
    comp.openTxMenu('tx-1', event);
    expect(comp.txMenuOpenId()).toBe('tx-1');
    expect(comp.txMenuPosition()).toEqual({ top: 104, right: window.innerWidth - 200 });
  });

  it('openTxMenu opens upward when not enough space below but enough above', () => {
    const comp = fixture.componentInstance as unknown as {
      txMenuOpenId: WritableSignal<string | null>;
      txMenuPosition: WritableSignal<{ top: number; right: number } | null>;
      openTxMenu: (id: string, e: MouseEvent) => void;
    };
    const mockButton = {
      getBoundingClientRect: () => ({ bottom: 750, right: 200, top: 730, left: 150, width: 50, height: 20 }),
    } as HTMLElement;
    const event = { stopPropagation: jest.fn(), currentTarget: mockButton } as unknown as MouseEvent;
    comp.openTxMenu('tx-1', event);
    expect(comp.txMenuPosition()!.top).toBe(730 - 90 - 4);
  });

  it('openTxMenu toggles off when same id clicked twice', () => {
    const comp = fixture.componentInstance as unknown as {
      txMenuOpenId: WritableSignal<string | null>;
      txMenuPosition: WritableSignal<{ top: number; right: number } | null>;
      openTxMenu: (id: string, e: MouseEvent) => void;
    };
    const mockButton = {
      getBoundingClientRect: () => ({ bottom: 100, right: 200, top: 80, left: 150, width: 50, height: 20 }),
    } as HTMLElement;
    const event = { stopPropagation: jest.fn(), currentTarget: mockButton } as unknown as MouseEvent;
    comp.openTxMenu('tx-1', event);
    comp.openTxMenu('tx-1', event);
    expect(comp.txMenuOpenId()).toBeNull();
    expect(comp.txMenuPosition()).toBeNull();
  });

  it('requestDeleteTransaction sets deletingTxId and clears menu', () => {
    const comp = fixture.componentInstance as unknown as {
      txMenuOpenId: WritableSignal<string | null>;
      deletingTxId: Signal<string | null>;
      requestDeleteTransaction: (tx: Transaction) => void;
    };
    comp.txMenuOpenId.set('tx-1');
    comp.requestDeleteTransaction(mockTransaction);
    expect(comp.deletingTxId()).toBe('tx-1');
    expect(comp.txMenuOpenId()).toBeNull();
  });

  it('confirmDeleteTransaction calls accountService.deleteTransaction', () => {
    const accountService = TestBed.inject(AccountService);
    const comp = fixture.componentInstance as unknown as {
      deletingTransaction: WritableSignal<Transaction | null>;
      confirmDeleteTransaction: () => void;
    };
    comp.deletingTransaction.set(mockTransaction);
    comp.confirmDeleteTransaction();
    expect(accountService.deleteTransaction).toHaveBeenCalledWith('crypto-1', 'tx-1');
  });

  it('confirmDeleteTransaction shows success toast on success', () => {
    const toastService = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      deletingTransaction: WritableSignal<Transaction | null>;
      deleteLoading: WritableSignal<boolean>;
      confirmDeleteTransaction: () => void;
    };
    comp.deletingTransaction.set(mockTransaction);
    comp.confirmDeleteTransaction();
    expect(toastService.success).toHaveBeenCalledWith('Transaction deleted');
    expect(comp.deletingTransaction()).toBeNull();
    expect(comp.deleteLoading()).toBe(false);
  });

  it('confirmDeleteTransaction shows error toast on failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.deleteTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Delete failed' }))
    );
    const toastService = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      deletingTransaction: WritableSignal<Transaction | null>;
      deleteLoading: WritableSignal<boolean>;
      confirmDeleteTransaction: () => void;
    };
    comp.deletingTransaction.set(mockTransaction);
    comp.confirmDeleteTransaction();
    expect(toastService.error).toHaveBeenCalledWith('Delete failed');
    expect(comp.deleteLoading()).toBe(false);
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

  it('loadHistory calls analyticsService.getAccountHistory with account id', () => {
    const analyticsService = TestBed.inject(AnalyticsService);
    const mockPts: PortfolioHistoryPoint[] = [
      { date: '2026-01-01', value: 20000, invested: 15000, pnl: 5000 },
    ];
    (analyticsService.getAccountHistory as jest.Mock).mockReturnValue(of(mockPts));

    const comp = fixture.componentInstance as unknown as {
      loadHistory: (period: ChartPeriod) => void;
      historyPoints: WritableSignal<PortfolioHistoryPoint[]>;
      historyLoading: WritableSignal<boolean>;
    };
    comp.loadHistory('ONE_MONTH');

    expect(analyticsService.getAccountHistory).toHaveBeenCalledWith('crypto-1', 'ONE_MONTH');
    expect(comp.historyPoints()).toEqual(mockPts);
    expect(comp.historyLoading()).toBe(false);
  });

  it('loadHistory sets historyLoading to false on error', () => {
    const analyticsService = TestBed.inject(AnalyticsService);
    (analyticsService.getAccountHistory as jest.Mock).mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    const comp = fixture.componentInstance as unknown as {
      loadHistory: (period: ChartPeriod) => void;
      historyLoading: WritableSignal<boolean>;
    };
    comp.historyLoading.set(true);
    comp.loadHistory('ONE_MONTH');

    expect(comp.historyLoading()).toBe(false);
  });
});
