import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Signal } from '@angular/core';
import { CryptoComponent } from './crypto.component';
import { AccountService } from '../../../core/services/account.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { FinancialAccount } from '../../../core/models/account.model';

interface CryptoComponentSignals {
  totalCryptoValue: Signal<number>;
}

const makeCryptoAccount = (portfolioValue: number | null): FinancialAccount => ({
  id: 'c-1', name: 'Ledger', accountType: 'CRYPTO_WALLET',
  subType: 'CRYPTO_WALLET', balance: 50, currency: 'EUR',
  transactionCount: 1, broker: 'Ledger', depositLimit: null,
  totalDeposits: null, remainingCapacity: null, openedAt: null,
  portfolioValue,
});

const makeInvestmentAccount = (): FinancialAccount => ({
  id: 'i-1', name: 'Mon PEA', accountType: 'PEA',
  subType: 'PEA', balance: 1000, currency: 'EUR',
  transactionCount: 2, broker: 'Fortuneo', depositLimit: 150000,
  totalDeposits: 5000, remainingCapacity: 145000, openedAt: null,
  portfolioValue: 5000,
});

describe('CryptoComponent', () => {
  let fixture: ComponentFixture<CryptoComponent>;
  const accountsSignal = signal<FinancialAccount[]>([]);

  beforeEach(async () => {
    accountsSignal.set([]);
    await TestBed.configureTestingModule({
      imports: [CryptoComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            accounts: accountsSignal.asReadonly(),
            portfolioSummaries: signal<[]>([]).asReadonly(),
            loadAccounts: jest.fn(),
            loadPortfolioSummaries: jest.fn(),
            getPortfolioSummary: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CryptoComponent);
  });

  it('totalCryptoValue sums portfolioValue for CRYPTO_WALLET accounts only', () => {
    accountsSignal.set([makeCryptoAccount(3000), makeInvestmentAccount()]);
    fixture.detectChanges();
    expect((fixture.componentInstance as unknown as CryptoComponentSignals).totalCryptoValue()).toBe(3000);
  });

  it('totalCryptoValue treats null portfolioValue as 0', () => {
    accountsSignal.set([makeCryptoAccount(null)]);
    fixture.detectChanges();
    expect((fixture.componentInstance as unknown as CryptoComponentSignals).totalCryptoValue()).toBe(0);
  });

  it('totalCryptoValue is 0 when no crypto accounts', () => {
    accountsSignal.set([makeInvestmentAccount()]);
    fixture.detectChanges();
    expect((fixture.componentInstance as unknown as CryptoComponentSignals).totalCryptoValue()).toBe(0);
  });
});
