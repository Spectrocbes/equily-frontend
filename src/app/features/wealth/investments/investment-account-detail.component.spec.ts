import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WritableSignal, Signal } from '@angular/core';
import { InvestmentAccountDetailComponent } from './investment-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
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
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'BUY', ticker: 'AAPL',
  quantity: 10, pricePerUnit: 150,
  totalAmount: 1505, totalAmountNative: 1505, nativeCurrency: 'EUR',
  date: '2026-01-15', fees: 5, feesNative: 5, description: null,
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
            getAccount:                 jest.fn().mockReturnValue(of(mockAccount)),
            getAccountById:             jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions:            jest.fn().mockReturnValue(of([mockTransaction])),
            getEnrichedHoldings:        jest.fn().mockReturnValue(of([mockEnrichedHolding])),
            recordTransaction:          jest.fn().mockReturnValue(of(undefined)),
            loadAccounts:               jest.fn(),
            getPeaClosureSimulation:    jest.fn().mockReturnValue(of({})),
            closePea:                   jest.fn().mockReturnValue(of(undefined)),
          },
        },
        {
          provide: ToastService,
          useValue: { error: jest.fn(), success: jest.fn() },
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

  it('isClosed returns true when status is CLOSED', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null>; isClosed: Signal<boolean> };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    expect(comp.isClosed()).toBe(true);
  });

  it('isClosed returns false when status is ACTIVE', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null>; isClosed: Signal<boolean> };
    comp.account.set({ ...mockAccount, status: 'ACTIVE' });
    expect(comp.isClosed()).toBe(false);
  });

  it('isPea returns true for PEA subType', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null>; isPea: Signal<boolean> };
    comp.account.set({ ...mockAccount, subType: 'PEA' });
    expect(comp.isPea()).toBe(true);
  });

  it('isPea returns true for PEA_PME subType', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null>; isPea: Signal<boolean> };
    comp.account.set({ ...mockAccount, subType: 'PEA_PME' });
    expect(comp.isPea()).toBe(true);
  });

  it('isPea returns false for non-PEA subType', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null>; isPea: Signal<boolean> };
    comp.account.set({ ...mockAccount, subType: 'COMPTE_TITRES' });
    expect(comp.isPea()).toBe(false);
  });

  it('peaUnder5Years returns true when age < 5', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 2);
    const comp = fixture.componentInstance as unknown as {
      account: WritableSignal<FinancialAccount | null>;
      peaUnder5Years: Signal<boolean>;
    };
    comp.account.set({ ...mockAccount, subType: 'PEA', openedAt: recentDate.toISOString().split('T')[0] });
    expect(comp.peaUnder5Years()).toBe(true);
  });

  it('peaUnder5Years returns false when age >= 5', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 6);
    const comp = fixture.componentInstance as unknown as {
      account: WritableSignal<FinancialAccount | null>;
      peaUnder5Years: Signal<boolean>;
    };
    comp.account.set({ ...mockAccount, subType: 'PEA', openedAt: oldDate.toISOString().split('T')[0] });
    expect(comp.peaUnder5Years()).toBe(false);
  });

  it('hides Add Transaction button when account is CLOSED', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null> };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Add Transaction');
  });

  it('hides Import CSV button when account is CLOSED', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null> };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Import CSV');
  });

  it('hides Allocation and Geographical Exposure when closed', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null> };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('Allocation');
    expect(text).not.toContain('Geographical Exposure');
  });

  it('hides Holdings tab when closed', () => {
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null> };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]'));
    const holdingsTab = buttons.find(b => b.textContent?.trim().startsWith('Holdings'));
    expect(holdingsTab).toBeUndefined();
  });

  it('shows Closed badge instead of age badge for closed PEA with openedAt', () => {
    const recentDate = new Date();
    recentDate.setFullYear(recentDate.getFullYear() - 2);
    const comp = fixture.componentInstance as unknown as { account: WritableSignal<FinancialAccount | null> };
    comp.account.set({
      ...mockAccount, subType: 'PEA',
      openedAt: recentDate.toISOString().split('T')[0],
      status: 'CLOSED', closedAt: '2026-06-01',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Closed');
    expect(text).not.toContain('PEA withdrawal rules apply');
  });

  it('3-dot menu shows Close PEA option for open PEA', () => {
    const comp = fixture.componentInstance as unknown as {
      account: WritableSignal<FinancialAccount | null>;
      accountMenuOpen: WritableSignal<boolean>;
    };
    comp.account.set({ ...mockAccount, subType: 'PEA', status: 'ACTIVE' });
    comp.accountMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Close PEA');
  });

  it('3-dot menu hidden for non-PEA accounts', () => {
    const comp = fixture.componentInstance as unknown as {
      account: WritableSignal<FinancialAccount | null>;
      accountMenuOpen: WritableSignal<boolean>;
    };
    comp.account.set({ ...mockAccount, accountType: 'COMPTE_TITRES', subType: 'COMPTE_TITRES', status: 'ACTIVE' });
    comp.accountMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Close PEA');
  });

  it('loadClosureSimulation sets simulation and opens modal on success', () => {
    const mockSim = {
      liquidationValue: 10000, totalDeposits: 8000, netGain: 2000, gainRatio: 1,
      irTax: 256, psTax: 372, totalTax: 628, netAmount: 9372,
      taxableGain: 2000, withdrawalAmount: 10000,
      atLoss: false, peaOlderThan5Years: false,
    };
    const accountService = TestBed.inject(AccountService);
    (accountService.getPeaClosureSimulation as jest.Mock).mockReturnValue(of(mockSim));

    const comp = fixture.componentInstance as unknown as {
      showClosureModal: WritableSignal<boolean>;
      simulation: WritableSignal<typeof mockSim | null>;
      loadClosureSimulation: () => void;
    };
    comp.loadClosureSimulation();
    expect(comp.simulation()).toEqual(mockSim);
    expect(comp.showClosureModal()).toBe(true);
  });

  it('loadClosureSimulation calls toastService.error on failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.getPeaClosureSimulation as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Simulation failed' }))
    );
    const toastService = TestBed.inject(ToastService);
    (fixture.componentInstance as unknown as { loadClosureSimulation: () => void }).loadClosureSimulation();
    expect(toastService.error).toHaveBeenCalledWith('Simulation failed');
  });

  it('onPeaClosureRequested closes add transaction modal before loading simulation', () => {
    jest.useFakeTimers();
    const comp = fixture.componentInstance as unknown as {
      showTransactionModal: WritableSignal<boolean>;
      showClosureModal: WritableSignal<boolean>;
      onPeaClosureRequested: () => void;
    };
    comp.showTransactionModal.set(true);
    comp.onPeaClosureRequested();
    expect(comp.showTransactionModal()).toBe(false);
    expect(comp.showClosureModal()).toBe(false);
    jest.runAllTimers();
    expect(comp.showClosureModal()).toBe(true);
    jest.useRealTimers();
  });

  it('confirmClosure calls closePea, shows success toast and reloads', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.closePea as jest.Mock).mockReturnValue(of(undefined));
    const toastService = TestBed.inject(ToastService);

    const comp = fixture.componentInstance as unknown as {
      showClosureModal: WritableSignal<boolean>;
      showTransactionModal: WritableSignal<boolean>;
      simulation: WritableSignal<null>;
      closureLoading: WritableSignal<boolean>;
      confirmClosure: () => void;
    };
    comp.showClosureModal.set(true);
    comp.showTransactionModal.set(true);
    comp.confirmClosure();

    expect(toastService.success).toHaveBeenCalledWith('PEA closed successfully');
    expect(comp.showClosureModal()).toBe(false);
    expect(comp.showTransactionModal()).toBe(false);
    expect(comp.simulation()).toBeNull();
    expect(comp.closureLoading()).toBe(false);
  });

  it('confirmClosure calls toastService.error on closePea failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.closePea as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Close failed' }))
    );
    const toastService = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      closureLoading: WritableSignal<boolean>;
      confirmClosure: () => void;
    };
    comp.confirmClosure();
    expect(toastService.error).toHaveBeenCalledWith('Close failed');
    expect(comp.closureLoading()).toBe(false);
  });

  it('onPeaOver5yWithdrawalRequested closes tx modal and opens breakdown modal', () => {
    const accountService = TestBed.inject(AccountService);
    const mockSim = {
      liquidationValue: 15000, totalDeposits: 10000, netGain: 5000, gainRatio: 0.5,
      irTax: 0, psTax: 465, totalTax: 465, netAmount: 9535,
      taxableGain: 2500, withdrawalAmount: 1000, atLoss: false, peaOlderThan5Years: true,
    };
    (accountService.getPeaClosureSimulation as jest.Mock).mockReturnValue(of(mockSim));

    const comp = fixture.componentInstance as unknown as {
      showTransactionModal: WritableSignal<boolean>;
      showWithdrawalBreakdownModal: WritableSignal<boolean>;
      withdrawalBreakdown: WritableSignal<typeof mockSim | null>;
      onPeaOver5yWithdrawalRequested: (amount: number) => void;
    };
    comp.showTransactionModal.set(true);
    comp.onPeaOver5yWithdrawalRequested(1000);

    expect(comp.showTransactionModal()).toBe(false);
    expect(comp.showWithdrawalBreakdownModal()).toBe(true);
    expect(comp.withdrawalBreakdown()).toEqual(mockSim);
  });

  it('confirmWithdrawal calls recordTransaction with correct amount', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.recordTransaction as jest.Mock).mockReturnValue(of(undefined));
    const toastService = TestBed.inject(ToastService);

    const mockSim = {
      liquidationValue: 15000, totalDeposits: 10000, netGain: 5000, gainRatio: 0.5,
      irTax: 0, psTax: 465, totalTax: 465, netAmount: 9535,
      taxableGain: 2500, withdrawalAmount: 2000, atLoss: false, peaOlderThan5Years: true,
    };
    const comp = fixture.componentInstance as unknown as {
      withdrawalBreakdown: WritableSignal<typeof mockSim | null>;
      showWithdrawalBreakdownModal: WritableSignal<boolean>;
      withdrawalLoading: WritableSignal<boolean>;
      confirmWithdrawal: () => void;
    };
    comp.withdrawalBreakdown.set(mockSim);
    comp.showWithdrawalBreakdownModal.set(true);
    comp.confirmWithdrawal();

    expect(accountService.recordTransaction).toHaveBeenCalledWith(
      'acc-1',
      expect.objectContaining({ type: 'WITHDRAWAL', totalAmount: 2000, currency: 'EUR' })
    );
    expect(toastService.success).toHaveBeenCalledWith('Withdrawal recorded');
    expect(comp.showWithdrawalBreakdownModal()).toBe(false);
    expect(comp.withdrawalLoading()).toBe(false);
  });

  it('confirmWithdrawal calls toastService.error on failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.recordTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Record failed' }))
    );
    const toastService = TestBed.inject(ToastService);

    const mockSim = {
      liquidationValue: 15000, totalDeposits: 10000, netGain: 5000, gainRatio: 0.5,
      irTax: 0, psTax: 465, totalTax: 465, netAmount: 9535,
      taxableGain: 2500, withdrawalAmount: 2000, atLoss: false, peaOlderThan5Years: true,
    };
    const comp = fixture.componentInstance as unknown as {
      withdrawalBreakdown: WritableSignal<typeof mockSim | null>;
      withdrawalLoading: WritableSignal<boolean>;
      confirmWithdrawal: () => void;
    };
    comp.withdrawalBreakdown.set(mockSim);
    comp.confirmWithdrawal();
    expect(toastService.error).toHaveBeenCalledWith('Record failed');
    expect(comp.withdrawalLoading()).toBe(false);
  });
});
