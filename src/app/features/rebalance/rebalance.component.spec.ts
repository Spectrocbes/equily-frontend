import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RebalanceComponent } from './rebalance.component';
import { AccountService } from '../../core/services/account.service';
import { RebalancingService } from '../../core/services/rebalancing.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { FinancialAccount, TargetAllocation, RebalancingSuggestion } from '../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

const makeAccount = (
  overrides: Partial<FinancialAccount> = {}
): FinancialAccount => ({
  id: 'acc-1', name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 1000, currency: 'EUR',
  transactionCount: 2, broker: 'Fortuneo', depositLimit: 150000,
  totalDeposits: 5000, remainingCapacity: 145000, openedAt: null,
  portfolioValue: 5000, status: 'ACTIVE', closedAt: null,
  linkedCheckingAccountId: null, defaultDcaAmount: null,
  ...overrides,
});

describe('RebalanceComponent', () => {
  let fixture: ComponentFixture<RebalanceComponent>;
  let component: RebalanceComponent;
  let rebalancingService: {
    getAllocations: jest.Mock;
    saveAllocations: jest.Mock;
    saveDcaAmount: jest.Mock;
    getSuggestions: jest.Mock;
  };
  let toastService: { error: jest.Mock; success: jest.Mock };
  const accountsSignal = signal<FinancialAccount[]>([]);

  beforeEach(async () => {
    accountsSignal.set([]);
    rebalancingService = {
      getAllocations: jest.fn().mockReturnValue(of([])),
      saveAllocations: jest.fn().mockReturnValue(of(undefined)),
      saveDcaAmount: jest.fn().mockReturnValue(of(undefined)),
      getSuggestions: jest.fn().mockReturnValue(of([])),
    };
    toastService = { error: jest.fn(), success: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [RebalanceComponent],
      providers: [
        provideTestTranslations(),
        {
          provide: AccountService,
          useValue: {
            accounts: accountsSignal.asReadonly(),
            loadAccounts: jest.fn(),
          },
        },
        { provide: RebalancingService, useValue: rebalancingService },
        {
          provide: PreferencesService,
          useValue: {
            currency: signal('EUR'),
            currencySymbol: signal('€'),
          },
        },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RebalanceComponent);
    component = fixture.componentInstance;
    useTestTranslations();
    fixture.detectChanges();
  });

  it('renders the account selector with rebalancable accounts only', () => {
    accountsSignal.set([
      makeAccount({ id: 'a-1', accountType: 'PEA' }),
      makeAccount({ id: 'a-2', accountType: 'SAVINGS_ACCOUNT', subType: 'LIVRET_A' }),
      makeAccount({ id: 'a-3', accountType: 'CRYPTO_WALLET', subType: 'CRYPTO_WALLET' }),
      makeAccount({ id: 'a-4', accountType: 'CASH_ACCOUNT', subType: 'CASH_ACCOUNT' }),
      makeAccount({ id: 'a-5', accountType: 'PEA', status: 'CLOSED' }),
    ]);
    fixture.detectChanges();

    expect(component['rebalancableAccounts']().map(a => a.id)).toEqual(['a-1', 'a-3']);
  });

  it('selectedAccount is null when the selected id matches no rebalancable account', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();

    component.selectAccount('unknown-id');

    expect(component['selectedAccount']()).toBeNull();
  });

  it('editTotal treats a zero percent as 0', () => {
    component['editAllocations'] = [
      { category: 'A', percent: 0 },
      { category: 'B', percent: 40 },
    ];
    expect(component['editTotal']).toBe(40);
  });

  it('saveAllocations does nothing when no account is selected', () => {
    component['editAllocations'] = [{ category: 'France', percent: 100 }];

    component['saveAllocations']();

    expect(rebalancingService.saveAllocations).not.toHaveBeenCalled();
  });

  it('selectAccount loads allocations for the chosen account', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();

    const allocs: TargetAllocation[] = [{ category: 'France', targetPercent: 100 }];
    rebalancingService.getAllocations.mockReturnValue(of(allocs));

    component.selectAccount('a-1');

    expect(rebalancingService.getAllocations).toHaveBeenCalledWith('a-1');
    expect(component['targetAllocations']()).toEqual(allocs);
  });

  it('selectAccount stops the loading spinner when getAllocations errors', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    rebalancingService.getAllocations.mockReturnValue(throwError(() => new Error('boom')));

    component.selectAccount('a-1');

    expect(component['allocationsLoading']()).toBe(false);
  });

  it('enterEditMode prefills from existing target allocations when present', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    rebalancingService.getAllocations.mockReturnValue(
      of([{ category: 'France', targetPercent: 70 }, { category: 'US', targetPercent: 30 }])
    );
    component.selectAccount('a-1');

    component['enterEditMode']();

    expect(component['editAllocations']).toEqual([
      { category: 'France', percent: 70 },
      { category: 'US', percent: 30 },
    ]);
  });

  it('cancelEdit exits edit mode without saving', () => {
    component['editMode'].set(true);
    component['cancelEdit']();
    expect(component['editMode']()).toBe(false);
  });

  it('computeSuggestions stops the loading spinner when getSuggestions errors', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['dcaAmount'].set(300);
    rebalancingService.getSuggestions.mockReturnValue(throwError(() => new Error('boom')));

    component['computeSuggestions']();

    expect(component['suggestionsLoading']()).toBe(false);
  });

  it('enterEditMode prefills default categories for a crypto account', () => {
    accountsSignal.set([makeAccount({
      id: 'c-1', accountType: 'CRYPTO_WALLET', subType: 'CRYPTO_WALLET',
    })]);
    fixture.detectChanges();
    component.selectAccount('c-1');

    component['enterEditMode']();

    expect(component['editAllocations']).toEqual([
      { category: 'BTC', percent: 50 },
      { category: 'ETH', percent: 30 },
      { category: 'SOL', percent: 20 },
    ]);
  });

  it('enterEditMode prefills default categories for an investment account', () => {
    accountsSignal.set([makeAccount({ id: 'a-1', accountType: 'PEA' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');

    component['enterEditMode']();

    expect(component['editAllocations']).toEqual([
      { category: 'United States', percent: 40 },
      { category: 'France', percent: 30 },
      { category: 'Europe', percent: 20 },
      { category: 'Other', percent: 10 },
    ]);
  });

  it('addCategory adds an empty row', () => {
    component['editAllocations'] = [];
    component['addCategory']();
    expect(component['editAllocations']).toEqual([{ category: '', percent: 0 }]);
  });

  it('removeCategory removes the row at the given index', () => {
    component['editAllocations'] = [
      { category: 'A', percent: 50 },
      { category: 'B', percent: 50 },
    ];
    component['removeCategory'](0);
    expect(component['editAllocations']).toEqual([{ category: 'B', percent: 50 }]);
  });

  it('editTotal sums the percent of all rows', () => {
    component['editAllocations'] = [
      { category: 'A', percent: 60 },
      { category: 'B', percent: 25 },
    ];
    expect(component['editTotal']).toBe(85);
  });

  it('saveAllocations shows an error toast when the total is not 100', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['editAllocations'] = [{ category: 'France', percent: 60 }];

    component['saveAllocations']();

    expect(toastService.error).toHaveBeenCalled();
    expect(rebalancingService.saveAllocations).not.toHaveBeenCalled();
  });

  it('saveAllocations calls the service and updates state when total is 100', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['editAllocations'] = [
      { category: 'France', percent: 60 },
      { category: 'US', percent: 40 },
    ];

    component['saveAllocations']();

    expect(rebalancingService.saveAllocations).toHaveBeenCalledWith('a-1', [
      { category: 'France', targetPercent: 60 },
      { category: 'US', targetPercent: 40 },
    ]);
    expect(component['targetAllocations']()).toEqual([
      { category: 'France', targetPercent: 60 },
      { category: 'US', targetPercent: 40 },
    ]);
    expect(component['editMode']()).toBe(false);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('saveAllocations shows the backend error message on failure', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['editAllocations'] = [{ category: 'France', percent: 100 }];
    rebalancingService.saveAllocations.mockReturnValue(
      throwError(() => ({ error: 'Duplicate category' }))
    );

    component['saveAllocations']();

    expect(toastService.error).toHaveBeenCalledWith('Duplicate category');
  });

  it('computeSuggestions calls the service with the entered dcaAmount', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['dcaAmount'].set(500);

    component['computeSuggestions']();

    expect(rebalancingService.getSuggestions).toHaveBeenCalledWith('a-1', 500);
  });

  it('computeSuggestions does nothing when dcaAmount is 0', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['dcaAmount'].set(0);

    component['computeSuggestions']();

    expect(rebalancingService.getSuggestions).not.toHaveBeenCalled();
  });

  it('displays buy/sell suggestion amounts once computed', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    rebalancingService.getAllocations.mockReturnValue(
      of([{ category: 'France', targetPercent: 100 }])
    );
    component.selectAccount('a-1');

    const suggestions: RebalancingSuggestion[] = [
      {
        category: 'France', targetPercent: 60, currentPercent: 50,
        currentValue: 500, deviationPercent: -10, suggestedAmount: 100,
        suggestedTickers: [],
      },
      {
        category: 'US', targetPercent: 40, currentPercent: 50,
        currentValue: 500, deviationPercent: 10, suggestedAmount: -50,
        suggestedTickers: [],
      },
    ];
    rebalancingService.getSuggestions.mockReturnValue(of(suggestions));
    component['dcaAmount'].set(200);
    component['computeSuggestions']();
    fixture.detectChanges();

    expect(component['suggestions']()).toEqual(suggestions);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('France');
    expect(text).toContain('US');
  });

  it('displays suggestedTickers for a suggestion with a positive amount', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    rebalancingService.getAllocations.mockReturnValue(
      of([{ category: 'France', targetPercent: 100 }])
    );
    component.selectAccount('a-1');

    const suggestions: RebalancingSuggestion[] = [
      {
        category: 'France', targetPercent: 60, currentPercent: 50,
        currentValue: 500, deviationPercent: -10, suggestedAmount: 100,
        suggestedTickers: ['CW8', 'ESE'],
      },
    ];
    rebalancingService.getSuggestions.mockReturnValue(of(suggestions));
    component['dcaAmount'].set(200);
    component['computeSuggestions']();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CW8');
    expect(text).toContain('ESE');
  });

  it('selectAccount uses the account defaultDcaAmount when set', () => {
    accountsSignal.set([makeAccount({ id: 'a-1', defaultDcaAmount: 250 })]);
    fixture.detectChanges();

    component.selectAccount('a-1');

    expect(component['dcaAmount']()).toBe(250);
  });

  it('selectAccount defaults dcaAmount to 0 when the account has no default', () => {
    accountsSignal.set([makeAccount({ id: 'a-1', defaultDcaAmount: null })]);
    fixture.detectChanges();

    component.selectAccount('a-1');

    expect(component['dcaAmount']()).toBe(0);
  });

  it('availableCategories returns crypto tokens for a CRYPTO_WALLET account', () => {
    accountsSignal.set([makeAccount({
      id: 'c-1', accountType: 'CRYPTO_WALLET', subType: 'CRYPTO_WALLET',
    })]);
    fixture.detectChanges();
    component.selectAccount('c-1');

    expect(component['availableCategories']()).toEqual([
      'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT',
      'AVAX', 'LINK', 'MATIC', 'UNI', 'Other',
    ]);
  });

  it('availableCategories returns regions for an investment account', () => {
    accountsSignal.set([makeAccount({ id: 'a-1', accountType: 'PEA' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');

    expect(component['availableCategories']()).toEqual([
      'United States', 'France', 'Germany',
      'United Kingdom', 'Netherlands', 'Italy',
      'Belgium', 'Switzerland', 'Europe', 'Asia',
      'Emerging Markets', 'Other',
    ]);
  });

  it('unusedCategories excludes categories already selected in editAllocations', () => {
    accountsSignal.set([makeAccount({ id: 'a-1', accountType: 'PEA' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['editAllocations'] = [
      { category: 'France', percent: 50 },
      { category: 'Europe', percent: 50 },
    ];

    expect(component['unusedCategories']()).not.toContain('France');
    expect(component['unusedCategories']()).not.toContain('Europe');
    expect(component['unusedCategories']()).toContain('United States');
  });

  it('onDcaFocus clears a 0 value and selects the input text', () => {
    const input = document.createElement('input');
    input.value = '0';
    input.select = jest.fn();
    const event = { target: input } as unknown as FocusEvent;

    component['onDcaFocus'](event);

    expect(input.value).toBe('');
    expect(input.select).toHaveBeenCalled();
  });

  it('onDcaFocus leaves a non-zero value untouched', () => {
    const input = document.createElement('input');
    input.value = '150';
    input.select = jest.fn();
    const event = { target: input } as unknown as FocusEvent;

    component['onDcaFocus'](event);

    expect(input.value).toBe('150');
  });

  it('onDcaBlur resets to 0 when the input is left empty', () => {
    const input = document.createElement('input');
    input.value = '';
    const event = { target: input } as unknown as FocusEvent;

    component['onDcaBlur'](event);

    expect(input.value).toBe('0');
    expect(component['dcaAmount']()).toBe(0);
  });

  it('onDcaBlur leaves a filled-in value untouched', () => {
    component['dcaAmount'].set(300);
    const input = document.createElement('input');
    input.value = '300';
    const event = { target: input } as unknown as FocusEvent;

    component['onDcaBlur'](event);

    expect(input.value).toBe('300');
    expect(component['dcaAmount']()).toBe(300);
  });

  it('saveDcaAmount calls the service with the current amount', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    component['dcaAmount'].set(400);

    component['saveDcaAmount']();

    expect(rebalancingService.saveDcaAmount).toHaveBeenCalledWith('a-1', 400);
    expect(toastService.success).toHaveBeenCalled();
  });

  it('saveDcaAmount does nothing when no account is selected', () => {
    component['saveDcaAmount']();
    expect(rebalancingService.saveDcaAmount).not.toHaveBeenCalled();
  });

  it('saveDcaAmount shows an error toast on failure', () => {
    accountsSignal.set([makeAccount({ id: 'a-1' })]);
    fixture.detectChanges();
    component.selectAccount('a-1');
    rebalancingService.saveDcaAmount.mockReturnValue(throwError(() => new Error('boom')));

    component['saveDcaAmount']();

    expect(toastService.error).toHaveBeenCalled();
  });
});
