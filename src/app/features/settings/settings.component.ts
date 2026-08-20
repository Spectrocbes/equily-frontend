import { Component, inject, signal } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CURRENCY_SYMBOLS } from '../../core/models/account.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly preferencesService = inject(PreferencesService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly preferences = this.preferencesService.preferences;
  protected readonly loading = signal(false);
  protected readonly localeLoading = signal(false);
  protected readonly CURRENCY_SYMBOLS = CURRENCY_SYMBOLS;
  protected readonly selectedCurrency = signal(this.preferencesService.currency());
  protected readonly currentLocale = this.preferencesService.locale;
  protected readonly activeSection =
    signal<'currency' | 'language'>('currency');

  protected readonly sections = [
    { id: 'currency' as const, labelKey: 'settings.navCurrency' },
    { id: 'language' as const, labelKey: 'settings.locale'      },
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
          this.toastService.success(this.translate.instant('settings.saved'));
          this.loading.set(false);
        },
        error: () => {
          this.toastService.error(this.translate.instant('settings.saveFailed'));
          this.loading.set(false);
        },
      });
  }

  protected setLocale(locale: string): void {
    this.localeLoading.set(true);
    this.preferencesService
      .update(this.preferencesService.currency(), locale)
      .subscribe({
        next: () => {
          this.toastService.success(this.translate.instant('settings.saved'));
          this.localeLoading.set(false);
        },
        error: () => {
          this.toastService.error(this.translate.instant('common.error'));
          this.localeLoading.set(false);
        },
      });
  }
}
