import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AccountType, ACCOUNT_CATEGORY } from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent],
  templateUrl: './investments.component.html',
})
export class InvestmentsComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal = signal(false);

  protected readonly allowedTypes: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE',
  ];

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'investments'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + a.balance, 0)
  );

  protected readonly expandedIds = signal<Set<string>>(new Set());

  protected toggle(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  protected onAccountCreated(): void {
    this.accountService.loadAccounts();
    this.showModal.set(false);
  }

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }
}
