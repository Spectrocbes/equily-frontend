import { Component, inject, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly menuToggled = output<void>();

  protected readonly themeService  = inject(ThemeService);
  protected readonly authService   = inject(AuthService);
  protected readonly userMenuOpen  = signal(false);

  protected readonly userInitial = computed(() => {
    const user = this.authService.currentUser();
    const name = user?.displayName ?? user?.email ?? '?';
    return name.charAt(0).toUpperCase();
  });

  protected logout(): void {
    void this.authService.logout();
  }
}
