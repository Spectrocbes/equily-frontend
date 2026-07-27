import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WritableSignal, Signal } from '@angular/core';
import { CashAccountDetailComponent } from './cash-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ChartPeriod, FinancialAccount, PortfolioHistoryPoint, Transaction } from '../../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const mockAccount: FinancialAccount = {
  id: 'cash-1', name: 'Compte Courant', accountType: 'CASH_ACCOUNT',
  subType: 'CASH_ACCOUNT', balance: 2500, currency: 'EUR', transactionCount: 6,
  broker: 'BNP Paribas', depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'DEPOSIT', ticker: null,
  quantity: null, pricePerUnit: null,
  totalAmount: 300, totalAmountNative: 300, nativeCurrency: 'EUR',
  date: '2026-01-05', fees: 0, feesNative: 0, description: null,
  transferId: null, linkedAccountId: null, externalAddress: null, transferDirection: null,
};

describe('CashAccountDetailComponent', () => {
  let fixture: ComponentFixture<CashAccountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashAccountDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideTestTranslations(),
        {
          provide: AccountService,
          useValue: {
            getAccount:             jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions:        jest.fn().mockReturnValue(of([mockTransaction])),
            deleteTransaction:      jest.fn().mockReturnValue(of(undefined)),
            deleteAccount:          jest.fn().mockReturnValue(of(undefined)),
            loadAccounts:           jest.fn(),
            loadPortfolioSummaries: jest.fn(),
            accounts:               jest.fn(() => []),
          },
        },
        {
          provide: AnalyticsService,
          useValue: { getAccountHistory: jest.fn().mockReturnValue(of([])) },
        },
        {
          provide: ToastService,
          useValue: { error: jest.fn(), success: jest.fn() },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('cash-1') } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CashAccountDetailComponent);
    useTestTranslations();
    fixture.detectChanges();
  });

  it('displays account name', () => {
    expect(fixture.nativeElement.textContent).toContain('Compte Courant');
  });

  it('displays balance', () => {
    const comp = fixture.componentInstance as unknown as { currentAccountValue: Signal<number | null> };
    expect(comp.currentAccountValue()).toBe(2500);
  });

  it('redirects to /wealth/cash when no id', () => {
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(spy).toHaveBeenCalledWith(['/wealth/cash']);
  });

  it('isClosed returns true when status is CLOSED', () => {
    const comp = fixture.componentInstance as unknown as {
      account: WritableSignal<FinancialAccount | null>; isClosed: Signal<boolean>;
    };
    comp.account.set({ ...mockAccount, status: 'CLOSED', closedAt: '2026-06-01' });
    expect(comp.isClosed()).toBe(true);
  });

  it('onTransactionCreated sets positive delta for DEPOSIT', () => {
    const comp = fixture.componentInstance as unknown as {
      cashDelta: WritableSignal<number | null>;
      cashDeltaPositive: WritableSignal<boolean>;
      onTransactionCreated: (type: string, amount: number) => void;
    };
    comp.onTransactionCreated('DEPOSIT', 300);
    expect(comp.cashDelta()).toBe(300);
    expect(comp.cashDeltaPositive()).toBe(true);
  });

  it('onTransactionCreated sets negative delta for WITHDRAWAL', () => {
    const comp = fixture.componentInstance as unknown as {
      cashDeltaPositive: WritableSignal<boolean>;
      onTransactionCreated: (type: string, amount: number) => void;
    };
    comp.onTransactionCreated('WITHDRAWAL', 100);
    expect(comp.cashDeltaPositive()).toBe(false);
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

  it('confirmDeleteTransaction calls accountService.deleteTransaction and reloads', () => {
    const accountService = TestBed.inject(AccountService);
    const toastService   = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      deletingTransaction: WritableSignal<Transaction | null>;
      deleteLoading: WritableSignal<boolean>;
      confirmDeleteTransaction: () => void;
    };
    comp.deletingTransaction.set(mockTransaction);
    comp.confirmDeleteTransaction();
    expect(accountService.deleteTransaction).toHaveBeenCalledWith('cash-1', 'tx-1');
    expect(toastService.success).toHaveBeenCalledWith('Transaction deleted');
    expect(comp.deleteLoading()).toBe(false);
  });

  it('confirmDeleteTransaction shows error toast on failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.deleteTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Cannot delete' }))
    );
    const toastService = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      deletingTransaction: WritableSignal<Transaction | null>;
      deleteLoading: WritableSignal<boolean>;
      confirmDeleteTransaction: () => void;
    };
    comp.deletingTransaction.set(mockTransaction);
    comp.confirmDeleteTransaction();
    expect(toastService.error).toHaveBeenCalledWith('Cannot delete');
    expect(comp.deleteLoading()).toBe(false);
  });

  it('loadHistory calls analyticsService.getAccountHistory with account id', () => {
    const analyticsService = TestBed.inject(AnalyticsService);
    const mockPts: PortfolioHistoryPoint[] = [
      { date: '2026-01-01', value: 2500, invested: 2500, pnl: 0 },
    ];
    (analyticsService.getAccountHistory as jest.Mock).mockReturnValue(of(mockPts));
    const comp = fixture.componentInstance as unknown as {
      loadHistory: (period: ChartPeriod) => void;
      historyPoints: WritableSignal<PortfolioHistoryPoint[]>;
      historyLoading: WritableSignal<boolean>;
    };
    comp.loadHistory('ONE_MONTH');
    expect(analyticsService.getAccountHistory).toHaveBeenCalledWith('cash-1', 'ONE_MONTH');
    expect(comp.historyPoints()).toEqual(mockPts);
    expect(comp.historyLoading()).toBe(false);
  });

  it('getLinkedAccountName returns null when no linkedAccountId', () => {
    const comp = fixture.componentInstance as unknown as {
      getLinkedAccountName: (id: string | null) => string | null;
    };
    expect(comp.getLinkedAccountName(null)).toBeNull();
  });

  // --- Delete account tests ---

  it('showDeleteAccountModal is false by default', () => {
    const comp = fixture.componentInstance as unknown as { showDeleteAccountModal: Signal<boolean> };
    expect(comp.showDeleteAccountModal()).toBe(false);
  });

  it('3-dot menu shows Delete account option', () => {
    const comp = fixture.componentInstance as unknown as { accountMenuOpen: WritableSignal<boolean> };
    comp.accountMenuOpen.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Delete account');
  });

  it('confirmDeleteAccount calls accountService.deleteAccount', () => {
    const accountService = TestBed.inject(AccountService);
    const comp = fixture.componentInstance as unknown as { confirmDeleteAccount: () => void };
    comp.confirmDeleteAccount();
    expect(accountService.deleteAccount).toHaveBeenCalledWith('cash-1');
  });

  it('confirmDeleteAccount shows success toast, reloads and navigates on success', () => {
    const accountService = TestBed.inject(AccountService);
    const toastService   = TestBed.inject(ToastService);
    const router         = TestBed.inject(Router);
    const navigateSpy    = jest.spyOn(router, 'navigate');

    const comp = fixture.componentInstance as unknown as {
      showDeleteAccountModal: WritableSignal<boolean>;
      accountDeleteLoading: WritableSignal<boolean>;
      confirmDeleteAccount: () => void;
    };
    comp.showDeleteAccountModal.set(true);
    comp.confirmDeleteAccount();

    expect(toastService.success).toHaveBeenCalledWith('Account deleted');
    expect(accountService.loadAccounts).toHaveBeenCalled();
    expect(accountService.loadPortfolioSummaries).toHaveBeenCalled();
    expect(comp.showDeleteAccountModal()).toBe(false);
    expect(comp.accountDeleteLoading()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/wealth/cash']);
  });

  it('confirmDeleteAccount shows error toast on 422 failure', () => {
    const accountService = TestBed.inject(AccountService);
    (accountService.deleteAccount as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Cannot delete account with a nonzero balance' }))
    );
    const toastService = TestBed.inject(ToastService);
    const comp = fixture.componentInstance as unknown as {
      accountDeleteLoading: WritableSignal<boolean>;
      confirmDeleteAccount: () => void;
    };
    comp.confirmDeleteAccount();
    expect(toastService.error).toHaveBeenCalledWith('Cannot delete account with a nonzero balance');
    expect(comp.accountDeleteLoading()).toBe(false);
  });
});
