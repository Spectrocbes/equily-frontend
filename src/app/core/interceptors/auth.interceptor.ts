import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { auth } from '../firebase/firebase.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/assets/i18n/') || req.url.includes('/market-data/')) {
    return next(req);
  }

  const user = auth.currentUser;
  if (!user) {
    return next(req);
  }

  return from(user.getIdToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
        return next(authReq);
      }
      return next(req);
    })
  );
};
