import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthHeaderComponent } from './auth-header.component';
import { normalizeEmail, normalizeTextOrUndefined } from '../../core/utils/sanitize';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent, TranslatePipe],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb           = inject(FormBuilder);
  private readonly authService  = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router       = inject(Router);
  private readonly translate    = inject(TranslateService);

  protected readonly loading       = signal(false);
  protected readonly googleLoading = signal(false);
  protected readonly submitted     = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
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

    const { displayName, email, password } = this.form.getRawValue();
    const normalizedEmail = normalizeEmail(email);
    const trimmedDisplayName = normalizeTextOrUndefined(displayName) ?? '';

    try {
      await this.authService.registerWithEmail(normalizedEmail, password!, trimmedDisplayName);
      this.router.navigate(['/overview']);
    } catch (err: unknown) {
      this.toastService.error(this.firebaseErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async registerWithGoogle(): Promise<void> {
    this.googleLoading.set(true);
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/overview']);
    } catch {
      this.toastService.error(this.translate.instant('auth.googleError'));
    } finally {
      this.googleLoading.set(false);
    }
  }

  private firebaseErrorMessage(err: unknown): string {
    const code = err instanceof Object && 'code' in err ? String((err as { code: unknown }).code) : '';
    if (code === 'auth/email-already-in-use') {
      return this.translate.instant('auth.accountExists');
    }
    return this.translate.instant('auth.registrationFailed');
  }
}
