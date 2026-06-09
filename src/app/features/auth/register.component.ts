import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthHeaderComponent } from './auth-header.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb                 = inject(FormBuilder);
  private readonly authService        = inject(AuthService);
  private readonly preferencesService = inject(PreferencesService);
  private readonly toastService       = inject(ToastService);
  private readonly router             = inject(Router);

  protected readonly step      = signal<1 | 2>(1);
  protected readonly loading   = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly rightPanelItems = [
    'All account types — stocks, ETFs, crypto, savings',
    'Broker CSV import — no manual entry',
    'Holdings, P&L, and fee tracking',
    'Multi-user with strict data isolation',
    'Dark mode included',
  ];

  protected readonly currencies = [
    { code: 'EUR', label: 'Euro',           symbol: '€'   },
    { code: 'USD', label: 'US Dollar',      symbol: '$'   },
    { code: 'GBP', label: 'British Pound',  symbol: '£'   },
    { code: 'CHF', label: 'Swiss Franc',    symbol: 'CHF' },
  ];

  protected readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly preferencesForm = this.fb.group({
    currency: ['EUR', Validators.required],
    locale:   ['fr',  Validators.required],
  });

  protected nextStep(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.submitted.set(false);
    this.step.set(2);
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    if (this.preferencesForm.invalid) return;
    this.loading.set(true);

    const { displayName, email, password } = this.form.getRawValue();
    const { currency, locale } = this.preferencesForm.getRawValue();

    this.authService.register({
      displayName: displayName!,
      email: email!,
      password: password!,
    }).pipe(
      switchMap(() => this.preferencesService.update(currency!, locale!))
    ).subscribe({
      next: () => this.router.navigate(
        ['/verify-email'],
        { queryParams: { email: email! } }
      ),
      error: (err) => {
        this.toastService.error(
          err.status === 409
            ? 'An account with this email already exists'
            : (err.error ?? 'Registration failed. Please try again.')
        );
        this.loading.set(false);
      },
    });
  }
}
