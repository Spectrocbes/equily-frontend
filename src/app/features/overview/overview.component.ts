import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { ACCOUNT_CATEGORY } from '../../core/models/account.model';
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

  protected readonly investmentAccounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'investments'
    )
  );
  protected readonly cryptoAccounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'crypto'
    )
  );
  protected readonly savingsAccounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'savings'
    )
  );
  protected readonly cashAccounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'cash'
    )
  );

  protected readonly totalInvestments = computed(() =>
    this.investmentAccounts().reduce((s, a) => s + a.balance, 0)
  );
  protected readonly totalCrypto = computed(() =>
    this.cryptoAccounts().reduce((s, a) => s + a.balance, 0)
  );
  protected readonly totalSavings = computed(() =>
    this.savingsAccounts().reduce((s, a) => s + a.balance, 0)
  );
  protected readonly totalCash = computed(() =>
    this.cashAccounts().reduce((s, a) => s + a.balance, 0)
  );
  protected readonly totalWealth = computed(() =>
    this.totalInvestments() +
    this.totalCrypto() +
    this.totalSavings() +
    this.totalCash()
  );

  protected readonly allocationData = computed(() => [
    { label: 'Investments', value: this.totalInvestments(), color: '#6366f1' },
    { label: 'Crypto',      value: this.totalCrypto(),      color: '#f59e0b' },
    { label: 'Savings',     value: this.totalSavings(),     color: '#10b981' },
    { label: 'Cash',        value: this.totalCash(),        color: '#64748b' },
  ].filter(d => d.value > 0));

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.showModal.set(false);
  }
}
