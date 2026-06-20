import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EditTransactionModalComponent } from './edit-transaction-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { Transaction } from '../../../core/models/account.model';
import { of, throwError } from 'rxjs';

const depositTransaction: Transaction = {
  id: 'tx-1',
  type: 'DEPOSIT',
  ticker: null,
  quantity: null,
  pricePerUnit: null,
  totalAmount: 500,
  totalAmountNative: 500,
  nativeCurrency: 'EUR',
  date: '2024-01-15',
  fees: 0,
  feesNative: 0,
  description: 'Test deposit',
  transferId: null,
  linkedAccountId: null,
  externalAddress: null,
  transferDirection: null,
};

const buyTransaction: Transaction = {
  id: 'tx-2',
  type: 'BUY',
  ticker: 'AAPL',
  quantity: 10,
  pricePerUnit: 100,
  totalAmount: 1005,
  totalAmountNative: 1005,
  nativeCurrency: 'EUR',
  date: '2024-01-15',
  fees: 5,
  feesNative: 5,
  description: null,
  transferId: null,
  linkedAccountId: null,
  externalAddress: null,
  transferDirection: null,
};

const sellTransaction: Transaction = {
  id: 'tx-3',
  type: 'SELL',
  ticker: 'AAPL',
  quantity: 10,
  pricePerUnit: 100,
  totalAmount: 995,
  totalAmountNative: 995,
  nativeCurrency: 'EUR',
  date: '2024-01-15',
  fees: 5,
  feesNative: 5,
  description: null,
  transferId: null,
  linkedAccountId: null,
  externalAddress: null,
  transferDirection: null,
};

const interestTransaction: Transaction = {
  id: 'tx-4',
  type: 'INTEREST',
  ticker: null,
  quantity: null,
  pricePerUnit: null,
  totalAmount: 0,
  totalAmountNative: 0,
  nativeCurrency: 'EUR',
  date: '2024-01-15',
  fees: 0,
  feesNative: 0,
  description: null,
  transferId: null,
  linkedAccountId: null,
  externalAddress: null,
  transferDirection: null,
};

describe('EditTransactionModalComponent', () => {
  let fixture: ComponentFixture<EditTransactionModalComponent>;
  let mockAccountService: Partial<AccountService>;
  let mockToastService: Partial<ToastService>;

  beforeEach(async () => {
    mockAccountService = {
      updateTransaction: jest.fn().mockReturnValue(of(undefined)),
    };
    mockToastService = {
      success: jest.fn(),
      error: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EditTransactionModalComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTransactionModalComponent);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.componentRef.setInput('transaction', depositTransaction);
    fixture.detectChanges();
  });

  // ── DEPOSIT (base cases) ────────────────────────────────────────────────────

  it('renders with transaction data pre-filled', () => {
    const form = fixture.componentInstance['form']();
    expect(form.get('totalAmount')!.value).toBe(500);
    expect(form.get('date')!.value).toBe('2024-01-15');
    expect(form.get('fees')!.value).toBe(0);
    expect(form.get('description')!.value).toBe('Test deposit');
  });

  it('shows type as read-only badge', () => {
    const badge = fixture.nativeElement.querySelector('span.inline-flex');
    expect(badge.textContent).toContain('DEPOSIT');
  });

  it('shows totalAmount field for DEPOSIT transaction', () => {
    const amountInput = fixture.nativeElement.querySelector('input[formcontrolname="totalAmount"]');
    expect(amountInput).not.toBeNull();
    const qtyInput = fixture.nativeElement.querySelector('input[formcontrolname="quantity"]');
    expect(qtyInput).toBeNull();
  });

  it('sends totalAmount for DEPOSIT on submit', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.updateTransaction).toHaveBeenCalledWith(
      'acc-1',
      'tx-1',
      expect.objectContaining({ totalAmount: 500, date: '2024-01-15', fees: 0 })
    );
  });

  it('emits updated and closed on success', () => {
    const updatedSpy = jest.fn();
    const closedSpy  = jest.fn();
    fixture.componentInstance.updated.subscribe(updatedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(updatedSpy).toHaveBeenCalled();
    expect(closedSpy).toHaveBeenCalled();
    expect(mockToastService.success).toHaveBeenCalledWith('Transaction updated successfully');
  });

  it('shows toast error and keeps modal open on failure', () => {
    (mockAccountService.updateTransaction as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'Server error' }))
    );
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));

    expect(mockToastService.error).toHaveBeenCalledWith('Failed to update transaction. Please try again.');
    expect(closedSpy).not.toHaveBeenCalled();
  });

  // ── BUY transaction ─────────────────────────────────────────────────────────

  describe('BUY transaction', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(EditTransactionModalComponent);
      fixture.componentRef.setInput('accountId', 'acc-1');
      fixture.componentRef.setInput('transaction', buyTransaction);
      fixture.detectChanges();
    });

    it('shows quantity + pricePerUnit fields for BUY transaction', () => {
      const qtyInput   = fixture.nativeElement.querySelector('input[formcontrolname="quantity"]');
      const priceInput = fixture.nativeElement.querySelector('input[formcontrolname="pricePerUnit"]');
      expect(qtyInput).not.toBeNull();
      expect(priceInput).not.toBeNull();
      const amountInput = fixture.nativeElement.querySelector('input[formcontrolname="totalAmount"]');
      expect(amountInput).toBeNull();
    });

    it('computedTotal = qty × price + fees for BUY', () => {
      const total = fixture.componentInstance['computedTotal']();
      expect(total).toBe(10 * 100 + 5); // 1005
    });

    it('sends quantity + pricePerUnit (not totalAmount) for BUY on submit', () => {
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
      const calls = (mockAccountService.updateTransaction as jest.Mock).mock.calls;
      expect(calls.length).toBe(1);
      const payload = calls[0][2];
      expect(payload).toMatchObject({ quantity: 10, pricePerUnit: 100, fees: 5, date: '2024-01-15' });
      expect(payload.totalAmount).toBeUndefined();
    });
  });

  // ── SELL transaction ─────────────────────────────────────────────────────────

  describe('SELL transaction', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(EditTransactionModalComponent);
      fixture.componentRef.setInput('accountId', 'acc-1');
      fixture.componentRef.setInput('transaction', sellTransaction);
      fixture.detectChanges();
    });

    it('shows quantity + pricePerUnit fields for SELL transaction', () => {
      const qtyInput   = fixture.nativeElement.querySelector('input[formcontrolname="quantity"]');
      const priceInput = fixture.nativeElement.querySelector('input[formcontrolname="pricePerUnit"]');
      expect(qtyInput).not.toBeNull();
      expect(priceInput).not.toBeNull();
      const amountInput = fixture.nativeElement.querySelector('input[formcontrolname="totalAmount"]');
      expect(amountInput).toBeNull();
    });

    it('computedTotal = qty × price - fees for SELL', () => {
      const total = fixture.componentInstance['computedTotal']();
      expect(total).toBe(10 * 100 - 5); // 995
    });
  });

  // ── Missing qty / price ──────────────────────────────────────────────────────

  it('computedTotal is 0 when quantity or price is missing', () => {
    const buyNoQty: Transaction = {
      ...depositTransaction,
      id: 'tx-5',
      type: 'BUY',
      ticker: 'AAPL',
      quantity: null,
      pricePerUnit: null,
      totalAmount: 0,
    };
    const tempFixture = TestBed.createComponent(EditTransactionModalComponent);
    tempFixture.componentRef.setInput('accountId', 'acc-1');
    tempFixture.componentRef.setInput('transaction', buyNoQty);
    tempFixture.detectChanges();
    expect(tempFixture.componentInstance['computedTotal']()).toBe(0);
  });

  // ── INTEREST transaction ─────────────────────────────────────────────────────

  it('DIAGNOSTIC: INTEREST form state', () => {
    const interestFixture = TestBed.createComponent(EditTransactionModalComponent);
    interestFixture.componentRef.setInput('accountId', 'acc-1');
    interestFixture.componentRef.setInput('transaction', interestTransaction);
    interestFixture.detectChanges();

    const comp = interestFixture.componentInstance;
    const f = comp['form']();

    console.log('isSimpleAmount:', comp['isSimpleAmount']());
    console.log('isBuyOrSell:', comp['isBuyOrSell']());
    console.log('form.valid:', f.valid);
    console.log('form.invalid:', f.invalid);
    console.log('totalAmount value:', f.get('totalAmount')?.value);
    console.log('date value:', f.get('date')?.value);
    console.log('fees value:', f.get('fees')?.value, '/ valid:', f.get('fees')?.valid, '/ errors:', f.get('fees')?.errors);
    Object.keys(f.controls).forEach(key => {
      const ctrl = f.get(key);
      if (ctrl?.invalid) console.log(`  INVALID: ${key} value=${ctrl.value} errors=`, ctrl.errors);
    });

    expect(true).toBe(true);
  });

  it('shows error toast when INTEREST amount is 0', () => {
    const interestFixture = TestBed.createComponent(EditTransactionModalComponent);
    interestFixture.componentRef.setInput('accountId', 'acc-1');
    interestFixture.componentRef.setInput('transaction', interestTransaction);
    interestFixture.detectChanges();

    // Call onSubmit directly (protected method via bracket access)
    interestFixture.componentInstance['onSubmit']();
    expect(mockToastService.error).toHaveBeenCalledWith('Amount must be greater than zero');
    expect(mockAccountService.updateTransaction).not.toHaveBeenCalled();
  });
});
