import { Component, input, output, inject, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AccountService } from '../../core/services/account.service';
import {
  AccountType, TransactionType,
  ALLOWED_TRANSACTION_TYPES
} from '../../core/models/account.model';

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

  protected readonly requiresAsset = computed(() => {
    const t = this.form.get('type')?.value as TransactionType;
    return t === 'BUY' || t === 'SELL';
  });

  protected readonly isDividend = computed(() =>
    this.form.get('type')?.value === 'DIVIDEND'
  );

  protected readonly computedTotal = computed(() => {
    const qty = this.form.get('quantity')?.value;
    const price = this.form.get('pricePerUnit')?.value;
    if (qty && price && qty > 0 && price > 0) {
      return qty * price;
    }
    return null;
  });

  protected readonly form = this.fb.group({
    type:         ['', Validators.required],
    ticker:       [''],
    quantity:     [null as number | null],
    pricePerUnit: [null as number | null],
    totalAmount:  [null as number | null, [Validators.required, Validators.min(0.01)]],
    date:         [new Date().toISOString().split('T')[0], Validators.required],
    description:  [''],
  });

  constructor() {
    this.form.get('quantity')?.valueChanges.subscribe(() => this.updateTotal());
    this.form.get('pricePerUnit')?.valueChanges.subscribe(() => this.updateTotal());
  }

  private updateTotal(): void {
    const qty = this.form.get('quantity')?.value;
    const price = this.form.get('pricePerUnit')?.value;
    if (qty && price) {
      this.form.get('totalAmount')?.setValue(
        Math.round(qty * price * 100) / 100,
        { emitEvent: false }
      );
    }
  }

  private updateValidators(type: TransactionType): void {
    const ticker = this.form.get('ticker')!;
    const quantity = this.form.get('quantity')!;
    const pricePerUnit = this.form.get('pricePerUnit')!;
    const totalAmount = this.form.get('totalAmount')!;

    ticker.clearValidators();
    quantity.clearValidators();
    pricePerUnit.clearValidators();
    totalAmount.setValidators([Validators.required, Validators.min(0.01)]);

    if (type === 'BUY' || type === 'SELL') {
      ticker.setValidators([Validators.required, Validators.minLength(1)]);
      quantity.setValidators([Validators.required, Validators.min(0.00000001)]);
      pricePerUnit.setValidators([Validators.required, Validators.min(0.01)]);
    } else if (type === 'DIVIDEND') {
      ticker.setValidators([Validators.required, Validators.minLength(1)]);
    }

    ticker.updateValueAndValidity();
    quantity.updateValueAndValidity();
    pricePerUnit.updateValueAndValidity();
    totalAmount.updateValueAndValidity();
  }

  protected onTypeChange(type: string): void {
    this.form.get('type')?.setValue(type);
    this.form.patchValue({
      ticker: '',
      quantity: null,
      pricePerUnit: null,
      totalAmount: null,
    });
    this.updateValidators(type as TransactionType);
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const type = v.type as TransactionType;
    const needsAsset = type === 'BUY' || type === 'SELL';
    const needsTicker = needsAsset || type === 'DIVIDEND';

    this.accountService.recordTransaction(this.accountId(), {
      type,
      ticker:        needsTicker ? v.ticker ?? undefined : undefined,
      quantity:      needsAsset  ? v.quantity ?? undefined : undefined,
      pricePerUnit:  needsAsset  ? v.pricePerUnit ?? undefined : undefined,
      priceCurrency: needsAsset  ? 'EUR' : undefined,
      totalAmount:   v.totalAmount!,
      totalCurrency: 'EUR',
      date: v.date!,
      description: v.description || undefined,
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
