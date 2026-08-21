/**
 * Copies only the flags declared in `country-flags.ts` from the `flag-icons`
 * package into `public/assets/flags/`.
 *
 * Why not just import `flag-icons/css/flag-icons.min.css`?
 * Because its rules reference all 542 SVGs, so the build emits every one of
 * them — 3.9 MB, measured, or 77% of the whole bundle — to render the ~25 we
 * use (106 KB). This keeps `flag-icons` as a devDependency and treats it as the
 * *source* of the assets rather than a runtime dependency.
 *
 * Adding a country: add it to REGION_TO_ISO, then run `npm run sync:flags`.
 *
 * Usage: node scripts/sync-flag-assets.mjs
 */
import { readFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root    = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir  = join(root, 'node_modules', 'flag-icons', 'flags', '1x1');
const outDir  = join(root, 'public', 'assets', 'flags');

// Read the codes straight out of the manifest so the two can never drift.
const manifest = readFileSync(join(root, 'src/app/core/constants/country-flags.ts'), 'utf8');
const body     = manifest.slice(manifest.indexOf('REGION_TO_ISO'), manifest.indexOf('REQUIRED_FLAG_CODES'));
const codes    = [...new Set([...body.matchAll(/:\s*'([a-z]{2})'/g)].map(m => m[1]))].sort();

if (!existsSync(srcDir)) {
  console.error('flag-icons is not installed — run `npm install` first.');
  process.exit(1);
}
if (codes.length === 0) {
  console.error('No ISO codes parsed from country-flags.ts — aborting rather than emptying the folder.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// Drop flags no longer declared, so removing a country actually shrinks the build.
for (const file of existsSync(outDir) ? readdirSync(outDir) : []) {
  if (file.endsWith('.svg') && !codes.includes(file.replace('.svg', ''))) {
    rmSync(join(outDir, file));
    console.log(`removed  ${file} (no longer declared)`);
  }
}

let copied = 0, bytes = 0;
const missing = [];
for (const code of codes) {
  const from = join(srcDir, `${code}.svg`);
  if (!existsSync(from)) { missing.push(code); continue; }
  copyFileSync(from, join(outDir, `${code}.svg`));
  bytes += readFileSync(from).length;
  copied++;
}

console.log(`copied ${copied}/${codes.length} flags → public/assets/flags/ (${(bytes / 1024).toFixed(0)} KB)`);
if (missing.length) {
  console.error(`MISSING in flag-icons: ${missing.join(', ')}`);
  process.exit(1);
}
