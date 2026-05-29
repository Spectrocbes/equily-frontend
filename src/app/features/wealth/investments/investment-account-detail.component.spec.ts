import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InvestmentAccountDetailComponent } from './investment-account-detail.component';
import { AccountService } from '../../../core/services/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FinancialAccount, Holding, Transaction } from '../../../core/models/account.model';

const mockAccount: FinancialAccount = {
  id: 'acc-1', name: 'Mon PEA', accountType: 'PEA',
  balance: 5000, currency: 'EUR', transactionCount: 1,
  broker: 'Fortuneo',
};

const mockHolding: Holding = {
  ticker: 'AAPL', quantity: 10, averageCostPrice: 150,
  currency: 'EUR', totalInvested: 1500, totalFeesPaid: 5,
};

const mockTransaction: Transaction = {
  id: 'tx-1', type: 'BUY', ticker: 'AAPL',
  quantity: 10, pricePerUnit: 150,
  totalAmount: 1505, currency: 'EUR',
  date: '2026-01-15', fees: 5, description: null,
};

describe('InvestmentAccountDetailComponent', () => {
  let fixture: ComponentFixture<InvestmentAccountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAccountDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            modalLoading: signal(false),
            modalError: signal(null),
            getAccountById:  jest.fn().mockReturnValue(of(mockAccount)),
            getHoldings:     jest.fn().mockReturnValue(of([mockHolding])),
            getTransactions: jest.fn().mockReturnValue(of([mockTransaction])),
            recordTransaction: jest.fn().mockReturnValue(of(undefined)),
            loadAccounts: jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('acc-1') } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvestmentAccountDetailComponent);
    fixture.detectChanges();
  });

  it('displays account name', () => {
    expect(fixture.nativeElement.textContent).toContain('Mon PEA');
  });

  it('displays holding ticker in Holdings tab', () => {
    expect(fixture.nativeElement.textContent).toContain('AAPL');
  });

  it('shows transactions tab on click', () => {
    const tabs = fixture.nativeElement.querySelectorAll('button[type="button"]');
    const txTab = Array.from(tabs).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Transactions')
    ) as HTMLButtonElement;
    txTab.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('transactions');
  });

  it('redirects to /wealth/investments when no id', () => {
    const router = TestBed.inject(Router);
    const spy = jest.spyOn(router, 'navigate');
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(spy).toHaveBeenCalledWith(['/wealth/investments']);
  });

  it('computes totalCashOut correctly', () => {
    expect(fixture.componentInstance.totalCashOut()).toBe(1505);
  });

  it('toggles P&L mode between euro and percent', () => {
    expect(fixture.componentInstance.plMode()).toBe('euro');
    fixture.componentInstance.togglePlMode();
    expect(fixture.componentInstance.plMode()).toBe('percent');
    fixture.componentInstance.togglePlMode();
    expect(fixture.componentInstance.plMode()).toBe('euro');
  });
});
