import { Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly open   = input<boolean>(false);
  readonly closed = output<void>();

  protected readonly wealthExpanded = signal(true);

  protected toggleWealth(): void {
    this.wealthExpanded.update(v => !v);
  }

  protected readonly wealthItems = [
    { labelKey: 'nav.investments', route: '/wealth/investments' },
    { labelKey: 'nav.crypto',      route: '/wealth/crypto'      },
    { labelKey: 'nav.savings',     route: '/wealth/savings'     },
    { labelKey: 'nav.cash',        route: '/wealth/cash'        },
  ];
}
