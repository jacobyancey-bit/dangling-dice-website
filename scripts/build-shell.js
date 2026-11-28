#!/usr/bin/env node
/**
 * Writes the shared ecosystem shell (packages/shared/shell.js) into every app's index.html,
 * between <!-- dds-shell:start --> and <!-- dds-shell:end -->. One source, five pages, no drift.
 *
 *   node scripts/build-shell.js           # regenerate
 *   node scripts/build-shell.js --check   # fail if any page is out of date (runs in npm test)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { renderShell } = await import(pathToFileURL(path.join(root, 'packages', 'shared', 'shell.js')).href);

const PAGES = [
  { site: 'web', file: 'apps/web/index.html', options: { stash: true } },
  { site: 'beats', file: 'apps/beats/index.html' },
  { site: 'dev', file: 'apps/dev/index.html' },
  { site: 'games', file: 'apps/games/index.html' },
  { site: 'media', file: 'apps/media/index.html' },
];

const START = '<!-- dds-shell:start -->';
const END = '<!-- dds-shell:end -->';
const CHECK = process.argv.includes('--check');
const stale = [];

for (const { site, file, options } of PAGES) {
  const abs = path.join(root, file);
  const src = fs.readFileSync(abs, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const i = src.indexOf(START);
  const j = src.indexOf(END);
  if (i < 0 || j < i) throw new Error(`${file}: missing ${START} / ${END} markers`);
  const indent = src.slice(src.lastIndexOf('\n', i) + 1, i);
  const block = renderShell(site, options).split('\n').map((l) => indent + l).join(eol);
  const next = src.slice(0, i) + START + eol + block + eol + indent + END + src.slice(j + END.length);
  // The <html> element must carry data-site so tokens.css selects this site's accent
  if (!new RegExp(`<html[^>]*data-site="${site}"`).test(next)) throw new Error(`${file}: <html> is missing data-site="${site}"`);
  if (next !== src) {
    if (CHECK) stale.push(file);
    else fs.writeFileSync(abs, next);
  }
}

if (CHECK && stale.length) {
  console.error(`Shell markup is out of date in:\n  ${stale.join('\n  ')}\nRun: node scripts/build-shell.js`);
  process.exit(1);
}
console.log(CHECK ? 'Shell markup up to date in all 5 apps.' : 'Shell markup written to all 5 apps.');
