import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';
import { normalizeEmail } from '../../core/utils/sanitize';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent, TranslatePipe],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly translate   = inject(TranslateService);

  protected readonly loading         = signal(false);
  protected readonly error           = signal<string | null>(null);
  protected readonly unverifiedEmail = signal<string | null>(null);
  protected readonly resendLoading   = signal(false);
  protected readonly resendSent      = signal(false);
  protected readonly submitted       = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected onEmailBlur(): void {
    const ctrl = this.form.get('email');
    ctrl?.setValue(normalizeEmail(ctrl.value), { emitEvent: false });
  }

  protected onSubmit(): void {
    this.onEmailBlur();
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.unverifiedEmail.set(null);
    this.resendSent.set(false);
    const { email, password } = this.form.getRawValue();
    const normalizedEmail = normalizeEmail(email);
    this.authService.login({ email: normalizedEmail, password: password! }).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => {
        if (err.status === 403) {
          this.unverifiedEmail.set(normalizedEmail);
          this.error.set(this.translate.instant('auth.pleaseVerifyEmail'));
        } else if (err.status === 401) {
          this.error.set(this.translate.instant('auth.invalidCredentials'));
        } else {
          this.error.set(this.translate.instant('auth.loginFailed'));
        }
        this.loading.set(false);
      },
    });
  }

  protected resendVerification(): void {
    const email = this.unverifiedEmail();
    if (!email) return;
    this.resendLoading.set(true);
    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendSent.set(true);
        this.resendLoading.set(false);
      },
      error: () => this.resendLoading.set(false),
    });
  }
}
