import { buildFirebaseAuthMock, mockFirebaseUser } from '../../../testing/firebase-mock';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => buildFirebaseAuthMock());

import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { auth } from '../firebase/firebase.config';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    (auth as unknown as { currentUser: unknown }).currentUser = null;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches a Bearer token when a user is signed in', async () => {
    const firebaseUser = mockFirebaseUser();
    jest.mocked(firebaseUser.getIdToken).mockResolvedValue('id-token-123');
    (auth as unknown as { currentUser: unknown }).currentUser = firebaseUser;

    http.get('/api/v1/accounts').subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = httpMock.expectOne('/api/v1/accounts');
    expect(req.request.headers.get('Authorization')).toBe('Bearer id-token-123');
    req.flush({});
  });

  it('sends no Authorization header when no user is signed in', () => {
    http.get('/api/v1/accounts').subscribe();
    const req = httpMock.expectOne('/api/v1/accounts');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips token lookup entirely for i18n asset requests', () => {
    const firebaseUser = mockFirebaseUser();
    (auth as unknown as { currentUser: unknown }).currentUser = firebaseUser;

    http.get('/assets/i18n/en.json').subscribe();
    const req = httpMock.expectOne('/assets/i18n/en.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(firebaseUser.getIdToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('skips token lookup entirely for market-data requests', () => {
    const firebaseUser = mockFirebaseUser();
    (auth as unknown as { currentUser: unknown }).currentUser = firebaseUser;

    http.get('/api/v1/market-data/search').subscribe();
    const req = httpMock.expectOne('/api/v1/market-data/search');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(firebaseUser.getIdToken).not.toHaveBeenCalled();
    req.flush({});
  });

  it('sends the request without a header when getIdToken resolves null', async () => {
    const firebaseUser = mockFirebaseUser();
    jest.mocked(firebaseUser.getIdToken).mockResolvedValue(null as unknown as string);
    (auth as unknown as { currentUser: unknown }).currentUser = firebaseUser;

    http.get('/api/v1/accounts').subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const req = httpMock.expectOne('/api/v1/accounts');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
