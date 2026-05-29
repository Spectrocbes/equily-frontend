import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY } from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-cash',
  standalone: true,
  imports: [CurrencyPipe, AddAccountModalComponent],
  templateUrl: './cash.component.html',
})
export class CashComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  protected readonly allowedTypes: AccountType[] = ['CASH_ACCOUNT'];

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'cash'
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
