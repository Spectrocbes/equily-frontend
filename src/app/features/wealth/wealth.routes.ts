import { Routes } from '@angular/router';

export const WEALTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'investments',
    pathMatch: 'full',
  },
  {
    path: 'investments',
    loadComponent: () =>
      import('./investments/investments.component')
        .then(m => m.InvestmentsComponent),
  },
  {
    path: 'investments/:id',
    loadComponent: () =>
      import('./investments/investment-account-detail.component')
        .then(m => m.InvestmentAccountDetailComponent),
  },
  {
    path: 'crypto',
    loadComponent: () =>
      import('./crypto/crypto.component')
        .then(m => m.CryptoComponent),
  },
  {
    path: 'crypto/:id',
    loadComponent: () =>
      import('./crypto/crypto-account-detail.component')
        .then(m => m.CryptoAccountDetailComponent),
  },
  {
    path: 'savings',
    loadComponent: () =>
      import('./savings/savings.component')
        .then(m => m.SavingsComponent),
  },
  {
    path: 'savings/:id',
    loadComponent: () =>
      import('./savings/savings-account-detail.component')
        .then(m => m.SavingsAccountDetailComponent),
  },
  {
    path: 'cash',
    loadComponent: () =>
      import('./cash/cash.component')
        .then(m => m.CashComponent),
  },
  {
    path: 'cash/:id',
    loadComponent: () =>
      import('./cash/cash-account-detail.component')
        .then(m => m.CashAccountDetailComponent),
  },
];
