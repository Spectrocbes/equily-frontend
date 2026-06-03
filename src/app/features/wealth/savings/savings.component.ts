import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY } from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent],
  templateUrl: './savings.component.html',
})
export class SavingsComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  protected readonly allowedTypes: AccountType[] = ['SAVINGS_ACCOUNT'];

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'savings'
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
