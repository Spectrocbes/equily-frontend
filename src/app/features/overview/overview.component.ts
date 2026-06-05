import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY } from '../../core/models/account.model';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { AddAccountModalComponent } from '../wealth/shared/add-account-modal.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, DonutChartComponent, AddAccountModalComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  private readonly INVESTMENT_TYPES: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE', 'CRYPTO_WALLET',
  ];

  protected readonly investmentTotal = computed(() =>
    this.accountService.accounts()
      .filter(a => ACCOUNT_CATEGORY[a.accountType] === 'investments')
      .reduce((sum, a) => sum + (a.portfolioValue ?? 0) + a.balance, 0)
  );

  protected readonly cryptoTotal = computed(() =>
    this.accountService.accounts()
      .filter(a => ACCOUNT_CATEGORY[a.accountType] === 'crypto')
      .reduce((sum, a) => sum + (a.portfolioValue ?? 0) + a.balance, 0)
  );

  protected readonly savingsTotal = computed(() =>
    this.accountService.accounts()
      .filter(a => ACCOUNT_CATEGORY[a.accountType] === 'savings')
      .reduce((sum, a) => sum + a.balance, 0)
  );

  protected readonly cashTotal = computed(() =>
    this.accountService.accounts()
      .filter(a => ACCOUNT_CATEGORY[a.accountType] === 'cash')
      .reduce((sum, a) => sum + a.balance, 0)
  );

  protected readonly totalWealth = computed(() =>
    this.investmentTotal() + this.cryptoTotal() +
    this.savingsTotal() + this.cashTotal()
  );

  protected readonly allocationData = computed(() => [
    { label: 'Investments', value: this.investmentTotal(), color: '#6366f1' },
    { label: 'Crypto',      value: this.cryptoTotal(),     color: '#f59e0b' },
    { label: 'Savings',     value: this.savingsTotal(),    color: '#10b981' },
    { label: 'Cash',        value: this.cashTotal(),       color: '#64748b' },
  ].filter(d => d.value > 0));

  ngOnInit(): void {
    this.accountService.loadSummaries();
    this.accountService.loadAccounts();
  }

  protected onAccountCreated(): void {
    this.accountService.loadSummaries();
    this.showModal.set(false);
  }
}
