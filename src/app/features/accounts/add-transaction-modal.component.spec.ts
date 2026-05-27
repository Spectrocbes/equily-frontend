import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AddTransactionModalComponent } from './add-transaction-modal.component';
import { AccountService } from '../../core/services/account.service';
import { Signal, signal } from '@angular/core';
import { of } from 'rxjs';

describe('AddTransactionModalComponent', () => {
  let fixture: ComponentFixture<AddTransactionModalComponent>;
  let mockService: Partial<AccountService>;

  beforeEach(async () => {
    mockService = {
      modalLoading: signal(false) as Signal<boolean>,
      modalError: signal<string | null>(null) as Signal<string | null>,
      recordTransaction: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [AddTransactionModalComponent],
      providers: [{ provide: AccountService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTransactionModalComponent);
    fixture.componentRef.setInput('accountId', 'acc-1');
    fixture.componentRef.setInput('accountType', 'PEA');
    fixture.detectChanges();
  });

  it('renders all allowed types for PEA', () => {
    const text = fixture.nativeElement.textContent;
    ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'].forEach(t =>
      expect(text).toContain(t)
    );
  });

  it('renders only DEPOSIT and WITHDRAWAL for SAVINGS_ACCOUNT', async () => {
    fixture.componentRef.setInput('accountType', 'SAVINGS_ACCOUNT');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('DEPOSIT');
    expect(text).toContain('WITHDRAWAL');
    expect(text).not.toContain('BUY');
  });

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
});
