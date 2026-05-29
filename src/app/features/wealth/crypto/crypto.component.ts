import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY } from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent],
  templateUrl: './crypto.component.html',
})
export class CryptoComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  protected readonly allowedTypes: AccountType[] = ['CRYPTO_WALLET'];

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'crypto'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.showModal.set(false);
  }

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }
}
