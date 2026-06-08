import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, ACCOUNT_CATEGORY, FinancialAccount,
  ACCOUNT_TYPE_LABELS, PeaSummary,
} from '../../../core/models/account.model';
import { AddAccountModalComponent } from '../shared/add-account-modal.component';

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, AddAccountModalComponent],
  templateUrl: './investments.component.html',
})
export class InvestmentsComponent implements OnInit {
  protected readonly accountService = inject(AccountService);
  protected readonly showModal   = signal(false);
  protected readonly peaSummary = signal<PeaSummary | null>(null);

  protected readonly allowedTypes: AccountType[] = [
    'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE',
  ];
  protected readonly ACCOUNT_TYPE_LABELS = ACCOUNT_TYPE_LABELS;

  protected readonly accounts = computed(() =>
    this.accountService.accounts().filter(
      a => ACCOUNT_CATEGORY[a.accountType] === 'investments'
    )
  );

  protected readonly total = computed(() =>
    this.accounts().reduce((s, a) => s + (a.portfolioValue ?? 0) + a.balance, 0)
  );

  protected readonly totalPortfolioValue = computed(() => {
    const summaries  = this.accountService.portfolioSummaries();
    const accountIds = new Set(this.accounts().map(a => a.id));
    if (summaries.length > 0) {
      return summaries
        .filter(s => accountIds.has(s.accountId))
        .reduce((sum, s) => sum + s.livePortfolioValue, 0);
    }
    return this.accounts().reduce((sum, a) => sum + (a.portfolioValue ?? 0), 0);
  });

  protected readonly totalCash = computed(() =>
    this.accounts().reduce((sum, a) => sum + a.balance, 0)
  );

  protected liveValue(accountId: string): number {
    return this.accountService.getPortfolioSummary(accountId)
      ?.livePortfolioValue ?? 0;
  }

  protected isPriceAvailable(accountId: string): boolean {
    return this.accountService.getPortfolioSummary(accountId)
      ?.priceAvailable ?? false;
  }

  protected depositPercent(account: FinancialAccount): number {
    if (!account.depositLimit || account.depositLimit === 0) return 0;

    const isPeaType = account.subType === 'PEA' || account.subType === 'PEA_PME';
    const summary   = this.peaSummary();

    if (isPeaType && summary?.hasPea && summary?.hasPeaPme) {
      return Math.min(100,
        (summary.combinedDeposits / summary.combinedLimit) * 100
      );
    }

    const isSavings = ['LIVRET_A', 'LDDS', 'LDD', 'LEP', 'LIVRET_JEUNE']
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
    this.accountService.loadPortfolioSummaries();
    this.accountService.getPeaSummary().subscribe(s => this.peaSummary.set(s));
  }
}
