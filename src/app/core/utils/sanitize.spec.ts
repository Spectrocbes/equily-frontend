import { normalizeEmail, normalizeText, normalizeTextOrUndefined } from './sanitize';

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  John.Doe@EXAMPLE.com  ')).toBe('john.doe@example.com');
  });

  it('handles null', () => {
    expect(normalizeEmail(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('leaves an already-normalized email unchanged', () => {
    expect(normalizeEmail('test@example.com')).toBe('test@example.com');
  });
});

describe('normalizeText', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('collapses multiple internal spaces to a single space', () => {
    expect(normalizeText('   Mon       PEA    ')).toBe('Mon PEA');
  });

  it('collapses tabs and newlines between words to a single space', () => {
    expect(normalizeText('Mon\t\tPEA\n\nFortuneo')).toBe('Mon PEA Fortuneo');
  });

  it('returns null for whitespace-only input', () => {
    expect(normalizeText('   ')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeText('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizeText(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(normalizeText(undefined)).toBeNull();
  });
});

describe('normalizeTextOrUndefined', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeTextOrUndefined('  hello  ')).toBe('hello');
  });

  it('collapses multiple internal spaces to a single space', () => {
    expect(normalizeTextOrUndefined('   Mon       PEA    ')).toBe('Mon PEA');
  });

  it('returns undefined for empty string', () => {
    expect(normalizeTextOrUndefined('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only input', () => {
    expect(normalizeTextOrUndefined('   ')).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(normalizeTextOrUndefined(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(normalizeTextOrUndefined(undefined)).toBeUndefined();
  });
});
