import { existsSync } from 'fs';
import { join } from 'path';
import { getBrokerLogoPath, getBrokerInitials, DECLARED_LOGO_FILES } from './broker-logos';
import { TRADITIONAL_BROKERS, CRYPTO_BROKERS, OTHER_BROKER } from './brokers';

const LOGO_DIR = join(process.cwd(), 'public', 'assets', 'logos', 'brokers');

describe('broker logo manifest', () => {
  // Without this, a renamed or forgotten file is invisible until a user sees a
  // blank frame in production.
  it('ships a file on disk for every declared logo', () => {
    const missing = DECLARED_LOGO_FILES.filter(f => !existsSync(join(LOGO_DIR, f)));
    expect(missing).toEqual([]);
  });

  // The catalogue drives the "add account" dropdown, so any broker a user can
  // pick must resolve to either a logo or a deliberate initials fallback.
  it('accounts for every broker offered in the catalogue', () => {
    const unresolved = [...TRADITIONAL_BROKERS, ...CRYPTO_BROKERS]
      .filter(b => getBrokerLogoPath(b.value) === null)
      .map(b => b.value);

    // Bourse Direct publishes no usable favicon and is intentionally on initials.
    expect(unresolved).toEqual(['Bourse Direct']);
  });

  it('never resolves a logo for the Other placeholder', () => {
    expect(getBrokerLogoPath(OTHER_BROKER.value)).toBeNull();
  });
});

describe('getBrokerLogoPath', () => {
  // Accounts store "BoursoBank" while the catalogue lists "Boursobank"; a
  // case-sensitive lookup silently misses it.
  it('ignores casing and surrounding whitespace', () => {
    expect(getBrokerLogoPath('BoursoBank')).toBe('assets/logos/brokers/boursobank.png');
    expect(getBrokerLogoPath('  BINANCE  ')).toBe('assets/logos/brokers/binance.png');
  });

  // Names whose file cannot be derived from the label — the reason filenames
  // are declared rather than slugified.
  it('resolves names that do not match their filename', () => {
    expect(getBrokerLogoPath('De Giro')).toBe('assets/logos/brokers/degiro.png');
    expect(getBrokerLogoPath("Caisse d'Épargne")).toBe('assets/logos/brokers/caisse-depargne.png');
    expect(getBrokerLogoPath('Crypto.com')).toBe('assets/logos/brokers/crypto-com.png');
  });

  it('handles the typographic apostrophe as well as the straight one', () => {
    expect(getBrokerLogoPath('Caisse d’Épargne'))
      .toBe(getBrokerLogoPath("Caisse d'Épargne"));
  });

  it('returns null for unknown or empty input rather than a broken path', () => {
    expect(getBrokerLogoPath('My Local Credit Union')).toBeNull();
    expect(getBrokerLogoPath('')).toBeNull();
    expect(getBrokerLogoPath(null)).toBeNull();
    expect(getBrokerLogoPath(undefined)).toBeNull();
  });
});

describe('getBrokerInitials', () => {
  it('uses the first letter of the first two words', () => {
    expect(getBrokerInitials('BNP Paribas')).toBe('BP');
    expect(getBrokerInitials('Trade Republic')).toBe('TR');
  });

  it('uses the first two letters of a single-word name', () => {
    expect(getBrokerInitials('Fortuneo')).toBe('FO');
  });

  it('splits on punctuation as well as spaces', () => {
    expect(getBrokerInitials('Crypto.com')).toBe('CC');
    expect(getBrokerInitials("Caisse d'Épargne")).toBe('CD');
  });

  it('falls back to a dash rather than an empty chip', () => {
    expect(getBrokerInitials('')).toBe('—');
    expect(getBrokerInitials(null)).toBe('—');
  });
});
