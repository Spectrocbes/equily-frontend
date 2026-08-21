import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UserCurrencyPipe } from '../../shared/pipes/user-currency.pipe';
import { AccountService } from '../../core/services/account.service';
import { RebalancingService } from '../../core/services/rebalancing.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { TargetAllocation, RebalancingSuggestion } from '../../core/models/account.model';
import { RegionFlagComponent } from '../../shared/components/region-flag/region-flag.component';

const REBALANCABLE_ACCOUNT_TYPES = [
  'PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE', 'CRYPTO_WALLET',
];

@Component({
  selector: 'app-rebalance',
  standalone: true,
  imports: [
    RegionFlagComponent,
    TranslatePipe,
    CurrencyPipe,
    DecimalPipe,
    UserCurrencyPipe,
    FormsModule,
  ],
  templateUrl: './rebalance.component.html',
})
export class RebalanceComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly rebalancingService = inject(RebalancingService);
  protected readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly Math = Math;

  // Accounts that support rebalancing
  protected readonly rebalancableAccounts = computed(() =>
    this.accountService.accounts()
      .filter(a => a.status !== 'CLOSED')
      .filter(a => REBALANCABLE_ACCOUNT_TYPES.includes(a.accountType))
  );

  protected readonly selectedAccountId = signal<string | null>(null);
  protected readonly selectedAccount = computed(() => {
    const id = this.selectedAccountId();
    return id
      ? this.rebalancableAccounts().find(a => a.id === id) ?? null
      : null;
  });

  protected readonly isCrypto = computed(() =>
    this.selectedAccount()?.accountType === 'CRYPTO_WALLET'
  );

  protected readonly availableCategories = computed((): string[] => {
    if (this.isCrypto()) {
      return ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT',
              'AVAX', 'LINK', 'MATIC', 'UNI', 'Other'];
    }
    return ['United States', 'France', 'Germany',
            'United Kingdom', 'Netherlands', 'Italy',
            'Belgium', 'Switzerland', 'Europe', 'Asia',
            'Emerging Markets', 'Other'];
  });

  // Plain method, not computed(): editAllocations is a mutable array, not a signal, so a computed() would cache a stale result.
  protected unusedCategories(): string[] {
    const used = new Set(this.editAllocations.map(a => a.category));
    return this.availableCategories().filter(c => !used.has(c));
  }

  // Target allocations
  protected readonly targetAllocations = signal<TargetAllocation[]>([]);
  protected readonly allocationsLoading = signal(false);

  // Suggestions
  protected readonly suggestions = signal<RebalancingSuggestion[]>([]);
  protected readonly suggestionsLoading = signal(false);

  // DCA amount
  protected readonly dcaAmount = signal<number>(0);

  // Edit mode
  protected readonly editMode = signal(false);
  protected editAllocations: { category: string; percent: number }[] = [];

  ngOnInit(): void {
    this.accountService.loadAccounts();
  }

  protected selectAccount(accountId: string): void {
    this.selectedAccountId.set(accountId);
    this.editMode.set(false);
    this.suggestions.set([]);

    const account = this.rebalancableAccounts().find(a => a.id === accountId);
    this.dcaAmount.set(account?.defaultDcaAmount ?? 0);

    this.loadAllocations(accountId);
  }

  private loadAllocations(accountId: string): void {
    this.allocationsLoading.set(true);
    this.rebalancingService.getAllocations(accountId).subscribe({
      next: allocs => {
        this.targetAllocations.set(allocs);
        this.allocationsLoading.set(false);
      },
      error: () => this.allocationsLoading.set(false),
    });
  }

  protected enterEditMode(): void {
    this.editMode.set(true);
    const existing = this.targetAllocations();
    if (existing.length > 0) {
      this.editAllocations = existing.map(a => ({
        category: a.category,
        percent: a.targetPercent,
      }));
    } else if (this.isCrypto()) {
      this.editAllocations = [
        { category: 'BTC', percent: 50 },
        { category: 'ETH', percent: 30 },
        { category: 'SOL', percent: 20 },
      ];
    } else {
      this.editAllocations = [
        { category: 'United States', percent: 40 },
        { category: 'France', percent: 30 },
        { category: 'Europe', percent: 20 },
        { category: 'Other', percent: 10 },
      ];
    }
  }

  protected addCategory(): void {
    this.editAllocations.push({ category: '', percent: 0 });
  }

  protected removeCategory(index: number): void {
    this.editAllocations.splice(index, 1);
  }

  protected get editTotal(): number {
    return this.editAllocations.reduce((sum, a) => sum + (a.percent || 0), 0);
  }

  protected saveAllocations(): void {
    if (Math.abs(this.editTotal - 100) > 0.01) {
      this.toastService.error(this.translate.instant('rebalancing.totalMustBe100'));
      return;
    }

    const allocations = this.editAllocations.map(a => ({
      category: a.category.trim(),
      targetPercent: a.percent,
    }));

    const accountId = this.selectedAccountId();
    if (!accountId) return;

    this.rebalancingService.saveAllocations(accountId, allocations).subscribe({
      next: () => {
        this.targetAllocations.set(allocations);
        this.editMode.set(false);
        this.toastService.success(this.translate.instant('rebalancing.allocationsSaved'));
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : this.translate.instant('common.error');
        this.toastService.error(msg);
      },
    });
  }

  protected cancelEdit(): void {
    this.editMode.set(false);
  }

  protected onDcaFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.value = '';
    }
    input.select();
  }

  protected onDcaBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      input.value = '0';
      this.dcaAmount.set(0);
    }
  }

  protected saveDcaAmount(): void {
    const accountId = this.selectedAccountId();
    if (!accountId) return;
    this.rebalancingService.saveDcaAmount(accountId, this.dcaAmount()).subscribe({
      next: () => {
        this.toastService.success(this.translate.instant('rebalancing.dcaSaved'));
        this.accountService.loadAccounts();
      },
      error: () => this.toastService.error(this.translate.instant('common.error')),
    });
  }

  protected computeSuggestions(): void {
    const accountId = this.selectedAccountId();
    const amount = this.dcaAmount();
    if (!accountId || amount <= 0) return;

    this.suggestionsLoading.set(true);
    this.rebalancingService.getSuggestions(accountId, amount).subscribe({
      next: suggestions => {
        this.suggestions.set(suggestions);
        this.suggestionsLoading.set(false);
      },
      error: () => this.suggestionsLoading.set(false),
    });
  }
}
