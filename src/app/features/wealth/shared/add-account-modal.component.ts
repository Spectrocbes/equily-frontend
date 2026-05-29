import { Component, output, input, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { AccountService } from '../../../core/services/account.service';
import { AccountType } from '../../../core/models/account.model';

@Component({
  selector: 'app-add-account-modal',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './add-account-modal.component.html',
})
export class AddAccountModalComponent {
  closed = output<void>();
  created = output<void>();
  allowedTypes = input<AccountType[] | null>(null);

  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  protected readonly loading = this.accountService.modalLoading;
  protected readonly error = this.accountService.modalError;

  protected readonly step = signal<1 | 2>(1);

  private readonly accountTypes: { value: AccountType; label: string }[] = [
    { value: 'PEA', label: 'PEA — Plan Épargne Actions' },
    { value: 'PEA_PME', label: 'PEA PME' },
    { value: 'COMPTE_TITRES', label: 'Compte Titres Ordinaire' },
    { value: 'PER', label: 'PER — Plan Épargne Retraite' },
    { value: 'ASSURANCE_VIE', label: 'Assurance Vie' },
    { value: 'SAVINGS_ACCOUNT', label: 'Livret (A, LDDS, LEP...)' },
    { value: 'CASH_ACCOUNT', label: 'Compte Courant' },
    { value: 'CRYPTO_WALLET', label: 'Crypto Wallet' },
  ];

  protected readonly filteredAccountTypes = computed(() => {
    const allowed = this.allowedTypes();
    return allowed
      ? this.accountTypes.filter(t => allowed.includes(t.value))
      : this.accountTypes;
  });

  protected readonly brokerSuggestions: string[] = [
    'Fortuneo', 'BoursoBank', 'BNP Paribas', 'Société Générale',
    'Crédit Mutuel', 'Crédit Agricole', 'LCL', 'La Banque Postale',
    'Caisse d\'Épargne', 'BRED', 'ING', 'Hello bank!',
    'Degiro', 'Trade Republic', 'Saxo Bank', 'Interactive Brokers',
    'Binance', 'Coinbase', 'Kraken',
  ];

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    accountType: ['', Validators.required],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    broker: ['', Validators.required],
  });

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected nextStep(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.step.set(2);
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const { name, accountType, initialBalance, broker } = this.form.getRawValue();
    this.accountService.createAccount({
      name: name!,
      accountType: accountType as AccountType,
      initialBalance: initialBalance!,
      currency: 'EUR',
      broker: broker!,
    }).subscribe({
      next: () => {
        this.created.emit();
        this.closed.emit();
      },
      error: () => {
        // error already set in service via tap — modal stays open to show message
      },
    });
  }
}
