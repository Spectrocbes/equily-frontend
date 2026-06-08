import { Component, inject, signal } from '@angular/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CURRENCY_SYMBOLS } from '../../core/models/account.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);

  protected readonly preferences = this.preferencesService.preferences;
  protected readonly loading = signal(false);
  protected readonly CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;
  protected readonly selectedCurrency = signal(this.preferencesService.currency());
  protected readonly activeSection = signal<'currency' | 'appearance' | 'notifications'>('currency');

  protected readonly sections = [
    { id: 'currency'      as const, label: 'Currency'      },
    { id: 'appearance'    as const, label: 'Appearance'    },
    { id: 'notifications' as const, label: 'Notifications' },
  ];

  protected selectCurrency(currency: string): void {
    this.selectedCurrency.set(currency);
  }

  protected save(): void {
    this.loading.set(true);
    this.preferencesService
      .update(this.selectedCurrency(), this.preferences().locale)
      .subscribe({
        next: () => {
          this.toastService.success('Preferences saved');
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error('Failed to save preferences');
          this.loading.set(false);
        },
      });
  }
}
