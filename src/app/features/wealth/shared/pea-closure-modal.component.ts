import { Component, input, output, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FinancialAccount, PeaWithdrawalSimulation } from '../../../core/models/account.model';
import { UserCurrencyPipe } from '../../../shared/pipes/user-currency.pipe';

@Component({
  selector: 'app-pea-closure-modal',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, UserCurrencyPipe, TranslatePipe],
  templateUrl: './pea-closure-modal.component.html',
})
export class PeaClosureModalComponent {
  simulation = input.required<PeaWithdrawalSimulation>();
  loading    = input<boolean>(false);
  linkedCheckingAccount = input<FinancialAccount | null>(null);
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
