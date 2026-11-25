import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateOgCard } from '../controllers/ogController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webPublicDir = path.join(__dirname, '..', '..', 'web', 'public');

test('🔍 SEO, Social Graph & AI Discoverability Suite', async (t) => {
  await t.test('SEO-01: Sitemap XML lists all 5 production subdomains with high priority', () => {
    const sitemapPath = path.join(webPublicDir, 'sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'sitemap.xml must exist');

    const content = fs.readFileSync(sitemapPath, 'utf8');
    assert.ok(content.includes('https://dangling-dice-studios.com/'));
    assert.ok(content.includes('https://beats.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://media.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://dev.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://games.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://api.dangling-dice-studios.com/'));
  });

  await t.test('SEO-02: llms.txt provides accurate context on subdomains, R2 storage, and APIs', () => {
    const llmsPath = path.join(webPublicDir, 'llms.txt');
    assert.ok(fs.existsSync(llmsPath), 'llms.txt must exist');

    const content = fs.readFileSync(llmsPath, 'utf8');
    assert.ok(content.includes('Dangling Dice Studios™'));
    assert.ok(content.includes('https://beats.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://media.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://dev.dangling-dice-studios.com/'));
    assert.ok(content.includes('https://games.dangling-dice-studios.com/'));
    assert.ok(content.includes('dangling-dice-assets'));
    assert.ok(content.includes('Cloudflare R2'));
  });

  await t.test('SEO-03: Dynamic OpenGraph card generator renders valid SVG with custom themes', () => {
    let outputSvg = '';
    const headers = {};

    const req = {
      query: {
        title: 'Dangling Beats Studio',
        subtitle: 'In-Browser Audio Workstation',
        theme: 'purple',
        badge: 'AUDIO LAB',
      },
    };
    const res = {
      setHeader: (name, val) => {
        headers[name] = val;
      },
      status: (code) => {
        assert.strictEqual(code, 200);
        return res;
      },
      send: (svg) => {
        outputSvg = svg;
      },
    };

    generateOgCard(req, res);

    assert.ok(headers['Content-Type'].includes('image/svg+xml'));
    assert.ok(headers['Cache-Control'].includes('public, max-age=86400'));
    assert.ok(outputSvg.includes('<svg'));
    assert.ok(outputSvg.includes('Dangling Beats Studio'));
    assert.ok(outputSvg.includes('#8b5cf6')); // Purple primary theme
    assert.ok(outputSvg.includes('AUDIO LAB'));
  });

  await t.test('SEO-04: HTML entrypoints include JSON-LD Schema.org structured data', () => {
    const apps = ['web', 'beats', 'dev', 'games', 'media'];
    for (const app of apps) {
      const htmlPath = path.join(__dirname, '..', '..', app, 'index.html');
      assert.ok(fs.existsSync(htmlPath), `${app}/index.html must exist`);
      const html = fs.readFileSync(htmlPath, 'utf8');
      assert.ok(html.includes('application/ld+json'), `${app}/index.html must contain JSON-LD Schema`);
      assert.ok(html.includes('schema.org'), `${app}/index.html schema must reference schema.org`);
    }
  });
});
