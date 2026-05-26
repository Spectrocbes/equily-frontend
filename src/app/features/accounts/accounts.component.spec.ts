import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { AccountsComponent } from './accounts.component';
import { AccountService } from '../../core/services/account.service';
import { signal } from '@angular/core';
import { FinancialAccount } from '../../core/models/account.model';

const mockAccount: FinancialAccount = {
  id: '1',
  name: 'Mon PEA Fortuneo',
  accountType: 'PEA',
  balance: 5250.00,
  currency: 'EUR',
  transactionCount: 3,
};

describe('AccountsComponent', () => {
  let fixture: ComponentFixture<AccountsComponent>;
  let mockAccountService: Partial<AccountService>;

  function createComponent(overrides: Partial<AccountService> = {}) {
    mockAccountService = {
      accounts: signal<FinancialAccount[]>([]),
      loading: signal(false),
      error: signal<string | null>(null),
      totalBalance: signal(0),
      loadAccounts: jest.fn(),
      ...overrides,
    };

    TestBed.configureTestingModule({
      imports: [AccountsComponent],
      providers: [
        { provide: AccountService, useValue: mockAccountService },
      ],
    });

    fixture = TestBed.createComponent(AccountsComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => TestBed.resetTestingModule());

  it('calls loadAccounts on init', () => {
    createComponent();
    expect(mockAccountService.loadAccounts).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no accounts', () => {
    createComponent();
    expect(fixture.nativeElement.textContent).toContain('No accounts yet');
  });

  it('shows loading skeleton when loading', () => {
    createComponent({
      loading: signal(true),
    });
    expect(fixture.nativeElement.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('shows error message when error', () => {
    createComponent({
      error: signal('Failed to load accounts'),
    });
    expect(fixture.nativeElement.textContent).toContain('Failed to load accounts');
  });

  it('displays account card when accounts loaded', () => {
    createComponent({
      accounts: signal<FinancialAccount[]>([mockAccount]),
      totalBalance: signal(5250),
    });
    expect(fixture.nativeElement.textContent).toContain('Mon PEA Fortuneo');
  });

  it('formats account type correctly', () => {
    createComponent({
      accounts: signal<FinancialAccount[]>([mockAccount]),
      totalBalance: signal(5250),
    });
    expect(fixture.nativeElement.textContent).toContain('Plan Épargne Actions');
  });
});
