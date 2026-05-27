import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../core/services/account.service';
import { AccountType } from '../../core/models/account.model';
import { AddAccountModalComponent } from './add-account-modal.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent],
  templateUrl: './accounts.component.html',
})
export class AccountsComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  protected readonly showModal = signal(false);

  protected readonly showModal = signal(false);

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }

  protected goToDetail(id: string): void {
    this.router.navigate(['/accounts', id]);
  }

  protected formatAccountType(type: AccountType): string {
    const labels: Record<AccountType, string> = {
      PEA: 'Plan Épargne Actions',
      PEA_PME: 'PEA PME',
      COMPTE_TITRES: 'Compte Titres',
      PER: 'Plan Épargne Retraite',
      ASSURANCE_VIE: 'Assurance Vie',
      SAVINGS_ACCOUNT: 'Livret / Épargne',
      CASH_ACCOUNT: 'Compte Courant',
      CRYPTO_WALLET: 'Crypto Wallet',
      REAL_ESTATE: 'Immobilier',
    };
    return labels[type] ?? type;
  }
}
