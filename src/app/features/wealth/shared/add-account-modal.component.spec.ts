import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AddAccountModalComponent } from './add-account-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';

describe('AddAccountModalComponent', () => {
  let fixture: ComponentFixture<AddAccountModalComponent>;
  let mockAccountService: Partial<AccountService>;
  let mockPrefsService: { currency: WritableSignal<string> };
  let mockToastService: { success: jest.Mock; error: jest.Mock };
  let modalLoadingSignal: WritableSignal<boolean>;

  beforeEach(async () => {
    modalLoadingSignal = signal(false);
    mockAccountService = {
      modalLoading: modalLoadingSignal,
      modalError: signal<string | null>(null),
      createAccount: jest.fn().mockReturnValue(of({ id: 'new-id' })),
    };
    mockPrefsService = { currency: signal('EUR') };
    mockToastService = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AddAccountModalComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: PreferencesService, useValue: mockPrefsService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAccountModalComponent);
    fixture.detectChanges();
  });

  it('renders the form', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('submit button is disabled while modalLoading is true on step 2', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01' });
    fixture.componentInstance['step'].set(2);
    modalLoadingSignal.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
  });

  it('emits closed when cancel is clicked', () => {
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    // Step 1 buttons: [X, broker-toggle, Cancel, Next]
    const cancelBtn = fixture.nativeElement.querySelectorAll('button[type="button"]')[2];
    cancelBtn.click();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('calls createAccount and emits created on valid submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);

    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01' });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
  });

  it('shows openedAt field for PEA account type', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['showOpenedAt']()).toBe(true);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="openedAt"]');
    expect(input).toBeTruthy();
  });

  it('hides openedAt field for SAVINGS_ACCOUNT type', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showOpenedAt']()).toBe(false);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="openedAt"]');
    expect(input).toBeFalsy();
  });

  it('defaults openedAt to today', () => {
    const today = new Date().toISOString().split('T')[0];
    const form = fixture.componentInstance['form'];
    expect(form.get('openedAt')!.value).toBe(today);
  });

  it('shows subType selector when accountType has sub-types', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showSubType']()).toBe(true);
    const select = fixture.nativeElement.querySelector('select[formcontrolname="subType"]');
    expect(select).toBeTruthy();
  });

  it('hides subType selector when accountType has no sub-types', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('REAL_ESTATE');
    fixture.detectChanges();
    expect(fixture.componentInstance['showSubType']()).toBe(false);
    const select = fixture.nativeElement.querySelector('select[formcontrolname="subType"]');
    expect(select).toBeFalsy();
  });

  it('auto-selects subType when only one option is available', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    expect(form.get('subType')!.value).toBe('PEA');
  });

  it('marks subType as required when account type has sub-types', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    form.get('subType')!.setValue(null);
    fixture.detectChanges();
    expect(form.get('subType')!.hasValidator).toBeTruthy();
    expect(form.get('subType')!.invalid).toBe(true);
  });

  it('shows subType validation error on submit with no subType selected', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    form.get('subType')!.setValue(null);
    form.get('name')!.setValue('Test');
    form.get('broker')!.setValue('Fortuneo');
    fixture.detectChanges();
    fixture.componentInstance['nextStep']();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('p.text-rose-500');
    expect(error).toBeTruthy();
  });

  it('initialBalanceCurrency returns EUR for PEA regardless of user preference', () => {
    mockPrefsService.currency.set('USD');
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['initialBalanceCurrency']()).toBe('EUR');
  });

  it('initialBalanceCurrency returns user currency for CRYPTO_WALLET', () => {
    mockPrefsService.currency.set('USD');
    fixture.componentInstance['form'].get('accountType')!.setValue('CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['initialBalanceCurrency']()).toBe('USD');
  });

  it('passes dynamic currency to createAccount', () => {
    mockPrefsService.currency.set('USD');
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'My Crypto', accountType: 'CRYPTO_WALLET', initialBalance: 500, broker: 'Binance', subType: 'CRYPTO_WALLET', openedAt: null });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'USD' })
    );
  });

  it('shows success toast and emits created on successful submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01' });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockToastService.success).toHaveBeenCalledWith('Account created');
    expect(createdSpy).toHaveBeenCalled();
  });

  it('shows plain-string 422 error via toast', () => {
    (mockAccountService.createAccount as jest.Mock).mockReturnValue(
      throwError(() => ({ error: 'PEA deposit limit already reached' }))
    );
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01' });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockToastService.error).toHaveBeenCalledWith('PEA deposit limit already reached');
  });

  it('shows fallback error message when error body is not a string', () => {
    (mockAccountService.createAccount as jest.Mock).mockReturnValue(
      throwError(() => ({ error: { code: 500 }, status: 500 }))
    );
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01' });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockToastService.error).toHaveBeenCalledWith('Failed to create account');
  });
});
