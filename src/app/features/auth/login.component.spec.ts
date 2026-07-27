import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

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
    useTestTranslations();
    fixture.detectChanges();
  });

  it('renders the login form', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    expect(el.querySelector('input[type="password"]')).toBeTruthy();
    expect(el.querySelector('button[type="submit"]')).toBeTruthy();
  });

  it('submit button is enabled when form is invalid (errors shown on submit)', () => {
    const btn = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls authService.login on valid submit', () => {
    const authService = TestBed.inject(AuthService);
    const loginSpy = jest.spyOn(authService, 'login').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'test@example.com', displayName: 'Test',
    }));

    const emailInput    = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
    emailInput.value    = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
  });

  it('shows error message on 401', () => {
    const authService = TestBed.inject(AuthService);
    jest.spyOn(authService, 'login').mockReturnValue(
      throwError(() => ({ status: 401 }))
    );

    const emailInput    = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
    emailInput.value    = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invalid email or password');
  });

  it('sends a normalized (lowercased, trimmed) email on submit', () => {
    const authService = TestBed.inject(AuthService);
    const loginSpy = jest.spyOn(authService, 'login').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'test@example.com', displayName: 'Test',
    }));

    fixture.componentInstance['form'].setValue({
      email: '  Test@EXAMPLE.com  ',
      password: 'password',
    });
    fixture.nativeElement.querySelector('button[type="submit"]').click();

    expect(loginSpy).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
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

  it('navigates to /overview on successful login', () => {
    const authService = TestBed.inject(AuthService);
    const router      = TestBed.inject(Router);
    jest.spyOn(authService, 'login').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'test@example.com', displayName: 'Test',
    }));
    const navigateSpy = jest.spyOn(router, 'navigate');

    const emailInput    = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = fixture.nativeElement.querySelector('input[type="password"]') as HTMLInputElement;
    emailInput.value    = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = 'password';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[type="submit"]').click();
    expect(navigateSpy).toHaveBeenCalledWith(['/overview']);
  });
});
