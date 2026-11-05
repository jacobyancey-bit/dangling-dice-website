import Stripe from 'stripe';
import crypto from 'crypto';
import Item from '../models/Item.js';
import Order from '../models/Order.js';
import { LICENSE_TIERS } from '@dangling-dice/shared';

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
 * @desc    Handle Stripe Webhook events (Fulfills orders upon payment confirmation)
 * @route   POST /api/checkout/webhook
 * @access  Public (Validated with Stripe HMAC Signature)
 */
export const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const stripe = getStripe();
    if (webhookSecret && sig) {
      // Use raw body for cryptographic signature verification
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
    } else {
      // Fallback for local testing or simulated events without webhook secret
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
      // Generate a cryptographically secure digital license key
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
    const filter = {};

    if (req.user && req.user.role !== 'admin') {
      filter.$or = [{ user: req.user._id }, { customerEmail: req.user.email.toLowerCase() }];
    } else if (req.query.email) {
      filter.customerEmail = req.query.email.toLowerCase();
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
