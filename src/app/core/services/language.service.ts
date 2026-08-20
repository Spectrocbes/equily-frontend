import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Lang = 'en' | 'fr';

const STORAGE_KEY = 'equily-lang';

/** Maps a backend locale ('en', 'fr-FR', …) onto one of the bundled translations. */
export function langFromLocale(locale: string): Lang {
  return locale.startsWith('fr') ? 'fr' : 'en';
}

/**
 * Resolved synchronously by `app.config` so the very first paint is already in
 * the right language — resolving it any later renders English and then swaps.
 *
 * Guarded because this runs while the app's providers are being built: a throw
 * here (Safari private mode, storage disabled by policy) would white-screen the
 * app before anything is on screen.
 */
export function resolveInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') return stored;
    return langFromLocale(navigator.language || 'en');
  } catch {
    return 'en';
  }
}

/**
 * Single owner of the active language.
 *
 * Deliberately applies the change synchronously rather than through an
 * `effect()` like ThemeService: the language is also set from
 * `PreferencesService` outside any change-detection pass, where a scheduled
 * effect would not have run yet.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  private readonly _lang = signal<Lang>(resolveInitialLang());
  readonly lang = this._lang.asReadonly();

  constructor() {
    this.apply(this._lang());
  }

  use(lang: Lang): void {
    if (lang === this._lang()) return;
    this._lang.set(lang);
    this.apply(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable: the choice still applies for this session.
    }
  }

  private apply(lang: Lang): void {
    this.translate.use(lang);
    // Keep <html lang> honest: index.html hardcodes "en", and leaving it there
    // makes a screen reader read French copy with an English voice.
    document.documentElement.lang = lang;
  }
}
