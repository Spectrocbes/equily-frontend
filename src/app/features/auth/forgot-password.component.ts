import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';
import { normalizeEmail } from '../../core/utils/sanitize';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent, TranslatePipe],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly loading    = signal(false);
  protected readonly sent       = signal(false);
  protected readonly submitted  = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
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
    try {
      await this.authService.resetPassword(normalizeEmail(this.form.value.email));
    } catch {
      // Always show success — don't reveal whether the email exists
    } finally {
      this.sent.set(true);
      this.loading.set(false);
    }
  }
}
