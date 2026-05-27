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
}

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

export interface RecordTransactionRequest {
  type: TransactionType;
  ticker?: string;
  quantity?: number;
  pricePerUnit?: number;
  priceCurrency?: string;
  totalAmount: number;
  totalCurrency: string;
  date: string;
  description?: string;
}
