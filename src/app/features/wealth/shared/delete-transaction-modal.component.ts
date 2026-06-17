import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';

@Component({
  selector: 'app-delete-transaction-modal',
  standalone: true,
  imports: [DatePipe, UserCurrencyPipe],
  templateUrl: './delete-transaction-modal.component.html',
})
export class DeleteTransactionModalComponent {
  transactionType   = input.required<string>();
  transactionDate   = input.required<string>();
  transactionAmount = input.required<number>();
  loading           = input<boolean>(false);
  confirmed         = output<void>();
  closed            = output<void>();

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
}
