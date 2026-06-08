import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InvestmentsComponent } from './investments.component';
import { AccountService } from '../../../core/services/account.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { FinancialAccount, AccountPortfolioSummary } from '../../../core/models/account.model';

interface InvestmentsComponentPublic {
  liveValue: (accountId: string) => number;
  isPriceAvailable: (accountId: string) => boolean;
}

const makeAccount = (id: string, portfolioValue: number | null): FinancialAccount => ({
  id, name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 1000, currency: 'EUR',
  transactionCount: 2, broker: 'Fortuneo', depositLimit: 150000,
  totalDeposits: 5000, remainingCapacity: 145000, openedAt: null,
  portfolioValue,
});

const makeSummary = (
  accountId: string,
  livePortfolioValue: number,
  priceAvailable: boolean,
): AccountPortfolioSummary => ({
  accountId,
  livePortfolioValue,
  costPortfolioValue: 5000,
  unrealizedPnl: 500,
  unrealizedPnlPct: 10,
  priceAvailable,
});

describe('InvestmentsComponent', () => {
  let fixture: ComponentFixture<InvestmentsComponent>;
  const accountsSignal = signal<FinancialAccount[]>([]);
  const summariesSignal = signal<AccountPortfolioSummary[]>([]);

  beforeEach(async () => {
    accountsSignal.set([]);
    summariesSignal.set([]);

    await TestBed.configureTestingModule({
      imports: [InvestmentsComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            accounts: accountsSignal.asReadonly(),
            portfolioSummaries: summariesSignal.asReadonly(),
            loadAccounts: jest.fn(),
            loadPortfolioSummaries: jest.fn(),
            getPeaSummary: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
            getPortfolioSummary: (id: string) =>
              summariesSignal().find(s => s.accountId === id),
            modalLoading: signal(false),
            modalError: signal(null),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentsComponent);
  });

  it('liveValue returns livePortfolioValue from summary when available', () => {
    accountsSignal.set([makeAccount('a-1', 5000)]);
    summariesSignal.set([makeSummary('a-1', 7500, true)]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as InvestmentsComponentPublic;
    expect(comp.liveValue('a-1')).toBe(7500);
  });

  it('liveValue falls back to 0 when no summary exists', () => {
    accountsSignal.set([makeAccount('a-1', 5000)]);
    summariesSignal.set([]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as InvestmentsComponentPublic;
    expect(comp.liveValue('a-1')).toBe(0);
  });

  it('isPriceAvailable returns true when summary.priceAvailable is true', () => {
    summariesSignal.set([makeSummary('a-1', 7500, true)]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as InvestmentsComponentPublic;
    expect(comp.isPriceAvailable('a-1')).toBe(true);
  });

  it('isPriceAvailable returns false when no summary exists', () => {
    summariesSignal.set([]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as InvestmentsComponentPublic;
    expect(comp.isPriceAvailable('unknown')).toBe(false);
  });
});
