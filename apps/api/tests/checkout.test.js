import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${process.env.PORT || 5000}/api`;

describe('💳 Stripe Checkout & Monetization Engine Suite', () => {
  let serverProcess = null;

  before(async () => {
    try {
      const ping = await fetch(BASE_URL);
      if (ping.ok) {
        console.log(`[Checkout Test] Server already active at ${BASE_URL}`);
      }
    } catch {
      console.log('[Checkout Test] Launching Express server...');
      const serverModule = await import('../server.js');
      serverProcess = serverModule.default;
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  });

  describe('Validation & Boundary Checks', () => {
    it('CHK-01: Rejects session creation missing itemId with 400', async () => {
      const res = await fetch(`${BASE_URL}/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: 'creator@test.com' }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /Item ID is required/i);
    });

    it('CHK-02: Rejects session creation missing customerEmail with 400', async () => {
      const res = await fetch(`${BASE_URL}/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: '679000000000000000000001' }),
      });
      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.match(data.message, /Customer email is required/i);
    });

    it('CHK-03: Rejects session creation for non-existent item with 404', async () => {
      const res = await fetch(`${BASE_URL}/checkout/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: '000000000000000000000000',
          customerEmail: 'creator@test.com',
        }),
      });
      const data = await res.json();
      assert.equal(res.status, 404);
      assert.equal(data.success, false);
    });
  });

  describe('Webhook & Order Tracking', () => {
    it('CHK-04: Returns 404 for unknown order session ID', async () => {
      const res = await fetch(`${BASE_URL}/checkout/order/cs_test_nonexistent_session`);
      const data = await res.json();
      assert.equal(res.status, 404);
      assert.equal(data.success, false);
    });

    it('CHK-05: Returns list of orders from /api/orders', async () => {
      const res = await fetch(`${BASE_URL}/orders`);
      const data = await res.json();
      assert.equal(res.status, 200);
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.data));
    });
  });
});
