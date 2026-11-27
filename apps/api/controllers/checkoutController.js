import Stripe from 'stripe';
import crypto from 'crypto';
import Item from '../models/Item.js';
import Order from '../models/Order.js';
import { LICENSE_TIERS } from '@dangling-dice/shared';
import { API_TIER_CONFIG, createApiKeyRecord, upgradeApiKeyTier } from '../models/ApiKey.js';

// Lazy-initialize Stripe client
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
  }
  return new Stripe(secretKey);
};

/**
 * Resolves license tier details and pricing
 */
function resolveTierAndPrice(item, requestedTier = 'standard_lease') {
  const tierKey = Object.keys(LICENSE_TIERS).find(
    (key) => LICENSE_TIERS[key].id === requestedTier
  );

  const tier = tierKey ? LICENSE_TIERS[tierKey] : LICENSE_TIERS.STANDARD_LEASE;
  let priceUsd = tier.defaultPriceUsd;

  // If item has a custom base price and user selected standard/digital, honor item base price
  if (item.price && item.price > 0 && (tier.id === 'standard_lease' || tier.id === 'digital_asset')) {
    priceUsd = item.price;
  }

  return { tier, priceUsd };
}

/**
 * @desc    Create a Stripe Checkout Session for studio resources or beat licenses
 * @route   POST /api/checkout/create-session
 * @access  Public / Optional Auth
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { itemId, licenseTier = 'standard_lease', customerEmail, successUrl, cancelUrl } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: 'Item ID is required for checkout' });
    }

    if (!customerEmail) {
      return res.status(400).json({ success: false, message: 'Customer email is required for checkout' });
    }

    const item = await Item.findById(itemId);
    if (!item || !item.isAvailable) {
      return res.status(404).json({ success: false, message: 'Requested studio resource is unavailable or not found' });
    }

    const { tier, priceUsd } = resolveTierAndPrice(item, licenseTier);
    const amountInCents = Math.round(priceUsd * 100);

    const stripe = getStripe();
    const clientBase = process.env.CLIENT_URL || 'http://localhost:3000';
    const redirectSuccess = successUrl || `${clientBase}/?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const redirectCancel = cancelUrl || `${clientBase}/?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      allow_promotion_codes: true,
      customer_email: customerEmail,
      client_reference_id: req.user?._id?.toString() || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${item.title} — ${tier.name}`,
              description: tier.description,
              images: item.imageUrl && item.imageUrl.startsWith('http') ? [item.imageUrl] : undefined,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        itemId: item._id.toString(),
        itemTitle: item.title,
        licenseTier: tier.id,
        customerEmail: customerEmail.toLowerCase(),
        userId: req.user?._id?.toString() || '',
      },
      success_url: redirectSuccess,
      cancel_url: redirectCancel,
    });

    // Record initial pending Order in MongoDB
    await Order.create({
      customerEmail: customerEmail.toLowerCase(),
      customerName: req.user?.name || 'Valued Creator',
      user: req.user?._id || null,
      item: item._id,
      itemTitle: item.title,
      licenseTier: tier.id,
      amount: priceUsd,
      currency: 'usd',
      stripeSessionId: session.id,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
        amount: priceUsd,
        currency: 'usd',
        tier: tier.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a Stripe Checkout Session for Developer API Subscriptions
 * @route   POST /api/checkout/create-api-session
 * @access  Public
 */
export const createApiSubscriptionSession = async (req, res, next) => {
  try {
    const { customerEmail, tier = 'pro', apiKey, successUrl, cancelUrl } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ success: false, message: 'Customer email is required for API checkout' });
    }

    const selectedTier = String(tier || 'pro').toLowerCase();
    const cfg = API_TIER_CONFIG[selectedTier];
    if (!cfg || cfg.priceUsd <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription tier selected. Choose "pro" ($9.99) or "ultra" ($29.99).',
      });
    }

    let targetKey = apiKey;
    if (!targetKey) {
      const newKeyDoc = await createApiKeyRecord({
        ownerEmail: customerEmail,
        name: `${cfg.name} Key`,
        tier: 'free',
      });
      targetKey = newKeyDoc.key;
    }

    const stripe = getStripe();
    const clientBase = process.env.DEV_URL || process.env.CLIENT_URL || 'https://dev.dangling-dice-studios.com';
    const redirectSuccess = successUrl || `${clientBase}/#billingSuccess?session_id={CHECKOUT_SESSION_ID}&key=${targetKey}`;
    const redirectCancel = cancelUrl || `${clientBase}/#billingCancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      allow_promotion_codes: true,
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Dangling Dice Studios™ API — ${cfg.name}`,
              description: `${cfg.monthlyQuota.toLocaleString()} requests/month, ${cfg.rateLimitPerMin} req/min burst limit. Identical to RapidAPI plan.`,
            },
            unit_amount: Math.round(cfg.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'api_subscription',
        tier: selectedTier,
        apiKey: targetKey,
        ownerEmail: customerEmail,
      },
      success_url: redirectSuccess,
      cancel_url: redirectCancel,
    });

    res.status(200).json({
      success: true,
      data: {
        sessionId: session.id,
        checkoutUrl: session.url,
        amount: cfg.priceUsd,
        currency: 'usd',
        tier: cfg.name,
        apiKey: targetKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle Stripe Webhook events (Fulfills orders upon payment confirmation)
 * @route   POST /api/checkout/webhook
 * @access  Public (Validated with Stripe HMAC Signature)
 */
export const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (process.env.NODE_ENV === 'production' || webhookSecret) {
      const stripe = getStripe();
      if (!sig || !webhookSecret) {
        return res.status(400).send('Webhook Error: Missing Stripe signature or webhook secret configuration');
      }
      // Use raw body for cryptographic signature verification
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
    } else {
      // Local development / testing only without webhook secret
      event = req.body;
    }
  } catch (err) {
    console.error(`[Webhook Signature Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      // 1. API Subscription / Key Fulfillment
      if (session.metadata?.type === 'api_subscription') {
        const { apiKey, tier } = session.metadata;
        await upgradeApiKeyTier({ key: apiKey, tier });
        console.log(`[Stripe API Fulfillment] API Key ${apiKey} upgraded to tier "${tier}"`);
        return res.status(200).json({ received: true });
      }

      // 2. Studio Resource / Beat License Fulfillment
      const licenseKey = `DDS-LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const order = await Order.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: 'completed',
          stripePaymentIntentId: session.payment_intent || null,
          licenseKey,
          downloadUrl: `/api/orders/download/${licenseKey}`,
          paidAt: new Date(),
        },
        { new: true }
      );

      if (order) {
        console.log(`[Stripe Fulfillment] Order fulfilled for ${order.customerEmail} (${order.licenseKey})`);
      }
    } catch (dbError) {
      console.error(`[Webhook DB Error]: ${dbError.message}`);
    }
  }

  res.status(200).json({ received: true });
};

/**
 * @desc    Get order fulfillment details by Stripe Session ID (Used on post-checkout page)
 * @route   GET /api/checkout/order/:sessionId
 * @access  Public
 */
export const getOrderBySessionId = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const order = await Order.findOne({ stripeSessionId: sessionId }).populate('item', 'title category mediaUrl imageUrl');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order session not found' });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer purchase history & digital licenses
 * @route   GET /api/orders
 * @access  Private (or by email filter)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized: Authentication required to view orders' });
    }

    const filter = {};

    if (req.user.role === 'admin') {
      if (req.query.email) {
        filter.customerEmail = req.query.email.toLowerCase();
      }
    } else {
      filter.$or = [{ user: req.user._id }, { customerEmail: req.user.email.toLowerCase() }];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('item', 'title category');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Billing portal must only bounce back to studio-owned origins (prevents open redirect via Stripe)
const SAFE_RETURN_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*dangling-dice-studios\.com$/i;
export function isSafeReturnUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    if (SAFE_RETURN_ORIGIN.test(u.origin)) return true;
    return process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(u.origin);
  } catch {
    return false;
  }
}

/**
 * @desc    Create a Stripe Customer Billing Portal session for self-service subscription/invoice management
 * @route   POST /api/checkout/portal
 * @access  Public (Customer Email / Customer ID verification)
 */
export const createPortalSession = async (req, res, next) => {
  try {
    // Raw Stripe customer IDs are never accepted from the client (direct IDOR on billing data).
    const { email, returnUrl } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Customer email is required to access the billing portal.',
      });
    }

    const stripe = getStripe();
    let targetCustomerId = null;

    {
      const customers = await stripe.customers.list({
        email: email.trim().toLowerCase(),
        limit: 1,
      });
      if (customers.data && customers.data.length > 0) {
        targetCustomerId = customers.data[0].id;
      }
    }

    if (!targetCustomerId) {
      return res.status(404).json({
        success: false,
        message: 'No active Stripe billing profile found for this email address. Please make a purchase or subscribe first.',
      });
    }

    const clientBase = process.env.CLIENT_URL || 'https://dangling-dice-studios.com';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: isSafeReturnUrl(returnUrl) ? returnUrl : `${clientBase}/#sandboxes`,
    });

    return res.status(200).json({
      success: true,
      url: portalSession.url,
    });
  } catch (err) {
    console.error('[Stripe Portal Error]', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to generate billing portal session.',
    });
  }
};
