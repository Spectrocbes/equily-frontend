import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'verify-email', redirectTo: '' }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
