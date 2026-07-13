import { Component, OnInit, ViewChild, input, output, inject, computed, signal, effect } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/account.service';
import { PreferencesService } from '../../../core/services/preferences.service';
import {
  AccountType, AccountSubType, TransactionType, TransferRequest,
  ALLOWED_TX_TYPES, ACCOUNT_CATEGORY, PeaSummary, CURRENCY_SYMBOLS,
  isEurOnlyAccount, EnrichedHolding, FinancialAccount,
} from '../../../core/models/account.model';
import { ToastService } from '../../../shared/toast/toast.service';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { TickerAutocompleteComponent } from '../../../shared/components/ticker-autocomplete/ticker-autocomplete.component';

const ALL_TRANSACTION_TYPES: { value: TransactionType; label: string; icon: string }[] = [
  { value: 'DEPOSIT',    label: 'Deposit',    icon: '↓' },
  { value: 'WITHDRAWAL', label: 'Withdrawal', icon: '↑' },
  { value: 'PAYMENT',    label: 'Payment',    icon: '💳' },
  { value: 'TRANSFER',   label: 'Transfer',   icon: '⇄' },
  { value: 'BUY',        label: 'Buy',        icon: '📈' },
  { value: 'SELL',       label: 'Sell',       icon: '📉' },
  { value: 'DIVIDEND',   label: 'Dividend',   icon: '💰' },
  { value: 'INTEREST',   label: 'Interest',   icon: '🏦' },
];

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, CurrencyPipe, UserCurrencyPipe, DatePickerComponent, TickerAutocompleteComponent],
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
  peaUnder5Years    = input<boolean>(false);
  hasHoldings       = input<boolean>(false);
  holdings          = input<EnrichedHolding[]>([]);
  account           = input<FinancialAccount | null>(null);

  closed                       = output<void>();
  created                      = output<{ type: TransactionType; amount: number }>();
  peaClosureRequested          = output<void>();
  peaOver5yWithdrawalRequested = output<number>();

  @ViewChild(DatePickerComponent) private datePicker?: DatePickerComponent;

  private readonly fb = inject(FormBuilder);
  protected readonly accountService = inject(AccountService);
  protected readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);

  protected readonly transactionCurrency = computed(() =>
    isEurOnlyAccount(this.accountType(), this.accountSubType())
      ? 'EUR'
      : this.preferencesService.currency()
  );

  protected readonly isEurForced = computed(() =>
    isEurOnlyAccount(this.accountType(), this.accountSubType())
  );

  protected readonly heldTickers = computed(() =>
    this.holdings().map(h => ({ symbol: h.ticker, quantity: h.quantity }))
  );

  protected readonly maxSellQuantity = computed(() => {
    if (this.selectedType() !== 'SELL') return null;
    const symbol = this.formValue().ticker;
    if (!symbol) return null;
    const holding = this.heldTickers().find(h => h.symbol === symbol);
    return holding?.quantity ?? null;
  });

  protected readonly isPeaUnder5Years = computed(() => {
    const subType = this.accountSubType();
    if (subType !== 'PEA' && subType !== 'PEA_PME') return false;
    return this.peaUnder5Years();
  });

  protected readonly isPeaOver5Years = computed(() => {
    const subType = this.accountSubType();
    if (subType !== 'PEA' && subType !== 'PEA_PME') return false;
    return !this.peaUnder5Years();
  });

  protected readonly peaOver5yWithdrawal = computed(() =>
    this.isPeaOver5Years() &&
    this.selectedType() === 'WITHDRAWAL' &&
    !this.peaWithdrawalForcedClosure()
  );

  protected readonly withdrawalBlocked = computed(() =>
    this.isPeaUnder5Years() && this.hasHoldings()
  );

  protected readonly peaWithdrawalForcedClosure = computed(() =>
    this.isPeaUnder5Years() &&
    !this.hasHoldings() &&
    this.selectedType() === 'WITHDRAWAL'
  );

  protected readonly CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;

  protected readonly loading    = signal(false);
  protected readonly error      = signal<string | null>(null);
  protected readonly peaSummary = signal<PeaSummary | null>(null);

  protected readonly transferMode = signal<'internal' | 'external'>('internal');

  protected readonly availableTransactionTypes = computed(() => {
    const accountType = this.accountType();
    const key = ACCOUNT_CATEGORY[accountType] === 'investments' ? 'INVESTMENT' : accountType;
    const allowed = ALLOWED_TX_TYPES[key] ?? [];
    return ALL_TRANSACTION_TYPES.filter(t => allowed.includes(t.value));
  });

  protected readonly selectedTypeLabel = computed(() => {
    const type = this.selectedType();
    return this.availableTransactionTypes().find(t => t.value === type)?.label ?? '';
  });

  protected readonly showTransferForm = computed(() =>
    this.selectedType() === 'TRANSFER'
  );

  protected readonly useDropdownForTypes = computed(() =>
    this.accountType() === 'CASH_ACCOUNT'
  );

  protected readonly isInvestmentAccount = computed(() =>
    ACCOUNT_CATEGORY[this.accountType()] === 'investments'
  );

  protected readonly showExternalOption = computed(() =>
    this.accountType() === 'CASH_ACCOUNT' ||
    this.accountType() === 'CRYPTO_WALLET'
  );

  protected readonly availableBalance = computed(() => {
    const account = this.accountService.accounts()
      .find(a => a.id === this.accountId());
    return account?.balance ?? 0;
  });

  protected readonly destinationAccounts = computed(() => {
    const current    = this.accountId();
    const sourceType = this.accountType();
    const all        = this.accountService.accounts()
      .filter(a => a.id !== current && a.status !== 'CLOSED');

    if (ACCOUNT_CATEGORY[sourceType] === 'investments') {
      return [];
    }
    switch (sourceType) {
      case 'SAVINGS_ACCOUNT':
        return all.filter(a => a.accountType === 'CASH_ACCOUNT');
      case 'CRYPTO_WALLET':
        return all.filter(a =>
          a.accountType === 'CASH_ACCOUNT' || a.accountType === 'CRYPTO_WALLET'
        );
      default:
        return all;
    }
  });

  protected readonly linkedCheckingAccount = computed(() => {
    if (!this.isInvestmentAccount()) return null;
    const account = this.accountService.accounts()
      .find(a => a.id === this.accountId());
    if (!account?.linkedCheckingAccountId) return null;
    return this.accountService.accounts()
      .find(a => a.id === account.linkedCheckingAccountId) ?? null;
  });

  protected readonly peaCapacityInfo = computed(() => {
    if (!this.isInvestmentAccount()) return null;
    const account = this.accountService.accounts()
      .find(a => a.id === this.accountId());
    if (!account) return null;
    return {
      totalDeposits:     account.totalDeposits ?? 0,
      remainingCapacity: account.remainingCapacity ?? 0,
    };
  });

  protected readonly selectedDestinationAccount = computed(() => {
    const id = this.formValue().toAccountId;
    if (!id) return null;
    return this.accountService.accounts().find(a => a.id === id) ?? null;
  });

  protected readonly destinationCapacityInfo = computed(() => {
    const dest = this.selectedDestinationAccount();
    if (!dest) return null;
    if (dest.depositLimit == null || dest.depositLimit === 0) return null;
    const isPea = dest.subType === 'PEA' || dest.subType === 'PEA_PME';
    return {
      label:     isPea ? 'PEA deposited' : 'Balance',
      current:   dest.totalDeposits ?? dest.balance,
      limit:     dest.depositLimit,
      remaining: dest.remainingCapacity ?? 0,
    };
  });

  protected readonly typeConfirmed = signal(false);
  protected readonly typeDropdownOpen = signal(false);

  protected readonly peaTransferForcedClosure = computed(() =>
    this.isInvestmentAccount() &&
    this.isPeaUnder5Years() &&
    this.selectedType() === 'TRANSFER' &&
    !this.hasHoldings()
  );

  protected readonly peaTransferBlockedByHoldings = computed(() =>
    this.isInvestmentAccount() &&
    this.isPeaUnder5Years() &&
    this.selectedType() === 'TRANSFER' &&
    this.hasHoldings()
  );

  protected readonly step = signal<'form' | 'confirm'>('form');
  protected readonly selectedType = signal<TransactionType | ''>('');

  protected readonly requiresAsset = computed(() =>
    ['BUY', 'SELL'].includes(this.selectedType())
  );

  protected readonly requiresTicker = computed(() =>
    ['BUY', 'SELL', 'DIVIDEND'].includes(this.selectedType())
  );

  protected readonly form = this.fb.group({
    ticker:               [''],
    quantity:             [null as number | null],
    pricePerUnit:         [null as number | null],
    totalAmount:          [null as number | null],
    fees:                 [0],
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
    description:          [''],
    toAccountId:          [''],
    externalAddress:      [''],
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

  protected readonly todayIso = new Date().toISOString().split('T')[0];
  protected readonly currentDateValue = signal<string>(this.todayIso);

  protected readonly minDate = computed(() =>
    this.account()?.openedAt ?? null
  );

  protected readonly selectedDestinationId = signal<string>('');

  protected readonly transferMinDate = computed(() => {
    const fromDate = this.account()?.openedAt ?? null;
    const toId     = this.selectedDestinationId();
    if (!toId) return fromDate;
    const toAccount = this.accountService.accounts()
      .find(a => a.id === toId);
    const toDate = toAccount?.openedAt ?? null;
    if (!fromDate) return toDate;
    if (!toDate)   return fromDate;
    return fromDate > toDate ? fromDate : toDate;
  });

  protected readonly effectiveMinDate = computed(() =>
    this.selectedType() === 'TRANSFER'
      ? this.transferMinDate()
      : this.minDate()
  );

  protected readonly isFormValid = computed(() => {
    if (this.peaWithdrawalForcedClosure() || this.peaTransferForcedClosure()) {
      return (this.currentBalance() ?? 0) > 0;
    }

    if (this.peaTransferBlockedByHoldings()) return false;

    const type = this.selectedType();
    if (!type) return false;
    if (this.wouldExceedLimit()) return false;

    const v = this.formValue();
    const dateValid = !!v.date && this.form.get('date')?.valid !== false;

    if (type === 'TRANSFER') {
      if ((v.totalAmount ?? 0) <= 0 || !dateValid) return false;
      if (this.transferMode() === 'internal') return !!(v.toAccountId?.trim());
      return true;
    }

    if (type === 'BUY' || type === 'SELL') {
      const maxQty = this.maxSellQuantity();
      const qtyExceedsMax = type === 'SELL' && maxQty !== null && (v.quantity ?? 0) > maxQty;
      return !!(v.ticker?.trim()) &&
             (v.quantity ?? 0) > 0 &&
             !qtyExceedsMax &&
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

    effect(() => {
      const control = this.form.get('totalAmount');
      if (!control) return;
      if (this.peaWithdrawalForcedClosure() || this.peaTransferForcedClosure()) {
        control.setValue(this.currentBalance(), { emitEvent: false });
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const linked = this.linkedCheckingAccount();
      if (linked && this.selectedType() === 'TRANSFER' && this.isInvestmentAccount()) {
        this.form.get('toAccountId')?.setValue(linked.id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.error.set(null);
    this.loading.set(false);
    if (this.accountSubType() === 'PEA' || this.accountSubType() === 'PEA_PME') {
      this.accountService.getPeaSummary().subscribe(s => this.peaSummary.set(s));
    }
    this.form.get('toAccountId')?.valueChanges.subscribe(id => {
      this.selectedDestinationId.set(id ?? '');
      if (id) {
        this.resetDate();
        this.form.get('description')?.setValue(null);
      }
    });
  }

  protected onTypeChange(newType: TransactionType): void {
    this.selectedType.set(newType);
    this.typeConfirmed.set(true);
    this.typeDropdownOpen.set(false);

    const qtyControl = this.form.get('quantity');
    qtyControl?.setValidators([Validators.min(0.000001)]);
    this.form.patchValue({
      totalAmount:     null,
      quantity:        null,
      pricePerUnit:    null,
      ticker:          null,
      description:     null,
      toAccountId:     '',
      externalAddress: '',
      fees:            0,
    });
    qtyControl?.updateValueAndValidity({ emitEvent: false });
    this.selectedDestinationId.set('');
    this.transferMode.set('internal');
    this.resetDate();
  }

  protected selectType(value: string): void {
    this.onTypeChange(value as TransactionType);
  }

  protected selectTypeAndConfirm(value: string): void {
    this.onTypeChange(value as TransactionType);
  }

  protected changeType(): void {
    this.typeConfirmed.set(false);
    this.typeDropdownOpen.set(true);
  }

  protected closeTypeDropdown(): void {
    this.typeDropdownOpen.set(false);
    if (this.selectedType()) {
      this.typeConfirmed.set(true);
    }
  }

  protected onSellTickerChange(): void {
    const symbol = this.form.get('ticker')?.value as string;
    const holding = this.heldTickers().find(h => h.symbol === symbol);
    const max = holding?.quantity ?? null;
    const qtyControl = this.form.get('quantity');
    if (max !== null) {
      qtyControl?.setValidators([
        Validators.required,
        Validators.min(0.000001),
        Validators.max(max),
      ]);
    } else {
      qtyControl?.setValidators([Validators.min(0.000001)]);
    }
    qtyControl?.setValue(null);
    qtyControl?.updateValueAndValidity();
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

  private resetDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form.get('date')?.setValue(today);
    this.currentDateValue.set(today);
    this.datePicker?.resetToDate(today);
  }

  private validateDateBeforeSubmit(): boolean {
    const dateVal = this.form.get('date')?.value;
    const min     = this.effectiveMinDate();
    if (min && dateVal && dateVal < min) {
      this.toastService.error(
        `Date cannot be before ${new Date(min).toLocaleDateString('fr-FR')}`
      );
      return false;
    }
    return true;
  }

  protected onSubmit(): void {
    if (!this.isFormValid()) return;
    if (!this.validateDateBeforeSubmit()) return;

    if (this.peaWithdrawalForcedClosure() || this.peaTransferForcedClosure()) {
      this.peaClosureRequested.emit();
      return;
    }

    if (this.peaOver5yWithdrawal()) {
      const amount: number = this.form.get('totalAmount')!.value as number;
      this.peaOver5yWithdrawalRequested.emit(amount);
      return;
    }

    if (this.selectedType() === 'TRANSFER') {
      this.submitTransfer();
      return;
    }

    this.submitTransaction();
  }

  private submitTransfer(): void {
    const v = this.form.value;
    const request: TransferRequest = {
      fromAccountId:   this.accountId(),
      toAccountId:     this.transferMode() === 'internal'
                         ? (v.toAccountId || null)
                         : null,
      amount:          v.totalAmount!,
      currency:        this.transactionCurrency(),
      date:            v.date!,
      description:     v.description || null,
      externalAddress: this.transferMode() === 'external'
                         ? (v.externalAddress || null)
                         : null,
    };

    this.loading.set(true);
    this.accountService.executeTransfer(request).subscribe({
      next: () => {
        this.toastService.success('Transfer completed');
        this.created.emit({ type: 'TRANSFER', amount: request.amount });
        this.closed.emit();
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : err.error?.message ?? 'Failed to execute transfer';
        this.toastService.error(msg);
        this.loading.set(false);
      }
    });
  }

  private submitTransaction(): void {
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

    const payload = {
      type,
      ticker:          needsTicker ? v.ticker ?? undefined : undefined,
      quantity:        needsAsset  ? v.quantity ?? undefined : undefined,
      pricePerUnit:    needsAsset  ? v.pricePerUnit ?? undefined : undefined,
      totalAmount,
      currency:        this.transactionCurrency(),
      fees:            v.fees ?? 0,
      date:            v.date!,
      description:     v.description || undefined,
      externalAddress: v.externalAddress || undefined,
    };
    this.accountService.recordTransaction(this.accountId(), payload).subscribe({
      next: () => {
        this.created.emit({ type, amount: totalAmount });
        this.closed.emit();
      },
      error: (err) => {
        let message = 'Transaction failed. Please try again.';
        if (typeof err.error === 'string') {
          message = err.error;
        } else if (err.error?.message) {
          message = err.error.message;
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
