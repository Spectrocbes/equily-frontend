import { accountAgeYears, isEurOnlyAccount, Transaction } from './account.model';

describe('Transaction', () => {
  it('has nativeCurrency, totalAmountNative and feesNative fields', () => {
    const tx: Transaction = {
      id: '1',
      type: 'BUY',
      ticker: 'AAPL',
      quantity: 10,
      pricePerUnit: 150,
      totalAmount: 1395,
      totalAmountNative: 1620,
      nativeCurrency: 'USD',
      date: '2026-01-01',
      fees: 4.50,
      feesNative: 5.00,
      description: null,
      transferId: null,
      linkedAccountId: null,
      externalAddress: null,
      transferDirection: null,
    };
    expect(tx.nativeCurrency).toBe('USD');
    expect(tx.totalAmountNative).toBe(1620);
    expect(tx.feesNative).toBe(5.00);
  });
});

describe('isEurOnlyAccount', () => {
  it('returns true for PEA account type', () => {
    expect(isEurOnlyAccount('PEA', null)).toBe(true);
  });

  it('returns true for LIVRET_A sub-type', () => {
    expect(isEurOnlyAccount('SAVINGS_ACCOUNT', 'LIVRET_A')).toBe(true);
  });

  it('returns false for CRYPTO_WALLET', () => {
    expect(isEurOnlyAccount('CRYPTO_WALLET', 'CRYPTO_WALLET')).toBe(false);
  });
});

describe('accountAgeYears', () => {
  it('returns null for null input', () => {
    expect(accountAgeYears(null)).toBeNull();
  });

  it('returns 0 for account opened today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(accountAgeYears(today)).toBe(0);
  });

  it('returns 5 for account opened 5 years ago', () => {
    const opened = new Date();
    opened.setFullYear(opened.getFullYear() - 5);
    const isoDate = opened.toISOString().split('T')[0];
    expect(accountAgeYears(isoDate)).toBe(5);
  });
});
