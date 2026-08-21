import { existsSync } from 'fs';
import { join } from 'path';
import {
  getBrokerLogoPath, getBrokerInitials, getBrokerLogoTransform,
  DECLARED_LOGO_FILES, LOGO_FRAMING_ENTRIES, BROKER_LOGO_FILES,
} from './broker-logos';
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

describe('getBrokerLogoTransform', () => {
  it('leaves logos without a framing entry untransformed', () => {
    const unframed = Object.entries(BROKER_LOGO_FILES)
      .filter(([, file]) => file && !(file in LOGO_FRAMING_ENTRIES))
      .map(([broker]) => broker);

    expect(unframed.length).toBeGreaterThan(0);
    for (const broker of unframed) {
      expect(getBrokerLogoTransform(broker)).toBeNull();
    }
  });

  // Expectations are derived from the manifest rather than hardcoded: these
  // values get nudged by eye whenever a logo is replaced, and a spec that has
  // to be edited after every nudge is a tax, not a safety net. What is worth
  // pinning is that the broker name resolves to its file's entry, and that
  // undeclared axes fall back rather than emitting "undefined".
  it('applies the declared crop, resolving the broker name to its file', () => {
    for (const [file, framing] of Object.entries(LOGO_FRAMING_ENTRIES)) {
      const broker = Object.entries(BROKER_LOGO_FILES).find(([, f]) => f === file)?.[0];
      if (!broker) continue;
      expect(getBrokerLogoTransform(broker)).toBe(
        `translate(${framing.x ?? 0}%, ${framing.y ?? 0}%) scale(${framing.scale ?? 1})`,
      );
    }
  });

  it('defaults every axis that was not declared', () => {
    for (const broker of Object.keys(BROKER_LOGO_FILES)) {
      const t = getBrokerLogoTransform(broker);
      if (t) expect(t).not.toContain('undefined');
    }
  });

  it('returns null for a broker with no logo at all', () => {
    expect(getBrokerLogoTransform('Bourse Direct')).toBeNull();
    expect(getBrokerLogoTransform(null)).toBeNull();
  });

  // A framing entry pointing at a file that no longer exists would be silently
  // dead — the crop would simply never apply.
  it('only frames files that are actually shipped', () => {
    const orphans = Object.keys(LOGO_FRAMING_ENTRIES)
      .filter(f => !DECLARED_LOGO_FILES.includes(f));
    expect(orphans).toEqual([]);
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
