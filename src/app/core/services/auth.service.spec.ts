import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { AuthResponse } from '../models/auth.model';
import { UserPreferences } from '../models/account.model';

const mockPreferences: UserPreferences = {
  currency: 'EUR',
  locale: 'fr',
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF'],
};

const ACCESS_TOKEN_KEY  = 'equily_access_token';
const REFRESH_TOKEN_KEY = 'equily_refresh_token';

const mockAuthResponse: AuthResponse = {
  accessToken: 'header.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJkaXNwbGF5TmFtZSI6IlRlc3QgVXNlciIsImV4cCI6OTk5OTk5OTk5OX0.sig',
  refreshToken: 'refresh-token-value',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login stores tokens and sets currentUser', () => {
    service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
    const req = httpMock.expectOne('/auth/login');
    req.flush(mockAuthResponse);
    httpMock.expectOne('/api/v1/preferences').flush(mockPreferences);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe(mockAuthResponse.accessToken);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe(mockAuthResponse.refreshToken);
    expect(service.currentUser()).toEqual({
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('logout clears tokens and navigates to /login', () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, mockAuthResponse.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, mockAuthResponse.refreshToken);
    service['_currentUser'].set({ email: 'test@example.com', displayName: 'Test User' });

    const navigateSpy = jest.spyOn(router, 'navigate');
    service.logout();

    const req = httpMock.expectOne('/auth/logout');
    req.flush({});

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('logout calls accountService.reset', () => {
    const accountService = TestBed.inject(AccountService);
    const resetSpy = jest.spyOn(accountService, 'reset');
    service.logout();
    expect(resetSpy).toHaveBeenCalled();
  });

  it('isAuthenticated returns false when no token stored', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when valid token stored and user set', () => {
    service['_currentUser'].set({ email: 'test@example.com', displayName: 'Test User' });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('register stores tokens and sets currentUser', () => {
    service.register({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    }).subscribe();
    const req = httpMock.expectOne('/auth/register');
    req.flush(mockAuthResponse);
    httpMock.expectOne('/api/v1/preferences').flush(mockPreferences);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe(mockAuthResponse.accessToken);
    expect(service.currentUser()?.email).toBe('test@example.com');
  });

  it('loadCurrentUser fetches /auth/me and loads preferences when token exists', () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, mockAuthResponse.accessToken);
    service.loadCurrentUser();
    const meReq = httpMock.expectOne('/auth/me');
    meReq.flush({ email: 'test@example.com', displayName: 'Test User' });
    httpMock.expectOne('/api/v1/preferences').flush(mockPreferences);

    expect(service.currentUser()).toEqual({
      email: 'test@example.com',
      displayName: 'Test User',
    });
  });

  it('loadCurrentUser does nothing when no token', () => {
    service.loadCurrentUser();
    httpMock.expectNone('/auth/me');
  });

  it('verifyEmail calls POST /auth/verify-email with token', () => {
    service.verifyEmail('abc123').subscribe();
    const req = httpMock.expectOne('/auth/verify-email');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'abc123' });
    req.flush(null);
  });

  it('resendVerification calls POST /auth/resend-verification with email', () => {
    service.resendVerification('test@example.com').subscribe();
    const req = httpMock.expectOne('/auth/resend-verification');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);
  });

  it('forgotPassword calls POST /auth/forgot-password with email', () => {
    service.forgotPassword('test@example.com').subscribe();
    const req = httpMock.expectOne('/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);
  });

  it('resetPassword calls POST /auth/reset-password with token and newPassword', () => {
    service.resetPassword('tok123', 'newPass!1').subscribe();
    const req = httpMock.expectOne('/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok123', newPassword: 'newPass!1' });
    req.flush(null);
  });
});
