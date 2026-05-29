import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (err) => {
        this.error.set(
          err.status === 401
            ? 'Invalid email or password'
            : 'Login failed. Please try again.'
        );
        this.loading.set(false);
      },
    });
  }
}
