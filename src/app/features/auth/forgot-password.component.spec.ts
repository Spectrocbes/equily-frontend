import { buildFirebaseAuthMock } from '../../../testing/firebase-mock';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => buildFirebaseAuthMock());

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../core/services/auth.service';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('ForgotPasswordComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ForgotPasswordComponent>>;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTestTranslations(),
      ],
    });
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    authService = TestBed.inject(AuthService);
    useTestTranslations();
    fixture.detectChanges();
  });

  it('shows the form by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Reset your password');
  });

  it('shows sent state after successful submit', async () => {
    jest.spyOn(authService, 'resetPassword').mockResolvedValue(undefined);
    fixture.componentInstance['form'].setValue({ email: 'test@example.com' });
    fixture.componentInstance['onSubmit']();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Check your email');
  });

  it('sends a normalized (lowercased, trimmed) email on submit', async () => {
    const resetSpy = jest.spyOn(authService, 'resetPassword').mockResolvedValue(undefined);
    fixture.componentInstance['form'].setValue({ email: '  Test@EXAMPLE.com  ' });
    fixture.componentInstance['onSubmit']();
    await fixture.whenStable();
    expect(resetSpy).toHaveBeenCalledWith('test@example.com');
  });

  it('onEmailBlur normalizes the visible input value', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = '  Test@EXAMPLE.com  ';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.value).toBe('test@example.com');
  });

  it('shows sent state even on error (never reveals whether email exists)', async () => {
    jest.spyOn(authService, 'resetPassword').mockRejectedValue({ code: 'auth/user-not-found' });
    fixture.componentInstance['form'].setValue({ email: 'unknown@example.com' });
    fixture.componentInstance['onSubmit']();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Check your email');
  });
});
