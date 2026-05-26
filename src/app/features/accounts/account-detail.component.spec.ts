import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AccountDetailComponent } from './account-detail.component';
import { AccountService } from '../../core/services/account.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FinancialAccount, Transaction } from '../../core/models/account.model';

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
            getTransactions: jest.fn().mockReturnValue(of([mockTransaction])),
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

  it('redirects if no id in route', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const route = TestBed.inject(ActivatedRoute);
    (route.snapshot.paramMap.get as jest.Mock).mockReturnValue(null);
    fixture.componentInstance.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/accounts']);
  });
});
