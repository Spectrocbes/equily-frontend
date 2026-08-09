import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.loading()) {
    return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
  }

  return new Promise(resolve => {
    const check = (): void => {
      if (!authService.loading()) {
        resolve(authService.isAuthenticated() ? true : router.createUrlTree(['/login']));
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
};
