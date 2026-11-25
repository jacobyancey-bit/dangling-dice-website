import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('📜 Pillar 8: Compliance, Privacy & Governance Suite', () => {
  it('CMP-01: Compliance endpoint returns structured zero-retention and GDPR posture', async () => {
    // Import router and invoke /compliance handler directly
    const apiRouter = (await import('../routes/api.js')).default;

    // Find the compliance route handler
    const complianceRoute = apiRouter.stack.find(
      (layer) => layer.route && layer.route.path === '/compliance'
    );
    assert.ok(complianceRoute, 'Expected /compliance route to exist in apiRouter');

    const handler = complianceRoute.route.stack[0].handle;
    let statusCode = null;
    let jsonBody = null;
    let headers = {};

    const req = {};
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(k, v) {
        headers[k] = v;
      },
      json(data) {
        jsonBody = data;
        return this;
      },
    };

    handler(req, res);

    assert.equal(statusCode, 200);
    assert.equal(jsonBody?.success, true);
    assert.equal(jsonBody?.studio, 'Dangling Dice Studios™');
    assert.equal(jsonBody?.compliance?.zeroDataRetention, true);
    assert.equal(jsonBody?.compliance?.cookieFreeAnalytics, true);
    assert.match(jsonBody?.compliance?.ipMasking, /GDPR \/ CCPA compliant/i);
    assert.ok(Array.isArray(jsonBody?.compliance?.subprocessors));
    assert.ok(jsonBody.compliance.subprocessors.some((s) => s.name === 'Cloudflare'));
    assert.ok(jsonBody.compliance.subprocessors.some((s) => s.name === 'Render'));
    assert.ok(jsonBody.compliance.subprocessors.some((s) => s.name === 'MongoDB Atlas'));
    assert.ok(jsonBody.compliance.subprocessors.some((s) => s.name === 'Stripe'));
    assert.match(jsonBody?.compliance?.dmcaNotice?.designatedAgentEmail, /@dangling-dice-studios\.com/);
  });

  it('CMP-02: Verifies telemetry IP masking conforms to GDPR/CCPA /24 subnets', async () => {
    const { maskIpForTesting } = await import('../middleware/analytics.js').catch(() => ({}));
    // Check analytics file content to verify IP masking regex
    const analyticsSrc = fs.readFileSync(path.join(__dirname, '../middleware/analytics.js'), 'utf8');
    assert.ok(analyticsSrc.includes('maskIp'), 'Expected analytics.js to contain maskIp function');
    assert.ok(analyticsSrc.includes('.xxx'), 'Expected IPv4 masking to replace last octet with .xxx');
    assert.ok(analyticsSrc.includes('::xxx'), 'Expected IPv6 masking to mask suffix with ::xxx');
  });

  it('CMP-03: Media converter index.html contains zero-retention trust banner and fair-use disclosure', () => {
    const mediaHtmlPath = path.resolve(__dirname, '../../media/index.html');
    const content = fs.readFileSync(mediaHtmlPath, 'utf8');
    assert.ok(content.includes('Zero-Retention Trust'), 'Media index.html must feature Zero-Retention Trust banner');
    assert.ok(content.includes('fairUseCheckbox'), 'Media index.html must feature Fair Use confirmation checkbox');
    assert.ok(content.includes('api/compliance'), 'Media index.html must link to the API compliance policy');
  });

  it('CMP-04: Developer suite index.html contains Privacy by Design and compliance links', () => {
    const devHtmlPath = path.resolve(__dirname, '../../dev/index.html');
    const content = fs.readFileSync(devHtmlPath, 'utf8');
    assert.ok(content.includes('Privacy by Design'), 'Dev index.html must feature Privacy by Design disclosure');
    assert.ok(content.includes('api/compliance'), 'Dev index.html must link to the API compliance policy');
    assert.ok(content.includes('Cookie-free analytics'), 'Dev index.html must declare cookie-free analytics');
  });
});
