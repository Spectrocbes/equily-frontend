import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

describe('ForgotPasswordComponent', () => {
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<ForgotPasswordComponent>>;

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
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    useTestTranslations();
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('shows the form by default', () => {
    expect(fixture.nativeElement.textContent).toContain('Reset your password');
  });

  it('shows sent state after successful submit', () => {
    fixture.componentInstance['form'].setValue({ email: 'test@example.com' });
    fixture.componentInstance['onSubmit']();
    httpMock.expectOne('/auth/forgot-password').flush(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Check your email');
  });

  it('sends a normalized (lowercased, trimmed) email on submit', () => {
    fixture.componentInstance['form'].setValue({ email: '  Test@EXAMPLE.com  ' });
    fixture.componentInstance['onSubmit']();
    const req = httpMock.expectOne('/auth/forgot-password');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);
  });

  it('onEmailBlur normalizes the visible input value', () => {
    const emailInput = fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = '  Test@EXAMPLE.com  ';
    emailInput.dispatchEvent(new Event('input'));
    emailInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance['form'].get('email')?.value).toBe('test@example.com');
  });

  it('shows sent state even on error (never reveals whether email exists)', () => {
    fixture.componentInstance['form'].setValue({ email: 'unknown@example.com' });
    fixture.componentInstance['onSubmit']();
    httpMock.expectOne('/auth/forgot-password').flush(
      {},
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Check your email');
  });
});
