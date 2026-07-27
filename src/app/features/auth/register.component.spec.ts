import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { of, throwError } from 'rxjs';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'verify-email', redirectTo: '' }]),
        provideTestTranslations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    useTestTranslations();
    fixture.detectChanges();
  });

  it('shows step 1 by default', () => {
    expect(fixture.componentInstance['step']()).toBe(1);
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeTruthy();
  });

  it('nextStep() stays on step 1 when form is invalid', () => {
    fixture.componentInstance['nextStep']();
    expect(fixture.componentInstance['step']()).toBe(1);
  });

  it('nextStep() moves to step 2 when form is valid', () => {
    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    expect(fixture.componentInstance['step']()).toBe(2);
  });

  it('shows currency selector on step 2', () => {
    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Choose your currency');
    expect(fixture.nativeElement.textContent).toContain('EUR');
    expect(fixture.nativeElement.textContent).toContain('USD');
  });

  it('Back button returns to step 1', () => {
    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.detectChanges();
    const allBtns = Array.from(
      fixture.nativeElement.querySelectorAll('button[type="button"]')
    ) as HTMLButtonElement[];
    const backBtn = allBtns.find(b => b.textContent?.includes('Back'))!;
    backBtn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['step']()).toBe(1);
  });

  it('onSubmit calls authService.register then preferencesService.update', () => {
    const authService  = TestBed.inject(AuthService);
    const prefService  = TestBed.inject(PreferencesService);
    const registerSpy  = jest.spyOn(authService, 'register').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'john@example.com', displayName: 'John Doe',
    }));
    const updateSpy = jest.spyOn(prefService, 'update').mockReturnValue(of({
      currency: 'USD', locale: 'en',
      supportedCurrencies: ['EUR', 'USD'], eurToTargetRate: 1.1,
    }));

    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.componentInstance['preferencesForm'].patchValue({ currency: 'USD', locale: 'en' });
    fixture.componentInstance['onSubmit']();

    expect(registerSpy).toHaveBeenCalledWith({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    expect(updateSpy).toHaveBeenCalledWith('USD', 'en');
  });

  it('sends normalized email and trimmed displayName on submit', () => {
    const authService = TestBed.inject(AuthService);
    const prefService = TestBed.inject(PreferencesService);
    const registerSpy = jest.spyOn(authService, 'register').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'john@example.com', displayName: 'John Doe',
    }));
    jest.spyOn(prefService, 'update').mockReturnValue(of({
      currency: 'EUR', locale: 'fr',
      supportedCurrencies: ['EUR'], eurToTargetRate: 1,
    }));

    fixture.componentInstance['form'].patchValue({
      displayName: '  John Doe  ',
      email: '  John@EXAMPLE.com  ',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.componentInstance['onSubmit']();

    expect(registerSpy).toHaveBeenCalledWith({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
  });

  it('onEmailBlur normalizes the visible input value', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = '  John@EXAMPLE.com  ';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.value).toBe('john@example.com');
  });

  it('shows toast on 409 duplicate email', () => {
    const authService = TestBed.inject(AuthService);
    const toastService = TestBed.inject(ToastService);
    jest.spyOn(authService, 'register').mockReturnValue(
      throwError(() => ({ status: 409, error: 'ignored' }))
    );
    jest.spyOn(toastService, 'error');

    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.componentInstance['onSubmit']();

    expect(toastService.error).toHaveBeenCalledWith(
      'An account with this email already exists.'
    );
    expect(fixture.componentInstance['loading']()).toBe(false);
  });

  it('shows backend message on non-409 registration error', () => {
    const authService = TestBed.inject(AuthService);
    const toastService = TestBed.inject(ToastService);
    jest.spyOn(authService, 'register').mockReturnValue(
      throwError(() => ({ status: 500, error: { code: 'oops' } }))
    );
    jest.spyOn(toastService, 'error');

    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.componentInstance['onSubmit']();

    expect(toastService.error).toHaveBeenCalledWith(
      'Registration failed. Please try again.'
    );
  });

  it('navigates to /verify-email after successful registration', () => {
    const authService = TestBed.inject(AuthService);
    const prefService = TestBed.inject(PreferencesService);
    const router      = TestBed.inject(Router);
    jest.spyOn(authService, 'register').mockReturnValue(of({
      accessToken: 'tok', refreshToken: 'ref',
      email: 'john@example.com', displayName: 'John Doe',
    }));
    jest.spyOn(prefService, 'update').mockReturnValue(of({
      currency: 'EUR', locale: 'fr',
      supportedCurrencies: ['EUR'], eurToTargetRate: 1,
    }));
    const navigateSpy = jest.spyOn(router, 'navigate');

    fixture.componentInstance['form'].patchValue({
      displayName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    fixture.componentInstance['nextStep']();
    fixture.componentInstance['onSubmit']();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/verify-email'],
      { queryParams: { email: 'john@example.com' } }
    );
  });
});
