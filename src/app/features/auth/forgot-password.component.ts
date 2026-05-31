import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly sent    = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
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
