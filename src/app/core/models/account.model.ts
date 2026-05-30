export type AccountSubType =
  | 'LIVRET_A' | 'LDDS' | 'LDD' | 'LEP' | 'LIVRET_JEUNE'
  | 'PEA' | 'PEA_PME' | 'COMPTE_TITRES' | 'PER' | 'ASSURANCE_VIE'
  | 'CRYPTO_WALLET' | 'CASH_ACCOUNT' | 'REAL_ESTATE' | 'OTHER';

export const ACCOUNT_SUB_TYPE_LABELS: Record<AccountSubType, string> = {
  LIVRET_A:      'Livret A',
  LDDS:          'LDDS',
  LDD:           'LDD',
  LEP:           'LEP',
  LIVRET_JEUNE:  'Livret Jeune',
  PEA:           'PEA',
  PEA_PME:       'PEA-PME',
  COMPTE_TITRES: 'Compte Titres',
  PER:           'PER',
  ASSURANCE_VIE: 'Assurance Vie',
  CRYPTO_WALLET: 'Crypto Wallet',
  CASH_ACCOUNT:  'Compte Courant',
  REAL_ESTATE:   'Immobilier',
  OTHER:         'Autre',
};

export const ACCOUNT_TYPE_SUB_TYPES: Partial<Record<AccountType, AccountSubType[]>> = {
  SAVINGS_ACCOUNT: ['LIVRET_A', 'LDDS', 'LDD', 'LEP', 'LIVRET_JEUNE'],
  PEA:             ['PEA'],
  PEA_PME:         ['PEA_PME'],
  COMPTE_TITRES:   ['COMPTE_TITRES'],
  PER:             ['PER'],
  ASSURANCE_VIE:   ['ASSURANCE_VIE'],
  CRYPTO_WALLET:   ['CRYPTO_WALLET'],
  CASH_ACCOUNT:    ['CASH_ACCOUNT'],
};

// Mirrors backend DepositLimits constants
export const DEPOSIT_LIMITS: Partial<Record<AccountSubType, number>> = {
  LIVRET_A:     22950,
  LDDS:         12000,
  LDD:          12000,
  LEP:          10000,
  LIVRET_JEUNE: 1600,
  PEA:          150000,
  PEA_PME:      225000,
};

export interface FinancialAccount {
  id: string;
  name: string;
  accountType: AccountType;
  subType: AccountSubType | null;
  balance: number;
  currency: string;
  transactionCount: number;
  broker: string;
  depositLimit: number | null;
  totalDeposits: number | null;
  remainingCapacity: number | null;
}

export type AccountType =
  | 'PEA'
  | 'PEA_PME'
  | 'COMPTE_TITRES'
  | 'PER'
  | 'ASSURANCE_VIE'
  | 'SAVINGS_ACCOUNT'
  | 'CASH_ACCOUNT'
  | 'CRYPTO_WALLET'
  | 'REAL_ESTATE';

export interface Transaction {
  id: string;
  type: TransactionType;
  ticker: string | null;
  quantity: number | null;
  pricePerUnit: number | null;
  totalAmount: number;
  currency: string;
  date: string;
  fees: number;
  description: string | null;
}

export type TransactionType =
  | 'BUY'
  | 'SELL'
  | 'DIVIDEND'
  | 'DEPOSIT'
  | 'WITHDRAWAL';

export interface CreateAccountRequest {
  name: string;
  accountType: AccountType;
  initialBalance: number;
  currency: string;
  broker: string;
  subType: AccountSubType | null;
}

export type WealthCategory =
  | 'investments'
  | 'crypto'
  | 'savings'
  | 'cash';

export const ACCOUNT_CATEGORY: Record<AccountType, WealthCategory> = {
  PEA:             'investments',
  PEA_PME:         'investments',
  COMPTE_TITRES:   'investments',
  PER:             'investments',
  ASSURANCE_VIE:   'investments',
  CRYPTO_WALLET:   'crypto',
  SAVINGS_ACCOUNT: 'savings',
  CASH_ACCOUNT:    'cash',
  REAL_ESTATE:     'investments', // future
};

export const WEALTH_CATEGORY_LABELS: Record<WealthCategory, string> = {
  investments: 'Investments',
  crypto:      'Crypto',
  savings:     'Savings',
  cash:        'Cash',
};

export const WEALTH_CATEGORY_ROUTE: Record<WealthCategory, string> = {
  investments: '/wealth/investments',
  crypto:      '/wealth/crypto',
  savings:     '/wealth/savings',
  cash:        '/wealth/cash',
};

export const ALLOWED_TRANSACTION_TYPES: Record<AccountType, TransactionType[]> = {
  PEA:             ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'],
  PEA_PME:         ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'],
  COMPTE_TITRES:   ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'],
  PER:             ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'],
  ASSURANCE_VIE:   ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'],
  SAVINGS_ACCOUNT: ['DEPOSIT', 'WITHDRAWAL'],
  CASH_ACCOUNT:    ['DEPOSIT', 'WITHDRAWAL'],
  CRYPTO_WALLET:   ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL'],
  REAL_ESTATE:     ['DEPOSIT', 'WITHDRAWAL'],
};

export interface AccountSummary {
  account: FinancialAccount;
  totalInvested: number;
  totalFeesPaid: number;
}

export interface Holding {
  ticker: string;
  quantity: number;
  averageCostPrice: number;    // pure fiscal price — excludes fees
  currency: string;
  totalInvested: number;       // quantity × averageCostPrice (no fees)
  totalFeesPaid: number;       // cumulative brokerage fees on BUY transactions
}

export interface RecordTransactionRequest {
  type: TransactionType;
  ticker?: string;
  quantity?: number;
  pricePerUnit?: number;
  priceCurrency?: string;
  totalAmount: number;
  totalCurrency: string;
  date: string;
  fees?: number;
  description?: string;
}

export type CsvBroker = 'BOURSOBANK';
export type CsvMode = 'OPERATIONS' | 'POSITIONS';

export interface CsvImportResponse {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}
