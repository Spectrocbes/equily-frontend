import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InvestmentsComponent } from './investments.component';
import { AccountService } from '../../../core/services/account.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Signal, signal } from '@angular/core';
import { FinancialAccount, AccountPortfolioSummary, PortfolioHistoryPoint } from '../../../core/models/account.model';
import { of } from 'rxjs';

interface InvestmentsComponentPublic {
  liveValue: (accountId: string) => number;
  isPriceAvailable: (accountId: string) => boolean;
}

const makeAccount = (
  id: string,
  portfolioValue: number | null,
  status: 'ACTIVE' | 'CLOSED' = 'ACTIVE',
): FinancialAccount => ({
  id, name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 1000, currency: 'EUR',
  transactionCount: 2, broker: 'Fortuneo', depositLimit: 150000,
  totalDeposits: 5000, remainingCapacity: 145000, openedAt: null,
  portfolioValue,
  status,
  closedAt: status === 'CLOSED' ? '2026-06-01' : null,
  linkedCheckingAccountId: null,
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
        provideHttpClient(),
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
        {
          provide: AnalyticsService,
          useValue: {
            getPortfolioHistory: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: PreferencesService,
          useValue: { currency: signal('EUR') },
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

  it('openAccounts excludes CLOSED accounts', () => {
    accountsSignal.set([
      makeAccount('a-1', 5000, 'ACTIVE'),
      makeAccount('a-2', 3000, 'CLOSED'),
    ]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { openAccounts: Signal<FinancialAccount[]> };
    expect(comp.openAccounts().length).toBe(1);
    expect(comp.openAccounts()[0].id).toBe('a-1');
  });

  it('closedAccounts includes only CLOSED accounts', () => {
    accountsSignal.set([
      makeAccount('a-1', 5000, 'ACTIVE'),
      makeAccount('a-2', 3000, 'CLOSED'),
    ]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { closedAccounts: Signal<FinancialAccount[]> };
    expect(comp.closedAccounts().length).toBe(1);
    expect(comp.closedAccounts()[0].id).toBe('a-2');
  });

  it('activeAccountTab defaults to active', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { activeAccountTab: Signal<string> };
    expect(comp.activeAccountTab()).toBe('active');
  });

  it('closed tab button shown when closedAccounts exist', () => {
    accountsSignal.set([
      makeAccount('a-1', 5000, 'ACTIVE'),
      makeAccount('a-2', 3000, 'CLOSED'),
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Closed');
  });

  it('switching to closed tab shows closed account name', () => {
    const closed = { ...makeAccount('a-2', 3000, 'CLOSED'), name: 'Old PEA' };
    accountsSignal.set([makeAccount('a-1', 5000, 'ACTIVE'), closed]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      activeAccountTab: ReturnType<typeof signal<'active' | 'closed'>>;
    };
    comp.activeAccountTab.set('closed');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Old PEA');
  });

  it('totalPortfolioValue excludes closed accounts', () => {
    accountsSignal.set([
      makeAccount('a-1', 5000, 'ACTIVE'),
      makeAccount('a-2', 3000, 'CLOSED'),
    ]);
    summariesSignal.set([]);
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { totalPortfolioValue: Signal<number> };
    expect(comp.totalPortfolioValue()).toBe(5000);
  });

  it('animatedProgress is false initially then true after timeout', () => {
    jest.useFakeTimers();
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as { animatedProgress: () => boolean };
    expect(comp.animatedProgress()).toBe(false);
    jest.runAllTimers();
    expect(comp.animatedProgress()).toBe(true);
    jest.useRealTimers();
  });

  it('progressPercent uses ownDeposits when depositNote is present', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      progressPercent: (account: FinancialAccount) => number;
    };
    const account: FinancialAccount = {
      ...makeAccount('a-1', null),
      depositLimit: 150000,
      ownDeposits: 0,
      totalDeposits: 75000,
      depositNote: 'Includes deposits from linked PEA',
    };
    expect(comp.progressPercent(account)).toBe(0);
  });

  it('progressPercent uses totalDeposits when no depositNote', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance as unknown as {
      progressPercent: (account: FinancialAccount) => number;
    };
    const account: FinancialAccount = {
      ...makeAccount('a-1', null),
      depositLimit: 150000,
      totalDeposits: 75000,
      depositNote: null,
    };
    expect(comp.progressPercent(account)).toBeCloseTo(50, 5);
  });

  it('loadHistory calls getPortfolioHistory with INVESTMENT type', () => {
    accountsSignal.set([makeAccount('a-1', 5000)]);
    fixture.detectChanges();
    const analyticsService = TestBed.inject(AnalyticsService);
    expect(analyticsService.getPortfolioHistory).toHaveBeenCalledWith('ONE_MONTH', 'INVESTMENT');
  });

  it('chart hidden when no open accounts — loadHistory skips getPortfolioHistory', () => {
    accountsSignal.set([]);
    fixture.detectChanges();
    const analyticsService = TestBed.inject(AnalyticsService);
    expect(analyticsService.getPortfolioHistory).not.toHaveBeenCalled();
    const comp = fixture.componentInstance as unknown as { historyPoints: Signal<PortfolioHistoryPoint[]> };
    expect(comp.historyPoints()).toEqual([]);
  });
});
