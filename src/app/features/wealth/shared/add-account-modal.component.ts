import { Component, OnInit, output, input, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, AccountSubType,
  ACCOUNT_TYPE_SUB_TYPES, ACCOUNT_SUB_TYPE_LABELS, ACCOUNT_TYPE_LABELS,
  CURRENCY_SYMBOLS, isEurOnlyAccount,
} from '../../../core/models/account.model';
import { PreferencesService } from '../../../core/services/preferences.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { Broker, getBrokersForAccountType } from '../../../core/constants/brokers';
import { normalizeTextOrUndefined } from '../../../core/utils/sanitize';

@Component({
  selector: 'app-add-account-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe, DatePickerComponent],
  templateUrl: './add-account-modal.component.html',
})
export class AddAccountModalComponent implements OnInit {
  closed = output<void>();
  created = output<void>();
  allowedTypes = input<AccountType[] | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = this.accountService.modalLoading;
  protected readonly error = this.accountService.modalError;

  protected readonly step = signal<1 | 2>(1);
  protected readonly submitted = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly ACCOUNT_SUB_TYPE_LABELS = ACCOUNT_SUB_TYPE_LABELS;
  protected readonly ACCOUNT_TYPE_LABELS     = ACCOUNT_TYPE_LABELS as Record<string, string>;

  protected readonly isSingleAccountType = computed(() =>
    (this.allowedTypes()?.length ?? 0) === 1
  );

  private readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'PEA', label: 'PEA — Plan Épargne Actions' },
    { value: 'PEA_PME', label: 'PEA PME' },
    { value: 'COMPTE_TITRES', label: 'Compte Titres Ordinaire' },
    { value: 'PER', label: 'PER — Plan Épargne Retraite' },
    { value: 'ASSURANCE_VIE', label: 'Assurance Vie' },
    { value: 'SAVINGS_ACCOUNT', label: 'Livret (A, LDDS, LEP...)' },
    { value: 'CASH_ACCOUNT', label: 'Compte Courant' },
    { value: 'CRYPTO_WALLET', label: 'Crypto Wallet' },
  ];

  protected readonly filteredAccountTypes = computed(() => {
    const allowed = this.allowedTypes();
    return allowed
      ? this.accountTypes.filter(t => allowed.includes(t.value))
      : this.accountTypes;
  });


  protected readonly isPeaSubType = computed(() => {
    const sub = this.formValue().subType;
    return sub === 'PEA' || sub === 'PEA_PME';
  });

  protected readonly checkingAccounts = computed(() =>
    this.accountService.accounts()
      .filter(a => a.accountType === 'CASH_ACCOUNT' && a.status !== 'CLOSED')
  );

  protected readonly canCreatePea = computed(() =>
    !this.isPeaSubType() || this.checkingAccounts().length > 0
      || !!(this.formValue().linkedCheckingAccountId)
  );

  protected readonly linkedAccountName = computed(() => {
    const id = this.formValue().linkedCheckingAccountId;
    if (!id) return null;
    return this.checkingAccounts().find(a => a.id === id)?.name ?? null;
  });

  protected readonly todayIso = new Date().toISOString().split('T')[0];

  protected readonly form = this.fb.group({
    name:                    ['', [Validators.required, Validators.minLength(1)]],
    accountType:             ['', Validators.required],
    initialBalance:          [0, [Validators.required, Validators.min(0)]],
    broker:                  ['', Validators.required],
    subType:                 [null as AccountSubType | null],
    openedAt:                [this.todayIso, Validators.required],
    linkedCheckingAccountId: [null as string | null],
  });

  protected readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly availableSubTypes = computed(() => {
    const type = this.formValue().accountType as AccountType;
    return ACCOUNT_TYPE_SUB_TYPES[type] ?? [];
  });

  protected readonly showSubType = computed(() =>
    this.availableSubTypes().length > 1
  );

  protected readonly showInitialBalance = computed(() =>
    this.formValue().accountType === 'CASH_ACCOUNT'
  );

  protected readonly initialBalanceCurrency = computed(() => {
    const type    = this.formValue().accountType as AccountType;
    const subType = this.formValue().subType as AccountSubType;
    if (isEurOnlyAccount(type, subType ?? null)) return 'EUR';
    return this.preferencesService.currency();
  });

  protected readonly initialBalanceCurrencySymbol = computed(() =>
    CURRENCY_SYMBOLS[this.initialBalanceCurrency()] ?? this.initialBalanceCurrency()
  );

  protected readonly availableBrokers = computed((): Broker[] =>
    getBrokersForAccountType(this.formValue().accountType ?? null)
  );

  protected readonly brokerDropdownOpen = signal(false);
  protected readonly brokerSearch = signal('');
  protected readonly brokerHighlightedIndex = signal(-1);

  protected readonly filteredBrokers = computed(() => {
    const search = this.brokerSearch().toLowerCase().trim();
    const all    = this.availableBrokers();
    if (!search) return all;
    // Always keep Other at end if it matches or no filter
    const regular = all.filter(b => b.value !== 'Other');
    const other   = all.find(b => b.value === 'Other');
    const filtered = regular.filter(b =>
      b.label.toLowerCase().includes(search)
    );
    if (other && (
      !search || 'other'.includes(search)
    )) {
      filtered.push(other);
    }
    return filtered;
  });

  protected selectBroker(value: string): void {
    this.form.get('broker')?.setValue(value);
    this.brokerDropdownOpen.set(false);
    this.brokerSearch.set('');
    this.brokerHighlightedIndex.set(-1);
  }

  protected closeBrokerDropdown(): void {
    this.brokerDropdownOpen.set(false);
    this.brokerSearch.set(''); // reset search on close
    this.brokerHighlightedIndex.set(-1);
  }

  protected onBrokerSearchInput(value: string): void {
    this.brokerSearch.set(value);
    this.brokerHighlightedIndex.set(-1);
  }

  protected onBrokerKeyDown(event: KeyboardEvent): void {
    if (!this.brokerDropdownOpen()) return;
    const all = this.filteredBrokers();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.brokerHighlightedIndex.update(i => Math.min(i + 1, all.length - 1));
        this.scrollBrokerIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.brokerHighlightedIndex.update(i => Math.max(i - 1, 0));
        this.scrollBrokerIntoView();
        break;
      case 'Enter': {
        event.preventDefault();
        const idx = this.brokerHighlightedIndex();
        if (idx >= 0 && idx < all.length) {
          this.selectBroker(all[idx].value);
        }
        break;
      }
      case 'Escape':
        this.closeBrokerDropdown();
        break;
    }
  }

  private scrollBrokerIntoView(): void {
    setTimeout(() => {
      const el = document.getElementById('broker-option-' + this.brokerHighlightedIndex());
      el?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }, 0);
  }

  protected readonly selectedBrokerLabel = computed(() => {
    const val = this.formValue().broker;
    if (!val) return null;
    const all = this.availableBrokers();
    return all.find(b => b.value === val)?.label ?? val;
  });

  protected today(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected onInitialBalanceFocus(): void {
    if (this.form.get('initialBalance')?.value === 0) {
      this.form.get('initialBalance')?.setValue(null);
    }
  }

  protected onInitialBalanceBlur(): void {
    const current = this.form.get('initialBalance')?.value;
    if (current === null || current === undefined) {
      this.form.get('initialBalance')?.setValue(0);
    }
  }

  constructor() {
    this.form.get('accountType')!.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(type => {
        const subTypeControl = this.form.get('subType')!;
        subTypeControl.setValue(null);
        const available = ACCOUNT_TYPE_SUB_TYPES[type as AccountType] ?? [];
        if (available.length === 1) {
          subTypeControl.setValue(available[0]);
        }
        if (available.length > 0) {
          subTypeControl.setValidators([Validators.required]);
        } else {
          subTypeControl.clearValidators();
        }
        subTypeControl.updateValueAndValidity();
        if (type !== 'CASH_ACCOUNT') {
          this.form.get('initialBalance')?.setValue(0);
        }
        this.form.get('broker')?.setValue('');
        this.brokerDropdownOpen.set(false);
        this.brokerSearch.set('');
        this.brokerHighlightedIndex.set(-1);
      });
  }

  protected mouseDownOnBackdrop = false;

  protected onBackdropMouseDown(event: MouseEvent): void {
    this.mouseDownOnBackdrop = event.target === event.currentTarget;
  }

  protected onBackdropMouseUp(event: MouseEvent): void {
    if (this.mouseDownOnBackdrop && event.target === event.currentTarget) {
      this.closed.emit();
    }
    this.mouseDownOnBackdrop = false;
  }

  ngOnInit(): void {
    const allowed = this.allowedTypes();
    if (allowed?.length === 1) {
      this.form.get('accountType')?.setValue(allowed[0]);
    }
  }

  protected nextStep(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const accountType = this.form.get('accountType')?.value;
    const subType     = this.form.get('subType')?.value;
    const requiresSubType = ['SAVINGS_ACCOUNT', 'INVESTMENT'].includes(accountType ?? '');

    if (requiresSubType && !subType) {
      this.toastService.error('Please select an account type before continuing.');
      return;
    }

    this.submitted.set(false);
    this.step.set(2);
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { name, accountType, initialBalance, broker, subType, openedAt, linkedCheckingAccountId } = this.form.getRawValue();
    this.accountService.createAccount({
      name: normalizeTextOrUndefined(name) ?? '',
      accountType: accountType as AccountType,
      initialBalance: initialBalance!,
      currency: this.initialBalanceCurrency(),
      broker: broker!,
      subType: subType as AccountSubType | null,
      openedAt: openedAt ?? null,
      linkedCheckingAccountId: linkedCheckingAccountId ?? null,
    }).subscribe({
      next: () => {
        this.toastService.success('Account created');
        this.created.emit();
        this.closed.emit();
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : 'Failed to create account';
        this.toastService.error(msg);
      },
    });
  }
}
