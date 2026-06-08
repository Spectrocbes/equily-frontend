import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY, ACCOUNT_TYPE_LABELS } from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent, UserCurrencyPipe],
  templateUrl: './crypto.component.html',
})
export class CryptoComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  protected readonly allowedTypes: AccountType[] = ['CRYPTO_WALLET'];
  protected readonly ACCOUNT_TYPE_LABELS = ACCOUNT_TYPE_LABELS;

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'crypto'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected readonly totalCryptoValue = computed(() => {
    const cryptoAccounts = this.accounts();
    const accountIds     = new Set(cryptoAccounts.map(a => a.id));
    const summaries      = this.accountService.portfolioSummaries();
    if (summaries.length > 0) {
      return summaries
        .filter(s => accountIds.has(s.accountId))
        .reduce((sum, s) => sum + s.livePortfolioValue, 0);
    }
    return cryptoAccounts.reduce((sum, a) => sum + (a.portfolioValue ?? 0), 0);
  });

  protected liveValue(accountId: string): number {
    return this.accountService.getPortfolioSummary(accountId)
      ?.livePortfolioValue ?? 0;
  }

  protected isPriceAvailable(accountId: string): boolean {
    return this.accountService.getPortfolioSummary(accountId)
      ?.priceAvailable ?? false;
  }

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.showModal.set(false);
  }

  ngOnInit(): void {
    this.accountService.loadAccounts();
    this.accountService.loadPortfolioSummaries();
  }
}
