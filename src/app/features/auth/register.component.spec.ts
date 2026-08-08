import { buildFirebaseAuthMock } from '../../../testing/firebase-mock';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => buildFirebaseAuthMock());

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'overview', redirectTo: '' }]),
        provideTestTranslations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    authService = TestBed.inject(AuthService);
    useTestTranslations();
    fixture.detectChanges();
  });

  function fillForm(displayName: string, email: string, password: string): void {
    fixture.componentInstance['form'].setValue({ displayName, email, password });
  }

  it('renders displayName + email + password fields and a Google button', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input#displayName')).toBeTruthy();
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.querySelector('button[type="button"]')).toBeTruthy();
  });

  it('does not call registerWithEmail when the form is invalid', async () => {
    const registerSpy = jest.spyOn(authService, 'registerWithEmail').mockResolvedValue(undefined);
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();
    expect(registerSpy).not.toHaveBeenCalled();
  });

  it('onSubmit calls authService.registerWithEmail with normalized fields', async () => {
    const registerSpy = jest.spyOn(authService, 'registerWithEmail').mockResolvedValue(undefined);
    fillForm('  John Doe  ', '  John@EXAMPLE.com  ', 'password123');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(registerSpy).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe');
  });

  it('navigates to /overview after successful registration', async () => {
    jest.spyOn(authService, 'registerWithEmail').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    fillForm('John Doe', 'john@example.com', 'password123');

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith(['/overview']);
  });

  it('shows a toast on auth/email-already-in-use', async () => {
    jest.spyOn(authService, 'registerWithEmail').mockRejectedValue({ code: 'auth/email-already-in-use' });
    const toastService = TestBed.inject(ToastService);
    jest.spyOn(toastService, 'error');
    fillForm('John Doe', 'john@example.com', 'password123');

    await fixture.componentInstance['onSubmit']();

    expect(toastService.error).toHaveBeenCalledWith('An account with this email already exists.');
    expect(fixture.componentInstance['loading']()).toBe(false);
  });

  it('shows a generic failure toast on other errors', async () => {
    jest.spyOn(authService, 'registerWithEmail').mockRejectedValue({ code: 'auth/network-request-failed' });
    const toastService = TestBed.inject(ToastService);
    jest.spyOn(toastService, 'error');
    fillForm('John Doe', 'john@example.com', 'password123');

    await fixture.componentInstance['onSubmit']();

    expect(toastService.error).toHaveBeenCalledWith('Registration failed. Please try again.');
  });

  it('onEmailBlur normalizes the visible input value', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = '  John@EXAMPLE.com  ';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.value).toBe('john@example.com');
  });

  it('calls authService.loginWithGoogle and navigates on Google button click', async () => {
    const googleSpy = jest.spyOn(authService, 'loginWithGoogle').mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    const googleBtn = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    googleBtn.click();
    await fixture.whenStable();

    expect(googleSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/overview']);
  });

  it('shows a toast when Google sign-up fails', async () => {
    jest.spyOn(authService, 'loginWithGoogle').mockRejectedValue(new Error('popup closed'));
    const toastService = TestBed.inject(ToastService);
    jest.spyOn(toastService, 'error');

    await fixture.componentInstance['registerWithGoogle']();

    expect(toastService.error).toHaveBeenCalledWith('Google sign-in failed. Please try again.');
  });
});
