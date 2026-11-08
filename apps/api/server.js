import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { redirectPartner } from './controllers/affiliateController.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { analyticsMiddleware } from './middleware/analytics.js';

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Connect to Database tier
connectDB();

const app = express();

/**
 * ----------------------------------------------------
 * Enterprise Security & Hardening Middleware
 * ----------------------------------------------------
 */

// 1. HTTP Security Headers with custom Content Security Policy (CSP) & Referrer-Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://*.dangling-dice-studios.com',
          'https://dangling-dice-studios.com',
          'https://www.youtube.com',
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        styleSrcAttr: ["'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'blob:', 'data:', 'https:'],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://youtube.com',
          'https://js.stripe.com',
          'https://*.dangling-dice-studios.com',
          'https://dangling-dice-studios.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://*.dangling-dice-studios.com',
          'https://dangling-dice-studios.com',
          'https://www.youtube.com',
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Enable Cross-Origin Resource Sharing
app.use(cors());

// 2b. Request Telemetry & AI Crawler Analytics Engine
app.use(analyticsMiddleware);

// AI Search Crawler Discovery Standards (llms.txt)
app.get(['/llms.txt', '/.well-known/llms.txt', '/llms-full.txt'], (req, res) => {
  const llmsPath = path.join(__dirname, '..', 'web', 'public', 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(llmsPath);
  }
  res.status(404).send('Not found');
});

// Discord Domain Verification Standard (HTTPS Verification)
app.get(['/.well-known/discord', '/.well-known/discord.txt'], (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send('dh=1249865747f1f8a9daec742ba9b4bbc5dd950ae9');
});

// 3. Prevent Denial of Service (DoS) by limiting JSON & URL-encoded request body size
// Preserves raw body for Stripe webhook cryptographic signature verification
app.use(
  express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Sanitize user data against NoSQL Query Injection (strips $ and . from keys)
app.use(mongoSanitize());

// 5. Prevent HTTP Parameter Pollution (HPP)
app.use(hpp({ whitelist: ['category', 'tags', 'price'] }));

/**
 * ----------------------------------------------------
 * API Tier Routes (Protected by General API Limiter)
 * ----------------------------------------------------
 */
// Privacy-preserving outbound affiliate & partner redirector
app.get('/go/:slug', redirectPartner);

// Mount central API router containing /auth, /items, /checkout, /orders, /affiliates with rate limiting
app.use('/api', apiLimiter, apiRoutes);

// Subdomain / Path Reverse-Proxy Bridge to Dangling Dice Stateless Compute Gateway (:4100)
const COMPUTE_GATEWAY_ORIGIN = process.env.COMPUTE_GATEWAY_URL || 'http://127.0.0.1:4100';
app.use('/v1', async (req, res) => {
  try {
    const targetUrl = `${COMPUTE_GATEWAY_ORIGIN}${req.originalUrl}`;
    const headers = { 'Content-Type': 'application/json' };
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    if (req.headers['x-api-key']) headers['x-api-key'] = req.headers['x-api-key'];
    if (req.headers['x-rapidapi-key']) headers['x-rapidapi-key'] = req.headers['x-rapidapi-key'];
    if (req.headers['x-rapidapi-host']) headers['x-rapidapi-host'] = req.headers['x-rapidapi-host'];
    if (req.headers['x-rapidapi-proxy-secret']) {
      headers['x-rapidapi-proxy-secret'] = req.headers['x-rapidapi-proxy-secret'];
    }
    if (req.headers['postman-token']) headers['postman-token'] = req.headers['postman-token'];
    if (req.headers['user-agent']) headers['user-agent'] = req.headers['user-agent'];
    if (req.headers.origin) headers['origin'] = req.headers.origin;

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {}),
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-')) {
        res.setHeader(key, value);
      }
    });
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');
    return res.send(data);
  } catch (err) {
    return res.status(502).json({
      error: 'ComputeGatewayUnavailable',
      message: 'Stateless Compute Gateway (:4100) is not reachable.',
    });
  }
});

// Frontend Static Files (Supports main domain and media subdomain)
const webDistPath = path.join(__dirname, '..', 'web', 'dist');
const mediaDistPath = path.join(__dirname, '..', 'media', 'dist');

// Multi-tenant subdomain static server
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/go')) {
    return next();
  }

  // Reject malicious vulnerability probes for hidden dotfiles (.env, .git, etc.)
  if (req.path.startsWith('/.') && !req.path.startsWith('/.well-known/')) {
    return res.status(404).send('Not found');
  }

  const hostname = (req.hostname || '').toLowerCase();
  const isMediaSubdomain = hostname.startsWith('media.') || req.query.subdomain === 'media';

  if (isMediaSubdomain && fs.existsSync(mediaDistPath)) {
    return express.static(mediaDistPath)(req, res, () => {
      res.sendFile(path.join(mediaDistPath, 'index.html'));
    });
  }

  if (fs.existsSync(webDistPath)) {
    return express.static(webDistPath)(req, res, () => {
      res.sendFile(path.join(webDistPath, 'index.html'));
    });
  }

  next();
});

// Root info fallback when running headless API without built web client
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Dangling Dice Studios™ REST API',
    version: '1.0.0',
    documentation: '/api',
  });
});

/**
 * ----------------------------------------------------
 * Central Error Handling Middleware
 * ----------------------------------------------------
 */
// 404 handler for unmapped endpoints
app.use(notFound);

// Global exception and error transformer
app.use(errorHandler);

/**
 * ----------------------------------------------------
 * Server Initialization
 * ----------------------------------------------------
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log(`[Server] Running in ${NODE_ENV} mode on http://localhost:${PORT}`);
  console.log(`[API Docs] Base endpoint active at http://localhost:${PORT}/api`);
});

// In test environment, unref the server so the Node process can terminate cleanly when test assertions complete
if (NODE_ENV === 'test') {
  server.unref();
}

// Handle unhandled Promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error]: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
export { server };
