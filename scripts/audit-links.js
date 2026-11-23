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

// Read PARTNER_DIRECTORY from affiliateController.js
const affPath = path.join(__dirname, '..', 'apps', 'api', 'controllers', 'affiliateController.js');
const affContent = fs.readFileSync(affPath, 'utf8');
const partnerSlugs = new Set();
const slugMatches = affContent.matchAll(/(?:['"]([a-zA-Z0-9_-]+)['"]|([a-zA-Z0-9_-]+))\s*:\s*\{[\s\S]*?name:/g);
for (const m of slugMatches) {
  partnerSlugs.add((m[1] || m[2]).toLowerCase());
}
console.log(`Loaded ${partnerSlugs.size} valid partner slugs in affiliateController:`, Array.from(partnerSlugs));

let allLinks = [];
let brokenAnchors = [];
let brokenGoLinks = [];
let dummyLinks = [];
let localMissingFiles = [];

for (const relFile of htmlFiles) {
  const file = path.join(__dirname, '..', relFile);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');

  // Find all id="" anchors in this file
  const idMatches = [...content.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
  const ids = new Set(idMatches);

  // Extract all href and src
  const hrefMatches = [...content.matchAll(/href=["']([^"']+)["']/g)].map(m => ({ file: relFile, attr: 'href', val: m[1] }));
  const srcMatches = [...content.matchAll(/src=["']([^"']+)["']/g)].map(m => ({ file: relFile, attr: 'src', val: m[1] }));
  const links = [...hrefMatches, ...srcMatches];
  allLinks.push(...links);

  for (const l of links) {
    const val = l.val.trim();
    // 1. Check for empty or dead href
    if (val === '#' || val === 'javascript:void(0)' || val === 'javascript:;') {
      dummyLinks.push({ file: l.file, val });
      continue;
    }

    // 2. Check internal page anchors (e.g., #audioWizardSection)
    if (val.startsWith('#')) {
      const anchor = val.slice(1);
      if (anchor && !ids.has(anchor)) {
        brokenAnchors.push({ file: l.file, anchor, val });
      }
      continue;
    }

    // 3. Check /go/ affiliate redirects
    if (val.includes('/go/')) {
      const parts = val.split('/go/')[1].split('?')[0].split('#')[0].toLowerCase();
      // Ignore branded short links (/go/l/:slug)
      if (!parts.startsWith('l/')) {
        if (!partnerSlugs.has(parts)) {
          brokenGoLinks.push({ file: l.file, slug: parts, fullUrl: val });
        }
      }
      continue;
    }

    // 4. Check relative file paths (e.g., images, css, scripts)
    if (!val.startsWith('http') && !val.startsWith('//') && !val.startsWith('mailto:') && !val.startsWith('tel:') && !val.startsWith('data:') && !val.startsWith('blob:')) {
      const cleanPath = val.split('?')[0].split('#')[0];
      if (cleanPath.startsWith('/')) {
        // Absolute from web app root
        const appDir = path.dirname(file);
        const candidates = [
          path.join(appDir, cleanPath),
          path.join(appDir, 'public', cleanPath),
          path.join(__dirname, '..', 'apps', 'web', cleanPath),
          path.join(__dirname, '..', 'apps', 'web', 'public', cleanPath),
        ];
        const exists = candidates.some(c => fs.existsSync(c));
        if (!exists && !cleanPath.startsWith('/api') && !cleanPath.startsWith('/v1') && !cleanPath.startsWith('/go') && !cleanPath.startsWith('/docs') && !cleanPath.startsWith('/health')) {
          localMissingFiles.push({ file: l.file, path: cleanPath });
        }
      }
    }
  }
}

console.log('\n==================================================');
console.log('🔗 COMPREHENSIVE LINK & NAVIGATION AUDIT');
console.log('==================================================');
console.log(`Total URLs/Links scanned: ${allLinks.length}`);
console.log(`Broken Internal Anchors (#): ${brokenAnchors.length}`);
if (brokenAnchors.length > 0) console.log('Broken Anchors:', brokenAnchors);

console.log(`Broken /go/ Partner Slugs: ${brokenGoLinks.length}`);
if (brokenGoLinks.length > 0) console.log('Broken /go/ links:', brokenGoLinks);

console.log(`Dead Placeholder Links (#): ${dummyLinks.length}`);
if (dummyLinks.length > 0) console.log('Placeholder links:', dummyLinks);

console.log(`Missing Local Files: ${localMissingFiles.length}`);
if (localMissingFiles.length > 0) console.log('Missing Local Files:', localMissingFiles);
