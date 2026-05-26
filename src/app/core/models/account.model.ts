export interface FinancialAccount {
  id: string;
  name: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  transactionCount: number;
  broker: string;
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
}
