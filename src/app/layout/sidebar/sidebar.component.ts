import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly navItems: NavItem[] = [
    {
      label: 'Accounts',
      route: '/accounts',
      icon: 'M3 10h18M3 14h18M10 3v18M14 3v18M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
    },
    {
      label: 'Holdings',
      route: '/holdings',
      icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941',
    },
    {
      label: 'Analytics',
      route: '/analytics',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z',
    },
    {
      label: 'Rebalance',
      route: '/rebalance',
      icon: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 7.854c.168.444-.651 1.176-1.263.92a4.62 4.62 0 0 0-1.857-.387 4.62 4.62 0 0 0-1.857.387c-.612.256-1.43-.476-1.263-.92L18.75 4.97zm-13.5 0-.245.736m0 0-2.375 7.118c-.168.444.651 1.176 1.263.92a4.62 4.62 0 0 1 1.857-.387 4.62 4.62 0 0 1 1.857.387c.612.256 1.43-.476 1.263-.92L5.25 5.706z',
    },
  ];
}
