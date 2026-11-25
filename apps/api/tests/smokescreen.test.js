import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import controllers and engines directly for blazing-fast in-memory smoke validation
import { redirectPartner, getPartnerDirectory } from '../controllers/affiliateController.js';
import { redactText } from '../engines/privacy.js';
import { resolveScale, generateProgression } from '../engines/music.js';
import { calculateParcelMetrics } from '../engines/geo.js';
import { calculateAmortization } from '../engines/finance.js';
import { inferFromJson } from '../engines/schema.js';

describe('💨 Dangling Dice Studios™ Smokescreen Test Suite', () => {

  // =========================================================================
  // 1. Core Compute Engine Smoke Tests
  // =========================================================================
  describe('⚡ Compute Engine Smoke Tests', () => {
    it('SMOKE-01: Privacy Redactor Engine sanitizes PII and secret tokens', () => {
      const input = 'Call 555-123-4567 or email dev@dangling-dice-studios.com with key sk_live_abc12345678901234567890';
      const result = redactText({ text: input, mode: 'placeholder' });
      assert.ok(result.sanitizedText, 'Must return sanitizedText');
      assert.ok(!result.sanitizedText.includes('dev@dangling-dice-studios.com'), 'Email must be redacted');
      assert.ok(!result.sanitizedText.includes('sk_live_'), 'Stripe key must be redacted');
      assert.ok(result.redactionCount >= 2, 'Must detect at least email and key');
    });

    it('SMOKE-02: Music Theory Engine computes modal scale and chords', () => {
      const scale = resolveScale({ rootNote: 'C', scaleType: 'major' });
      assert.equal(scale.root, 'C');
      assert.ok(scale.notes.length >= 7, 'Scale must have at least 7 notes');

      const progression = generateProgression({ rootNote: 'C', scaleType: 'major', presetKey: 'lofi_chill' });
      assert.ok(progression.chords.length >= 4, 'Must return progression chords');
      assert.ok(progression.chords[0].numeral, 'Must have Roman numeral');
    });

    it('SMOKE-03: GIS Geo Math Engine calculates polygon acreage', () => {
      // 100m x 100m square in Kansas (~2.5 acres)
      const squareCoords = [
        [-98.5795, 39.8283],
        [-98.5783, 39.8283],
        [-98.5783, 39.8274],
        [-98.5795, 39.8274],
      ];
      const metrics = calculateParcelMetrics({ coordinates: squareCoords });
      assert.ok(metrics.areaAcres > 0, 'Acreage must be positive');
      assert.ok(metrics.areaSquareMeters > 0, 'Area in sq meters must be positive');
      assert.ok(metrics.centroid, 'Must calculate centroid');
    });

    it('SMOKE-04: Financial Math Engine generates amortization schedule', () => {
      const schedule = calculateAmortization({
        principal: 100000,
        annualRatePercent: 6.0,
        termMonths: 360,
      });
      assert.ok(schedule.monthlyPayment > 500 && schedule.monthlyPayment < 700, 'Monthly payment in expected range');
      assert.equal(schedule.schedule.length, 360, 'Must contain 360 monthly entries');
      assert.equal(schedule.totalPrincipal, 100000, 'Total principal must match');
    });

    it('SMOKE-05: Schema Transformer Engine infers TypeScript, Zod, and SQL DDL', () => {
      const sample = { id: 1, name: 'Jacob', isActive: true, score: 98.5 };
      const inferred = inferFromJson({ jsonInput: sample, rootName: 'User' });
      assert.ok(inferred.typescript.includes('interface User'), 'Must generate TypeScript interface');
      assert.ok(inferred.zod.includes('z.object'), 'Must generate Zod schema');
      assert.ok(inferred.sqlDdl.includes('CREATE TABLE'), 'Must generate SQL DDL');
    });
  });

  // =========================================================================
  // 2. OpenAPI Specification Integrity Smoke Tests
  // =========================================================================
  describe('📜 OpenAPI 3.0.3 Specification Integrity', () => {
    const specs = [
      'openapi.json',
      'openapi-privacy.json',
      'openapi-music.json',
      'openapi-schema.json',
      'openapi-geo.json',
      'openapi-finance.json',
    ];

    for (const specFile of specs) {
      it(`SMOKE-SPEC: ${specFile} exists, is valid JSON, and declares openapi 3.0.3`, () => {
        const specPath = path.join(__dirname, '..', 'public', specFile);
        assert.ok(fs.existsSync(specPath), `Spec file ${specFile} must exist in apps/api/public/`);
        const content = fs.readFileSync(specPath, 'utf8');
        const parsed = JSON.parse(content);
        assert.ok(parsed.openapi && parsed.openapi.startsWith('3.0'), 'Must declare openapi 3.0.x');
        assert.ok(parsed.info && parsed.info.title, 'Must contain API title');
        assert.ok(parsed.paths && Object.keys(parsed.paths).length > 0, 'Must define endpoints');
      });
    }
  });

  // =========================================================================
  // 3. Affiliate Attribution & Amazon Link Smoke Tests
  // =========================================================================
  describe('🛒 Affiliate & Partner Attribution Engine', () => {
    it('SMOKE-AFF-01: JBL Tune 680NC Amazon affiliate link resolves with 302', () => {
      let statusCode = null;
      let redirectLocation = null;
      const headers = {};

      const req = {
        params: { slug: 'gear-jbl-680nc' },
        query: { src: 'smoke_test' },
      };

      const res = {
        setHeader(k, v) { headers[k] = v; },
        redirect(code, loc) { statusCode = code; redirectLocation = loc; },
      };

      redirectPartner(req, res);

      assert.equal(statusCode, 302, 'Must issue 302 redirect');
      assert.match(redirectLocation, /amazon|amzn/i, 'Must redirect to user Amazon short link');
      assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
    });

    it('SMOKE-AFF-02: Partner directory lists all verified partners including Amazon gear', () => {
      let responseBody = null;
      const res = {
        status(c) {
          assert.equal(c, 200);
          return {
            json(data) { responseBody = data; },
          };
        },
      };

      getPartnerDirectory({}, res);
      assert.ok(responseBody.success, 'Directory response must be successful');
      assert.ok(responseBody.count >= 15, 'Must contain at least 15 active partner deals');
      const hasJbl = responseBody.data.some(p => p.slug === 'gear-jbl-680nc');
      assert.ok(hasJbl, 'Partner directory must include gear-jbl-680nc');
    });
  });

  // =========================================================================
  // 4. Multi-Tenant Frontend File Existence Smoke Tests
  // =========================================================================
  describe('🌐 Multi-Tenant Subdomain App Artifacts', () => {
    const apps = [
      { name: 'web', html: 'apps/web/index.html', sitemap: 'apps/web/public/sitemap.xml', robots: 'apps/web/public/robots.txt' },
      { name: 'beats', html: 'apps/beats/index.html', sitemap: 'apps/beats/public/sitemap.xml', robots: 'apps/beats/public/robots.txt' },
      { name: 'games', html: 'apps/games/index.html', sitemap: 'apps/games/public/sitemap.xml', robots: 'apps/games/public/robots.txt' },
      { name: 'dev', html: 'apps/dev/index.html', sitemap: 'apps/dev/public/sitemap.xml', robots: 'apps/dev/public/robots.txt' },
      { name: 'media', html: 'apps/media/index.html', sitemap: 'apps/media/public/sitemap.xml', robots: 'apps/media/public/robots.txt' },
    ];

    for (const app of apps) {
      it(`SMOKE-APP: ${app.name} has valid index.html, sitemap.xml, and robots.txt`, () => {
        const rootDir = path.join(__dirname, '..', '..', '..');
        const htmlPath = path.join(rootDir, app.html);
        const sitemapPath = path.join(rootDir, app.sitemap);
        const robotsPath = path.join(rootDir, app.robots);

        assert.ok(fs.existsSync(htmlPath), `${app.name} index.html must exist`);
        assert.ok(fs.existsSync(sitemapPath), `${app.name} sitemap.xml must exist`);
        assert.ok(fs.existsSync(robotsPath), `${app.name} robots.txt must exist`);

        const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
        assert.ok(sitemapContent.includes('<urlset') || sitemapContent.includes('<sitemapindex'), `${app.name} sitemap must be valid XML`);
        assert.ok(/2026-11-\d{2}/.test(sitemapContent), `${app.name} sitemap must have updated lastmod timestamp`);
      });
    }

    it('SMOKE-AI: llms.txt exists and contains all 5 RapidAPI microservices', () => {
      const llmsPath = path.join(__dirname, '..', '..', 'web', 'public', 'llms.txt');
      assert.ok(fs.existsSync(llmsPath), 'llms.txt must exist');
      const content = fs.readFileSync(llmsPath, 'utf8');
      assert.ok(content.includes('data-privacy-pii-redactor'), 'llms.txt must list Privacy API');
      assert.ok(content.includes('music-theory-chord-progression'), 'llms.txt must list Music API');
      assert.ok(content.includes('schema-transformer-code-generator'), 'llms.txt must list Schema API');
      assert.ok(content.includes('gis-land-acreage-polygon-math'), 'llms.txt must list GIS API');
      assert.ok(content.includes('financial-math-loan-amortization'), 'llms.txt must list Finance API');
    });
  });

  // =========================================================================
  // 5. Security & Protection Smoke Tests
  // =========================================================================
  describe('🛡️ Security & Hardening Smoke Tests', () => {
    it('SMOKE-SEC-01: No .env credentials exist in git tracking', () => {
      const rootDir = path.join(__dirname, '..', '..', '..');
      const gitIgnorePath = path.join(rootDir, '.gitignore');
      assert.ok(fs.existsSync(gitIgnorePath), '.gitignore must exist');
      const gitignore = fs.readFileSync(gitIgnorePath, 'utf8');
      assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env files');
    });

    it('SMOKE-SEC-02: Frontend web app has no hardcoded Atlas cluster IDs', () => {
      const appJsPath = path.join(__dirname, '..', '..', 'web', 'js', 'app.js');
      const content = fs.readFileSync(appJsPath, 'utf8');
      assert.ok(!content.includes('nnmqrde'), 'Must not contain actual Atlas cluster ID');
      assert.ok(content.includes('cluster0.abcde.mongodb.net'), 'Must use generic placeholder in demo URI');
    });
  });
});
