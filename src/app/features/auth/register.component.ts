import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);

  protected readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email:       ['', [Validators.required, Validators.email]],
    password:    ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { displayName, email, password } = this.form.getRawValue();
    this.authService.register({
      displayName: displayName!,
      email: email!,
      password: password!,
    }).subscribe({
      next: () => this.router.navigate(
        ['/verify-email'],
        { queryParams: { email: email! } }
      ),
      error: (err) => {
        this.error.set(
          err.status === 409
            ? 'An account with this email already exists'
            : 'Registration failed. Please try again.'
        );
        this.loading.set(false);
      },
    });
  }
}
