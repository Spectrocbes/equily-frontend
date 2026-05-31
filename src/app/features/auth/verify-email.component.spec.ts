import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VerifyEmailComponent } from './verify-email.component';

const makeRoute = (params: Record<string, string>) => ({
  provide: ActivatedRoute,
  useValue: {
    snapshot: {
      queryParamMap: { get: (key: string) => params[key] ?? null },
    },
  },
});

describe('VerifyEmailComponent — no token', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<VerifyEmailComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({}),
      ],
    });
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
  });

  it('shows check-your-email state when no token in URL', () => {
    expect(fixture.nativeElement.textContent).toContain('Check your email');
  });

  it('does not call the verify endpoint', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.expectNone('/auth/verify-email');
    httpMock.verify();
  });
});

describe('VerifyEmailComponent — with token, success', () => {
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<VerifyEmailComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({ token: 'abc123' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('calls POST /auth/verify-email with the token', () => {
    const req = httpMock.expectOne('/auth/verify-email');
    expect(req.request.body).toEqual({ token: 'abc123' });
    req.flush(null);
  });

  it('shows success state after verification', () => {
    httpMock.expectOne('/auth/verify-email').flush(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Email verified');
  });
});

describe('VerifyEmailComponent — with token, failure', () => {
  let httpMock: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<VerifyEmailComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        makeRoute({ token: 'bad-token' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerifyEmailComponent);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('shows error state on verification failure', () => {
    httpMock.expectOne('/auth/verify-email').flush(
      'Token expired',
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Verification failed');
  });
});
