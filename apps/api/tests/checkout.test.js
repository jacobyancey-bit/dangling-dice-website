import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCheckoutSession,
  createApiSubscriptionSession,
  createPortalSession,
  handleWebhook,
  getOrderBySessionId,
  getMyOrders,
} from '../controllers/checkoutController.js';
import Item from '../models/Item.js';
import Order from '../models/Order.js';
import { createApiKeyRecord, findApiKeyRecord } from '../models/ApiKey.js';

describe('💳 Stripe Checkout & Monetization Engine Suite', () => {
  describe('Validation & Boundary Checks', () => {
    it('CHK-01: Rejects session creation missing itemId with 400', async () => {
      let statusCode = null;
      let jsonBody = null;

      const req = {
        body: { customerEmail: 'creator@test.com' },
      };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await createCheckoutSession(req, res, () => {});
      assert.equal(statusCode, 400);
      assert.equal(jsonBody?.success, false);
      assert.match(jsonBody?.message, /Item ID is required/i);
    });

    it('CHK-02: Rejects session creation missing customerEmail with 400', async () => {
      let statusCode = null;
      let jsonBody = null;

      const req = {
        body: { itemId: '679000000000000000000001' },
      };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await createCheckoutSession(req, res, () => {});
      assert.equal(statusCode, 400);
      assert.equal(jsonBody?.success, false);
      assert.match(jsonBody?.message, /Customer email is required/i);
    });

    it('CHK-03: Rejects session creation for non-existent item with 404', async () => {
      let statusCode = null;
      let jsonBody = null;

      // Stub Item.findById to simulate item not found in DB
      const originalFindById = Item.findById;
      Item.findById = async () => null;

      try {
        const req = {
          body: {
            itemId: '000000000000000000000000',
            customerEmail: 'creator@test.com',
          },
        };
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await createCheckoutSession(req, res, () => {});
        assert.equal(statusCode, 404);
        assert.equal(jsonBody?.success, false);
      } finally {
        Item.findById = originalFindById;
      }
    });
  });

  describe('Webhook & Order Tracking', () => {
    it('CHK-04: Returns 404 for unknown order session ID', async () => {
      let statusCode = null;
      let jsonBody = null;

      const originalFindOne = Order.findOne;
      Order.findOne = () => ({
        populate: async () => null,
      });

      try {
        const req = {
          params: { sessionId: 'cs_test_nonexistent_session' },
        };
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await getOrderBySessionId(req, res, () => {});
        assert.equal(statusCode, 404);
        assert.equal(jsonBody?.success, false);
      } finally {
        Order.findOne = originalFindOne;
      }
    });

    it('CHK-05: Returns list of orders from /api/orders', async () => {
      let statusCode = null;
      let jsonBody = null;

      const originalFind = Order.find;
      Order.find = () => ({
        sort: () => ({
          populate: async () => [
            {
              _id: '679000000000000000000010',
              customerEmail: 'buyer@test.com',
              amountTotal: 25.0,
            },
          ],
        }),
      });

      try {
        const req = { user: { _id: '679000000000000000000001', role: 'admin' }, query: {} };
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonBody = data;
            return this;
          },
        };

        await getMyOrders(req, res, () => {});
        assert.equal(statusCode, 200);
        assert.equal(jsonBody?.success, true);
        assert.ok(Array.isArray(jsonBody?.data));
        assert.equal(jsonBody.data.length, 1);
      } finally {
        Order.find = originalFind;
      }
    });

    it('CHK-06: Rejects createApiSubscriptionSession missing customerEmail with 400', async () => {
      let statusCode = null;
      let jsonBody = null;

      const req = { body: { tier: 'pro' } };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await createApiSubscriptionSession(req, res, () => {});
      assert.equal(statusCode, 400);
      assert.equal(jsonBody?.success, false);
      assert.match(jsonBody?.message, /Customer email is required/i);
    });

    it('CHK-07: Rejects createApiSubscriptionSession with invalid tier with 400', async () => {
      let statusCode = null;
      let jsonBody = null;

      const req = { body: { customerEmail: 'dev@test.com', tier: 'invalid_tier_99' } };
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonBody = data;
          return this;
        },
      };

      await createApiSubscriptionSession(req, res, () => {});
      assert.equal(statusCode, 400);
      assert.equal(jsonBody?.success, false);
      assert.match(jsonBody?.message, /Invalid subscription tier/i);
    });

    it('CHK-08: Fulfills API key upgrade to ULTRA tier upon Stripe webhook completion', async () => {
      const keyDoc = await createApiKeyRecord({
        ownerEmail: 'ultra-buyer@test.com',
        tier: 'free',
      });
      assert.equal(keyDoc.tier, 'free');
      assert.equal(keyDoc.monthlyQuota, 100);

      let responseStatus = null;
      let responseBody = null;

      const mockReq = {
        headers: {},
        body: {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_api_sub_123',
              metadata: {
                type: 'api_subscription',
                tier: 'ultra',
                apiKey: keyDoc.key,
              },
            },
          },
        },
      };

      const mockRes = {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(data) {
          responseBody = data;
          return this;
        },
        send(data) {
          responseBody = data;
          return this;
        },
      };

      await handleWebhook(mockReq, mockRes, () => {});

      assert.equal(responseStatus, 200);
      assert.equal(responseBody?.received, true);

      // Verify key is now upgraded to ULTRA with 25,000 monthly quota
      const updated = await findApiKeyRecord(keyDoc.key);
      assert.ok(updated);
      assert.equal(updated.tier, 'ultra');
      assert.equal(updated.monthlyQuota, 25000);
      assert.equal(updated.rateLimitPerMin, 1200);
    });

    it('CHK-09: Billing portal returns the Stripe login link and never looks up customers', async () => {
      let jsonBody = null;
      const res = {
        status() { return this; },
        json(data) { jsonBody = data; return this; },
      };
      // Even with a guessed email/customerId, no portal session is created server-side
      createPortalSession({ body: { email: 'victim@example.com', customerId: 'cus_guess' } }, res);
      assert.equal(jsonBody?.success, true);
      const url = new URL(jsonBody.url);
      assert.equal(url.origin, 'https://billing.stripe.com');
      assert.ok(url.pathname.startsWith('/p/login/'), 'must be the email-verified login page, not a session URL');
      assert.equal(url.searchParams.get('prefilled_email'), 'victim@example.com');
      assert.ok(!jsonBody.url.includes('cus_guess'));
    });

    it('CHK-10: Portal login link ignores invalid emails and untrusted env overrides', async () => {
      const { getPortalLoginUrl } = await import('../controllers/checkoutController.js');
      assert.ok(!getPortalLoginUrl('not-an-email').includes('prefilled_email'));
      assert.ok(!getPortalLoginUrl(undefined).includes('prefilled_email'));
      const prev = process.env.STRIPE_PORTAL_LOGIN_URL;
      try {
        process.env.STRIPE_PORTAL_LOGIN_URL = 'https://evil.example/p/login/x';
        assert.ok(getPortalLoginUrl().startsWith('https://billing.stripe.com/p/login/'));
      } finally {
        if (prev === undefined) delete process.env.STRIPE_PORTAL_LOGIN_URL;
        else process.env.STRIPE_PORTAL_LOGIN_URL = prev;
      }
    });
  });
});
