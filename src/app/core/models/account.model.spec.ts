import { accountAgeYears } from './account.model';

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
