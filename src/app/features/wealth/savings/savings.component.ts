import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, ACCOUNT_CATEGORY, FinancialAccount,
  ACCOUNT_TYPE_LABELS, ACCOUNT_SUB_TYPE_LABELS,
} from '../../../core/models/account.model';
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
  protected readonly ACCOUNT_TYPE_LABELS     = ACCOUNT_TYPE_LABELS;
  protected readonly ACCOUNT_SUB_TYPE_LABELS = ACCOUNT_SUB_TYPE_LABELS;

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'savings'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected depositPercent(account: FinancialAccount): number {
    if (!account.depositLimit || account.depositLimit === 0) return 0;
    const isSavings = ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE']
      .includes(account.subType ?? '');
    const used = isSavings ? account.balance : (account.totalDeposits ?? 0);
    return Math.min(100, (used / account.depositLimit) * 100);
  }

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.showModal.set(false);
  }

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }
}
