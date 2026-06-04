import { Component, input, output, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { Transaction } from '../../../core/models/account.model';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-edit-transaction-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './edit-transaction-modal.component.html',
})
export class EditTransactionModalComponent {
  accountId   = input.required<string>();
  transaction = input.required<Transaction>();
  closed      = output<void>();
  updated     = output<void>();

  private readonly accountService = inject(AccountService);
  private readonly toastService   = inject(ToastService);
  private readonly fb             = inject(FormBuilder);

  protected readonly loading   = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = computed(() => {
    const tx = this.transaction();
    return this.fb.group({
      totalAmount:  [tx.totalAmount,  [Validators.required, Validators.min(0.01)]],
      date:         [tx.date,         [Validators.required]],
      fees:         [tx.fees ?? 0,    [Validators.min(0)]],
      quantity:     [tx.quantity,     []],
      pricePerUnit: [tx.pricePerUnit, []],
      description:  [tx.description,  []],
    });
  });

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
    if (f.invalid) return;
    this.loading.set(true);
    const v = f.getRawValue();
    this.accountService.updateTransaction(
      this.accountId(),
      this.transaction().id,
      {
        totalAmount:  v.totalAmount!,
        date:         v.date!,
        fees:         v.fees ?? 0,
        quantity:     v.quantity ?? undefined,
        pricePerUnit: v.pricePerUnit ?? undefined,
        description:  v.description ?? undefined,
      }
    ).subscribe({
      next: () => {
        this.toastService.success('Transaction updated successfully');
        this.updated.emit();
        this.closed.emit();
      },
      error: (err) => {
        const msg = typeof err.error === 'string'
          ? err.error
          : 'Failed to update transaction';
        this.toastService.error(msg);
        this.loading.set(false);
      },
    });
  }
}
