import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ResetPasswordComponent } from './reset-password.component';

const makeRoute = (params: Record<string, string>) => ({
  provide: ActivatedRoute,
  useValue: {
    snapshot: {
      queryParamMap: { get: (key: string) => params[key] ?? null },
    },
  },
});

describe('ResetPasswordComponent — no token', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ResetPasswordComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({}),
      ],
    });
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  });

  it('shows invalid state immediately when no token in URL', () => {
    expect(fixture.nativeElement.textContent).toContain('Invalid reset link');
  });

  it('does not call the validate endpoint', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectNone('/auth/validate-reset-token');
    httpMock.verify();
  });
});

describe('ResetPasswordComponent — with token, valid', () => {
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<ResetPasswordComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({ token: 'valid-token' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('calls POST /auth/validate-reset-token on init', () => {
    const req = httpMock.expectOne('/auth/validate-reset-token');
    expect(req.request.body).toEqual({ token: 'valid-token' });
    req.flush(null);
  });

  it('shows form after successful token validation', () => {
    httpMock.expectOne('/auth/validate-reset-token').flush(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('shows validating state before response arrives', () => {
    expect(fixture.nativeElement.textContent).toContain('Validating your reset link');
    httpMock.expectOne('/auth/validate-reset-token').flush(null);
  });
});

describe('ResetPasswordComponent — with token, invalid', () => {
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<ResetPasswordComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({ token: 'expired-token' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('shows invalid state when token validation fails', () => {
    httpMock.expectOne('/auth/validate-reset-token').flush(
      'Reset token has expired',
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Invalid reset link');
  });

  it('does not render the form when token is invalid', () => {
    httpMock.expectOne('/auth/validate-reset-token').flush(
      'Reset token has expired',
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
