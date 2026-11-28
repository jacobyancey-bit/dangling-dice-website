#!/usr/bin/env node
/**
 * Design-system guardrail (ratchet). Runs as part of `npm test`.
 *
 * 1. Anti-slop rules, counted per app: gradients, blur/glass, box-shadow, border-radius > 8px,
 *    hard-coded hex colors outside packages/shared/tokens.css, and emoji in HTML/JS.
 *    Counts may only go DOWN versus scripts/design-baseline.json. A migrated app is pinned at 0.
 * 2. Token contrast (WCAG 2.2): every accent >= 4.5:1 with white text and >= 3:1 on the dark
 *    canvas; ink >= 4.5:1; form-control borders >= 3:1 on every surface.
 *
 *   node scripts/lint-design.js            # check (CI / npm test)
 *   node scripts/lint-design.js --update   # lower the baseline after a cleanup (never raises it)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineFile = path.join(root, 'scripts', 'design-baseline.json');
const UPDATE = process.argv.includes('--update');

const rel = (p) => path.relative(root, p).replace(/\\/g, '/');
const read = (p) => fs.readFileSync(p, 'utf8');
const list = (dir, exts) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        const p = path.join(dir, d.name);
        if (d.isDirectory()) return ['node_modules', 'dist', 'public'].includes(d.name) ? [] : list(p, exts);
        return exts.some((e) => d.name.endsWith(e)) ? [p] : [];
      })
    : [];

// ---------- Scopes ----------
const SHARED = path.join(root, 'packages', 'shared');
const TOKENS = path.join(SHARED, 'tokens.css');

const scopes = {
  'shared-design': ['tokens.css', 'base.css', 'fonts.css', 'design.css', 'shell.css', 'shell.js', 'icons.js', 'icons.generated.js', 'tabs.js'].map((f) => path.join(SHARED, f)),
  // Temporary: staff palette module + legacy page chrome, retired as apps migrate (Phase 3)
  'shared-legacy': ['index.js', 'legacy-chrome.css'].map((f) => path.join(SHARED, f)),
};
for (const app of ['web', 'beats', 'dev', 'games', 'media']) {
  const base = path.join(root, 'apps', app);
  const files = [
    ...fs.readdirSync(base).filter((f) => f.endsWith('.html')).map((f) => path.join(base, f)),
    ...list(path.join(base, 'src'), ['.css', '.js']),
    ...list(path.join(base, 'css'), ['.css']),
    ...list(path.join(base, 'js'), ['.js']),
  ];
  scopes[app] = files;
}
// The admin console (admin.html + css/main.css + js/admin.js) migrates separately (Phase 4)
const ADMIN_FILES = ['admin.html', 'css/main.css', 'js/admin.js'].map((f) => path.join(root, 'apps', 'web', f));
scopes.web = scopes.web.filter((f) => !ADMIN_FILES.includes(f));
scopes.admin = ADMIN_FILES.filter((f) => fs.existsSync(f));

// ---------- Rules ----------
const NOT_EMOJI = new Set(['™', '©', '®']); // ™ © ® are brand/legal marks
const RULES = {
  gradient: (src) => (src.match(/(?:linear|radial|conic)-gradient\(/gi) || []).length,
  // `: none` resets (e.g. overriding legacy glows) are allowed; the lookahead skips whitespace itself
  // so the engine cannot backtrack past it and miscount `box-shadow: none`.
  blur: (src) => (src.match(/backdrop-filter\s*:(?!\s*none\b)|(?<![-\w])filter\s*:\s*[^;"']*blur\(/gi) || []).length,
  shadow: (src) => (src.match(/box-shadow\s*:(?!\s*none\b)/gi) || []).length,
  radius_gt8: (src) =>
    [...src.matchAll(/border-radius\s*:\s*([^;"'}]+)/gi)].filter(([, v]) =>
      v.split(/[\s/]+/).some((t) => {
        if (/%$/.test(t)) return parseFloat(t) > 0;
        const n = parseFloat(t);
        if (Number.isNaN(n)) return false;
        return /rem|em/.test(t) ? n * 16 > 8 : n > 8;
      })
    ).length,
  // <meta name="theme-color"> must be a literal (the browser reads it before CSS loads), so it is exempt
  hex_color: (src, file) => (file === TOKENS ? 0 : (src.replace(/<meta[^>]*name=["']theme-color["'][^>]*>/gi, '').match(/#[0-9a-fA-F]{3,8}\b(?![-\w])/g) || []).filter((h) => [4, 5, 7, 9].includes(h.length)).length),
  emoji: (src, file) =>
    /\.(html|js)$/.test(file) ? [...src.matchAll(/\p{Extended_Pictographic}/gu)].filter(([c]) => !NOT_EMOJI.has(c)).length : 0,
};

const counts = {};
for (const [scope, files] of Object.entries(scopes)) {
  counts[scope] = Object.fromEntries(Object.keys(RULES).map((r) => [r, 0]));
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const src = read(f);
    for (const [r, fn] of Object.entries(RULES)) counts[scope][r] += fn(src, f);
  }
}

// ---------- Contrast ----------
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const tokensSrc = read(TOKENS);
const block = (selector) => {
  const i = tokensSrc.indexOf(selector);
  return i < 0 ? '' : tokensSrc.slice(i, tokensSrc.indexOf('}', i));
};
const varIn = (blk, name) => blk.match(new RegExp(`--dds-${name}:\\s*(#[0-9A-Fa-f]{6})`))?.[1];
const dark = block(':root {');
const light = block(":root[data-theme='light']");
const T = (blk, n) => varIn(blk, n) || varIn(dark, n);
const contrastFailures = [];
const need = (label, fg, bg, min) => {
  if (!fg || !bg) return contrastFailures.push(`${label}: token missing`);
  const r = ratio(fg, bg);
  if (r < min) contrastFailures.push(`${label}: ${fg} on ${bg} = ${r.toFixed(2)}:1 (needs ${min}:1)`);
};
for (const [theme, blk] of [['dark', dark], ['light', light]]) {
  for (const bg of ['canvas', 'surface', 'surface-subtle']) {
    need(`${theme} ink on ${bg}`, T(blk, 'ink'), T(blk, bg), 4.5);
    need(`${theme} muted ink on ${bg}`, T(blk, 'ink-muted'), T(blk, bg), 4.5);
    need(`${theme} control border on ${bg}`, T(blk, 'border-control'), T(blk, bg), 3);
    for (const st of ['status-ok', 'status-warn', 'status-error']) need(`${theme} ${st} on ${bg}`, T(blk, st), T(blk, bg), 4.5);
  }
}
for (const m of tokensSrc.matchAll(/data-site='(\w+)'\]\s*\{\s*--dds-accent:\s*(#[0-9A-Fa-f]{6});\s*--dds-accent-hover:\s*(#[0-9A-Fa-f]{6})/g)) {
  const [, site, accent, hover] = m;
  need(`${site} accent with white text`, '#FFFFFF', accent, 4.5);
  need(`${site} accent-hover with white text`, '#FFFFFF', hover, 4.5);
  need(`${site} focus ring on dark canvas`, accent, T(dark, 'canvas'), 3);
  need(`${site} focus ring on light canvas`, accent, T(light, 'canvas'), 3);
}

// ---------- Ratchet ----------
const baseline = fs.existsSync(baselineFile) ? JSON.parse(read(baselineFile)) : {};
const regressions = [];
const improvements = [];
for (const [scope, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    const allowed = baseline[scope]?.[rule] ?? 0;
    if (n > allowed) regressions.push(`${scope}.${rule}: ${n} (allowed ${allowed})`);
    else if (n < allowed) improvements.push(`${scope}.${rule}: ${allowed} -> ${n}`);
  }
}

if (UPDATE) {
  // The very first run records today's state; after that the baseline can only go down.
  if (regressions.length && fs.existsSync(baselineFile)) {
    console.error('Refusing to raise the baseline. Fix these first:\n  ' + regressions.join('\n  '));
    process.exit(1);
  }
  const next = {};
  for (const [scope, rules] of Object.entries(counts)) next[scope] = { ...rules };
  fs.writeFileSync(baselineFile, JSON.stringify(next, null, 2) + '\n');
  console.log(`Baseline updated (${improvements.length} improvement(s)).`);
  process.exit(0);
}

const total = (scope) => Object.values(counts[scope]).reduce((a, b) => a + b, 0);
console.log('Design lint (ratchet) — remaining violations per scope:');
for (const scope of Object.keys(counts)) console.log(`  ${scope.padEnd(14)} ${String(total(scope)).padStart(5)}  ${JSON.stringify(counts[scope])}`);
if (improvements.length) console.log(`\n${improvements.length} improvement(s) — lock them in with: node scripts/lint-design.js --update`);

if (regressions.length || contrastFailures.length) {
  if (regressions.length) console.error('\nDesign regressions (new violations added):\n  ' + regressions.join('\n  '));
  if (contrastFailures.length) console.error('\nContrast failures:\n  ' + contrastFailures.join('\n  '));
  process.exit(1);
}
console.log('\nDesign lint passed (no regressions, all token contrast checks pass).');
