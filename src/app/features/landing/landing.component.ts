import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  protected readonly showScrollTop = signal(false);

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

  protected readonly stats = [
    { value: '9+',   labelKey: 'landing.stat1Label' },
    { value: '100%', labelKey: 'landing.stat2Label' },
    { value: 'Free', labelKey: 'landing.stat3Label' },
  ];

  protected readonly features = [
    { icon: '📊', titleKey: 'landing.feature1Title', descriptionKey: 'landing.feature1Description' },
    { icon: '🏦', titleKey: 'landing.feature2Title', descriptionKey: 'landing.feature2Description' },
    { icon: '📥', titleKey: 'landing.feature3Title', descriptionKey: 'landing.feature3Description' },
    { icon: '⚖️', titleKey: 'landing.feature4Title', descriptionKey: 'landing.feature4Description' },
    { icon: '🌍', titleKey: 'landing.feature5Title', descriptionKey: 'landing.feature5Description' },
    { icon: '🔒', titleKey: 'landing.feature6Title', descriptionKey: 'landing.feature6Description' },
  ];

  protected readonly accountTypes = [
    'landing.accountType1', 'landing.accountType2', 'landing.accountType3', 'landing.accountType4',
    'landing.accountType5', 'landing.accountType6', 'landing.accountType7', 'landing.accountType8',
  ];

  protected readonly security = [
    { icon: '🔐', titleKey: 'landing.security1Title', descriptionKey: 'landing.security1Description' },
    { icon: '🗄️', titleKey: 'landing.security2Title', descriptionKey: 'landing.security2Description' },
    { icon: '#️⃣', titleKey: 'landing.security3Title', descriptionKey: 'landing.security3Description' },
    { icon: '📁', titleKey: 'landing.security4Title', descriptionKey: 'landing.security4Description' },
  ];
}
