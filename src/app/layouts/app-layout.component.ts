import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../layout/navbar/navbar.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  protected readonly sidebarOpen = signal(false);
}
