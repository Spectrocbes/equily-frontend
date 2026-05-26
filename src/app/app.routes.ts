import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'accounts',
    pathMatch: 'full',
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts.component').then(m => m.AccountsComponent),
  },
  {
    path: 'accounts/:id',
    loadComponent: () =>
      import('./features/accounts/account-detail.component').then(
        m => m.AccountDetailComponent
      ),
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./features/holdings/holdings.component').then(m => m.HoldingsComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
  },
  {
    path: 'rebalance',
    loadComponent: () =>
      import('./features/rebalance/rebalance.component').then(m => m.RebalanceComponent),
  },
];
