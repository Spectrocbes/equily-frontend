import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EditTransactionModalComponent } from './edit-transaction-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { Transaction } from '../../../core/models/account.model';
import { of, throwError } from 'rxjs';

const mockTransaction: Transaction = {
  id: 'tx-1',
  type: 'DEPOSIT',
  ticker: null,
  quantity: null,
  pricePerUnit: null,
  totalAmount: 500,
  currency: 'EUR',
  date: '2024-01-15',
  fees: 0,
  description: 'Test deposit',
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
    fixture.componentRef.setInput('transaction', mockTransaction);
    fixture.detectChanges();
  });

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

  it('calls accountService.updateTransaction on valid submit', () => {
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

    expect(mockToastService.error).toHaveBeenCalledWith('Server error');
    expect(closedSpy).not.toHaveBeenCalled();
  });
});
