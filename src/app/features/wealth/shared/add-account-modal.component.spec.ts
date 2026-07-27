import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AddAccountModalComponent } from './add-account-modal.component';
import { AccountService } from '../../../core/services/account.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { signal, WritableSignal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { FinancialAccount } from '../../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../../testing/translate-testing';

const mockCheckingAccount: FinancialAccount = {
  id: 'cash-1', name: 'Mon Compte Courant', accountType: 'CASH_ACCOUNT',
  subType: 'CASH_ACCOUNT', balance: 5000, currency: 'EUR', transactionCount: 0,
  broker: 'BNP', depositLimit: null, totalDeposits: null, remainingCapacity: null,
  openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null,
};

describe('AddAccountModalComponent', () => {
  let fixture: ComponentFixture<AddAccountModalComponent>;
  let mockAccountService: Partial<AccountService>;
  let mockPrefsService: { currency: WritableSignal<string> };
  let mockToastService: { success: jest.Mock; error: jest.Mock };
  let modalLoadingSignal: WritableSignal<boolean>;
  let accountsSignal: WritableSignal<FinancialAccount[]>;

  beforeEach(async () => {
    modalLoadingSignal = signal(false);
    accountsSignal = signal<FinancialAccount[]>([]);
    mockAccountService = {
      modalLoading: modalLoadingSignal,
      modalError: signal<string | null>(null),
      createAccount: jest.fn().mockReturnValue(of({ id: 'new-id' })),
      accounts: accountsSignal,
    };
    mockPrefsService = { currency: signal('EUR') };
    mockToastService = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [AddAccountModalComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
        { provide: PreferencesService, useValue: mockPrefsService },
        { provide: ToastService, useValue: mockToastService },
        provideTestTranslations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAccountModalComponent);
    useTestTranslations();
    fixture.detectChanges();
  });

  it('renders the form', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('submit button is disabled while modalLoading is true on step 2', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01', linkedCheckingAccountId: null });
    fixture.componentInstance['step'].set(2);
    modalLoadingSignal.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
  });

  it('emits closed when cancel is clicked', () => {
    const closedSpy = jest.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]') as NodeListOf<HTMLButtonElement>);
    const cancelBtn = buttons.find(b => b.textContent?.trim() === 'Cancel');
    cancelBtn!.click();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('calls createAccount and emits created on valid submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);

    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01', linkedCheckingAccountId: null });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalled();
    expect(createdSpy).toHaveBeenCalled();
  });

  it('openedAt date picker always visible regardless of account type', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-date-picker')).toBeTruthy();

    fixture.componentInstance['form'].get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-date-picker')).toBeTruthy();

    fixture.componentInstance['form'].get('accountType')!.setValue('CASH_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-date-picker')).toBeTruthy();
  });

  it('defaults openedAt to today', () => {
    const today = new Date().toISOString().split('T')[0];
    const form = fixture.componentInstance['form'];
    expect(form.get('openedAt')!.value).toBe(today);
  });

  it('nextStep does not advance when SAVINGS_ACCOUNT has no subType', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    form.get('subType')!.setValue(null);
    form.get('name')!.setValue('My Livret');
    form.get('broker')!.setValue('Crédit Agricole');
    fixture.detectChanges();
    fixture.componentInstance['nextStep']();
    expect(fixture.componentInstance['step']()).toBe(1);
  });

  it('nextStep advances for CASH_ACCOUNT (subType auto-selected)', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('CASH_ACCOUNT');
    form.get('name')!.setValue('Mon Compte');
    form.get('broker')!.setValue('BNP Paribas');
    fixture.detectChanges();
    fixture.componentInstance['nextStep']();
    expect(fixture.componentInstance['step']()).toBe(2);
  });

  it('includes openedAt in createAccount payload', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 0, broker: 'Fortuneo', subType: 'PEA', openedAt: '2019-03-10', linkedCheckingAccountId: null });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ openedAt: '2019-03-10' })
    );
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
    form.setValue({ name: 'My Crypto', accountType: 'CRYPTO_WALLET', initialBalance: 500, broker: 'Binance', subType: 'CRYPTO_WALLET', openedAt: '2020-01-01', linkedCheckingAccountId: null });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'USD' })
    );
  });

  it('trims leading/trailing whitespace from name before submit', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({
      name: '  Test PEA  ', accountType: 'PEA', initialBalance: 1000,
      broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01',
      linkedCheckingAccountId: null,
    });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test PEA' })
    );
  });

  it('shows success toast and emits created on successful submit', () => {
    const createdSpy = jest.fn();
    fixture.componentInstance.created.subscribe(createdSpy);
    const form = fixture.componentInstance['form'];
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01', linkedCheckingAccountId: null });
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
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01', linkedCheckingAccountId: null });
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
    form.setValue({ name: 'Test PEA', accountType: 'PEA', initialBalance: 1000, broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01', linkedCheckingAccountId: null });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockToastService.error).toHaveBeenCalledWith('Failed to create account');
  });

  // ── PEA linked checking account ────────────────────────────────────────────

  it('isPeaSubType returns true for PEA subType', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['isPeaSubType']()).toBe(true);
  });

  it('isPeaSubType returns true for PEA_PME subType', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA_PME');
    fixture.detectChanges();
    expect(fixture.componentInstance['isPeaSubType']()).toBe(true);
  });

  it('isPeaSubType returns false for SAVINGS_ACCOUNT', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['isPeaSubType']()).toBe(false);
  });

  it('shows linked account selector when isPeaSubType and checking accounts exist', () => {
    accountsSignal.set([mockCheckingAccount]);
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select[formcontrolname="linkedCheckingAccountId"]');
    expect(select).toBeTruthy();
  });

  it('shows warning when isPeaSubType and no checking accounts available', () => {
    accountsSignal.set([]);
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No checking account found');
  });

  it('does not show linked account field for non-PEA account', () => {
    accountsSignal.set([mockCheckingAccount]);
    fixture.componentInstance['form'].get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select[formcontrolname="linkedCheckingAccountId"]');
    expect(select).toBeFalsy();
  });

  it('linkedCheckingAccountId is included in createAccount payload', () => {
    accountsSignal.set([mockCheckingAccount]);
    const form = fixture.componentInstance['form'];
    form.setValue({
      name: 'Test PEA', accountType: 'PEA', initialBalance: 0,
      broker: 'Fortuneo', subType: 'PEA', openedAt: '2020-01-01',
      linkedCheckingAccountId: 'cash-1',
    });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ linkedCheckingAccountId: 'cash-1' })
    );
  });

  it('linkedCheckingAccountId is null when not set', () => {
    const form = fixture.componentInstance['form'];
    form.setValue({
      name: 'Test CTO', accountType: 'COMPTE_TITRES', initialBalance: 0,
      broker: 'Fortuneo', subType: 'COMPTE_TITRES', openedAt: '2020-01-01',
      linkedCheckingAccountId: null,
    });
    fixture.componentInstance['step'].set(2);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(mockAccountService.createAccount).toHaveBeenCalledWith(
      expect.objectContaining({ linkedCheckingAccountId: null })
    );
  });

  // ── Initial balance visibility (Fix 5) ────────────────────────────────────

  it('shows initial balance field for CASH_ACCOUNT', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('CASH_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showInitialBalance']()).toBe(true);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="initialBalance"]');
    expect(input).toBeTruthy();
  });

  it('hides initial balance field for INVESTMENT_ACCOUNT types', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    expect(fixture.componentInstance['showInitialBalance']()).toBe(false);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="initialBalance"]');
    expect(input).toBeFalsy();
  });

  it('hides initial balance field for SAVINGS_ACCOUNT', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(fixture.componentInstance['showInitialBalance']()).toBe(false);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="initialBalance"]');
    expect(input).toBeFalsy();
  });

  it('hides initial balance field for CRYPTO_WALLET', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['showInitialBalance']()).toBe(false);
    const input = fixture.nativeElement.querySelector('input[formcontrolname="initialBalance"]');
    expect(input).toBeFalsy();
  });

  it('resets initialBalance to 0 when switching away from CASH_ACCOUNT', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('CASH_ACCOUNT');
    form.get('initialBalance')!.setValue(500);
    fixture.detectChanges();
    form.get('accountType')!.setValue('SAVINGS_ACCOUNT');
    fixture.detectChanges();
    expect(form.get('initialBalance')!.value).toBe(0);
  });

  // ── broker list by account category ────────────────────────────────────────

  it('availableBrokers returns CRYPTO list for CRYPTO_WALLET', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('CRYPTO_WALLET');
    fixture.detectChanges();
    const brokers = fixture.componentInstance['availableBrokers']();
    expect(brokers.some(b => b.value === 'Binance')).toBe(true);
    expect(brokers.some(b => b.value === 'BNP Paribas')).toBe(false);
    expect(brokers.some(b => b.value === 'Other')).toBe(true);
  });

  it('availableBrokers returns TRADITIONAL list for other types', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    const brokers = fixture.componentInstance['availableBrokers']();
    expect(brokers.some(b => b.value === 'BNP Paribas')).toBe(true);
    expect(brokers.some(b => b.value === 'Binance')).toBe(false);
    expect(brokers.some(b => b.value === 'Other')).toBe(true);
  });

  it('broker resets when accountType changes', () => {
    const form = fixture.componentInstance['form'];
    form.get('accountType')!.setValue('PEA');
    form.get('broker')!.setValue('Fortuneo');
    fixture.detectChanges();
    expect(form.get('broker')!.value).toBe('Fortuneo');

    form.get('accountType')!.setValue('CRYPTO_WALLET');
    fixture.detectChanges();
    expect(form.get('broker')!.value).toBe('');
  });

  it('brokerDropdownOpen closes when accountType changes', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    fixture.detectChanges();
    fixture.componentInstance['form'].get('accountType')!.setValue('CRYPTO_WALLET');
    fixture.detectChanges();
    expect(fixture.componentInstance['brokerDropdownOpen']()).toBe(false);
  });

  it('selectBroker sets the form value and closes the dropdown', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    fixture.componentInstance['selectBroker']('Fortuneo');
    fixture.detectChanges();
    expect(fixture.componentInstance['form'].get('broker')!.value).toBe('Fortuneo');
    expect(fixture.componentInstance['brokerDropdownOpen']()).toBe(false);
  });

  it('selectedBrokerLabel resolves the label for the selected broker value', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['selectBroker']('Fortuneo');
    fixture.detectChanges();
    expect(fixture.componentInstance['selectedBrokerLabel']()).toBe('Fortuneo');
  });

  it('selectedBrokerLabel is null when no broker selected', () => {
    expect(fixture.componentInstance['selectedBrokerLabel']()).toBeNull();
  });

  it('renders the broker dropdown trigger button, not a native select', () => {
    expect(fixture.nativeElement.querySelector('select[formcontrolname="broker"]')).toBeNull();
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button[type="button"]')
    );
    expect(buttons.some(b => b.textContent?.includes('— Select broker —'))).toBe(true);
  });

  it('clicking the broker trigger opens the options panel', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.detectChanges();
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button[type="button"]')
    );
    const trigger = buttons.find(b => b.textContent?.includes('— Select broker —'));
    trigger!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['brokerDropdownOpen']()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Fortuneo');
  });

  // ── broker search filter ─────────────────────────────────────────────────────

  it('filteredBrokers filters by label', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerSearch'].set('bnp');
    fixture.detectChanges();
    const results = fixture.componentInstance['filteredBrokers']();
    expect(results.map(b => b.value)).toEqual(['BNP Paribas']);
  });

  it('filteredBrokers keeps Other visible when the search matches "other"', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerSearch'].set('oth');
    fixture.detectChanges();
    const results = fixture.componentInstance['filteredBrokers']();
    expect(results.map(b => b.value)).toEqual(['Other']);
  });

  it('filteredBrokers shows only Other when search matches nothing else', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerSearch'].set('zzzzz');
    fixture.detectChanges();
    expect(fixture.componentInstance['filteredBrokers']()).toEqual([]);
  });

  it('closeBrokerDropdown resets search text', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerSearch'].set('bnp');
    fixture.componentInstance['closeBrokerDropdown']();
    expect(fixture.componentInstance['brokerSearch']()).toBe('');
  });

  // ── broker dropdown keyboard navigation ───────────────────────────────────────

  function brokerKeyEvent(key: string): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, cancelable: true });
  }

  it('onBrokerKeyDown does nothing when dropdown is closed', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(false);
    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('ArrowDown'));
    expect(fixture.componentInstance['brokerHighlightedIndex']()).toBe(-1);
  });

  it('ArrowDown moves brokerHighlightedIndex forward and clamps at the last option', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    const count = fixture.componentInstance['filteredBrokers']().length;

    for (let n = 0; n < count + 2; n++) {
      fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('ArrowDown'));
    }
    expect(fixture.componentInstance['brokerHighlightedIndex']()).toBe(count - 1);
  });

  it('ArrowUp moves brokerHighlightedIndex backward and clamps at 0', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    fixture.componentInstance['brokerHighlightedIndex'].set(2);

    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('ArrowUp'));
    expect(fixture.componentInstance['brokerHighlightedIndex']()).toBe(1);

    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('ArrowUp'));
    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('ArrowUp'));
    expect(fixture.componentInstance['brokerHighlightedIndex']()).toBe(0);
  });

  it('Enter selects the highlighted broker', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    fixture.componentInstance['brokerHighlightedIndex'].set(0);
    const firstBroker = fixture.componentInstance['filteredBrokers']()[0];

    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('Enter'));

    expect(fixture.componentInstance['form'].get('broker')!.value).toBe(firstBroker.value);
    expect(fixture.componentInstance['brokerDropdownOpen']()).toBe(false);
  });

  it('Enter does nothing when no broker is highlighted', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);

    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('Enter'));

    expect(fixture.componentInstance['form'].get('broker')!.value).toBe('');
  });

  it('Escape closes the broker dropdown', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);

    fixture.componentInstance['onBrokerKeyDown'](brokerKeyEvent('Escape'));

    expect(fixture.componentInstance['brokerDropdownOpen']()).toBe(false);
  });

  it('onBrokerSearchInput updates search text and resets brokerHighlightedIndex', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerHighlightedIndex'].set(3);

    fixture.componentInstance['onBrokerSearchInput']('bnp');

    expect(fixture.componentInstance['brokerSearch']()).toBe('bnp');
    expect(fixture.componentInstance['brokerHighlightedIndex']()).toBe(-1);
  });

  it('highlighted broker option gets the highlight class', () => {
    fixture.componentInstance['form'].get('accountType')!.setValue('PEA');
    fixture.componentInstance['brokerDropdownOpen'].set(true);
    fixture.componentInstance['brokerHighlightedIndex'].set(1);
    fixture.detectChanges();

    const el: HTMLElement | null = fixture.nativeElement.querySelector('#broker-option-1');
    expect(el).toBeTruthy();
    expect(el!.className).toContain('bg-primary-50');
  });
});
