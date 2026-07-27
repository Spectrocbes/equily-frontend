import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AccountService } from './account.service';
import { AccountPortfolioSummary, FinancialAccount } from '../models/account.model';
import { provideTestTranslations } from '../../../testing/translate-testing';

function makeAccount(id: string, name: string): FinancialAccount {
  return {
    id, name, accountType: 'CASH_ACCOUNT', subType: 'CASH_ACCOUNT',
    balance: 100, currency: 'EUR', transactionCount: 0,
    broker: 'Bank', depositLimit: null, totalDeposits: null, remainingCapacity: null,
    openedAt: null, portfolioValue: null, status: 'ACTIVE', closedAt: null,
    linkedCheckingAccountId: null,
  };
}

function makePortfolioSummary(accountId: string): AccountPortfolioSummary {
  return {
    accountId, livePortfolioValue: 0, costPortfolioValue: 0,
    unrealizedPnl: 0, unrealizedPnlPct: 0, priceAvailable: false,
  };
}

describe('AccountService.deleteAccount', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideTestTranslations()],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends DELETE to /api/v1/accounts/:id', () => {
    service.deleteAccount('acc-1').subscribe();
    const req = httpMock.expectOne('/api/v1/accounts/acc-1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('removes the deleted account from the accounts signal', () => {
    service.loadAccounts();
    httpMock.expectOne(req => req.url === '/api/v1/accounts')
      .flush([makeAccount('acc-1', 'A'), makeAccount('acc-2', 'B')]);
    expect(service.accounts().length).toBe(2);

    service.deleteAccount('acc-1').subscribe();
    httpMock.expectOne('/api/v1/accounts/acc-1').flush(null);

    expect(service.accounts().map(a => a.id)).toEqual(['acc-2']);
  });

  it('removes the deleted account from portfolioSummaries', () => {
    service.loadPortfolioSummaries();
    httpMock.expectOne(req => req.url === '/api/v1/accounts/portfolio-summary')
      .flush([makePortfolioSummary('acc-1'), makePortfolioSummary('acc-2')]);
    expect(service.portfolioSummaries().length).toBe(2);

    service.deleteAccount('acc-1').subscribe();
    httpMock.expectOne('/api/v1/accounts/acc-1').flush(null);

    expect(service.portfolioSummaries().map(s => s.accountId)).toEqual(['acc-2']);
  });

  it('does not mutate state when the delete request fails', () => {
    service.loadAccounts();
    httpMock.expectOne(req => req.url === '/api/v1/accounts')
      .flush([makeAccount('acc-1', 'A')]);

    let errored = false;
    service.deleteAccount('acc-1').subscribe({ error: () => { errored = true; } });
    httpMock.expectOne('/api/v1/accounts/acc-1').error(new ProgressEvent('error'));

    expect(errored).toBe(true);
    expect(service.accounts().length).toBe(1);
  });
});
