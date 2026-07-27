import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import en from '../../public/assets/i18n/en.json';

/** Provider for specs: real TranslateService, no HTTP loader (NoOp — translations set manually). */
export function provideTestTranslations(): Provider {
  return provideTranslateService({ lang: 'en', fallbackLang: 'en' });
}

/**
 * Loads the real en.json into the TestBed's TranslateService so templates render actual
 * English text instead of raw translation keys. Call after TestBed.inject/createComponent.
 */
export function useTestTranslations(): void {
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', en);
  translate.use('en');
}
