import { existsSync } from 'fs';
import { join } from 'path';
import {
  REGION_TO_ISO,
  REQUIRED_FLAG_CODES,
  isoForRegion,
  flagPathForRegion,
  isCryptoRegion,
  CRYPTO_REGION,
} from './country-flags';

const FLAG_DIR = join(process.cwd(), 'public', 'assets', 'flags');

describe('country flag manifest', () => {
  // The guarantee that matters: a region can never point at a flag that is not
  // deployed. Without this, a missing file is invisible until a user sees a gap.
  it('ships an SVG on disk for every declared ISO code', () => {
    const missing = REQUIRED_FLAG_CODES.filter(
      code => !existsSync(join(FLAG_DIR, `${code}.svg`)),
    );
    expect(missing).toEqual([]);
  });

  it('declares a flag for every region the UI can receive', () => {
    for (const region of ['United States', 'France', 'Germany', 'Netherlands',
                          'United Kingdom', 'Italy', 'Belgium', 'Switzerland']) {
      expect(isoForRegion(region)).not.toBeNull();
    }
  });

  it('maps only to two-letter ISO codes', () => {
    for (const code of Object.values(REGION_TO_ISO)) {
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });
});

describe('isoForRegion', () => {
  // Region strings come from the backend; casing and padding are not guaranteed.
  it('ignores casing and surrounding whitespace', () => {
    expect(isoForRegion('UNITED STATES')).toBe('us');
    expect(isoForRegion('  france  ')).toBe('fr');
  });

  it('resolves common aliases to the same flag', () => {
    expect(isoForRegion('UK')).toBe(isoForRegion('United Kingdom'));
    expect(isoForRegion('USA')).toBe(isoForRegion('United States'));
  });

  it('returns null for an unknown or empty region rather than guessing', () => {
    expect(isoForRegion('Atlantis')).toBeNull();
    expect(isoForRegion('')).toBeNull();
    expect(isoForRegion(null)).toBeNull();
    expect(isoForRegion(undefined)).toBeNull();
  });
});

describe('flagPathForRegion', () => {
  it('builds a path under the served assets folder', () => {
    expect(flagPathForRegion('France')).toBe('assets/flags/fr.svg');
  });

  it('returns null when there is no flag, so callers fall back instead of 404ing', () => {
    expect(flagPathForRegion('Atlantis')).toBeNull();
  });
});

describe('isCryptoRegion', () => {
  it('recognises the crypto pseudo-region in any casing', () => {
    expect(isCryptoRegion(CRYPTO_REGION)).toBe(true);
    expect(isCryptoRegion('crypto')).toBe(true);
  });

  it('does not mistake a country for it', () => {
    expect(isCryptoRegion('France')).toBe(false);
    expect(isCryptoRegion(null)).toBe(false);
  });
});
