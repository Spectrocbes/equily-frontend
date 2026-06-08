import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import {
  AuthResponse, RegisterRequest,
  LoginRequest, CurrentUser
} from '../models/auth.model';
import { AccountService } from './account.service';
import { PreferencesService } from './preferences.service';

const ACCESS_TOKEN_KEY  = 'equily_access_token';
const REFRESH_TOKEN_KEY = 'equily_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http                = inject(HttpClient);
  private readonly router              = inject(Router);
  private readonly accountService      = inject(AccountService);
  private readonly preferencesService  = inject(PreferencesService);

  private readonly _currentUser = signal<CurrentUser | null>(
    this.loadStoredUser()
  );
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = () => this._currentUser() !== null;

  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>('/auth/register', request).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>('/auth/login', request).pipe(
      tap(res => this.handleAuthResponse(res))
    );
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post('/auth/logout', {}).subscribe();
    }
    this.accountService.reset();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    return this.http.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap(res => {
        localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      })
    );
  }

  verifyEmail(token: string) {
    return this.http.post<void>('/auth/verify-email', { token });
  }

  resendVerification(email: string) {
    return this.http.post<void>('/auth/resend-verification', { email });
  }

  forgotPassword(email: string) {
    return this.http.post<void>('/auth/forgot-password', { email });
  }

  validateResetToken(token: string) {
    return this.http.post<void>('/auth/validate-reset-token', { token });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<void>('/auth/reset-password', { token, newPassword });
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  loadCurrentUser(): void {
    const token = this.getAccessToken();
    if (!token) return;
    this.http.get<CurrentUser>('/auth/me').subscribe({
      next: (user) => {
        this._currentUser.set(user);
        this.preferencesService.load();
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }

  private handleAuthResponse(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    this._currentUser.set({ email: res.email, displayName: res.displayName });
    this.preferencesService.load();
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this._currentUser.set(null);
  }

  private loadStoredUser(): CurrentUser | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        return null;
      }
      return { email: payload.email, displayName: payload.displayName };
    } catch {
      return null;
    }
  }
}
