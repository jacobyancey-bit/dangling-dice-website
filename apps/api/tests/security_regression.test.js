import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { protect, admin } from '../middleware/authMiddleware.js';
import { errorHandler } from '../middleware/errorHandler.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_2026';

/**
 * Helper to dispatch middleware and route any next(err) through errorHandler
 */
function executeMiddleware(middleware, req) {
  let statusCode = 200;
  let jsonResponse = null;

  const res = {
    statusCode: 200,
    status(code) {
      statusCode = code;
      this.statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    },
  };

  return new Promise((resolve) => {
    const next = (err) => {
      if (err) {
        errorHandler(err, req, res, () => {});
      }
      resolve({ status: statusCode, body: jsonResponse });
    };

    try {
      const result = middleware(req, res, next);
      if (result && typeof result.catch === 'function') {
        result.catch((err) => {
          errorHandler(err, req, res, () => {});
          resolve({ status: statusCode, body: jsonResponse });
        });
      }
    } catch (err) {
      errorHandler(err, req, res, () => {});
      resolve({ status: statusCode, body: jsonResponse });
    }
  });
}

describe('🔒 Security & Authorization Negative Regression Suite', () => {
  describe('Authentication Boundary Checks (Expect 401 Unauthorized)', () => {
    it('NEG-01: Rejects protected profile requests without Authorization header with 401', async () => {
      const req = { headers: {} };
      const { status, body } = await executeMiddleware(protect, req);

      assert.equal(status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false, 'Payload success flag must be false');
      assert.match(
        body.message,
        /No Bearer token provided/i,
        'Error message must indicate missing Bearer token'
      );
    });

    it('NEG-02: Rejects malformed or tampered JWT signatures with 401', async () => {
      const req = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_tampered_payload.bogus_sig',
        },
      };
      const { status, body } = await executeMiddleware(protect, req);

      assert.equal(status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false);
      assert.match(body.message, /Not authorized/i, 'Error message must reflect authorization failure');
    });

    it('NEG-03: Rejects non-Bearer schemes (e.g. Basic auth) with 401', async () => {
      const req = {
        headers: {
          authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        },
      };
      const { status, body } = await executeMiddleware(protect, req);

      assert.equal(status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /No Bearer token provided/i,
        'Server must require Bearer scheme specifically'
      );
    });

    it('NEG-04: Rejects anonymous item creation attempts with 401', async () => {
      const req = {
        headers: {},
        body: {
          title: 'Anonymous Unauthenticated Beat',
          description: 'Exploit attempt without credentials',
        },
      };
      const { status, body } = await executeMiddleware(protect, req);

      assert.equal(status, 401, 'Anonymous resource creation must return 401');
      assert.equal(body.success, false);
    });
  });

  describe('Authorization & Privilege Escalation Checks (Expect 403 Forbidden)', () => {
    it('NEG-05: Blocks non-admin users from creating items with 403 Forbidden', async () => {
      const req = {
        user: { _id: '679000000000000000000002', role: 'user', email: 'creator@danglingdice.com' },
      };
      const { status, body } = await executeMiddleware(admin, req);

      assert.equal(status, 403, 'Non-admin users must receive 403 Forbidden on admin creation endpoints');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /Forbidden: Admin access privileges required/i,
        'Response message must state admin privileges are required'
      );
    });

    it('NEG-06: Blocks non-admin users from deleting items with 403 Forbidden', async () => {
      const req = {
        user: { _id: '679000000000000000000002', role: 'user', email: 'creator@danglingdice.com' },
        params: { id: '679000000000000000000001' },
      };
      const { status, body } = await executeMiddleware(admin, req);

      assert.equal(status, 403, 'Non-admin users must receive 403 Forbidden on deletion endpoints');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /Forbidden: Admin access privileges required/i,
        'Response message must state admin privileges are required'
      );
    });
  });

  describe('Input Sanitization & Route Integrity', () => {
    it('NEG-07: Sanitizes malformed MongoDB ObjectIDs into safe 404 CastError responses', async () => {
      let statusCode = 200;
      let jsonBody = null;

      const castError = new Error('Cast to ObjectId failed for value "malformed-id" at path "_id"');
      castError.name = 'CastError';
      castError.kind = 'ObjectId';

      const res = {
        statusCode: 200,
        status(code) {
          statusCode = code;
          this.statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      errorHandler(castError, {}, res, () => {});

      assert.equal(statusCode, 404, 'Invalid ObjectId must return sanitized 404');
      assert.equal(jsonBody.success, false);
      assert.match(
        jsonBody.message,
        /Resource not found: invalid ID format/i,
        'Should return user-friendly sanitization instead of leaking Mongoose stack traces'
      );
    });

    it('NEG-08: Rejects unauthenticated order retrieval with 401 Unauthorized (BOLA protection)', async () => {
      const req = { headers: {} };
      const { status, body } = await executeMiddleware(protect, req);

      assert.equal(status, 401, 'Anonymous order query must be rejected with 401 Unauthorized');
      assert.equal(body.success, false);
      assert.match(body.message, /Not authorized/i);
    });

    it('NEG-09: Blocks non-admin users from broadcast endpoints with 403 Forbidden', async () => {
      const req = {
        user: { _id: '679000000000000000000002', role: 'user', email: 'creator@danglingdice.com' },
      };
      const { status, body } = await executeMiddleware(admin, req);

      assert.equal(status, 403, 'Non-admin users must be blocked from broadcast routes');
      assert.equal(body.success, false);
    });

    it('NEG-10: SSRF safety check blocks IPv6-mapped IPv4, ULA, octal, and DNS rebinding domains', async () => {
      const { isSafeOutboundUrl } = await import('../engines/tools.js');
      assert.equal(isSafeOutboundUrl('http://[::ffff:127.0.0.1]/admin'), false);
      assert.equal(isSafeOutboundUrl('http://0177.0.0.1/flag'), false);
      assert.equal(isSafeOutboundUrl('http://2130706433/'), false);
      assert.equal(isSafeOutboundUrl('http://make-it.traefik.me/'), false);
      assert.equal(isSafeOutboundUrl('http://metadata.google.internal/'), false);
      assert.equal(isSafeOutboundUrl('http://100.64.0.1/internal'), false);
      assert.equal(isSafeOutboundUrl('https://dangling-dice-studios.com'), true);
    });
  });
});

describe('🔐 Staff & Diagnostic Route Gating', () => {
  it('SEC-RBAC-01: Media debug-stream diagnostics require protect + admin', async () => {
    const { default: mediaRoutes } = await import('../routes/mediaRoutes.js');
    const layer = mediaRoutes.stack.find((l) => l.route && l.route.path === '/debug-stream');
    assert.ok(layer, 'Expected /debug-stream route');
    const handlers = layer.route.stack.map((s) => s.handle);
    assert.ok(handlers.includes(protect), 'debug-stream must use protect');
    assert.ok(handlers.includes(admin), 'debug-stream must use admin');
  });

  it('SEC-RBAC-02: Admin write/private API routes all enforce protect + admin', async () => {
    const { default: apiRouter } = await import('../routes/api.js');
    const guarded = ['/broadcast/discord', '/broadcast/scheduled', '/broadcast/scheduled/:id', '/marketing/links', '/marketing/links/:slug'];
    for (const p of guarded) {
      const layers = apiRouter.stack.filter((l) => l.route && l.route.path === p);
      assert.ok(layers.length > 0, `Expected route ${p}`);
      for (const l of layers) {
        const handlers = l.route.stack.map((s) => s.handle);
        assert.ok(handlers.includes(protect) && handlers.includes(admin), `${p} must use protect + admin`);
      }
    }
  });

  it('SEC-RBAC-03: Staff sandbox runner rejects requests without a configured STAFF_SECRET header', async () => {
    const { isStaffRequest } = await import('../routes/api.js');
    const prev = process.env.STAFF_SECRET;
    try {
      delete process.env.STAFF_SECRET;
      assert.equal(isStaffRequest({ headers: { 'x-staff-token': 'dds_staff_2026' }, body: { staff: 'dds_internal' } }), false);
      process.env.STAFF_SECRET = 'unit-test-secret';
      assert.equal(isStaffRequest({ headers: {}, body: { staff: 'dds_internal' } }), false);
      assert.equal(isStaffRequest({ headers: { 'x-staff-token': 'unit-test-secret' } }), true);
    } finally {
      if (prev === undefined) delete process.env.STAFF_SECRET;
      else process.env.STAFF_SECRET = prev;
    }
  });
});
