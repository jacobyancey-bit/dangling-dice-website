import tracer from 'dd-trace';
tracer.init({
  service: 'dangling-dice-api',
  env: process.env.NODE_ENV || 'development',
  logInjection: true
});

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
import v1ComputeRoutes from './routes/v1Compute.js';
import itemRoutes from './routes/itemRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import affiliateRoutes from './routes/affiliateRoutes.js';
import showcaseRoutes from './routes/showcaseRoutes.js';
import { getOEmbed } from './controllers/oembedController.js';
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

// Disable HTTP 304 ETag caching so all API endpoints return fresh 200 OK payloads
app.set('etag', false);

// Prevent dynamic API responses from being cached as 304 Not Modified
app.use(
  ['/api', '/v1', '/items', '/affiliates', '/health', '/showcase', '/media', '/orders', '/oembed'],
  (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  }
);

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
          'https://www.youtube-nocookie.com',
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
          'https://www.youtube-nocookie.com',
          'https://youtube-nocookie.com',
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
          'https://www.youtube-nocookie.com',
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

// Mount native in-process Stateless Compute & Connected Ecosystem /v1 endpoints (24/7 cloud execution on Render)
app.use('/v1', apiLimiter, v1ComputeRoutes);
app.use('/api/v1', apiLimiter, v1ComputeRoutes);

// Direct root aliases for OpenAPI, RapidAPI & developer convenience
// Guarantees calls like GET /health, GET /items, POST /media/convert, GET /oembed succeed instantly with pure JSON
app.get(['/health', '/status'], apiLimiter, (req, res, next) => {
  req.url = '/health';
  apiRoutes(req, res, next);
});
app.get(['/docs', '/docs/', '/api-docs'], apiLimiter, (req, res, next) => {
  req.url = '/docs';
  apiRoutes(req, res, next);
});
app.use('/items', apiLimiter, itemRoutes);
app.use('/media', apiLimiter, mediaRoutes);
app.use('/affiliates', apiLimiter, affiliateRoutes);
app.use('/showcase', apiLimiter, showcaseRoutes);
app.get('/oembed', apiLimiter, getOEmbed);
app.get('/openapi.json', (req, res) => {
  const specPath = path.join(__dirname, 'public', 'openapi.json');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(specPath);
});

// Frontend Static Files (Supports main domain, media, beats, and dev subdomains)
const webDistPath = path.join(__dirname, '..', 'web', 'dist');
const mediaDistPath = path.join(__dirname, '..', 'media', 'dist');
const beatsDistPath = path.join(__dirname, '..', 'beats', 'dist');
const devDistPath = path.join(__dirname, '..', 'dev', 'dist');

// Multi-tenant subdomain static server
app.use((req, res, next) => {
  const p = req.originalUrl || req.path;
  if (
    p.startsWith('/api') ||
    p.startsWith('/v1') ||
    p.startsWith('/go') ||
    p.startsWith('/health') ||
    p.startsWith('/status') ||
    p.startsWith('/items') ||
    p.startsWith('/media') ||
    p.startsWith('/affiliates') ||
    p.startsWith('/showcase') ||
    p.startsWith('/oembed') ||
    p.startsWith('/openapi.json')
  ) {
    return next();
  }

  // Reject malicious vulnerability probes for hidden dotfiles (.env, .git, etc.)
  if (req.path.startsWith('/.') && !req.path.startsWith('/.well-known/')) {
    return res.status(404).send('Not found');
  }

  const hostname = (req.hostname || '').toLowerCase();
  const isApiSubdomain = hostname.startsWith('api.') || req.query.subdomain === 'api';
  const isMediaSubdomain = hostname.startsWith('media.') || req.query.subdomain === 'media' || req.path === '/media' || req.path.startsWith('/media/');
  const isBeatsSubdomain = hostname.startsWith('beats.') || hostname.startsWith('music.') || hostname.startsWith('radio.') || req.query.subdomain === 'beats' || req.path === '/beats' || req.path.startsWith('/beats/');
  const isDevSubdomain = hostname.startsWith('dev.') || hostname.startsWith('api-docs.') || req.query.subdomain === 'dev' || req.path === '/dev' || req.path.startsWith('/dev/');

  // Dedicated Machine API Gateway (Subdomain: api.dangling-dice-studios.com)
  // Ensures machine clients receive pure JSON payloads with zero HTML/CSS overhead
  if (isApiSubdomain) {
    if (req.path === '/' || req.path === '/api') {
      req.url = '/';
      return apiRoutes(req, res, next);
    }
    return res.status(404).json({
      success: false,
      service: 'Dangling Dice Studios™ API Gateway',
      error: `Endpoint '${req.path}' not found on api.dangling-dice-studios.com`,
      documentation: 'https://dev.dangling-dice-studios.com',
      openapi: 'https://api.dangling-dice-studios.com/openapi.json',
    });
  }

  if (isDevSubdomain && fs.existsSync(devDistPath)) {
    return express.static(devDistPath)(req, res, () => {
      res.sendFile(path.join(devDistPath, 'index.html'));
    });
  }

  if (isBeatsSubdomain && fs.existsSync(beatsDistPath)) {
    return express.static(beatsDistPath)(req, res, () => {
      res.sendFile(path.join(beatsDistPath, 'index.html'));
    });
  }

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
