import { Component, OnInit, output, input, inject, signal, computed, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, AccountSubType,
  ACCOUNT_TYPE_SUB_TYPES, ACCOUNT_SUB_TYPE_LABELS, ACCOUNT_TYPE_LABELS,
} from '../../../core/models/account.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-add-account-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './add-account-modal.component.html',
})
export class AddAccountModalComponent implements OnInit {
  closed = output<void>();
  created = output<void>();
  allowedTypes = input<AccountType[] | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
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

  protected readonly brokerDropdownOpen = signal(false);
  protected readonly selectedBroker     = signal<string>('');

  protected readonly brokers: string[] = [
    'Fortuneo', 'BoursoBank', 'Degiro', 'Trade Republic',
    'Binance', 'Coinbase', 'Crédit Agricole', 'BNP Paribas',
    'Société Générale', 'LCL', 'Other',
  ];

  protected selectBroker(broker: string): void {
    this.selectedBroker.set(broker);
    this.form.get('broker')?.setValue(broker);
    this.brokerDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.broker-dropdown')) {
      this.brokerDropdownOpen.set(false);
    }
  }

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


  protected readonly form = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(1)]],
    accountType:    ['', Validators.required],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    broker:         ['', Validators.required],
    subType:        [null as AccountSubType | null],
    openedAt:       [this.today() as string | null, null],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly availableSubTypes = computed(() => {
    const type = this.formValue().accountType as AccountType;
    return ACCOUNT_TYPE_SUB_TYPES[type] ?? [];
  });

  protected readonly showSubType = computed(() =>
    this.availableSubTypes().length > 1
  );

  protected readonly showOpenedAt = computed(() => {
    const type = this.formValue().accountType as AccountType;
    return (['PEA', 'PEA_PME', 'COMPTE_TITRES', 'PER', 'ASSURANCE_VIE'] as string[])
      .includes(type);
  });

  protected today(): string {
    return new Date().toISOString().split('T')[0];
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
    this.step.set(2);
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { name, accountType, initialBalance, broker, subType, openedAt } = this.form.getRawValue();
    this.accountService.createAccount({
      name: name!,
      accountType: accountType as AccountType,
      initialBalance: initialBalance!,
      currency: 'EUR',
      broker: broker!,
      subType: subType as AccountSubType | null,
      openedAt: openedAt ?? null,
    }).subscribe({
      next: () => {
        this.created.emit();
        this.closed.emit();
      },
      error: (err) => {
        const message = err.error?.message ?? err.message ?? 'Failed to create account';
        this.toastService.error(message);
      },
    });
  }
}
