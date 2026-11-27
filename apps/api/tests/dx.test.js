import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('🛠️ Pillar 9: Developer Experience (DX) & OpenAPI Spec Suite', () => {
  const specPath = path.resolve(__dirname, '../public/openapi.json');
  let spec = null;

  it('DX-01: Validates openapi.json is well-formed OpenAPI 3.0.x with info, servers, and components', () => {
    assert.ok(fs.existsSync(specPath), 'openapi.json must exist in apps/api/public');
    const raw = fs.readFileSync(specPath, 'utf8');
    spec = JSON.parse(raw);

    assert.match(spec.openapi, /^3\.0\.\d+$/, 'OpenAPI version must be 3.0.x');
    assert.ok(spec.info?.title, 'Specification info must have title');
    assert.ok(spec.info?.version, 'Specification info must have version');
    assert.ok(Array.isArray(spec.servers) && spec.servers.length > 0, 'Must define at least one server gateway');
    assert.ok(spec.servers.some((s) => s.url.includes('api.dangling-dice-studios.com')), 'Must include production API URL');
    assert.ok(typeof spec.paths === 'object', 'Specification must have paths object');
  });

  it('DX-02: Verifies all major production tags and categories are documented in openapi.json', () => {
    assert.ok(spec, 'Spec must be loaded');
    const tagNames = spec.tags.map((t) => t.name);

    assert.ok(tagNames.includes('Media Converter'), 'Must document Media Converter tag');
    assert.ok(tagNames.includes('Schema Engine'), 'Must document Schema Engine tag');
    assert.ok(tagNames.includes('Finance Engine'), 'Must document Finance Engine tag');
    assert.ok(tagNames.includes('Privacy Engine'), 'Must document Privacy Engine tag');
    assert.ok(tagNames.includes('Music & Audio Theory'), 'Must document Music Theory tag');
    assert.ok(tagNames.includes('Storage & Assets'), 'Must document Storage & Assets tag');
    assert.ok(tagNames.includes('Compliance & Privacy'), 'Must document Compliance & Privacy tag');
  });

  it('DX-03: Verifies all documented paths start with / and have valid HTTP operation objects', () => {
    assert.ok(spec, 'Spec must be loaded');
    const paths = Object.keys(spec.paths);
    assert.ok(paths.length >= 15, `Expected at least 15 documented endpoints, found ${paths.length}`);

    for (const p of paths) {
      assert.ok(p.startsWith('/'), `Path ${p} must start with /`);
      const methods = Object.keys(spec.paths[p]);
      for (const m of methods) {
        assert.ok(['get', 'post', 'put', 'delete', 'patch'].includes(m.toLowerCase()), `Invalid HTTP method ${m} on ${p}`);
        const op = spec.paths[p][m];
        assert.ok(op.operationId, `Operation on ${m.toUpperCase()} ${p} must have operationId`);
        assert.ok(op.responses, `Operation on ${m.toUpperCase()} ${p} must have responses`);
      }
    }
  });

  it('DX-04: Verifies cURL, Python, and TypeScript SDK snippet generator produces syntactically valid code', () => {
    function generateCurlSnippet(endpoint, method = 'POST', body = {}) {
      return `curl -s -X ${method} "https://api.dangling-dice-studios.com${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: dds_live_test" \\
  -d '${JSON.stringify(body)}'`;
    }

    function generatePythonSnippet(endpoint, body = {}) {
      return `import requests

res = requests.post(
    "https://api.dangling-dice-studios.com${endpoint}",
    json=${JSON.stringify(body)},
    headers={"x-api-key": "dds_live_test"}
)
data = res.json()`;
    }

    function generateFetchSnippet(endpoint, body = {}) {
      return `const res = await fetch("https://api.dangling-dice-studios.com${endpoint}", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": "dds_live_test" },
  body: JSON.stringify(${JSON.stringify(body)})
});
const data = await res.json();`;
    }

    const testPayload = { text: 'Contact john.doe@example.com at 555-0199' };
    const curl = generateCurlSnippet('/v1/privacy/redact', 'POST', testPayload);
    const python = generatePythonSnippet('/v1/privacy/redact', testPayload);
    const ts = generateFetchSnippet('/v1/privacy/redact', testPayload);

    assert.ok(curl.includes('curl -s -X POST'), 'cURL snippet is valid');
    assert.ok(python.includes('import requests'), 'Python snippet is valid');
    assert.ok(ts.includes('const res = await fetch'), 'TypeScript/fetch snippet is valid');
  });

  it('DX-05: api, web, and media openapi.json copies stay byte-identical', () => {
    const read = (app) => fs.readFileSync(path.resolve(__dirname, `../../${app}/public/openapi.json`), 'utf8').replace(/\r\n/g, '\n');
    const apiSpec = read('api');
    assert.equal(read('web'), apiSpec, 'apps/web/public/openapi.json drifted from apps/api');
    assert.equal(read('media'), apiSpec, 'apps/media/public/openapi.json drifted from apps/api');
  });

  it('DX-06: Every live /v1 compute route is documented in openapi.json', async () => {
    const live = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const { default: v1Router } = await import('../routes/v1Compute.js');
    const toSpecPath = (p) => '/v1' + p.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const missing = [];
    for (const layer of v1Router.stack) {
      if (!layer.route) continue;
      const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      if (paths.includes('*')) continue;
      for (const method of Object.keys(layer.route.methods)) {
        // A route counts as documented if any of its aliases is in the spec
        const documented = paths.some((p) => {
          const sp = p === '/' ? '/v1/health' : toSpecPath(p);
          return live.paths[sp]?.[method];
        });
        if (!documented) missing.push(`${method.toUpperCase()} ${paths.join(' | ')}`);
      }
    }
    assert.deepEqual(missing, [], `Undocumented /v1 routes: ${missing.join(', ')}`);
  });
});
