import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { AppLayoutComponent } from './layouts/app-layout.component';

export const routes: Routes = [
  // ── Auth layout (full-screen, no navbar/sidebar) ──────────────────
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/landing/landing.component')
            .then(m => m.LandingComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component')
            .then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.component')
            .then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password.component')
            .then(m => m.ForgotPasswordComponent),
      },
    ],
  },
  // ── App layout (navbar + sidebar, protected) ──────────────────────
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
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
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component')
            .then(m => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'overview' },
];
