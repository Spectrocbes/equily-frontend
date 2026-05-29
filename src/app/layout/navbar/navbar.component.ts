import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly authService  = inject(AuthService);
  protected readonly showUserMenu = signal(false);
}
