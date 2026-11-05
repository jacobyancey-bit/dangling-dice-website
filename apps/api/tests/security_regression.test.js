import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;

describe('🔒 Security & Authorization Negative Regression Suite', () => {
  let serverProcess = null;
  let standardUserToken = '';
  let sampleItemId = '679000000000000000000001';

  before(async () => {
    // 1. Ensure server is active
    try {
      const ping = await fetch(BASE_URL);
      if (ping.ok) {
        console.log(`[Test Suite] Server already running at ${BASE_URL}`);
      }
    } catch {
      console.log('[Test Suite] Launching local Express server...');
      const serverModule = await import('../server.js');
      serverProcess = serverModule.default;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    // 2. Register an authentic standard user in MongoDB with role 'user'
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regression Test User',
        email: `reg_test_${Date.now()}@danglingdice.com`,
        password: 'StandardPass2026!',
      }),
    });
    const regData = await regRes.json();
    assert.equal(regRes.status, 201, 'Test user setup must succeed');
    assert.equal(regData.data.role, 'user', 'Test user must have role user');
    standardUserToken = regData.data.token;

    // 3. Obtain a valid item ID from database to test deletion boundaries
    const itemsRes = await fetch(`${BASE_URL}/items`);
    const itemsData = await itemsRes.json();
    if (itemsData.data && itemsData.data.length > 0) {
      sampleItemId = itemsData.data[0]._id;
    }
  });

  after(async () => {
    if (serverProcess && typeof serverProcess.close === 'function') {
      serverProcess.close();
    }
    // Clean process exit for Node test runner
    setTimeout(() => process.exit(0), 500);
  });

  describe('Authentication Boundary Checks (Expect 401 Unauthorized)', () => {
    it('NEG-01: Rejects protected profile requests without Authorization header with 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const body = await res.json();
      assert.equal(res.status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false, 'Payload success flag must be false');
      assert.match(
        body.message,
        /No Bearer token provided/i,
        'Error message must indicate missing Bearer token'
      );
    });

    it('NEG-02: Rejects malformed or tampered JWT signatures with 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_tampered_payload.bogus_sig',
          'Accept': 'application/json',
        },
      });

      const body = await res.json();
      assert.equal(res.status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false);
      assert.match(body.message, /Not authorized/i, 'Error message must reflect authorization failure');
    });

    it('NEG-03: Rejects non-Bearer schemes (e.g. Basic auth) with 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
          'Accept': 'application/json',
        },
      });

      const body = await res.json();
      assert.equal(res.status, 401, 'Status code must be 401 Unauthorized');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /No Bearer token provided/i,
        'Server must require Bearer scheme specifically'
      );
    });

    it('NEG-04: Rejects anonymous item creation attempts with 401', async () => {
      const res = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: 'Anonymous Unauthenticated Beat',
          description: 'Exploit attempt without credentials',
          category: 'Beats & Audio',
          mediaUrl: 'https://danglingdice.com',
          imageUrl: '/images/banner.jpg',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 401, 'Anonymous resource creation must return 401');
      assert.equal(body.success, false);
    });
  });

  describe('Authorization & Privilege Escalation Checks (Expect 403 Forbidden)', () => {
    it('NEG-05: Blocks non-admin users from creating items with 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${standardUserToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          title: 'Unauthorized Privilege Escalation Attempt',
          description: 'Standard role attempting admin resource creation',
          category: 'Beats & Audio',
          mediaUrl: 'https://danglingdice.com',
          imageUrl: '/images/banner.jpg',
        }),
      });

      const body = await res.json();
      assert.equal(res.status, 403, 'Non-admin users must receive 403 Forbidden on admin creation endpoints');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /Forbidden: Admin access privileges required/i,
        'Response message must state admin privileges are required'
      );
    });

    it('NEG-06: Blocks non-admin users from deleting items with 403 Forbidden', async () => {
      const res = await fetch(`${BASE_URL}/items/${sampleItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${standardUserToken}`,
          'Accept': 'application/json',
        },
      });

      const body = await res.json();
      assert.equal(res.status, 403, 'Non-admin users must receive 403 Forbidden on deletion endpoints');
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
      const res = await fetch(`${BASE_URL}/items/malformed-id-not-24-hex-chars`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      const body = await res.json();
      assert.equal(res.status, 404, 'Invalid ObjectId must return sanitized 404');
      assert.equal(body.success, false);
      assert.match(
        body.message,
        /Resource not found: invalid ID format/i,
        'Should return user-friendly sanitization instead of leaking Mongoose stack traces'
      );
    });
  });
});
