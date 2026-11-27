import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstileToken, requireTurnstile } from '../middleware/turnstile.js';
import authRoutes from '../routes/authRoutes.js';
import showcaseRoutes from '../routes/showcaseRoutes.js';

/** Runs fn with NODE_ENV/secret overridden and global fetch mocked; restores everything after. */
async function withEnv({ env = 'production', secret = 'unit-test-secret', fetchImpl }, fn) {
  const prev = { env: process.env.NODE_ENV, s1: process.env.TURNSTILE_SECRET, s2: process.env.TURNSTILE_SECRET_KEY, fetch: globalThis.fetch };
  process.env.NODE_ENV = env;
  delete process.env.TURNSTILE_SECRET;
  if (secret) process.env.TURNSTILE_SECRET_KEY = secret;
  else delete process.env.TURNSTILE_SECRET_KEY;
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, body: String(opts?.body || '') });
    return fetchImpl(url, opts);
  };
  try {
    await fn(calls);
  } finally {
    process.env.NODE_ENV = prev.env;
    if (prev.s1 === undefined) delete process.env.TURNSTILE_SECRET; else process.env.TURNSTILE_SECRET = prev.s1;
    if (prev.s2 === undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY = prev.s2;
    globalThis.fetch = prev.fetch;
  }
}

const cfRejects = async () => ({ json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }) });

describe('🛡️ Cloudflare Turnstile Bot Shield', () => {
  it('TS-01: Public dummy token is NOT auto-accepted outside tests (verified with Cloudflare)', async () => {
    await withEnv({ fetchImpl: cfRejects }, async (calls) => {
      const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');
      assert.equal(result.success, false);
      assert.equal(calls.length, 1, 'must call Cloudflare siteverify');
      assert.match(calls[0].url, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
    });
  });

  it('TS-02: Middleware returns 403 when Cloudflare rejects the token', async () => {
    await withEnv({ fetchImpl: cfRejects }, async () => {
      let status = null;
      let nextCalled = false;
      const res = { status(c) { status = c; return this; }, json() { return this; } };
      await requireTurnstile({ body: { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' }, headers: {}, ip: '203.0.113.5' }, res, () => { nextCalled = true; });
      assert.equal(status, 403);
      assert.equal(nextCalled, false);
    });
  });

  it('TS-03: Missing token is rejected without a network call', async () => {
    await withEnv({ fetchImpl: cfRejects }, async (calls) => {
      const result = await verifyTurnstileToken('');
      assert.equal(result.success, false);
      assert.equal(calls.length, 0);
    });
  });

  it('TS-04: Valid token passes through to the route', async () => {
    await withEnv({ fetchImpl: async () => ({ json: async () => ({ success: true }) }) }, async () => {
      let nextCalled = false;
      await requireTurnstile({ body: { 'cf-turnstile-response': 'real-token' }, headers: {}, ip: '203.0.113.5' }, {}, () => { nextCalled = true; });
      assert.equal(nextCalled, true);
    });
  });

  it('TS-05: Auth and public submission routes are guarded by Turnstile', () => {
    const guarded = (router, path, method = 'post') => {
      const layer = router.stack.find((l) => l.route && [].concat(l.route.path).includes(path) && l.route.methods[method]);
      assert.ok(layer, `route ${method.toUpperCase()} ${path} must exist`);
      return layer.route.stack.some((s) => s.handle === requireTurnstile);
    };
    assert.ok(guarded(authRoutes, '/login'), '/auth/login must require Turnstile');
    assert.ok(guarded(authRoutes, '/register'), '/auth/register must require Turnstile');
    assert.ok(guarded(showcaseRoutes, '/submit'), '/showcase/submit must require Turnstile');
  });
});
