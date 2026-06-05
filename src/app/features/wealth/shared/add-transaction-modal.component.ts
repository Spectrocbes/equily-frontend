import { Component, OnInit, input, output, inject, computed, signal, effect } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, AccountSubType, TransactionType,
  ALLOWED_TRANSACTION_TYPES, PeaSummary,
} from '../../../core/models/account.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './add-transaction-modal.component.html',
})
export class AddTransactionModalComponent implements OnInit {
  accountId         = input.required<string>();
  accountType       = input.required<AccountType>();
  accountSubType    = input<AccountSubType | null>(null);
  remainingCapacity = input<number | null>(null);
  depositLimit      = input<number | null>(null);
  totalDeposits     = input<number | null>(null);
  currentBalance    = input<number | null>(null);

  closed  = output<void>();
  created = output<{ type: TransactionType; amount: number }>();

  private readonly fb = inject(FormBuilder);
  protected readonly accountService = inject(AccountService);
  private readonly toastService = inject(ToastService);

  protected readonly loading    = signal(false);
  protected readonly error      = signal<string | null>(null);
  protected readonly peaSummary = signal<PeaSummary | null>(null);

  protected readonly allowedTypes = computed(() =>
    ALLOWED_TRANSACTION_TYPES[this.accountType()]
  );

  protected readonly availableTransactionTypes = computed(() => {
    const subType = this.accountSubType();
    const isSavings = ['LIVRET_A', 'LDDS', 'LDD', 'LEP', 'LIVRET_JEUNE']
      .includes(subType ?? '');
    const isCash = subType === 'CASH_ACCOUNT';

    if (isSavings) {
      return [
        { value: 'DEPOSIT'    as TransactionType, label: 'Deposit' },
        { value: 'WITHDRAWAL' as TransactionType, label: 'Withdrawal' },
        { value: 'INTEREST'   as TransactionType, label: 'Interest received' },
      ];
    }
    if (isCash) {
      return [
        { value: 'DEPOSIT'    as TransactionType, label: 'Deposit' },
        { value: 'WITHDRAWAL' as TransactionType, label: 'Withdrawal' },
      ];
    }
    return [
      { value: 'DEPOSIT'    as TransactionType, label: 'Deposit' },
      { value: 'WITHDRAWAL' as TransactionType, label: 'Withdrawal' },
      { value: 'BUY'        as TransactionType, label: 'Buy' },
      { value: 'SELL'       as TransactionType, label: 'Sell' },
      { value: 'DIVIDEND'   as TransactionType, label: 'Dividend' },
    ];
  });

  protected readonly step = signal<'form' | 'confirm'>('form');
  protected readonly selectedType = signal<TransactionType | ''>('');

  protected readonly requiresAsset = computed(() =>
    ['BUY', 'SELL'].includes(this.selectedType())
  );

  protected readonly requiresTicker = computed(() =>
    ['BUY', 'SELL', 'DIVIDEND'].includes(this.selectedType())
  );

  protected readonly form = this.fb.group({
    ticker:       [''],
    quantity:     [null as number | null],
    pricePerUnit: [null as number | null],
    totalAmount:  [null as number | null],
    fees:         [0],
    date: [
      new Date().toISOString().split('T')[0],
      [
        Validators.required,
        (control: AbstractControl) => {
          const date = new Date(control.value);
          if (isNaN(date.getTime())) return { invalidDate: true };
          if (date.getFullYear() > 9999) return { invalidDate: true };
          if (date.getFullYear() < 1900) return { invalidDate: true };
          return null;
        },
      ],
    ],
    description:  [''],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly computedTotal = computed(() => {
    const v    = this.formValue();
    const qty  = v.quantity;
    const price = v.pricePerUnit;
    const fees = v.fees ?? 0;
    const type = this.selectedType();
    if (qty && price && qty > 0 && price > 0) {
      if (type === 'BUY')  return Math.round((qty * price + fees) * 100) / 100;
      if (type === 'SELL') return Math.round((qty * price - fees) * 100) / 100;
      return Math.round(qty * price * 100) / 100;
    }
    return null;
  });

  protected readonly isSavingsSubType = computed(() =>
    ['LIVRET_A', 'LDDS', 'LEP', 'LIVRET_JEUNE'].includes(this.accountSubType() ?? '')
  );

  protected readonly usedAmount = computed(() => {
    if (this.isSavingsSubType()) {
      return this.currentBalance() ?? 0;
    }
    return this.totalDeposits() ?? 0;
  });

  protected readonly effectiveLimit = computed(() => {
    const summary = this.peaSummary();
    if (summary?.hasPea && summary?.hasPeaPme) {
      return summary.combinedLimit;
    }
    return this.depositLimit() ?? 0;
  });

  protected readonly effectiveRemaining = computed(() => {
    const summary = this.peaSummary();
    if (summary?.hasPea && summary?.hasPeaPme) {
      return summary.combinedRemaining;
    }
    return this.remainingCapacity() ?? 0;
  });

  protected readonly effectiveUsed = computed(() => {
    const summary = this.peaSummary();
    if (summary?.hasPea && summary?.hasPeaPme) {
      return summary.combinedDeposits;
    }
    return this.usedAmount();
  });

  protected readonly showDepositWarning = computed(() => {
    const type = this.selectedType();
    if (type !== 'DEPOSIT') return false;
    return this.depositLimit() !== null;
  });

  protected readonly wouldExceedLimit = computed(() => {
    if (!this.showDepositWarning()) return false;
    const amount    = this.formValue().totalAmount ?? 0;
    const remaining = this.effectiveRemaining();
    return remaining <= 0 || amount > remaining;
  });

  protected readonly isApproachingLimit = computed(() => {
    if (!this.showDepositWarning()) return false;
    if (this.wouldExceedLimit()) return false;
    const limit = this.effectiveLimit();
    if (limit === 0) return false;
    return (this.effectiveUsed() / limit) >= 0.9;
  });

  protected readonly maxDate = computed(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  protected readonly minDate = '1900-01-01';

  protected readonly dateWarning = computed(() => {
    const date = this.formValue().date;
    if (!date) return null;
    const selected = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) return 'This transaction is dated in the future.';
    return null;
  });

  protected readonly isFormValid = computed(() => {
    const type = this.selectedType();
    if (!type) return false;
    if (this.wouldExceedLimit()) return false;

    const v = this.formValue();
    const dateValid = !!v.date && this.form.get('date')?.valid !== false;

    if (type === 'BUY' || type === 'SELL') {
      return !!(v.ticker?.trim()) &&
             (v.quantity ?? 0) > 0 &&
             (v.pricePerUnit ?? 0) > 0 &&
             dateValid;
    }
    if (type === 'DIVIDEND') {
      return !!(v.ticker?.trim()) &&
             (v.totalAmount ?? 0) > 0 &&
             dateValid;
    }
    return (v.totalAmount ?? 0) > 0 && dateValid;
  });

  constructor() {
    effect(() => {
      this.selectedType();
      this.error.set(null);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.error.set(null);
    this.loading.set(false);
    if (this.accountSubType() === 'PEA' || this.accountSubType() === 'PEA_PME') {
      this.accountService.getPeaSummary().subscribe(s => this.peaSummary.set(s));
    }
  }

  protected onTypeChange(type: TransactionType): void {
    this.selectedType.set(type);
    this.form.patchValue({
      ticker: '',
      quantity: null,
      pricePerUnit: null,
      totalAmount: null,
      fees: 0,
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

  protected onFeesFocus(): void {
    if (this.form.get('fees')?.value === 0) {
      this.form.get('fees')?.setValue(null);
    }
  }

  protected onFeesBlur(): void {
    const v = this.form.get('fees')?.value;
    if (v === null || v === undefined) {
      this.form.get('fees')?.setValue(0);
    }
  }

  protected onSubmit(): void {
    if (!this.isFormValid()) return;
    const v    = this.form.getRawValue();
    const type = this.selectedType() as TransactionType;
    const needsAsset  = type === 'BUY' || type === 'SELL';
    const needsTicker = needsAsset || type === 'DIVIDEND';

    let totalAmount: number;
    if (type === 'BUY') {
      totalAmount = Math.round(((v.quantity! * v.pricePerUnit!) + (v.fees ?? 0)) * 100) / 100;
    } else if (type === 'SELL') {
      totalAmount = Math.round(((v.quantity! * v.pricePerUnit!) - (v.fees ?? 0)) * 100) / 100;
    } else {
      totalAmount = v.totalAmount!;
    }

    this.loading.set(true);
    this.error.set(null);

    this.accountService.recordTransaction(this.accountId(), {
      type,
      ticker:        needsTicker ? v.ticker ?? undefined : undefined,
      quantity:      needsAsset  ? v.quantity ?? undefined : undefined,
      pricePerUnit:  needsAsset  ? v.pricePerUnit ?? undefined : undefined,
      priceCurrency: needsAsset  ? 'EUR' : undefined,
      totalAmount,
      totalCurrency: 'EUR',
      fees:          v.fees ?? 0,
      date:          v.date!,
      description:   v.description || undefined,
    }).subscribe({
      next: () => {
        this.created.emit({ type, amount: totalAmount });
        this.closed.emit();
      },
      error: (err) => {
        let message = 'Transaction failed. Please try again.';
        if (err.error && typeof err.error === 'string') {
          message = err.error;
        } else if (err.status === 422) {
          message = 'Transaction exceeds account limits or available balance.';
        } else if (err.status === 403) {
          message = 'Session expired. Please sign in again.';
        }
        this.toastService.error(message);
        this.loading.set(false);
      },
    });
  }
}
