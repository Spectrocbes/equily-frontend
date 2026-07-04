import { signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AddTransactionModalComponent } from './add-transaction-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { EnrichedHolding, FinancialAccount } from '../../../core/models/account.model';
import { of, throwError } from 'rxjs';

const mockHoldings: EnrichedHolding[] = [
  {
    ticker: 'AAPL', quantity: 10, averageCostPrice: 150, totalInvested: 1500,
    totalFeesPaid: 5, currentPrice: 180, currency: 'USD', marketValue: 1800,
    unrealizedPnl: 300, unrealizedPnlPct: 20, dayChangePercent: 1.5, priceAvailable: true,
  },
  {
    ticker: 'MSFT', quantity: 5, averageCostPrice: 300, totalInvested: 1500,
    totalFeesPaid: 3, currentPrice: 350, currency: 'USD', marketValue: 1750,
    unrealizedPnl: 250, unrealizedPnlPct: 16.67, dayChangePercent: 0.5, priceAvailable: true,
  },
];

const mockAccount: FinancialAccount = {
  id: 'acc-1', name: 'Mon PEA', accountType: 'PEA', subType: 'PEA',
  balance: 5000, currency: 'EUR', transactionCount: 0, broker: 'Fortuneo',
  depositLimit: 150000, totalDeposits: 10000, remainingCapacity: 140000,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockLinkedAccount: FinancialAccount = {
  ...mockAccount,
  linkedCheckingAccountId: 'cash-1',
};

const mockCashAccount: FinancialAccount = {
  id: 'cash-1', name: 'Mon Compte', accountType: 'CASH_ACCOUNT', subType: 'CASH_ACCOUNT',
  balance: 2000, currency: 'EUR', transactionCount: 0, broker: 'BNP',
  depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockSavingsAccount: FinancialAccount = {
  id: 'savings-1', name: 'Livret A', accountType: 'SAVINGS_ACCOUNT', subType: 'LIVRET_A',
  balance: 3000, currency: 'EUR', transactionCount: 0, broker: 'La Banque Postale',
  depositLimit: 22950, totalDeposits: 3000, remainingCapacity: 19950,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockCryptoAccount: FinancialAccount = {
  id: 'crypto-1', name: 'Binance', accountType: 'CRYPTO_WALLET', subType: 'CRYPTO_WALLET',
  balance: 100, currency: 'EUR', transactionCount: 0, broker: 'Binance',
  depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

const mockClosedAccount: FinancialAccount = {
  id: 'closed-1', name: 'Closed Account', accountType: 'SAVINGS_ACCOUNT', subType: null,
  balance: 0, currency: 'EUR', transactionCount: 0, broker: 'BNP',
  depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null, status: 'CLOSED', closedAt: '2024-01-01',
  linkedCheckingAccountId: null,
};

describe('AddTransactionModalComponent', () => {
  let fixture: ComponentFixture<AddTransactionModalComponent>;
  let mockService: Partial<AccountService>;
  let mockPrefsService: { currency: ReturnType<typeof signal<string>> };
  let accountsSignal: ReturnType<typeof signal<FinancialAccount[]>>;

  beforeEach(async () => {
    accountsSignal = signal<FinancialAccount[]>([
      mockAccount, mockCashAccount, mockSavingsAccount, mockCryptoAccount, mockClosedAccount,
    ]);
    mockService = {
      recordTransaction: jest.fn().mockReturnValue(of(undefined)),
      getPeaSummary: jest.fn().mockReturnValue(of(null)),
      executeTransfer: jest.fn().mockReturnValue(of({ transferId: 'tr-1' })),
      accounts: accountsSignal,
    };
    mockPrefsService = { currency: signal('EUR') };

    await TestBed.configureTestingModule({
      imports: [AddTransactionModalComponent],
      providers: [
        { provide: AccountService, useValue: mockService },
        { provide: PreferencesService, useValue: mockPrefsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTransactionModalComponent);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.componentRef.setInput('accountType', 'PEA');
    fixture.detectChanges();
  });

  // ── availableTransactionTypes ──────────────────────────────────────────────

  it('renders BUY, SELL, DIVIDEND, TRANSFER for PEA (investment) but not INTEREST', () => {
    const text = fixture.nativeElement.textContent;
    ['Buy', 'Sell', 'Dividend', 'Transfer'].forEach(t =>
      expect(text).toContain(t)
    );
    expect(text).not.toContain('Deposit');
    expect(text).not.toContain('Withdrawal');
    expect(text).not.toContain('Interest');
  });

  it('renders TRANSFER and INTEREST only for SAVINGS_ACCOUNT', () => {
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.componentRef.setInput('accountSubType', 'LIVRET_A');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Transfer');
    expect(text).toContain('Interest');
    expect(text).not.toContain('Deposit');
    expect(text).not.toContain('Withdrawal');
    expect(text).not.toContain('Buy');
  });

  it('renders all types for CASH_ACCOUNT except DIVIDEND', () => {
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.componentRef.setInput('accountSubType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    // Open the custom dropdown to see the options in the DOM
    fixture.componentInstance['typeDropdownOpen'].set(true);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    ['Deposit', 'Withdrawal', 'Payment', 'Transfer', 'Buy', 'Sell', 'Interest']
      .forEach(t => expect(text).toContain(t));
    expect(text).not.toContain('Dividend');
  });

  // ── TRANSFER form ──────────────────────────────────────────────────────────

  it('showTransferForm is true when TRANSFER is selected', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    expect(fixture.componentInstance['showTransferForm']()).toBe(true);
  });

  it('showTransferForm is false when BUY is selected', () => {
    fixture.componentInstance.onTypeChange('BUY');
    fixture.detectChanges();
    expect(fixture.componentInstance['showTransferForm']()).toBe(false);
  });

  it('transferMode defaults to internal', () => {
    expect(fixture.componentInstance['transferMode']()).toBe('internal');
  });

  it('transferMode resets to internal on type change', () => {
    fixture.componentInstance['transferMode'].set('external');
    fixture.componentInstance.onTypeChange('TRANSFER');
    expect(fixture.componentInstance['transferMode']()).toBe('internal');
  });

  it('shows My accounts / External toggle when TRANSFER selected for CASH_ACCOUNT', () => {
    fixture.componentRef.setInput('accountId', 'cash-1');
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.componentRef.setInput('accountSubType', 'CASH_ACCOUNT');
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('My accounts');
    expect(text).toContain('External');
  });

  it('does not show My accounts / External toggle for INVESTMENT TRANSFER', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('My accounts');
    expect(text).not.toContain('External');
  });

  it('availableBalance returns balance of current account', () => {
    expect(fixture.componentInstance['availableBalance']()).toBe(5000);
  });

  it('availableBalance returns 0 when account not found', () => {
    fixture.componentRef.setInput('accountId', 'unknown');
    fixture.detectChanges();
    expect(fixture.componentInstance['availableBalance']()).toBe(0);
  });

  it('destinationAccounts excludes current account', () => {
    const dest = fixture.componentInstance['destinationAccounts']();
    expect(dest.some(a => a.id === 'acc-1')).toBe(false);
  });

  it('destinationAccounts excludes closed accounts', () => {
    const dest = fixture.componentInstance['destinationAccounts']();
    expect(dest.some(a => a.id === 'closed-1')).toBe(false);
  });

  it('destinationAccounts for INVESTMENT (PEA) returns empty array', () => {
    const dest = fixture.componentInstance['destinationAccounts']();
    expect(dest).toHaveLength(0);
  });

  it('destinationAccounts includes all active non-current accounts for CASH_ACCOUNT', () => {
    fixture.componentRef.setInput('accountId', 'cash-1');
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    const dest = fixture.componentInstance['destinationAccounts']();
    expect(dest.some(a => a.id === 'acc-1')).toBe(true);
  });

  it('isFormValid for TRANSFER internal requires toAccountId', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['form'].patchValue({
      totalAmount: 100, date: '2026-01-15', toAccountId: '',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(false);

    fixture.componentInstance['form'].patchValue({ toAccountId: 'cash-1' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(true);
  });

  it('isFormValid for TRANSFER external only requires amount and date', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['transferMode'].set('external');
    fixture.componentInstance['form'].patchValue({ totalAmount: 100, date: '2026-01-15' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(true);
  });

  it('submitTransfer calls executeTransfer with correct payload', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['form'].patchValue({
      totalAmount: 500, toAccountId: 'cash-1', description: 'test',
    });
    fixture.componentInstance['form'].patchValue({ date: '2026-06-01' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockService.executeTransfer).toHaveBeenCalledWith({
      fromAccountId: 'acc-1',
      toAccountId: 'cash-1',
      amount: 500,
      currency: 'EUR',
      date: '2026-06-01',
      description: 'test',
      externalAddress: null,
    });
  });

  it('submitTransfer with external mode sends null toAccountId and externalAddress', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['transferMode'].set('external');
    fixture.componentInstance['form'].patchValue({
      totalAmount: 200, date: '2026-06-01',
      externalAddress: 'John Doe',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockService.executeTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        toAccountId: null,
        externalAddress: 'John Doe',
      })
    );
  });

  // ── basic form validity ────────────────────────────────────────────────────

  it('submit button is disabled when form is invalid', () => {
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
  });

  it('emits closed when cancel clicked', () => {
    const spy = jest.fn();
    fixture.componentInstance.closed.subscribe(spy);
    const cancelBtn = fixture.nativeElement.querySelector('button[type="button"]');
    cancelBtn.click();
    expect(spy).toHaveBeenCalled();
  });

  it('calls recordTransaction and emits created on valid DEPOSIT submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);

    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({
      totalAmount: 1000,
      date: '2026-01-15',
      description: '',
    });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockService.recordTransaction).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
  });

  it('shows backend message on 422 insufficient balance (err.error.message)', () => {
    (mockService.recordTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ status: 422, error: { message: 'Insufficient balance on Mon Compte' } }))
    );
    const toastSvc = TestBed.inject(ToastService);
    jest.spyOn(toastSvc, 'error');

    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({ totalAmount: 1000, date: '2026-01-15' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(toastSvc.error).toHaveBeenCalledWith('Insufficient balance on Mon Compte');
  });

  it('shows backend message on 422 insufficient balance (plain string err.error)', () => {
    (mockService.recordTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ status: 422, error: 'Insufficient balance on Mon Compte' }))
    );
    const toastSvc = TestBed.inject(ToastService);
    jest.spyOn(toastSvc, 'error');

    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({ totalAmount: 1000, date: '2026-01-15' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(toastSvc.error).toHaveBeenCalledWith('Insufficient balance on Mon Compte');
  });

  it('isFormValid returns false when no type selected', () => {
    expect(fixture.componentInstance.isFormValid()).toBe(false);
  });

  it('isFormValid returns true for valid DEPOSIT', () => {
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({ totalAmount: 1000, date: '2026-01-15' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(true);
  });

  it('isFormValid returns true for valid BUY', () => {
    fixture.componentInstance.onTypeChange('BUY');
    fixture.componentInstance['form'].patchValue({
      ticker: 'AAPL', quantity: 10, pricePerUnit: 150, date: '2026-01-15'
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(true);
  });

  it('showDepositWarning is false when type is not DEPOSIT', () => {
    fixture.componentRef.setInput('depositLimit', 22950);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();
    expect(fixture.componentInstance['showDepositWarning']()).toBe(false);
  });

  it('showDepositWarning is false when no deposit limit', () => {
    fixture.componentRef.setInput('depositLimit', null);
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showDepositWarning']()).toBe(false);
  });

  it('showDepositWarning is true for DEPOSIT with limit', () => {
    fixture.componentRef.setInput('depositLimit', 22950);
    fixture.componentRef.setInput('remainingCapacity', 5000);
    fixture.componentRef.setInput('totalDeposits', 17950);
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showDepositWarning']()).toBe(true);
  });

  it('wouldExceedLimit is true when amount exceeds remaining', () => {
    fixture.componentRef.setInput('depositLimit', 22950);
    fixture.componentRef.setInput('remainingCapacity', 5000);
    fixture.componentRef.setInput('totalDeposits', 17950);
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({ totalAmount: 6000, date: '2026-01-15' });
    fixture.detectChanges();
    expect(fixture.componentInstance['wouldExceedLimit']()).toBe(true);
  });

  it('isFormValid returns false when would exceed limit', () => {
    fixture.componentRef.setInput('depositLimit', 22950);
    fixture.componentRef.setInput('remainingCapacity', 5000);
    fixture.componentRef.setInput('totalDeposits', 17950);
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({ totalAmount: 6000, date: '2026-01-15' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(false);
  });

  it('shows currency label on amount field', () => {
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('(EUR)');
  });

  it('sends currency in request payload on DEPOSIT submit', () => {
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].patchValue({
      totalAmount: 500,
      date: '2026-01-15',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockService.recordTransaction).toHaveBeenCalledWith(
      'acc-1',
      expect.objectContaining({ currency: 'EUR' })
    );
  });

  it('sends currency in request payload on BUY submit', () => {
    fixture.componentInstance.onTypeChange('BUY');
    fixture.componentInstance['form'].patchValue({
      ticker: 'AAPL', quantity: 5, pricePerUnit: 200, date: '2026-01-15',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockService.recordTransaction).toHaveBeenCalledWith(
      'acc-1',
      expect.objectContaining({ currency: 'EUR' })
    );
  });

  it('transactionCurrency returns EUR for PEA account regardless of user preference', () => {
    mockPrefsService.currency.set('USD');
    fixture.componentRef.setInput('accountType', 'PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['transactionCurrency']()).toBe('EUR');
  });

  it('transactionCurrency returns user currency for CRYPTO_WALLET', async () => {
    mockPrefsService.currency.set('USD');
    fixture.componentRef.setInput('accountType', 'CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['transactionCurrency']()).toBe('USD');
  });

  it('isEurForced returns true for PEA', () => {
    fixture.componentRef.setInput('accountType', 'PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['isEurForced']()).toBe(true);
  });

  it('isEurForced returns false for CRYPTO_WALLET', () => {
    fixture.componentRef.setInput('accountType', 'CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['isEurForced']()).toBe(false);
  });

  it('shows EUR only warning when user currency is USD and account is PEA', () => {
    mockPrefsService.currency.set('USD');
    fixture.componentRef.setInput('accountType', 'PEA');
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('EUR only');
  });

  it('withdrawalBlocked is false when not a PEA account', () => {
    fixture.componentRef.setInput('accountType', 'COMPTE_TITRES');
    fixture.componentRef.setInput('accountSubType', 'COMPTE_TITRES');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', true);
    fixture.detectChanges();
    expect(fixture.componentInstance['withdrawalBlocked']()).toBe(false);
  });

  it('withdrawalBlocked is false when PEA under 5y but no holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.detectChanges();
    expect(fixture.componentInstance['withdrawalBlocked']()).toBe(false);
  });

  it('withdrawalBlocked is true when PEA under 5y with holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', true);
    fixture.detectChanges();
    expect(fixture.componentInstance['withdrawalBlocked']()).toBe(true);
  });

  it('calls getPeaSummary in ngOnInit when accountSubType is PEA', () => {
    const localFixture = TestBed.createComponent(AddTransactionModalComponent);
    localFixture.componentRef.setInput('accountId', 'acc-2');
    localFixture.componentRef.setInput('accountType', 'PEA');
    localFixture.componentRef.setInput('accountSubType', 'PEA');
    localFixture.detectChanges();
    expect(mockService.getPeaSummary).toHaveBeenCalled();
  });

  it('peaWithdrawalForcedClosure is true for PEA <5y with 0 holdings and WITHDRAWAL selected', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaWithdrawalForcedClosure']()).toBe(true);
  });

  it('submit button shows "Continue" for forced closure', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitBtn.textContent?.trim()).toContain('Continue');
  });

  it('onSubmit emits peaClosureRequested instead of calling API for forced closure', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();

    const spy = jest.fn();
    fixture.componentInstance.peaClosureRequested.subscribe(spy);
    fixture.componentInstance['onSubmit']();

    expect(spy).toHaveBeenCalled();
    expect(mockService.recordTransaction).not.toHaveBeenCalled();
  });

  it('totalAmount is disabled and pre-filled when forced closure is active', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();

    const control = fixture.componentInstance['form'].get('totalAmount');
    expect(control?.disabled).toBe(true);
    expect(control?.value).toBe(5000);
  });

  it('isPeaOver5Years returns true for PEA with peaUnder5Years=false', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', false);
    fixture.detectChanges();
    expect(fixture.componentInstance['isPeaOver5Years']()).toBe(true);
  });

  it('isPeaOver5Years returns false for non-PEA account', () => {
    fixture.componentRef.setInput('accountType', 'COMPTE_TITRES');
    fixture.componentRef.setInput('accountSubType', 'COMPTE_TITRES');
    fixture.componentRef.setInput('peaUnder5Years', false);
    fixture.detectChanges();
    expect(fixture.componentInstance['isPeaOver5Years']()).toBe(false);
  });

  it('peaOver5yWithdrawal is true for PEA ≥5y WITHDRAWAL', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', false);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaOver5yWithdrawal']()).toBe(true);
  });

  it('submit button shows "Continue →" for PEA ≥5y WITHDRAWAL', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', false);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.componentInstance['form'].patchValue({ totalAmount: 1000, date: '2026-01-15' });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.textContent?.trim()).toContain('Continue');
  });

  it('onSubmit emits peaOver5yWithdrawalRequested with amount for PEA ≥5y', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', false);
    fixture.componentInstance.onTypeChange('WITHDRAWAL');
    fixture.componentInstance['form'].patchValue({ totalAmount: 2000, date: '2026-01-15' });
    fixture.detectChanges();

    const spy = jest.fn();
    fixture.componentInstance.peaOver5yWithdrawalRequested.subscribe(spy);
    fixture.componentInstance['onSubmit']();

    expect(spy).toHaveBeenCalledWith(2000);
    expect(mockService.recordTransaction).not.toHaveBeenCalled();
  });

  // ── SELL ticker dropdown + max quantity ────────────────────────────────────

  it('heldTickers returns mapped list from holdings input', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.detectChanges();
    expect(fixture.componentInstance['heldTickers']()).toEqual([
      { symbol: 'AAPL', quantity: 10 },
      { symbol: 'MSFT', quantity: 5 },
    ]);
  });

  it('SELL shows a ticker dropdown populated with held tickers', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[formControlName="ticker"]');
    expect(select).toBeTruthy();
    const options: HTMLOptionElement[] = Array.from(select.querySelectorAll('option'));
    expect(options.some(o => o.value === 'AAPL')).toBe(true);
    expect(options.some(o => o.value === 'MSFT')).toBe(true);
  });

  it('BUY shows free-text ticker input, not a dropdown', () => {
    fixture.componentInstance.onTypeChange('BUY');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select[formControlName="ticker"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[formControlName="ticker"]')).toBeTruthy();
  });

  it('onSellTickerChange resets quantity and activates max validator', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.componentInstance['form'].get('ticker')?.setValue('AAPL');
    fixture.componentInstance['onSellTickerChange']();
    fixture.detectChanges();

    const qtyControl = fixture.componentInstance['form'].get('quantity');
    expect(qtyControl?.value).toBeNull();

    qtyControl?.setValue(15);
    expect(qtyControl?.hasError('max')).toBe(true);
  });

  it('maxSellQuantity returns the quantity of the selected holding', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.componentInstance['form'].get('ticker')?.setValue('MSFT');
    fixture.componentInstance['onSellTickerChange']();
    fixture.detectChanges();
    expect(fixture.componentInstance['maxSellQuantity']()).toBe(5);
  });

  it('quantity label shows max hint for SELL after selecting a ticker', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.componentInstance['form'].get('ticker')?.setValue('AAPL');
    fixture.componentInstance['onSellTickerChange']();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('max: 10');
  });

  it('isFormValid is false when SELL quantity exceeds held quantity', () => {
    fixture.componentRef.setInput('holdings', mockHoldings);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.componentInstance['form'].get('ticker')?.setValue('AAPL');
    fixture.componentInstance['onSellTickerChange']();
    fixture.componentInstance['form'].patchValue({
      quantity: 20,
      pricePerUnit: 150,
      date: '2026-01-15',
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.isFormValid()).toBe(false);
  });

  it('shows "No holdings available to sell" when holdings is empty for SELL', () => {
    fixture.componentRef.setInput('holdings', []);
    fixture.componentInstance.onTypeChange('SELL');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No holdings available to sell');
  });

  // ── useDropdownForTypes ────────────────────────────────────────────────────

  it('useDropdownForTypes is true for CASH_ACCOUNT', () => {
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['useDropdownForTypes']()).toBe(true);
  });

  it('useDropdownForTypes is false for PEA', () => {
    expect(fixture.componentInstance['useDropdownForTypes']()).toBe(false);
  });

  it('renders a custom dropdown (not a native select) for type selection when CASH_ACCOUNT', () => {
    fixture.componentRef.setInput('accountId', 'cash-1');
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.componentRef.setInput('accountSubType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    const nativeSelect = fixture.nativeElement.querySelector('select:not([formControlName])');
    expect(nativeSelect).toBeFalsy();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Select transaction type');
  });

  // ── destinationAccounts filtering ─────────────────────────────────────────

  it('destinationAccounts for SAVINGS_ACCOUNT only includes CASH_ACCOUNT accounts', () => {
    fixture.componentRef.setInput('accountId', 'savings-1');
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.detectChanges();
    const dest = fixture.componentInstance['destinationAccounts']();
    expect(dest.every(a => a.accountType === 'CASH_ACCOUNT')).toBe(true);
    expect(dest.some(a => a.id === 'cash-1')).toBe(true);
  });

  it('destinationAccounts for CRYPTO_WALLET includes CASH_ACCOUNT and CRYPTO_WALLET only', () => {
    fixture.componentRef.setInput('accountId', 'crypto-1');
    fixture.componentRef.setInput('accountType', 'CRYPTO_WALLET');
    fixture.detectChanges();
    const dest = fixture.componentInstance['destinationAccounts']();
    dest.forEach(a => {
      expect(['CASH_ACCOUNT', 'CRYPTO_WALLET']).toContain(a.accountType);
    });
    expect(dest.some(a => a.id === 'cash-1')).toBe(true);
  });

  // ── showExternalOption ─────────────────────────────────────────────────────

  it('showExternalOption is false for SAVINGS_ACCOUNT', () => {
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showExternalOption']()).toBe(false);
  });

  it('showExternalOption is true for CASH_ACCOUNT', () => {
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showExternalOption']()).toBe(true);
  });

  it('showExternalOption is true for CRYPTO_WALLET', () => {
    fixture.componentRef.setInput('accountType', 'CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['showExternalOption']()).toBe(true);
  });

  it('showExternalOption is false for PEA (investment)', () => {
    expect(fixture.componentInstance['showExternalOption']()).toBe(false);
  });

  // ── linkedCheckingAccount ──────────────────────────────────────────────────

  it('linkedCheckingAccount returns null when no linkedCheckingAccountId', () => {
    expect(fixture.componentInstance['linkedCheckingAccount']()).toBeNull();
  });

  it('linkedCheckingAccount returns linked account for investment with link set', () => {
    accountsSignal.set([mockLinkedAccount, mockCashAccount, mockSavingsAccount, mockCryptoAccount, mockClosedAccount]);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.detectChanges();
    const linked = fixture.componentInstance['linkedCheckingAccount']();
    expect(linked).not.toBeNull();
    expect(linked!.id).toBe('cash-1');
  });

  it('linkedCheckingAccount returns null for non-investment account', () => {
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['linkedCheckingAccount']()).toBeNull();
  });

  // ── peaCapacityInfo ────────────────────────────────────────────────────────

  it('peaCapacityInfo returns totalDeposits and remainingCapacity for investment account', () => {
    const cap = fixture.componentInstance['peaCapacityInfo']();
    expect(cap).not.toBeNull();
    expect(cap!.totalDeposits).toBe(10000);
    expect(cap!.remainingCapacity).toBe(140000);
  });

  it('peaCapacityInfo returns null for non-investment account', () => {
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaCapacityInfo']()).toBeNull();
  });

  // ── auto-set toAccountId for investment TRANSFER ───────────────────────────

  it('auto-sets toAccountId when INVESTMENT + TRANSFER + linked account available', async () => {
    accountsSignal.set([mockLinkedAccount, mockCashAccount, mockSavingsAccount, mockCryptoAccount, mockClosedAccount]);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    await fixture.whenStable();
    const toAccountId = fixture.componentInstance['form'].get('toAccountId')?.value;
    expect(toAccountId).toBe('cash-1');
  });

  it('does not auto-set toAccountId when no linked account', () => {
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    const toAccountId = fixture.componentInstance['form'].get('toAccountId')?.value;
    expect(toAccountId).toBeFalsy();
  });

  // ── Fix 3: typeConfirmed + selectTypeAndConfirm + changeType ───────────────

  it('typeConfirmed is false by default', () => {
    expect(fixture.componentInstance['typeConfirmed']()).toBe(false);
  });

  it('selectTypeAndConfirm sets selectedType and marks typeConfirmed true', () => {
    fixture.componentInstance['selectTypeAndConfirm']('DEPOSIT');
    fixture.detectChanges();
    expect(fixture.componentInstance['selectedType']()).toBe('DEPOSIT');
    expect(fixture.componentInstance['typeConfirmed']()).toBe(true);
  });

  it('changeType resets typeConfirmed to false', () => {
    fixture.componentInstance['selectTypeAndConfirm']('DEPOSIT');
    fixture.componentInstance['changeType']();
    expect(fixture.componentInstance['typeConfirmed']()).toBe(false);
  });

  // ── destinationCapacityInfo ────────────────────────────────────────────────

  it('destinationCapacityInfo returns PEA deposited label when destination is a PEA account', () => {
    fixture.componentRef.setInput('accountId', 'cash-1');
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['form'].patchValue({ toAccountId: 'acc-1' });
    fixture.detectChanges();
    const cap = fixture.componentInstance['destinationCapacityInfo']();
    expect(cap).not.toBeNull();
    expect(cap!.label).toBe('PEA deposited');
    expect(cap!.current).toBe(10000);
    expect(cap!.remaining).toBe(140000);
  });

  it('destinationCapacityInfo returns Balance label when destination is a regulated savings account', () => {
    fixture.componentRef.setInput('accountId', 'cash-1');
    fixture.componentRef.setInput('accountType', 'CASH_ACCOUNT');
    fixture.detectChanges();
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['form'].patchValue({ toAccountId: 'savings-1' });
    fixture.detectChanges();
    const cap = fixture.componentInstance['destinationCapacityInfo']();
    expect(cap).not.toBeNull();
    expect(cap!.label).toBe('Balance');
    expect(cap!.remaining).toBe(19950);
  });

  it('destinationCapacityInfo is null when destination has no deposit limit', () => {
    fixture.componentRef.setInput('accountId', 'savings-1');
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.detectChanges();
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.componentInstance['form'].patchValue({ toAccountId: 'cash-1' });
    fixture.detectChanges();
    expect(fixture.componentInstance['destinationCapacityInfo']()).toBeNull();
  });

  // ── Fix 6: peaTransferForcedClosure + peaTransferBlockedByHoldings ────────

  it('peaTransferForcedClosure is true for PEA <5y + TRANSFER + no holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaTransferForcedClosure']()).toBe(true);
  });

  it('peaTransferForcedClosure is false for PEA <5y + TRANSFER + has holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', true);
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaTransferForcedClosure']()).toBe(false);
  });

  it('peaTransferBlockedByHoldings is true for PEA <5y + TRANSFER + has holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', true);
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaTransferBlockedByHoldings']()).toBe(true);
  });

  it('peaTransferBlockedByHoldings is false for PEA <5y + TRANSFER + no holdings', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();
    expect(fixture.componentInstance['peaTransferBlockedByHoldings']()).toBe(false);
  });

  it('onSubmit emits peaClosureRequested for peaTransferForcedClosure', () => {
    fixture.componentRef.setInput('accountSubType', 'PEA');
    fixture.componentRef.setInput('peaUnder5Years', true);
    fixture.componentRef.setInput('hasHoldings', false);
    fixture.componentRef.setInput('currentBalance', 5000);
    fixture.componentInstance.onTypeChange('TRANSFER');
    fixture.detectChanges();

    const spy = jest.fn();
    fixture.componentInstance.peaClosureRequested.subscribe(spy);
    fixture.componentInstance['onSubmit']();

    expect(spy).toHaveBeenCalled();
    expect(mockService.executeTransfer).not.toHaveBeenCalled();
  });

  // ── minDate / effectiveMinDate ─────────────────────────────────────────────

  it('effectiveMinDate returns account openedAt for non-TRANSFER', () => {
    fixture.componentRef.setInput('account', { ...mockAccount, openedAt: '2020-01-01' });
    fixture.componentInstance.onTypeChange('BUY');
    fixture.detectChanges();
    expect(fixture.componentInstance['effectiveMinDate']()).toBe('2020-01-01');
  });

  it('effectiveMinDate returns max(from, to) openedAt for TRANSFER', () => {
    const destAccount = { ...mockCashAccount, id: 'cash-dest', openedAt: '2021-06-01' };
    fixture.componentRef.setInput('account', { ...mockAccount, openedAt: '2019-03-01' });
    fixture.componentInstance.onTypeChange('TRANSFER');
    // Patch toAccountId AFTER onTypeChange (which resets it to ''), then update the
    // accounts signal so transferMinDate's computed re-evaluates and reads the new value
    fixture.componentInstance['form'].patchValue({ toAccountId: 'cash-dest' });
    accountsSignal.set([
      mockAccount, mockCashAccount, mockSavingsAccount, mockCryptoAccount,
      mockClosedAccount, destAccount,
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance['effectiveMinDate']()).toBe('2021-06-01');
  });

  it('validateDateBeforeSubmit returns false and shows toast when date is before minDate', () => {
    const toastSvc = TestBed.inject(ToastService);
    jest.spyOn(toastSvc, 'error');

    fixture.componentRef.setInput('account', { ...mockAccount, openedAt: '2020-01-01' });
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].get('date')!.setValue('2019-06-01');
    fixture.detectChanges();

    const result = fixture.componentInstance['validateDateBeforeSubmit']();
    expect(result).toBe(false);
    expect(toastSvc.error).toHaveBeenCalled();
  });

  it('validateDateBeforeSubmit returns true for valid date', () => {
    fixture.componentRef.setInput('account', { ...mockAccount, openedAt: '2020-01-01' });
    fixture.componentInstance.onTypeChange('DEPOSIT');
    fixture.componentInstance['form'].get('date')!.setValue('2026-06-15');
    fixture.detectChanges();

    expect(fixture.componentInstance['validateDateBeforeSubmit']()).toBe(true);
  });
});
