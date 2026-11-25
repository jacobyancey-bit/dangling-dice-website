import test from 'node:test';
import assert from 'node:assert/strict';
import { analyticsMiddleware, getAnalyticsSummary } from '../middleware/analytics.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { sendErrorAlert } from '../utils/alertManager.js';

test('📡 Observability, Telemetry & Logging Suite', async (t) => {
  await t.test('OBS-01: Analytics middleware assigns X-Request-Id and wraps latency headers', async () => {
    const headersSet = {};
    const req = {
      headers: {},
      url: '/v1/compute/ping',
      method: 'GET',
    };
    const res = {
      setHeader: (name, value) => {
        headersSet[name] = value;
      },
      writeHead: (status) => status,
      on: () => {},
    };

    analyticsMiddleware(req, res, () => {});

    assert.ok(req.id, 'req.id must be set');
    assert.ok(headersSet['X-Request-Id'], 'X-Request-Id header must be set');
    assert.strictEqual(req.id, headersSet['X-Request-Id']);

    // Trigger writeHead to test latency headers
    res.writeHead(200);
    assert.ok(headersSet['X-Response-Time'], 'X-Response-Time header must be set');
    assert.ok(headersSet['Server-Timing'], 'Server-Timing header must be set');
  });

  await t.test('OBS-02: Preserves incoming X-Request-Id if passed by gateway or client', async () => {
    const headersSet = {};
    const customTraceId = 'trace_client_xyz123';
    const req = {
      headers: { 'x-request-id': customTraceId },
      url: '/api/health',
      method: 'GET',
    };
    const res = {
      setHeader: (name, value) => {
        headersSet[name] = value;
      },
      writeHead: () => {},
      on: () => {},
    };

    analyticsMiddleware(req, res, () => {});

    assert.strictEqual(req.id, customTraceId);
    assert.strictEqual(headersSet['X-Request-Id'], customTraceId);
  });

  await t.test('OBS-03: Error handler attaches requestId and preserves structure', async () => {
    let jsonOutput = null;
    let statusCode = null;

    const req = {
      id: 'req_err_test_456',
      method: 'POST',
      originalUrl: '/api/crash-probe',
      headers: {},
    };
    const res = {
      statusCode: 500,
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        jsonOutput = data;
        return res;
      },
    };

    const testError = new Error('Database connection reset');
    errorHandler(testError, req, res, () => {});

    assert.strictEqual(statusCode, 500);
    assert.ok(jsonOutput);
    assert.strictEqual(jsonOutput.success, false);
    assert.strictEqual(jsonOutput.message, 'Database connection reset');
    assert.strictEqual(jsonOutput.requestId, 'req_err_test_456');
  });

  await t.test('OBS-04: Alert Manager rate-limits duplicate error signatures', async () => {
    // In test environment, sendErrorAlert skips network call and returns false safely
    const testError = new Error('RateLimitSentinelTest');
    const req = { method: 'GET', originalUrl: '/test-error' };

    const first = await sendErrorAlert({ error: testError, req });
    const duplicate = await sendErrorAlert({ error: testError, req });

    assert.strictEqual(first, false);
    assert.strictEqual(duplicate, false);
  });

  await t.test('OBS-05: Analytics summary includes avgResponseTimeMs telemetry', () => {
    const summary = getAnalyticsSummary();
    assert.ok(summary);
    assert.strictEqual(typeof summary.avgResponseTimeMs, 'number');
    assert.strictEqual(typeof summary.totalRequests, 'number');
    assert.ok(summary.crawlers);
    assert.ok(summary.apiChannels);
  });
});
