import { AfterViewInit, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { DEPOSIT_LIMITS } from '../../core/models/account.model';
import { LanguageService, Lang } from '../../core/services/language.service';
import { version } from '../../../../package.json';

interface CeilingRow {
  labelKey: string;
  amount: number;
  /** Bar width, as a share of the largest ceiling *within its own group*. */
  pct: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, TranslatePipe],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements AfterViewInit {
  private readonly languageService = inject(LanguageService);

  protected readonly showScrollTop = signal(false);
  protected readonly barsReady     = signal(false);
  protected readonly appVersion    = version;
  protected readonly currentLang   = this.languageService.lang;

  /**
   * Endonyms are deliberately not translated: someone who has landed on the
   * wrong language needs to recognise their own, so "Français" stays "Français"
   * on the English page.
   */
  protected readonly languages: { code: Lang; short: string; name: string }[] = [
    { code: 'en', short: 'EN', name: 'English'  },
    { code: 'fr', short: 'FR', name: 'Français' },
  ];

  protected setLang(lang: Lang): void {
    this.languageService.use(lang);
  }

  ngAfterViewInit(): void {
    // One orchestrated reveal: the ceiling bars grow in once, on load.
    requestAnimationFrame(() => this.barsReady.set(true));
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.showScrollTop.set(window.scrollY > 400);
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Ceilings are read from the model's DEPOSIT_LIMITS — the same constants the
   * app enforces on every deposit — so the marketing page can never quote a
   * number the product does not actually apply.
   *
   * Each group is scaled to its own maximum: securities envelopes and regulated
   * passbooks differ by an order of magnitude, and one shared scale would flatten
   * every Livret into an unreadable sliver.
   */
  private scale(rows: { labelKey: string; amount: number }[]): CeilingRow[] {
    const max = Math.max(...rows.map(r => r.amount));
    return rows.map(r => ({ ...r, pct: (r.amount / max) * 100 }));
  }

  protected readonly securitiesCeilings = this.scale([
    { labelKey: 'landing.ceilingPeaPme', amount: DEPOSIT_LIMITS.PEA_PME ?? 0 },
    { labelKey: 'landing.ceilingPea',    amount: DEPOSIT_LIMITS.PEA ?? 0 },
  ]);

  protected readonly passbookCeilings = this.scale([
    { labelKey: 'landing.ceilingLivretA',     amount: DEPOSIT_LIMITS.LIVRET_A ?? 0 },
    { labelKey: 'landing.ceilingLdds',        amount: DEPOSIT_LIMITS.LDDS ?? 0 },
    { labelKey: 'landing.ceilingLep',         amount: DEPOSIT_LIMITS.LEP ?? 0 },
    { labelKey: 'landing.ceilingLivretJeune', amount: DEPOSIT_LIMITS.LIVRET_JEUNE ?? 0 },
  ]);

  protected readonly features = [
    { titleKey: 'landing.feature1Title', descriptionKey: 'landing.feature1Description' },
    { titleKey: 'landing.feature2Title', descriptionKey: 'landing.feature2Description' },
    { titleKey: 'landing.feature3Title', descriptionKey: 'landing.feature3Description' },
    { titleKey: 'landing.feature4Title', descriptionKey: 'landing.feature4Description' },
    { titleKey: 'landing.feature5Title', descriptionKey: 'landing.feature5Description' },
    { titleKey: 'landing.feature6Title', descriptionKey: 'landing.feature6Description' },
  ];

  /**
   * Domain rules the app actually enforces, presented as a rulebook: the scope
   * column states which envelopes a provision applies to, the way a real
   * product sheet would.
   */
  protected readonly rules = [
    { scope: 'PEA',                          titleKey: 'landing.rule1Title', descriptionKey: 'landing.rule1Description' },
    { scope: 'PEA · CTO · PER · AV · Livrets', titleKey: 'landing.rule2Title', descriptionKey: 'landing.rule2Description' },
    { scope: 'Livrets · PEA · PEA-PME',      titleKey: 'landing.rule3Title', descriptionKey: 'landing.rule3Description' },
    { scope: 'PEA · PEA-PME · CTO · Crypto', titleKey: 'landing.rule4Title', descriptionKey: 'landing.rule4Description' },
  ];

  protected readonly security = [
    { titleKey: 'landing.security1Title', descriptionKey: 'landing.security1Description' },
    { titleKey: 'landing.security2Title', descriptionKey: 'landing.security2Description' },
    { titleKey: 'landing.security3Title', descriptionKey: 'landing.security3Description' },
    { titleKey: 'landing.security4Title', descriptionKey: 'landing.security4Description' },
  ];
}
