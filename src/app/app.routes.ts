import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./features/overview/overview.component')
        .then(m => m.OverviewComponent),
  },
  {
    path: 'wealth',
    loadChildren: () =>
      import('./features/wealth/wealth.routes')
        .then(m => m.WEALTH_ROUTES),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./features/analytics/analytics.component')
        .then(m => m.AnalyticsComponent),
  },
  {
    path: 'rebalance',
    loadComponent: () =>
      import('./features/rebalance/rebalance.component')
        .then(m => m.RebalanceComponent),
  },
  {
    path: '**',
    redirectTo: 'overview',
  },
];
