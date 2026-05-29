import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OverviewComponent } from './overview.component';
import { AccountService } from '../../core/services/account.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AccountSummary } from '../../core/models/account.model';

const mockSummary: AccountSummary = {
  account: {
    id: '1', name: 'Mon PEA', accountType: 'PEA',
    balance: 2698, currency: 'EUR',
    transactionCount: 5, broker: 'Fortuneo',
  },
  totalInvested: 7295,
  totalFeesPaid: 12.30,
};

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            summaries: signal([mockSummary]),
            summariesLoading: signal(false),
            accounts: signal([mockSummary.account]),
            loadSummaries: jest.fn(),
            loadAccounts: jest.fn(),
            modalLoading: signal(false),
            modalError: signal(null),
            createAccount: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewComponent);
    fixture.detectChanges();
  });

  it('uses totalInvested + balance for investment accounts in totalWealth', () => {
    // PEA with balance=2698 and totalInvested=7295 → 7295 + 2698 = 9993
    expect(fixture.componentInstance.totalWealth()).toBe(9993);
  });

  it('shows total wealth', () => {
    expect(fixture.nativeElement.textContent).toContain('9,993');
  });

  it('calls loadSummaries on init', () => {
    const service = TestBed.inject(AccountService);
    expect(service.loadSummaries).toHaveBeenCalled();
  });
});
