import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email.component').then(m => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  // Protected routes
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
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
    ],
  },
  { path: '**', redirectTo: 'overview' },
];
