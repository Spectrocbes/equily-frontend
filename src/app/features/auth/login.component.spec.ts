import { buildFirebaseAuthMock } from '../../../testing/firebase-mock';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => buildFirebaseAuthMock());

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'overview', redirectTo: '' }]),
        provideTestTranslations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    authService = TestBed.inject(AuthService);
    useTestTranslations();
    fixture.detectChanges();
  });

  function fillForm(email: string, password: string): void {
    const emailInput    = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('renders the login form and a Google button', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
    expect(el.querySelector('button[type="button"]')).toBeTruthy();
  });

  it('calls authService.loginWithEmail on valid submit', async () => {
    const loginSpy = jest.spyOn(authService, 'loginWithEmail').mockResolvedValue(undefined);
    fillForm('test@example.com', 'password');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('navigates to /overview on successful login', async () => {
    jest.spyOn(authService, 'loginWithEmail').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    fillForm('test@example.com', 'password');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/overview']);
  });

  it('shows a translated error message on invalid credentials', async () => {
    jest.spyOn(authService, 'loginWithEmail').mockRejectedValue({ code: 'auth/invalid-credential' });
    fillForm('test@example.com', 'wrong');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid email or password');
  });

  it('shows a rate-limit message on auth/too-many-requests', async () => {
    jest.spyOn(authService, 'loginWithEmail').mockRejectedValue({ code: 'auth/too-many-requests' });
    fillForm('test@example.com', 'wrong');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Too many login attempts');
  });

  it('sends a normalized (lowercased, trimmed) email on submit', async () => {
    const loginSpy = jest.spyOn(authService, 'loginWithEmail').mockResolvedValue(undefined);
    fixture.componentInstance['form'].setValue({
      email: '  Test@EXAMPLE.com  ',
      password: 'password',
    });

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(loginSpy).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('onEmailBlur normalizes the visible input value', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = '  Test@EXAMPLE.com  ';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.value).toBe('test@example.com');
    expect(emailInput.value).toBe('test@example.com');
  });

  it('calls authService.loginWithGoogle and navigates on click', async () => {
    const googleSpy = jest.spyOn(authService, 'loginWithGoogle').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    const googleBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    googleBtn.click();
    await fixture.whenStable();

    expect(googleSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/overview']);
  });

  it('shows a Google error toast-style message when the popup fails', async () => {
    jest.spyOn(authService, 'loginWithGoogle').mockRejectedValue(new Error('popup closed'));

    await fixture.componentInstance['loginWithGoogle']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Google sign-in failed');
  });
});
