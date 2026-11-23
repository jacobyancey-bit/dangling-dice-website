import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFiles = [
  'apps/web/index.html',
  'apps/web/admin.html',
  'apps/beats/index.html',
  'apps/games/index.html',
  'apps/dev/index.html',
  'apps/media/index.html'
];

const externalUrls = new Set();

for (const relFile of htmlFiles) {
  const file = path.join(__dirname, '..', relFile);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/https?:\/\/[^\s"'<>]+/g);
  for (const m of matches) {
    const url = m[0];
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('schema.org') || url.includes('w3.org') || url.includes('json-schema.org')) continue;
    externalUrls.add(url);
  }
}

console.log(`Found ${externalUrls.size} unique external/full URLs across all HTML files.`);

async function checkUrls() {
  const dead = [];
  for (const u of externalUrls) {
    try {
      const res = await fetch(u, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'manual'
      });
      // Accept 2xx, 3xx, or 403 (Cloudflare/Amazon bot challenge)
      if (res.status >= 400 && res.status !== 403 && res.status !== 405 && res.status !== 429) {
        // Retry with GET
        const resGet = await fetch(u, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          redirect: 'manual'
        });
        if (resGet.status >= 400 && resGet.status !== 403 && resGet.status !== 405 && resGet.status !== 429) {
          dead.push({ url: u, status: resGet.status });
        }
      }
    } catch (e) {
      dead.push({ url: u, error: e.message });
    }
  }
  console.log('Dead or broken external URLs:', dead);
}

checkUrls();
