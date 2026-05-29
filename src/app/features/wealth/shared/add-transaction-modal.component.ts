import { Component, input, output, inject, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountService } from '../../../core/services/account.service';
import {
  AccountType, TransactionType,
  ALLOWED_TRANSACTION_TYPES
} from '../../../core/models/account.model';

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './add-transaction-modal.component.html',
})
export class AddTransactionModalComponent {
  accountId = input.required<string>();
  accountType = input.required<AccountType>();

  closed = output<void>();
  created = output<void>();

  private readonly fb = inject(FormBuilder);
  protected readonly accountService = inject(AccountService);

  protected readonly loading = this.accountService.modalLoading;
  protected readonly error = this.accountService.modalError;

  protected readonly allowedTypes = computed(() =>
    ALLOWED_TRANSACTION_TYPES[this.accountType()]
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
    ticker:       [''],
    quantity:     [null as number | null],
    pricePerUnit: [null as number | null],
    totalAmount:  [null as number | null],
    fees:         [0],
    date:         [new Date().toISOString().split('T')[0], Validators.required],
    description:  [''],
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly computedTotal = computed(() => {
    const v = this.formValue();
    const qty = v.quantity;
    const price = v.pricePerUnit;
    const fees = v.fees ?? 0;
    if (qty && price && qty > 0 && price > 0) {
      return Math.round((qty * price + fees) * 100) / 100;
    }
    return null;
  });

  protected readonly isFormValid = computed(() => {
    const type = this.selectedType();
    if (!type) return false;

    const v = this.formValue();
    const dateValid = !!v.date;

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

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  protected onSubmit(): void {
    if (!this.isFormValid()) return;
    const v = this.form.getRawValue();
    const type = this.selectedType() as TransactionType;
    const needsAsset = type === 'BUY' || type === 'SELL';
    const needsTicker = needsAsset || type === 'DIVIDEND';

    const totalAmount = needsAsset
      ? Math.round(((v.quantity! * v.pricePerUnit!) + (v.fees ?? 0)) * 100) / 100
      : v.totalAmount!;

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
        this.created.emit();
        this.closed.emit();
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }
}
