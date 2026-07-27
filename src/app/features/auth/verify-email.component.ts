import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { AuthHeaderComponent } from './auth-header.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, AuthHeaderComponent, TranslatePipe],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly translate   = inject(TranslateService);

  protected readonly state = signal<'pending' | 'verifying' | 'success' | 'error' | 'no-token'>('pending');
  protected readonly error  = signal<string | null>(null);
  protected readonly email  = signal<string | null>(null);
  protected readonly resent = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.email.set(email);

    if (token) {
      this.state.set('verifying');
      this.authService.verifyEmail(token).subscribe({
        next: () => this.state.set('success'),
        error: (err) => {
          this.error.set(err.error ?? this.translate.instant('auth.invalidOrExpiredToken'));
          this.state.set('error');
        },
      });
    } else {
      this.state.set('no-token');
    }
  }

  protected resendEmail(): void {
    const email = this.email();
    if (!email) return;
    this.authService.resendVerification(email).subscribe({
      next: () => this.resent.set(true),
    });
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
