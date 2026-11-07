import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import orderRoutes from './orderRoutes.js';
import affiliateRoutes from './affiliateRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import { getOEmbed } from '../controllers/oembedController.js';
import { getAnalyticsSummary } from '../middleware/analytics.js';

const router = express.Router();

/**
 * Health check / meta endpoint for the API tier & MongoDB connection status
 */
const getHealthData = () => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: dbState === 1 ? 'healthy' : 'degraded',
    service: 'Dangling Dice Studios™ Central API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbState] || 'unknown',
      connected: dbState === 1,
      name: mongoose.connection.name || 'dangling_dice_db',
      host: mongoose.connection.host || '127.0.0.1',
    },
    analytics: getAnalyticsSummary(),
    endpoints: {
      health: '/api/health (live health & telemetry metrics)',
      oembed: '/api/oembed?url=... (oEmbed 1.0 rich card provider)',
      auth: '/api/auth (register, login, profile)',
      items: '/api/items (GET, POST, PUT, DELETE)',
      checkout: '/api/checkout (create-session, webhook, order/:sessionId)',
      orders: '/api/orders (GET customer purchases)',
      affiliates: '/api/affiliates (partner directory & privacy redirects)',
      media: '/api/media/convert (YouTube to MP3/MP4 extraction)',
    },
  };
};

router.get('/', (req, res) => {
  res.status(200).json(getHealthData());
});

router.get('/health', (req, res) => {
  const data = getHealthData();
  const statusCode = data.database.connected ? 200 : 503;
  res.status(statusCode).json(data);
});

router.get('/status', (req, res) => {
  res.status(200).json(getHealthData());
});

/**
 * oEmbed 1.0 Rich Media Discovery Provider
 */
router.get('/oembed', getOEmbed);

/**
 * OpenAPI 3.0 Public Specification (RapidAPI, Postman & Swagger Hub ready)
 */
router.get('/openapi.json', (req, res) => {
  const specPath = new URL('../public/openapi.json', import.meta.url);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(specPath.pathname.replace(/^\/([A-Z]:)/, '$1'));
});

/**
 * Mount sub-routers
 */
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);
router.use('/affiliates', affiliateRoutes);
router.use('/media', mediaRoutes);

export default router;
