import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir  = join(root, 'public/assets/logos/brokers');

const NAMES = {
  'bnp-paribas':'BNP Paribas','boursobank':'Boursobank','caisse-depargne':"Caisse d'Épargne",
  'cic':'CIC','credit-agricole':'Crédit Agricole','credit-mutuel':'Crédit Mutuel','degiro':'De Giro',
  'fortuneo':'Fortuneo','freetrade':'Freetrade','hello-bank':'Hello Bank','hsbc':'HSBC','ing':'ING',
  'interactive-brokers':'Interactive Brokers','la-banque-postale':'La Banque Postale','lcl':'LCL',
  'linxea':'Linxea','lydia':'Lydia','n26':'N26','nalo':'Nalo','revolut':'Revolut','saxo-bank':'Saxo Bank',
  'societe-generale':'Société Générale','swissquote':'Swissquote','trade-republic':'Trade Republic',
  'yomoni':'Yomoni','binance':'Binance','bitfinex':'Bitfinex','bitstamp':'Bitstamp','bybit':'Bybit',
  'coinbase':'Coinbase','crypto-com':'Crypto.com','gemini':'Gemini','kraken':'Kraken','ledger':'Ledger',
  'okx':'OKX','trezor':'Trezor',
};
const CRYPTO = new Set(['binance','bitfinex','bitstamp','bybit','coinbase','crypto-com','gemini','kraken','ledger','okx','trezor']);

// Read the per-brand framing out of the manifest the component uses, so this
// sheet can never show a crop the app does not apply.
const manifest = readFileSync(join(root, 'src/app/core/constants/broker-logos.ts'), 'utf8');
const framingBlock = manifest.slice(
  manifest.indexOf('const LOGO_FRAMING'),
  manifest.indexOf('function normalise'),
);
const FRAMING = {};
for (const [, file, body] of framingBlock.matchAll(/'([\w.-]+\.png)':\s*\{([^}]*)\}/g)) {
  const num = k => {
    const m = body.match(new RegExp(`\\b${k}:\\s*(-?[\\d.]+)`));
    return m ? parseFloat(m[1]) : undefined;
  };
  FRAMING[file] = { scale: num('scale'), x: num('x'), y: num('y') };
}
const transformFor = file => {
  const f = FRAMING[file];
  return f ? `translate(${f.x ?? 0}%, ${f.y ?? 0}%) scale(${f.scale ?? 1})` : 'none';
};

const items = readdirSync(dir).filter(f => /\.(png|svg)$/.test(f)).sort().map(file => {
  const buf  = readFileSync(join(dir, file));
  const slug = file.replace(/\.(png|svg)$/, '');
  const svg  = file.endsWith('.svg');
  return {
    file,
    slug,
    name: NAMES[slug] ?? file,
    // Vectors have no pixel width to report, and never need a better source.
    w: svg ? Infinity : buf.readUInt32BE(16),
    svg,
    kb: (buf.length / 1024).toFixed(1),
    crypto: CRYPTO.has(slug),
    framed: !!FRAMING[file],
    transform: transformFor(file),
    data: `data:image/${svg ? 'svg+xml' : 'png'};base64,${buf.toString('base64')}`,
  };
});

// Worst first: the low-resolution ones are the only actionable problem here.
items.sort((a, b) => a.w - b.w || a.name.localeCompare(b.name, 'fr'));

const sharp = items.filter(i => i.w >= 128).length;
const soft  = items.filter(i => i.w < 128);

const card = i => `
      <figure class="logo${i.w < 128 ? ' logo--soft' : ''}">
        <div class="chips">
          ${[44,34,20].map(s => `<span class="chip" style="--s:${s}px"><img src="${i.data}" alt="" width="${s}" height="${s}" style="transform:${i.transform}"></span>`).join('')}
        </div>
        <figcaption>
          <span class="logo__name">${i.name}${i.framed ? ' <span class="framed" title="Framing adjusted in broker-logos.ts">◇</span>' : ''}</span>
          <span class="logo__meta">${i.svg ? 'vector' : i.w + 'px'} · ${i.kb} KB${i.crypto ? ' · crypto' : ''}</span>
        </figcaption>
      </figure>`;

const html = `<title>Broker Logo Contact Sheet</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..700&family=Inter:wght@400;500;600&display=swap">
<style>
  :root{
    --ground:#E9ECED; --card:#FFFFFF; --raised:#F2F5F5;
    --line:#DBE0E1; --ink:#0F172A; --ink-2:#4B5A60; --ink-3:#64748B;
    --accent:#0F7869; --warn:#9A6B12; --warn-bg:#FBF0DA;
    --shadow:0 1px 2px rgb(15 23 42 / .06), 0 8px 24px rgb(15 23 42 / .05);
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ground:#0A0E10; --card:#12181B; --raised:#171F22;
      --line:#232B2E; --ink:#EDF1F1; --ink-2:#9FADB1; --ink-3:#6E7B7F;
      --accent:#4FB0A5; --warn:#D8A657; --warn-bg:#2A2010;
      --shadow:0 1px 2px rgb(0 0 0 / .4), 0 8px 24px rgb(0 0 0 / .3);
    }
  }
  :root[data-theme="dark"]{
    --ground:#0A0E10; --card:#12181B; --raised:#171F22;
    --line:#232B2E; --ink:#EDF1F1; --ink-2:#9FADB1; --ink-3:#6E7B7F;
    --accent:#4FB0A5; --warn:#D8A657; --warn-bg:#2A2010;
    --shadow:0 1px 2px rgb(0 0 0 / .4), 0 8px 24px rgb(0 0 0 / .3);
  }

  *{box-sizing:border-box}
  body{
    margin:0; background:var(--ground); color:var(--ink);
    font-family:Inter,system-ui,sans-serif; font-size:15px; line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1180px; margin:0 auto; padding:40px 24px 72px; display:flex; flex-direction:column; gap:28px}

  header{display:flex; flex-direction:column; gap:10px}
  h1{
    font-family:Archivo,Inter,sans-serif; font-stretch:112%; font-weight:700;
    font-size:clamp(1.6rem,3.4vw,2.2rem); letter-spacing:-.02em; margin:0; text-wrap:balance;
  }
  .sub{margin:0; color:var(--ink-2); max-width:62ch}

  .tally{display:flex; flex-wrap:wrap; gap:8px; align-items:center}
  .tag{
    display:inline-flex; align-items:center; gap:7px; padding:5px 11px; border-radius:999px;
    border:1px solid var(--line); background:var(--card);
    font-size:12px; font-weight:500; color:var(--ink-2); font-variant-numeric:tabular-nums;
  }
  .tag b{color:var(--ink); font-weight:600}
  .dot{width:7px; height:7px; border-radius:999px; background:var(--accent)}
  .dot--warn{background:var(--warn)}

  section{display:flex; flex-direction:column; gap:14px}
  .head{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
  h2{
    font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.14em;
    color:var(--ink-3); margin:0;
  }
  .note{font-size:13px; color:var(--ink-3); margin:0}

  .grid{
    display:grid; gap:10px;
    grid-template-columns:repeat(auto-fill,minmax(186px,1fr));
  }
  .logo{
    margin:0; padding:16px 14px; border-radius:10px;
    background:var(--card); border:1px solid var(--line); box-shadow:var(--shadow);
    display:flex; flex-direction:column; gap:12px; align-items:center;
  }
  .logo--soft{border-color:color-mix(in srgb, var(--warn) 45%, var(--line))}

  .chips{display:flex; align-items:center; gap:10px; min-height:48px}
  /* Mirrors BrokerLogoComponent exactly: white ground, hairline ring,
     image filling the circle with no inset. */
  .chip{
    width:var(--s); height:var(--s); border-radius:999px; overflow:hidden;
    display:inline-flex; align-items:center; justify-content:center;
    background:#fff; box-shadow:inset 0 0 0 1px var(--line); flex:none;
  }
  .chip img{width:100%; height:100%; object-fit:cover; display:block}

  figcaption{display:flex; flex-direction:column; gap:2px; align-items:center; text-align:center}
  .logo__name{font-size:13px; font-weight:600; line-height:1.3}
  .framed{color:var(--accent); font-size:11px; vertical-align:1px}
  .logo__meta{font-size:11px; color:var(--ink-3); font-variant-numeric:tabular-nums}
  .logo--soft .logo__meta{color:var(--warn); font-weight:500}

  .legend{
    display:flex; flex-wrap:wrap; gap:18px; align-items:center;
    padding:14px 16px; border-radius:10px;
    background:var(--raised); border:1px solid var(--line);
    font-size:12.5px; color:var(--ink-2);
  }
  .legend b{color:var(--ink); font-weight:600}
  .legend .chips{min-height:0}

  footer{border-top:1px solid var(--line); padding-top:16px; color:var(--ink-3); font-size:12.5px}
  footer code{
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11.5px;
    background:var(--raised); padding:1px 5px; border-radius:4px; color:var(--ink-2);
  }
</style>

<div class="wrap">
  <header>
    <h1>Broker logo contact sheet</h1>
    <p class="sub">
      Every committed logo, rendered exactly as <code style="font-family:ui-monospace,monospace;font-size:.85em">BrokerLogoComponent</code>
      draws it — white ground, hairline ring, image filling the circle. Three sizes, because the app uses three:
      44&nbsp;px in account detail headers, 34&nbsp;px in the wealth lists, 20&nbsp;px in the add-account summary.
    </p>
    <div class="tally">
      <span class="tag"><span class="dot"></span><b>${sharp}</b> sharp at 128&nbsp;px</span>
      <span class="tag"><span class="dot dot--warn"></span><b>${soft.length}</b> below 128&nbsp;px</span>
      <span class="tag"><b>1</b> on initials — Bourse Direct</span>
      <span class="tag"><b>${items.length}</b> files · ${(items.reduce((s,i)=>s+parseFloat(i.kb),0)).toFixed(0)}&nbsp;KB total</span>
    </div>
  </header>

  <div class="legend">
    <span>Sizes shown, left to right:</span>
    <span class="chips">
      <span class="chip" style="--s:44px;background:var(--raised)"></span>
      <span class="chip" style="--s:34px;background:var(--raised)"></span>
      <span class="chip" style="--s:20px;background:var(--raised)"></span>
    </span>
    <span><b>44</b> detail header &nbsp;·&nbsp; <b>34</b> list row &nbsp;·&nbsp; <b>20</b> add-account summary</span>
  </div>

  <section>
    <div class="head">
      <h2>Needs a better source</h2>
      <p class="note">Upscaled from a small favicon — soft at 34&nbsp;px, worse at 44. Only an official SVG fixes these.</p>
    </div>
    <div class="grid">${soft.map(card).join('')}
    </div>
  </section>

  <section>
    <div class="head">
      <h2>Sharp</h2>
      <p class="note">Native 128&nbsp;px, no upscaling at any size the app uses.</p>
    </div>
    <div class="grid">${items.filter(i=>i.w>=128).map(card).join('')}
    </div>
  </section>

  <footer>
    <span class="framed">◇</span> marks a logo whose framing is adjusted in
    <code>src/app/core/constants/broker-logos.ts</code> → <code>LOGO_FRAMING</code>.
    Edit the scale and offsets there, then run <code>npm run sheet:logos</code> to
    regenerate this page. Both this sheet and the app read that same table.
  </footer>
</div>
`;

writeFileSync(join(root, 'docs/logo-sheet.html'), html, 'utf8');
console.log(`wrote ${items.length} logos, ${(Buffer.byteLength(html)/1024).toFixed(0)} KB`);
