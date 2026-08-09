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

  protected readonly loading       = signal(false);
  protected readonly googleLoading = signal(false);
  protected readonly error         = signal<string | null>(null);
  protected readonly submitted     = signal(false);

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

  protected async onSubmit(): Promise<void> {
    this.onEmailBlur();
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    try {
      await this.authService.loginWithEmail(normalizeEmail(email), password!);
      this.router.navigate(['/overview']);
    } catch (err: unknown) {
      this.error.set(this.firebaseErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async loginWithGoogle(): Promise<void> {
    this.googleLoading.set(true);
    this.error.set(null);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/overview']);
    } catch {
      this.error.set(this.translate.instant('auth.googleError'));
    } finally {
      this.googleLoading.set(false);
    }
  }

  private firebaseErrorMessage(err: unknown): string {
    const code = err instanceof Object && 'code' in err ? String((err as { code: unknown }).code) : '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return this.translate.instant('auth.invalidCredentials');
      case 'auth/too-many-requests':
        return this.translate.instant('auth.tooManyRequests');
      default:
        return this.translate.instant('auth.loginFailed');
    }
  }
}
