import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SettingsComponent } from './settings.component';
import { PreferencesService } from '../../core/services/preferences.service';
import { ToastService } from '../../shared/toast/toast.service';
import { UserPreferences } from '../../core/models/account.model';
import { provideTestTranslations, useTestTranslations } from '../../../testing/translate-testing';

const mockPrefs: UserPreferences = {
  currency: 'EUR',
  locale: 'fr',
  supportedCurrencies: ['EUR', 'USD', 'GBP', 'CHF'],
};

function createPrefsServiceMock(prefs = mockPrefs) {
  const _prefs = signal(prefs);
  return {
    preferences: _prefs.asReadonly(),
    currency: () => _prefs().currency,
    locale: () => _prefs().locale,
    currencySymbol: () => '€',
    load: jest.fn(),
    update: jest.fn().mockReturnValue(of({ ...prefs })),
  };
}

describe('SettingsComponent', () => {
  let toastService: { success: jest.Mock; error: jest.Mock };
  let prefsService: ReturnType<typeof createPrefsServiceMock>;

  beforeEach(async () => {
    prefsService = createPrefsServiceMock();
    toastService = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideTestTranslations(),
        { provide: PreferencesService, useValue: prefsService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(SettingsComponent);
    useTestTranslations();
    fixture.detectChanges();
    return fixture;
  }

  it('renders one nav button per section (2 sections)', () => {
    const fixture = createComponent();
    const navButtons = fixture.debugElement.queryAll(By.css('nav button'));
    expect(navButtons.length).toBe(2);
    expect(navButtons[0].nativeElement.textContent.trim()).toBe('Currency');
    expect(navButtons[1].nativeElement.textContent.trim()).toBe('Language');
  });

  it('switching to language section shows EN/FR buttons', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      activeSection: ReturnType<typeof signal<'currency' | 'language'>>;
    };
    component.activeSection.set('language');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('English');
    expect(fixture.nativeElement.textContent).toContain('Français');
  });

  it('setLocale calls preferencesService.update with current currency and new locale', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      activeSection: ReturnType<typeof signal<'currency' | 'language'>>;
      setLocale: (locale: string) => void;
    };
    component.activeSection.set('language');
    fixture.detectChanges();
    component.setLocale('fr-FR');
    expect(prefsService.update).toHaveBeenCalledWith('EUR', 'fr-FR');
    expect(toastService.success).toHaveBeenCalledWith('Preferences saved');
  });

  it('setLocale shows an error toast when the update fails', () => {
    prefsService.update.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      setLocale: (locale: string) => void;
    };
    component.setLocale('en');
    expect(toastService.error).toHaveBeenCalledWith('An error occurred');
  });

  it('defaults to currency section showing pill buttons', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      activeSection: () => string;
    };
    expect(component.activeSection()).toBe('currency');
    const currencyButtons = fixture.debugElement.queryAll(
      By.css('div.flex.gap-2 button[type="button"]')
    );
    expect(currencyButtons.length).toBe(4);
  });

  it('selectCurrency updates the selectedCurrency signal', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      selectedCurrency: () => string;
      selectCurrency: (c: string) => void;
    };
    expect(component.selectedCurrency()).toBe('EUR');
    component.selectCurrency('USD');
    expect(component.selectedCurrency()).toBe('USD');
  });

  it('save button is disabled when selectedCurrency matches current preferences', () => {
    const fixture = createComponent();
    const saveBtn = fixture.nativeElement.querySelector(
      'button[disabled]'
    ) as HTMLButtonElement;
    expect(saveBtn).not.toBeNull();
  });

  it('save() calls preferencesService.update with selected currency and locale', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      selectCurrency: (c: string) => void;
      save: () => void;
    };
    component.selectCurrency('GBP');
    component.save();
    expect(prefsService.update).toHaveBeenCalledWith('GBP', 'fr');
  });

  it('save() shows success toast on successful update', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      selectCurrency: (c: string) => void;
      save: () => void;
    };
    component.selectCurrency('USD');
    component.save();
    expect(toastService.success).toHaveBeenCalledWith('Preferences saved');
  });

  it('save() shows error toast when update fails', () => {
    prefsService.update.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = createComponent();
    const component = fixture.componentInstance as unknown as {
      selectCurrency: (c: string) => void;
      save: () => void;
    };
    component.selectCurrency('USD');
    component.save();
    expect(toastService.error).toHaveBeenCalledWith('Failed to save preferences');
  });
});
