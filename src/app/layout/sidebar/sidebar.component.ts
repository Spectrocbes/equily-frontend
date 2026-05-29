import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly wealthExpanded = signal(true);

  protected toggleWealth(): void {
    this.wealthExpanded.update(v => !v);
  }

  protected readonly wealthItems = [
    { label: 'Investments', route: '/wealth/investments' },
    { label: 'Crypto',      route: '/wealth/crypto'      },
    { label: 'Savings',     route: '/wealth/savings'     },
    { label: 'Cash',        route: '/wealth/cash'        },
  ];
}
