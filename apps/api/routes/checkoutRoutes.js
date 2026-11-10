import express from 'express';
import {
  createCheckoutSession,
  createApiSubscriptionSession,
  handleWebhook,
  getOrderBySessionId,
} from '../controllers/checkoutController.js';

const router = express.Router();

// Public checkout endpoints
router.post('/create-session', createCheckoutSession);
router.post('/create-api-session', createApiSubscriptionSession);
router.post('/webhook', handleWebhook);
router.get('/order/:sessionId', getOrderBySessionId);

export default router;

