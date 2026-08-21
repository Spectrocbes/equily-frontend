/**
 * Broker name (as stored on the account) → logo filename in
 * `public/assets/logos/brokers/`.
 *
 * Filenames are declared, never derived from the broker name. A `slugify()`
 * would silently break on the entries whose file does not match their label —
 * "De Giro" → `degiro.png`, "Caisse d'Épargne" → `caisse-depargne.png` — and a
 * missing logo is invisible until a user notices a blank frame.
 *
 * Keys are normalised (lowercase, trimmed): accounts store "BoursoBank" while
 * the broker catalogue lists "Boursobank", and a case-sensitive lookup misses it.
 *
 * `broker-logos.spec.ts` asserts every filename here exists on disk and that
 * every broker in the catalogue is accounted for, so the two cannot drift.
 *
 * Logos are favicons fetched once by `scripts/fetch-broker-logos.ps1` and
 * committed, rather than hot-linked: a request per logo would tell the icon
 * provider which institutions each user banks with.
 */

/** Brokers with no logo on file — resolved to initials, never a broken image. */
const NO_LOGO = new Set(['other', 'bourse direct']);

const BROKER_LOGOS: Readonly<Record<string, string>> = {
  // Traditional
  'bnp paribas':          'bnp-paribas.png',
  'boursobank':           'boursobank.png',
  'bourse direct':        '',                       // no usable favicon published
  "caisse d'épargne":     'caisse-depargne.png',
  'caisse d’épargne': 'caisse-depargne.png',   // typographic apostrophe
  'cic':                  'cic.png',
  'crédit agricole':      'credit-agricole.png',
  'crédit mutuel':        'credit-mutuel.png',
  'de giro':              'degiro.png',
  'degiro':               'degiro.png',
  'fortuneo':             'fortuneo.png',
  'freetrade':            'freetrade.png',
  'hello bank':           'hello-bank.png',
  'hsbc':                 'hsbc.png',
  'ing':                  'ing.png',
  'interactive brokers':  'interactive-brokers.png',
  'la banque postale':    'la-banque-postale.png',
  'lcl':                  'lcl.svg',   // vector: sharp at any size, and lighter
  'linxea':               'linxea.png',
  'lydia':                'lydia.png',
  'n26':                  'n26.png',
  'nalo':                 'nalo.png',
  'revolut':              'revolut.png',
  'saxo bank':            'saxo-bank.png',
  'société générale':     'societe-generale.png',
  'swissquote':           'swissquote.png',
  'trade republic':       'trade-republic.png',
  'yomoni':               'yomoni.png',

  // Crypto
  'binance':    'binance.png',
  'bitfinex':   'bitfinex.png',
  'bitstamp':   'bitstamp.png',
  'bybit':      'bybit.png',
  'coinbase':   'coinbase.png',
  'crypto.com': 'crypto-com.png',
  'gemini':     'gemini.png',
  'kraken':     'kraken.png',
  'ledger':     'ledger.png',
  'okx':        'okx.png',
  'trezor':     'trezor.png',
};

/**
 * ── Adjust a logo's framing here ──────────────────────────────────────────
 *
 * Publishers crop their favicons inconsistently: some bleed to the edge, others
 * sit in generous padding, a few are simply off-centre. Centring is automated
 * (scripts/normalize-broker-logos.ps1), but how tightly a mark should be
 * cropped is a judgement call per brand, so it lives here.
 *
 *   scale  >1 zooms in (crops), <1 zooms out (adds margin). Default 1.
 *   x / y  shift as a percentage of the frame. Positive moves right / down.
 *
 * Keyed by filename, not broker name, because several names resolve to the same
 * file. Anything absent renders untransformed — the common case.
 *
 * After editing, run `npm run sheet:logos` to regenerate the contact sheet and
 * check the result at the sizes the app actually uses.
 */
export interface LogoFraming {
  scale?: number;
  x?: number;
  y?: number;
}

const LOGO_FRAMING: Readonly<Record<string, LogoFraming>> = {
  'hello-bank.png':      { scale: 0.7, y: 4 },
  'societe-generale.png':{ scale: 1.1 },
  'binance.png':         { scale: 0.9 },
  'bitfinex.png':        { scale: 1.1, x: -3 },
  'bitstamp.png':        { scale: 1.1, y: 3 },
  'boursobank.png':      { scale: 0.85, x: -7, y: 2 },
  'bnp-paribas.png':     { scale: 1.05, y: 1 },
  'bybit.png':           { scale: 1.15, y: -2 },
  'lcl.svg':             { scale: 1.2, y: -2 },
  'saxo-bank.png':       { scale: 1.05, y: 1 },
  'ledger.png':          { scale: 0.70 },
};

function normalise(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function fileFor(broker: string | null | undefined): string | null {
  const key = normalise(broker);
  if (!key || NO_LOGO.has(key)) return null;
  return BROKER_LOGOS[key] || null;
}

/** Path to the broker's logo, or null when none is on file (use the initials). */
export function getBrokerLogoPath(broker: string | null | undefined): string | null {
  const file = fileFor(broker);
  return file ? `assets/logos/brokers/${file}` : null;
}

/** CSS transform for the logo, or null when it needs no adjustment. */
export function getBrokerLogoTransform(broker: string | null | undefined): string | null {
  const file = fileFor(broker);
  const f = file ? LOGO_FRAMING[file] : undefined;
  if (!f) return null;
  return `translate(${f.x ?? 0}%, ${f.y ?? 0}%) scale(${f.scale ?? 1})`;
}

/** Framing entries, so the contact-sheet generator renders exactly what the app does. */
export const LOGO_FRAMING_ENTRIES = LOGO_FRAMING;

/**
 * Up to two letters standing in for a missing logo: initials of the first two
 * words, or the first two letters of a single-word name.
 */
export function getBrokerInitials(broker: string | null | undefined): string {
  const words = (broker ?? '').trim().split(/[\s.'’-]+/).filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Filenames this manifest points at — used by the spec to check they exist. */
export const DECLARED_LOGO_FILES: readonly string[] =
  [...new Set(Object.values(BROKER_LOGOS).filter(Boolean))].sort();

/** Broker → filename, exposed so specs can check the two tables line up. */
export const BROKER_LOGO_FILES: Readonly<Record<string, string>> = BROKER_LOGOS;
