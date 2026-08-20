/**
 * Region name (as returned by the backend's `inferRegion()`) → ISO 3166-1 alpha-2.
 *
 * Flags are served as static assets from `public/assets/flags/`, populated by
 * `scripts/sync-flag-assets.mjs` from the `flag-icons` package. Only the codes
 * declared here are copied: importing the package's stylesheet instead would
 * emit all 542 SVGs (3.9 MB — measured) into the build to render the handful we
 * actually use.
 *
 * Keys are normalised (lowercase, trimmed) so a stored "UNITED STATES" or a
 * stray trailing space still resolves.
 */

export const CRYPTO_REGION = 'Crypto';

/** Every ISO code below must have a matching SVG in public/assets/flags/. */
export const REGION_TO_ISO: Readonly<Record<string, string>> = {
  'united states': 'us',
  'usa':           'us',
  'us':            'us',
  'france':        'fr',
  'germany':       'de',
  'netherlands':   'nl',
  'united kingdom': 'gb',
  'uk':            'gb',
  'great britain': 'gb',
  'italy':         'it',
  'belgium':       'be',
  'switzerland':   'ch',
  'spain':         'es',
  'ireland':       'ie',
  'luxembourg':    'lu',
  'portugal':      'pt',
  'austria':       'at',
  'sweden':        'se',
  'denmark':       'dk',
  'norway':        'no',
  'finland':       'fi',
  'japan':         'jp',
  'china':         'cn',
  'canada':        'ca',
  'australia':     'au',
  'south korea':   'kr',
  'korea':         'kr',
  'india':         'in',
  'brazil':        'br',
  'europe':        'eu',
  'eurozone':      'eu',
  'euro area':     'eu',
};

/** Distinct ISO codes that must exist on disk — drives the sync script and its test. */
export const REQUIRED_FLAG_CODES: readonly string[] =
  [...new Set(Object.values(REGION_TO_ISO))].sort();

function normalise(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isCryptoRegion(region: string | null | undefined): boolean {
  return normalise(region) === normalise(CRYPTO_REGION);
}

export function isoForRegion(region: string | null | undefined): string | null {
  return REGION_TO_ISO[normalise(region)] ?? null;
}

export function flagPathForRegion(region: string | null | undefined): string | null {
  const iso = isoForRegion(region);
  return iso ? `assets/flags/${iso}.svg` : null;
}
