import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      // useHttpBackend bypasses all HttpClient interceptors (incl. authInterceptor),
      // breaking the TranslateHttpLoader -> authInterceptor -> AuthService ->
      // PreferencesService -> TranslateService -> TranslateHttpLoader cycle (NG0200).
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
        useHttpBackend: true,
      }),
    }),
    {
      provide: APP_INITIALIZER,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      useFactory: (auth: AuthService) => () => auth.loadCurrentUser().catch(() => {}),
      deps: [AuthService],
      multi: true,
    },
  ],
};
