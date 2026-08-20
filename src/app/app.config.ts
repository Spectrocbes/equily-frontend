import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { resolveInitialLang } from './core/services/language.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      // Resolved from localStorage / the browser before the first paint, so a
      // returning visitor never sees English flash past on their way to French.
      lang: resolveInitialLang(),
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
      useFactory: (authService: AuthService) => () => authService.initialize(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
