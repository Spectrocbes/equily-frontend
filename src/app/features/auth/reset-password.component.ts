import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthHeaderComponent, TranslatePipe],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly fb          = inject(FormBuilder);
  private readonly translate   = inject(TranslateService);

  protected readonly tokenState = signal<'validating' | 'valid' | 'invalid'>('validating');
  protected readonly token     = signal<string | null>(null);
  protected readonly loading   = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly success   = signal(false);
  protected readonly submitted = signal(false);

  protected showError(field: string): boolean {
    return this.submitted() && !!this.form.get(field)?.invalid;
  }

  protected readonly form = this.fb.group({
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordsMatch });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenState.set('invalid');
      this.error.set(this.translate.instant('auth.invalidResetLink'));
      return;
    }
    this.token.set(token);

    this.authService.validateResetToken(token).subscribe({
      next: () => this.tokenState.set('valid'),
      error: (err) => {
        this.tokenState.set('invalid');
        this.error.set(err.error ?? this.translate.instant('auth.invalidOrExpiredResetLink'));
      },
    });
  }

  protected onSubmit(): void {
    this.submitted.set(true);
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
        this.error.set(err.error ?? this.translate.instant('auth.invalidOrExpiredLink'));
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
