import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getOEmbed } from '../controllers/oembedController.js';
import { getAnalyticsSummary } from '../middleware/analytics.js';
import { sendDiscordBroadcast } from '../controllers/broadcastController.js';

describe('🌐 Crawler Discovery & Health Telemetry Suite', () => {
  it('DISC-01: Correctly classifies and records analytics summary', () => {
    const summary = getAnalyticsSummary();
    assert.ok(summary, 'Expected analytics summary object');
    assert.strictEqual(typeof summary.totalRequests, 'number');
    assert.strictEqual(typeof summary.crawlers, 'object');
    assert.ok('ai' in summary.crawlers);
    assert.ok('search' in summary.crawlers);
    assert.ok('social' in summary.crawlers);
  });

  it('DISC-02: oEmbed controller returns compliant oEmbed 1.0 JSON payload', () => {
    let responseStatus = null;
    let responseBody = null;
    const headers = {};

    const mockReq = {
      query: { url: 'https://dangling-dice-studios.com/' },
    };
    const mockRes = {
      status(code) {
        responseStatus = code;
        return this;
      },
      setHeader(k, v) {
        headers[k] = v;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    getOEmbed(mockReq, mockRes);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseBody.version, '1.0');
    assert.strictEqual(responseBody.type, 'rich');
    assert.ok(responseBody.title.includes('Dangling Dice Studios'));
    assert.ok(responseBody.html.includes('iframe'));
    assert.ok(headers['Content-Type'].includes('json+oembed'));
  });

  it('DISC-03: oEmbed controller adapts embed for media converter subdomain', () => {
    let responseBody = null;
    const mockReq = {
      query: { url: 'https://media.dangling-dice-studios.com/' },
    };
    const mockRes = {
      status() { return this; },
      setHeader() {},
      json(body) {
        responseBody = body;
        return this;
      },
    };

    getOEmbed(mockReq, mockRes);
    assert.ok(responseBody.title.includes('Media Converter'));
    assert.ok(responseBody.html.includes('media.dangling-dice-studios.com'));
  });

  it('DISC-04: OpenAPI 3.0 specification is valid JSON with required paths', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const specRaw = fs.readFileSync(path.join(__dirname, '..', 'public', 'openapi.json'), 'utf8');
    const spec = JSON.parse(specRaw);

    assert.strictEqual(spec.openapi, '3.0.3');
    assert.ok(spec.paths['/health']);
    assert.ok(spec.paths['/oembed']);
    assert.ok(spec.paths['/media/convert']);
    assert.ok(spec.paths['/items']);
  });

  it('DISC-05: Rejects broadcast request missing title and description with 400', async () => {
    let statusCode = null;
    let responseBody = null;
    const mockReq = { body: {} };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      }
    };

    await sendDiscordBroadcast(mockReq, mockRes);
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.success, false);
    assert.ok(responseBody.message.includes('requires at least a title or description'));
  });

  it('DISC-06: API documentation endpoint serves compliant HTML with CORS, HTTPS, and auth metadata', async () => {
    const apiModule = await import('../routes/api.js');
    const router = apiModule.default;
    assert.ok(router, 'API router should be exported');

    // Find the /docs route layer
    const docsLayer = router.stack.find(s => s.route && (s.route.path === '/docs' || (Array.isArray(s.route.path) && s.route.path.includes('/docs'))));
    assert.ok(docsLayer, 'Expected /docs route to be registered on API router');

    let responseHtml = '';
    let responseStatus = 200;
    const mockReq = { query: {}, headers: { accept: 'text/html' } };
    const mockRes = {
      status(code) { responseStatus = code; return this; },
      setHeader() {},
      send(html) { responseHtml = html; return this; }
    };

    docsLayer.route.stack[0].handle(mockReq, mockRes);
    assert.strictEqual(responseStatus, 200);
    assert.ok(responseHtml.includes('Dangling Dice Studios™ Developer API'));
    assert.ok(responseHtml.includes('meta name="api:cors" content="true"'));
    assert.ok(responseHtml.includes('meta name="api:https" content="true"'));
    assert.ok(responseHtml.includes('meta name="api:pricing" content="Free"'));
  });

  it('DISC-07: OpenAPI specification designates api.dangling-dice-studios.com as primary gateway', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const specRaw = fs.readFileSync(path.join(__dirname, '..', 'public', 'openapi.json'), 'utf8');
    const spec = JSON.parse(specRaw);

    assert.ok(Array.isArray(spec.servers), 'Expected servers array in OpenAPI spec');
    const primaryServer = spec.servers[0];
    assert.strictEqual(primaryServer.url, 'https://api.dangling-dice-studios.com');
    assert.ok(primaryServer.description.includes('Dedicated API Gateway'));
  });
});

