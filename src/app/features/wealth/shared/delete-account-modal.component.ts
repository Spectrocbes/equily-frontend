import { Component, input, output } from '@angular/core';
import { FinancialAccount, ACCOUNT_SUB_TYPE_LABELS } from '../../../core/models/account.model';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [],
  templateUrl: './delete-account-modal.component.html',
})
export class DeleteAccountModalComponent {
  account = input.required<FinancialAccount>();
  loading = input<boolean>(false);

  confirmed = output<void>();
  closed    = output<void>();

  protected readonly ACCOUNT_SUB_TYPE_LABELS = ACCOUNT_SUB_TYPE_LABELS;

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
