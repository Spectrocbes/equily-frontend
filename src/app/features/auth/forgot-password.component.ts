import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent],
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

  protected onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.sent.set(true);
        this.loading.set(false);
      },
      error: () => {
        // Always show success — don't reveal whether the email exists
        this.sent.set(true);
        this.loading.set(false);
      },
    });
  }
}
