import { buildFirebaseAuthMock, mockFirebaseUser } from '../../../testing/firebase-mock';

jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({})) }));
jest.mock('firebase/auth', () => buildFirebaseAuthMock());

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import * as firebaseAuth from 'firebase/auth';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { PreferencesService } from './preferences.service';
import { auth } from '../firebase/firebase.config';
import { provideTestTranslations } from '../../../testing/translate-testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    jest.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_a, callback) => {
      callback(null);
      return jest.fn();
    });
    (auth as unknown as { currentUser: unknown }).currentUser = null;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTestTranslations(),
      ],
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router   = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('sets currentUser to null and stops loading when signed out', async () => {
      await service.initialize();
      expect(service.currentUser()).toBeNull();
      expect(service.loading()).toBe(false);
    });

    it('sets currentUser and loads preferences when signed in', async () => {
      const firebaseUser = mockFirebaseUser({ uid: 'u1', email: 'a@b.com', displayName: 'A B' });
      jest.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_a, callback) => {
        callback(firebaseUser);
        return jest.fn();
      });

      const initPromise = service.initialize();
      httpMock.expectOne('/api/v1/preferences').flush({
        currency: 'EUR', locale: 'fr', supportedCurrencies: ['EUR'],
      });
      await initPromise;

      expect(service.currentUser()).toEqual({ uid: 'u1', email: 'a@b.com', displayName: 'A B' });
      expect(service.loading()).toBe(false);
    });

    it('is idempotent — second call resolves without re-subscribing', async () => {
      await service.initialize();
      const callCount = jest.mocked(firebaseAuth.onAuthStateChanged).mock.calls.length;
      await service.initialize();
      expect(jest.mocked(firebaseAuth.onAuthStateChanged).mock.calls.length).toBe(callCount);
    });
  });

  describe('getIdToken', () => {
    it('returns null when no firebase user is signed in', async () => {
      expect(await service.getIdToken()).toBeNull();
    });

    it('returns the token from the signed-in firebase user', async () => {
      const firebaseUser = mockFirebaseUser();
      (auth as unknown as { currentUser: unknown }).currentUser = firebaseUser;
      expect(await service.getIdToken()).toBe('mock-id-token');
      expect(firebaseUser.getIdToken).toHaveBeenCalled();
    });
  });

  it('loginWithEmail calls signInWithEmailAndPassword', async () => {
    jest.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue(
      { user: mockFirebaseUser() } as never
    );
    await service.loginWithEmail('a@b.com', 'secret');
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@b.com', 'secret');
  });

  it('registerWithEmail calls createUserWithEmailAndPassword then updateProfile', async () => {
    const firebaseUser = mockFirebaseUser();
    jest.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue(
      { user: firebaseUser } as never
    );
    await service.registerWithEmail('a@b.com', 'secret', 'Jane Doe');
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'a@b.com', 'secret');
    expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(firebaseUser, { displayName: 'Jane Doe' });
  });

  it('loginWithGoogle calls signInWithPopup with a GoogleAuthProvider', async () => {
    jest.mocked(firebaseAuth.signInWithPopup).mockResolvedValue({ user: mockFirebaseUser() } as never);
    await service.loginWithGoogle();
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(auth, expect.any(firebaseAuth.GoogleAuthProvider));
  });

  it('resetPassword calls sendPasswordResetEmail', async () => {
    jest.mocked(firebaseAuth.sendPasswordResetEmail).mockResolvedValue(undefined);
    await service.resetPassword('a@b.com');
    expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'a@b.com');
  });

  describe('logout', () => {
    it('calls signOut, resets state and services, and navigates to /login', async () => {
      jest.mocked(firebaseAuth.signOut).mockResolvedValue(undefined);
      const accountService = TestBed.inject(AccountService);
      const preferencesService = TestBed.inject(PreferencesService);
      const accountResetSpy = jest.spyOn(accountService, 'reset');
      const prefResetSpy = jest.spyOn(preferencesService, 'reset');
      const navigateSpy = jest.spyOn(router, 'navigate');

      await service.logout();

      expect(firebaseAuth.signOut).toHaveBeenCalledWith(auth);
      expect(service.currentUser()).toBeNull();
      expect(accountResetSpy).toHaveBeenCalled();
      expect(prefResetSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no user is set', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true once currentUser is set', async () => {
      const firebaseUser = mockFirebaseUser();
      jest.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((_a, callback) => {
        callback(firebaseUser);
        return jest.fn();
      });
      const initPromise = service.initialize();
      httpMock.expectOne('/api/v1/preferences').flush({
        currency: 'EUR', locale: 'fr', supportedCurrencies: ['EUR'],
      });
      await initPromise;
      expect(service.isAuthenticated()).toBe(true);
    });
  });
});
