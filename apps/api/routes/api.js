import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';
import checkoutRoutes from './checkoutRoutes.js';
import orderRoutes from './orderRoutes.js';
import affiliateRoutes from './affiliateRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import showcaseRoutes from './showcaseRoutes.js';
import v1ComputeRoutes from './v1Compute.js';
import { getOEmbed } from '../controllers/oembedController.js';
import {
  sendDiscordBroadcast,
  getScheduledPosts,
  createScheduledPost,
  deleteScheduledPost
} from '../controllers/broadcastController.js';
import { getAnalyticsSummary } from '../middleware/analytics.js';
import { protect, admin } from '../middleware/authMiddleware.js';

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
      docs: '/api/docs (official API documentation & Dev Suite)',
      openapi: '/openapi.json (OpenAPI 3.0.3 specification)',
      compute: '/v1 (stateless low-latency compute engine)',
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
 * Public Developer API Documentation Hub (/api/docs, /docs, /documentation)
 * Returns semantic HTML with free-tier, CORS, and auth metadata for crawlers,
 * with fast redirection to the interactive Developer Suite at dev.dangling-dice-studios.com.
 */
router.get(['/docs', '/docs/', '/documentation'], (req, res) => {
  if (req.query.format === 'json' || (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'))) {
    const specPath = new URL('../public/openapi.json', import.meta.url);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.sendFile(specPath.pathname.replace(/^\/([A-Z]:)/, '$1'));
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dangling Dice Studios™ API Documentation &amp; Developer Hub</title>
  <meta name="description" content="Official documentation for Dangling Dice Studios public APIs. Universal stateless compute, media extraction, and creative studio tools with HTTPS and CORS support." />
  <link rel="canonical" href="https://dangling-dice-studios.com/api/docs" />
  
  <!-- Verification & Crawler Metadata -->
  <meta name="api:name" content="Dangling Dice Studios" />
  <meta name="api:auth" content="apiKey, None" />
  <meta name="api:https" content="true" />
  <meta name="api:cors" content="true" />
  <meta name="api:pricing" content="Free" />
  <meta name="api:openapi" content="https://dangling-dice-studios.com/openapi.json" />

  <meta http-equiv="refresh" content="2; url=https://dev.dangling-dice-studios.com/" />
  <style>
    :root {
      --bg: #090a0f;
      --card: #12141f;
      --border: #1e2235;
      --cyan: #06b6d4;
      --pink: #ec4899;
      --green: #10b981;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem 1rem; display: flex; justify-content: center; }
    .container { max-width: 860px; width: 100%; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, var(--cyan), var(--pink)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .tagline { color: var(--muted); margin-bottom: 1.5rem; font-size: 1rem; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .meta-box { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; }
    .meta-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.25rem; }
    .meta-val { font-size: 1.1rem; font-weight: 700; color: var(--cyan); }
    .badge-green { color: var(--green); }
    .endpoints-list { list-style: none; margin-top: 1rem; }
    .endpoints-list li { padding: 0.75rem 0; border-bottom: 1px solid var(--border); font-family: monospace; font-size: 0.9rem; }
    .endpoints-list li:last-child { border-bottom: none; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; margin-right: 0.5rem; }
    .badge-get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-post { background: rgba(6, 182, 212, 0.2); color: #22d3ee; }
    .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; }
    .btn { display: inline-block; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none; transition: 0.2s; }
    .btn-primary { background: linear-gradient(135deg, var(--cyan), #3b82f6); color: #fff; }
    .btn-secondary { background: rgba(255, 255, 255, 0.05); color: var(--text); border: 1px solid var(--border); }
    .btn:hover { opacity: 0.9; }
    .redirect-note { font-size: 0.85rem; color: var(--muted); margin-top: 1rem; }
  </style>
</head>
<body>
  <main class="container">
    <div class="card">
      <h1>Dangling Dice Studios™ Developer API</h1>
      <p class="tagline">Universal stateless compute microservices, media stream extraction, and creative studio tools.</p>

      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Authentication</div>
          <div class="meta-val">Free Tier / API Key</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">HTTPS Support</div>
          <div class="meta-val badge-green">Yes (Enforced)</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">CORS Support</div>
          <div class="meta-val badge-green">Yes (*)</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Pricing</div>
          <div class="meta-val badge-green">100% Free Tier</div>
        </div>
      </div>

      <div class="actions">
        <a href="https://dev.dangling-dice-studios.com/" class="btn btn-primary">Open Interactive Dev Suite &rarr;</a>
        <a href="/openapi.json" class="btn btn-secondary">Download OpenAPI 3.0 Spec</a>
      </div>

      <p class="redirect-note">Redirecting to the Interactive Developer Portal in 2 seconds... (<a href="https://dev.dangling-dice-studios.com/" style="color: var(--cyan);">Click here if not redirected</a>)</p>
    </div>

    <div class="card">
      <h2>Public REST Endpoints</h2>
      <ul class="endpoints-list">
        <li><span class="badge badge-get">GET</span> <code>/v1/health</code> &mdash; Stateless compute gateway telemetry &amp; engine inventory</li>
        <li><span class="badge badge-post">POST</span> <code>/v1/compute/geo/parcel</code> &mdash; GIS land parcel boundary acreage &amp; perimeter metrics</li>
        <li><span class="badge badge-post">POST</span> <code>/v1/compute/schema/infer</code> &mdash; Real-time JSON to Zod/TypeScript/SQL schema inference</li>
        <li><span class="badge badge-post">POST</span> <code>/v1/compute/finance/amortization</code> &mdash; Penny-accurate loan &amp; mortgage schedule simulator</li>
        <li><span class="badge badge-post">POST</span> <code>/v1/compute/privacy/redact</code> &mdash; Luhn credit card &amp; PII regex sanitization firewall</li>
        <li><span class="badge badge-post">POST</span> <code>/media/convert</code> &mdash; YouTube MP3 (320kbps) &amp; MP4 audio/video transcoder</li>
        <li><span class="badge badge-get">GET</span> <code>/openapi.json</code> &mdash; Full machine-readable OpenAPI 3.0.3 specification</li>
      </ul>
    </div>
  </main>
</body>
</html>`);
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
router.use('/showcase', showcaseRoutes);
router.use('/v1', v1ComputeRoutes);
router.post('/broadcast/discord', protect, admin, sendDiscordBroadcast);
router.get('/broadcast/scheduled', protect, admin, getScheduledPosts);
router.post('/broadcast/scheduled', protect, admin, createScheduledPost);
router.delete('/broadcast/scheduled/:id', protect, admin, deleteScheduledPost);

export default router;
