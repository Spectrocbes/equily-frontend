import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FinancialAccount } from '../../../core/models/account.model';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './delete-account-modal.component.html',
})
export class DeleteAccountModalComponent {
  account = input.required<FinancialAccount>();
  loading = input<boolean>(false);

  confirmed = output<void>();
  closed    = output<void>();

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
