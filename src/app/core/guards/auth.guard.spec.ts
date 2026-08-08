import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: Router;

  function setup(loadingInitial: boolean, authenticated: boolean): { loading: WritableSignal<boolean> } {
    const loading = signal(loadingInitial);
    const authServiceMock = {
      loading,
      isAuthenticated: () => authenticated,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    router = TestBed.inject(Router);
    return { loading };
  }

  function runGuard(): boolean | UrlTree | Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => authGuard({} as never, {} as never)
    ) as boolean | UrlTree | Promise<boolean | UrlTree>;
  }

  it('returns true immediately when not loading and authenticated', () => {
    setup(false, true);
    expect(runGuard()).toBe(true);
  });

  it('returns a redirect UrlTree to /login immediately when not loading and unauthenticated', () => {
    setup(false, false);
    const result = runGuard() as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login');
  });

  it('waits for loading to finish, then resolves true once authenticated', async () => {
    jest.useFakeTimers();
    const { loading } = setup(true, true);
    const resultPromise = runGuard() as Promise<boolean | UrlTree>;
    loading.set(false);
    await jest.advanceTimersByTimeAsync(60);
    await expect(resultPromise).resolves.toBe(true);
    jest.useRealTimers();
  });

  it('waits for loading to finish, then resolves a redirect when unauthenticated', async () => {
    jest.useFakeTimers();
    const { loading } = setup(true, false);
    const resultPromise = runGuard() as Promise<boolean | UrlTree>;
    loading.set(false);
    await jest.advanceTimersByTimeAsync(60);
    const result = await resultPromise;
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    jest.useRealTimers();
  });
});
