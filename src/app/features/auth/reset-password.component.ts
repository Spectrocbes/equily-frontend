import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);

  protected readonly token   = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Invalid reset link. Please request a new one.');
      return;
    }
    this.token.set(token);
  }

  protected onSubmit(): void {
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    this.error.set(null);
    this.authService.resetPassword(this.token()!, this.form.value.password!).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.error.set(err.error ?? 'Invalid or expired link.');
        this.loading.set(false);
      },
    });
  }

  private passwordsMatch(group: AbstractControl) {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordsMismatch: true };
  }
}
