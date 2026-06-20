import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OverviewComponent } from './overview.component';
import { AccountService } from '../../core/services/account.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AccountSummary, FinancialAccount, AccountPortfolioSummary } from '../../core/models/account.model';

const peaAccount: FinancialAccount = {
  id: '1', name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 2698, currency: 'EUR',
  transactionCount: 5, broker: 'Fortuneo',
  depositLimit: 150000, totalDeposits: 2698, remainingCapacity: 147302,
  openedAt: null, portfolioValue: 7295,
  status: 'ACTIVE', closedAt: null, linkedCheckingAccountId: null,
};

const mockSummary: AccountSummary = {
  account: peaAccount,
  totalInvested: 7295,
  totalFeesPaid: 12.30,
};

const makePortfolioSummary = (
  accountId: string,
  livePortfolioValue: number,
): AccountPortfolioSummary => ({
  accountId,
  livePortfolioValue,
  costPortfolioValue: 7295,
  unrealizedPnl: livePortfolioValue - 7295,
  unrealizedPnlPct: ((livePortfolioValue - 7295) / 7295) * 100,
  priceAvailable: true,
});

describe('OverviewComponent', () => {
  let fixture: ComponentFixture<OverviewComponent>;
  const accountsSignal = signal<FinancialAccount[]>([peaAccount]);
  const portfolioSummariesSignal = signal<AccountPortfolioSummary[]>([]);

  beforeEach(async () => {
    accountsSignal.set([peaAccount]);
    portfolioSummariesSignal.set([]);

    await TestBed.configureTestingModule({
      imports: [OverviewComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: AccountService,
          useValue: {
            summaries: signal([mockSummary]),
            summariesLoading: signal(false),
            accounts: accountsSignal.asReadonly(),
            portfolioSummaries: portfolioSummariesSignal.asReadonly(),
            loadSummaries: jest.fn(),
            loadAccounts: jest.fn(),
            loadPortfolioSummaries: jest.fn(),
            getPortfolioSummary: (id: string) =>
              portfolioSummariesSignal().find(s => s.accountId === id),
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

  it('totalWealth falls back to portfolioValue when no summary available', () => {
    // PEA: portfolioValue=7295 + balance=2698 = 9993
    expect(fixture.componentInstance.totalWealth()).toBe(9993);
  });

  it('shows total wealth', () => {
    expect(fixture.nativeElement.textContent).toContain('9,993');
  });

  it('calls loadSummaries on init', () => {
    const service = TestBed.inject(AccountService);
    expect(service.loadSummaries).toHaveBeenCalled();
  });

  it('calls loadPortfolioSummaries on init', () => {
    const service = TestBed.inject(AccountService);
    expect(service.loadPortfolioSummaries).toHaveBeenCalled();
  });

  it('totalWealth uses livePortfolioValue when summary available', () => {
    portfolioSummariesSignal.set([makePortfolioSummary('1', 8500)]);
    fixture.detectChanges();
    // PEA: livePortfolioValue=8500 + balance=2698 = 11198
    expect(fixture.componentInstance.totalWealth()).toBe(11198);
  });
});
