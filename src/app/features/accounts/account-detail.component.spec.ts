import { TestBed, ComponentFixture, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { AccountDetailComponent } from './account-detail.component';
import { AccountService } from '../../core/services/account.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FinancialAccount, Transaction, Holding } from '../../core/models/account.model';

const mockAccount: FinancialAccount = {
  id: 'abc-123',
  name: 'Mon PEA',
  accountType: 'PEA',
  balance: 5000,
  currency: 'EUR',
  transactionCount: 1,
  broker: 'Fortuneo',
};

const mockTransaction: Transaction = {
  id: 'tx-1',
  type: 'DEPOSIT',
  ticker: null,
  quantity: null,
  pricePerUnit: null,
  totalAmount: 5000,
  currency: 'EUR',
  date: '2026-01-15',
  fees: 0,
  description: null,
};

describe('AccountDetailComponent', () => {
  let fixture: ComponentFixture<AccountDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: AccountService,
          useValue: {
            accounts: signal([mockAccount]),
            getAccountById: jest.fn().mockReturnValue(of(mockAccount)),
            getTransactions: jest.fn().mockReturnValue(of([mockTransaction])),
            getHoldings: jest.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: jest.fn().mockReturnValue('abc-123') } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailComponent);
    fixture.detectChanges();
  });

  it('displays account name', () => {
    expect(fixture.nativeElement.textContent).toContain('Mon PEA');
  });

  it('displays transaction type badge', () => {
    expect(fixture.nativeElement.textContent).toContain('DEPOSIT');
  });

  it('shows balance delta after transaction created', fakeAsync(() => {
    fixture.detectChanges();

    const accountService = TestBed.inject(AccountService);
    (accountService.getAccountById as jest.Mock).mockReturnValue(
      of({ ...mockAccount, balance: 6000 })
    );

    fixture.componentInstance['loadAccount']('abc-123');
    fixture.detectChanges();

    expect(fixture.componentInstance.balanceDelta()).toBe(1000);
    expect(fixture.componentInstance.balanceFlash()).toBe('gain');

    tick(4000);
    expect(fixture.componentInstance.balanceDelta()).toBeNull();

    discardPeriodicTasks();
  }));

  it('redirects if no id in route', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/accounts']);
  });

  it('shows transactions tab by default', () => {
    expect(fixture.componentInstance.activeTab()).toBe('transactions');
  });

  it('switches to holdings tab on click', () => {
    const holdingsBtn = fixture.nativeElement
      .querySelectorAll('button[type="button"]')[1];
    holdingsBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('holdings');
  });

  it('shows empty holdings message when no holdings', () => {
    fixture.componentInstance.activeTab.set('holdings');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent)
      .toContain('No open positions');
  });

  it('computes totalCashOut as totalInvested + totalFeesPaid', () => {
    const holding: Holding = {
      ticker: 'AAPL',
      quantity: 10,
      averageCostPrice: 150,
      currency: 'EUR',
      totalInvested: 1500,
      totalFeesPaid: 5,
    };
    fixture.componentInstance.holdings.set([holding]);
    fixture.detectChanges();
    expect(fixture.componentInstance.totalCashOut()).toBe(1505);
    expect(fixture.componentInstance.totalFeesPaid()).toBe(5);
  });
});
