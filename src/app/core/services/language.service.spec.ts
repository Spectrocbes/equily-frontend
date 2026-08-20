import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LanguageService, langFromLocale, resolveInitialLang } from './language.service';

const STORAGE_KEY = 'equily-lang';

function makeService(): LanguageService {
  TestBed.configureTestingModule({
    providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
  });
  return TestBed.inject(LanguageService);
}

describe('langFromLocale', () => {
  it('maps every French locale variant onto fr', () => {
    expect(langFromLocale('fr')).toBe('fr');
    expect(langFromLocale('fr-FR')).toBe('fr');
    expect(langFromLocale('fr-CA')).toBe('fr');
  });

  it('falls back to en for anything else', () => {
    expect(langFromLocale('en')).toBe('en');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('de-DE')).toBe('en');
  });
});

describe('resolveInitialLang', () => {
  afterEach(() => localStorage.clear());

  it('prefers an explicit stored choice over the browser language', () => {
    localStorage.setItem(STORAGE_KEY, 'en');
    jest.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(resolveInitialLang()).toBe('en');
  });

  it('falls back to the browser language when nothing is stored', () => {
    jest.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
    expect(resolveInitialLang()).toBe('fr');
  });

  it('ignores a corrupted stored value', () => {
    localStorage.setItem(STORAGE_KEY, 'klingon');
    jest.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    expect(resolveInitialLang()).toBe('en');
  });

  // This runs while the app's providers are being built, so a throw would
  // white-screen the app before anything reaches the page.
  it('survives storage being unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => resolveInitialLang()).not.toThrow();
    expect(resolveInitialLang()).toBe('en');
  });
});

describe('LanguageService', () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('applies the language to TranslateService and <html lang>', () => {
    const service = makeService();
    service.use('fr');

    expect(service.lang()).toBe('fr');
    expect(TestBed.inject(TranslateService).getCurrentLang()).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('persists an explicit choice so it survives a reload', () => {
    makeService().use('fr');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('fr');
  });

  it('does not persist anything until the user actually chooses', () => {
    makeService();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps working when storage rejects writes', () => {
    const service = makeService();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => service.use('fr')).not.toThrow();
    expect(service.lang()).toBe('fr');
  });
});
