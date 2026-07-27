import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NavbarComponent } from '../layout/navbar/navbar.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { ToastContainerComponent } from '../shared/toast/toast-container.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, ToastContainerComponent, TranslatePipe],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  protected readonly sidebarOpen = signal(false);
}
