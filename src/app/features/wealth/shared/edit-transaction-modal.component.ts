import { Component, OnInit, input, output, inject, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { Transaction } from '../../../core/models/account.model';
import { ToastService } from '../../../shared/toast/toast.service';
import { normalizeTextOrUndefined } from '../../../core/utils/sanitize';

@Component({
  selector: 'app-edit-transaction-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './edit-transaction-modal.component.html',
})
export class EditTransactionModalComponent implements OnInit {
  accountId   = input.required<string>();
  transaction = input.required<Transaction>();
  closed      = output<void>();
  updated     = output<void>();

  private readonly accountService = inject(AccountService);
  private readonly toastService   = inject(ToastService);
  private readonly fb             = inject(FormBuilder);

  protected readonly loading   = signal(false);
  protected readonly submitted = signal(false);

  protected readonly liveQuantity     = signal<number>(0);
  protected readonly livePricePerUnit = signal<number>(0);
  protected readonly liveFees         = signal<number>(0);

  protected readonly isBuyOrSell = computed(() =>
    this.transaction().type === 'BUY' ||
    this.transaction().type === 'SELL'
  );

  protected readonly isSimpleAmount = computed(() =>
    ['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST']
      .includes(this.transaction().type)
  );

  private static readonly dateRangeValidator = (control: AbstractControl) => {
    const date = new Date(control.value);
    if (isNaN(date.getTime())) return { invalidDate: true };
    if (date.getFullYear() > 9999) return { invalidDate: true };
    if (date.getFullYear() < 1900) return { invalidDate: true };
    return null;
  };

  protected readonly form = computed(() => {
    const tx = this.transaction();
    return this.fb.group({
      totalAmount:  [tx.totalAmount,  [Validators.min(0.01)]],
      quantity:     [tx.quantity,     [Validators.min(0.0001)]],
      pricePerUnit: [tx.pricePerUnit, [Validators.min(0.01)]],
      date:         [tx.date,         [Validators.required, EditTransactionModalComponent.dateRangeValidator]],
      fees:         [tx.fees ?? 0,    [Validators.min(0)]],
      description:  [tx.description,  []],
    });
  });

  protected readonly computedTotal = computed(() => {
    const qty   = this.liveQuantity();
    const price = this.livePricePerUnit();
    const fees  = this.liveFees();
    const type  = this.transaction().type;
    const base  = qty * price;
    return type === 'BUY' ? base + fees : base - fees;
  });

  ngOnInit(): void {
    const f  = this.form();
    const tx = this.transaction();

    this.liveQuantity.set(Number(tx.quantity) || 0);
    this.livePricePerUnit.set(Number(tx.pricePerUnit) || 0);
    this.liveFees.set(Number(tx.fees) || 0);

    f.get('quantity')?.valueChanges.subscribe(v =>
      this.liveQuantity.set(Number(v) || 0)
    );
    f.get('pricePerUnit')?.valueChanges.subscribe(v =>
      this.livePricePerUnit.set(Number(v) || 0)
    );
    f.get('fees')?.valueChanges.subscribe(v =>
      this.liveFees.set(Number(v) || 0)
    );
  }

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form().get(field)?.invalid;
  }

  private _mouseDownOnBackdrop = false;

  protected onBackdropMouseDown(event: MouseEvent): void {
    this._mouseDownOnBackdrop = event.target === event.currentTarget;
  }

  protected onBackdropMouseUp(event: MouseEvent): void {
    if (this._mouseDownOnBackdrop && event.target === event.currentTarget) {
      this.closed.emit();
    }
    this._mouseDownOnBackdrop = false;
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    const f = this.form();

    if (this.isBuyOrSell()) {
      const qty   = this.liveQuantity();
      const price = this.livePricePerUnit();
      if (!qty || qty <= 0) {
        this.toastService.error('Quantity must be greater than zero');
        return;
      }
      if (!price || price <= 0) {
        this.toastService.error('Price per unit must be greater than zero');
        return;
      }
    } else {
      const amount = f.get('totalAmount')?.value;
      if (!amount || amount <= 0) {
        this.toastService.error('Amount must be greater than zero');
        return;
      }
    }

    if (!f.get('date')?.value) {
      this.toastService.error('Date is required');
      return;
    }

    const fees = f.get('fees')?.value ?? 0;
    if (fees < 0) {
      this.toastService.error('Brokerage fees cannot be negative');
      return;
    }

    this.loading.set(true);
    const v = f.getRawValue();

    const base = {
      date:        v.date!,
      fees:        v.fees ?? 0,
      description: normalizeTextOrUndefined(v.description),
    };

    const data = this.isBuyOrSell()
      ? { ...base, quantity: v.quantity ?? undefined, pricePerUnit: v.pricePerUnit ?? undefined }
      : { ...base, totalAmount: v.totalAmount ?? undefined };

    this.accountService.updateTransaction(
      this.accountId(),
      this.transaction().id,
      data
    ).subscribe({
      next: () => {
        this.toastService.success('Transaction updated successfully');
        this.updated.emit();
        this.closed.emit();
      },
      error: () => {
        this.toastService.error('Failed to update transaction. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
