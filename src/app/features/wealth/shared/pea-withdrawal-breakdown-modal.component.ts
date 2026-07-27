import { Component, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { PeaWithdrawalSimulation } from '../../../core/models/account.model';

@Component({
  selector: 'app-pea-withdrawal-breakdown-modal',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, TranslatePipe],
  templateUrl: './pea-withdrawal-breakdown-modal.component.html',
})
export class PeaWithdrawalBreakdownModalComponent {
  simulation = input.required<PeaWithdrawalSimulation>();
  loading    = input<boolean>(false);
  confirmed  = output<void>();
  closed     = output<void>();

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
