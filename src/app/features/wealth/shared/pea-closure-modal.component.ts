import { Component, input, output, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { PeaWithdrawalSimulation } from '../../../core/models/account.model';

@Component({
  selector: 'app-pea-closure-modal',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './pea-closure-modal.component.html',
})
export class PeaClosureModalComponent {
  simulation = input.required<PeaWithdrawalSimulation>();
  loading    = input<boolean>(false);
  confirmed  = output<void>();
  closed     = output<void>();

  protected readonly taxDetailsOpen = signal(false);

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
