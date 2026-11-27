import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, isUpstreamOutageStatus, cobaltBreaker, rapidApiBreaker, discordBreaker } from '../utils/circuitBreaker.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const quiet = async (fn) => {
  const { log, warn, error } = console;
  console.log = console.warn = console.error = () => {};
  try { return await fn(); } finally { Object.assign(console, { log, warn, error }); }
};

/** Mocks global fetch + env for the duration of fn, restoring afterwards. */
async function withMocks(env, fetchImpl, fn) {
  const saved = { fetch: globalThis.fetch };
  for (const k of Object.keys(env)) saved[k] = process.env[k];
  Object.assign(process.env, env);
  let calls = 0;
  globalThis.fetch = async (...args) => { calls++; return fetchImpl(...args); };
  try {
    return await fn(() => calls);
  } finally {
    globalThis.fetch = saved.fetch;
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    }
  }
}

describe('⚡ Circuit Breakers (Cobalt, RapidAPI, Discord)', () => {
  it('CB-01: Opens after the failure threshold and fast-fails without calling upstream', async () => {
    const b = new CircuitBreaker('t1', { failureThreshold: 3, resetTimeoutMs: 10000 });
    let calls = 0;
    const failing = async () => { calls++; throw new Error('boom'); };
    await quiet(async () => {
      for (let i = 0; i < 3; i++) await assert.rejects(b.execute(failing));
      assert.equal(b.state, 'OPEN');
      await assert.rejects(b.execute(failing), /is OPEN/);
    });
    assert.equal(calls, 3, 'open circuit must not call upstream');
  });

  it('CB-02: After cooldown, HALF_OPEN admits exactly one probe at a time', async () => {
    const b = new CircuitBreaker('t2', { failureThreshold: 1, resetTimeoutMs: 20 });
    await quiet(async () => {
      await assert.rejects(b.execute(async () => { throw new Error('down'); }));
      await wait(30);
      let release;
      const probe = b.execute(() => new Promise((r) => { release = r; }));
      assert.equal(b.state, 'HALF_OPEN');
      assert.equal(b.isOpen(), true, 'concurrent callers must fast-fail while the probe is in flight');
      await assert.rejects(b.execute(async () => 'second'), /is OPEN/);
      release('ok');
      assert.equal(await probe, 'ok');
    });
    assert.equal(b.state, 'CLOSED');
  });

  it('CB-03: A failed probe re-opens the circuit immediately', async () => {
    const b = new CircuitBreaker('t3', { failureThreshold: 3, resetTimeoutMs: 20 });
    await quiet(async () => {
      for (let i = 0; i < 3; i++) await assert.rejects(b.execute(async () => { throw new Error('x'); }));
      await wait(30);
      await assert.rejects(b.execute(async () => { throw new Error('still down'); }));
    });
    assert.equal(b.state, 'OPEN');
    assert.equal(b.probeInFlight, false);
  });

  it('CB-04: Only 5xx and 429 count as upstream outages', () => {
    for (const s of [429, 500, 502, 503, 504]) assert.equal(isUpstreamOutageStatus(s), true, String(s));
    for (const s of [200, 204, 400, 401, 403, 404, 422]) assert.equal(isUpstreamOutageStatus(s), false, String(s));
  });

  it('CB-05: Cobalt HTTP 503 responses trip the Cobalt breaker', async () => {
    const { fetchFromExtractionGateway } = await import('../controllers/mediaController.js');
    cobaltBreaker.recordSuccess();
    await withMocks({ COBALT_API_URL: 'https://cobalt.invalid', RAPIDAPI_KEY: '' }, async () => ({ ok: false, status: 503, json: async () => ({}) }), async (calls) => {
      await quiet(async () => {
        for (let i = 0; i < 3; i++) await fetchFromExtractionGateway('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp4').catch(() => {});
        assert.equal(cobaltBreaker.state, 'OPEN');
        const before = calls();
        await fetchFromExtractionGateway('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp4').catch(() => {});
        assert.equal(calls(), before, 'open Cobalt breaker must skip the upstream call');
      });
    });
    cobaltBreaker.recordSuccess();
  });

  it('CB-06: RapidAPI 429 (quota exhausted) trips the RapidAPI breaker', async () => {
    const { fetchFromExtractionGateway } = await import('../controllers/mediaController.js');
    rapidApiBreaker.recordSuccess();
    await withMocks({ COBALT_API_URL: '', RAPIDAPI_KEY: 'unit-test-key', RAPIDAPI_PATH: '/dl?id={id}' }, async () => ({ ok: false, status: 429, json: async () => ({}) }), async () => {
      await quiet(async () => {
        for (let i = 0; i < 3; i++) await fetchFromExtractionGateway('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mp3').catch(() => {});
      });
      assert.equal(rapidApiBreaker.state, 'OPEN');
    });
    rapidApiBreaker.recordSuccess();
  });

  it('CB-07: Discord error-alert 429 responses count as breaker failures', async () => {
    const { sendErrorAlert } = await import('../utils/alertManager.js');
    discordBreaker.recordSuccess();
    await withMocks({ DISCORD_WEBHOOK_URL: 'https://discord.invalid/webhook', NODE_ENV: 'production' }, async () => ({ ok: false, status: 429 }), async () => {
      const sent = await quiet(() => sendErrorAlert({ error: new Error('cb-07 unique'), context: 'cb07' }));
      assert.equal(sent, false);
      assert.equal(discordBreaker.failureCount, 1);
    });
    discordBreaker.recordSuccess();
  });
});
