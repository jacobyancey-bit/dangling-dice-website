import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
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
import { generateOgCard } from './controllers/ogController.js';
import { findAndTrackShortUrl } from './models/ShortUrl.js';
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

// Security: strip Express fingerprint from response headers
app.disable('x-powered-by');

// Fast-fail blocker for automated vulnerability scanners & malicious bot probes
const MALICIOUS_PROBE_REGEX = /^\/(wp-admin|wp-login|xmlrpc\.php|phpmyadmin|\.env|\.git|\.aws|\.svn|actuator|cgi-bin|autodiscover|setup\.cgi|solr)/i;
app.use((req, res, next) => {
  if (MALICIOUS_PROBE_REGEX.test(req.path)) {
    return res.status(404).send('Not found');
  }
  next();
});

// Hardware & browser feature Permissions-Policy
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(), payment=(self), display-capture=()'
  );
  next();
});

// High-performance gzip/brotli payload compression (reduces text/json/html bandwidth by 65-80%)
app.use(
  compression({
    filter: (req, res) => {
      // Do not compress already-compressed audio/video streams
      if (req.path.startsWith('/api/media/download') || req.path.startsWith('/media/download')) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // only compress responses above 1KB
  })
);

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
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://*.dangling-dice-studios.com',
          'https://dangling-dice-studios.com',
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://challenges.cloudflare.com',
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
          'https://challenges.cloudflare.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://*.dangling-dice-studios.com',
          'https://dangling-dice-studios.com',
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
          'https://gleitz.github.io',
          'https://tonejs.github.io',
          'https://raw.githubusercontent.com',
          'https://cdn.jsdelivr.net',
          'https://challenges.cloudflare.com',
        ],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Enable Smart Origin-Verifying Cross-Origin Resource Sharing (CORS)
const ALLOWED_ORIGIN_REGEX = /^(https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|([a-z0-9-]+\.)*dangling-dice-studios\.com|([a-z0-9-]+\.)*pages\.dev|([a-z0-9-]+\.)*railway\.app|([a-z0-9-]+\.)*onrender\.com))$/i;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isPublicMachinePath =
    req.path.startsWith('/v1/') ||
    req.path === '/health' ||
    req.path === '/oembed' ||
    req.path.startsWith('/go/l/') ||
    req.path.startsWith('/api/og/') ||
    req.path === '/og-card.svg' ||
    req.path.startsWith('/.well-known/') ||
    req.path === '/llms.txt' ||
    req.path === '/robots.txt' ||
    req.path === '/sitemap.xml';

  if (!origin || ALLOWED_ORIGIN_REGEX.test(origin) || isPublicMachinePath) {
    cors({
      origin: origin ? (ALLOWED_ORIGIN_REGEX.test(origin) ? origin : '*') : '*',
      credentials: origin && ALLOWED_ORIGIN_REGEX.test(origin) ? true : false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Api-Key'],
    })(req, res, next);
  } else {
    cors({ origin: false })(req, res, next);
  }
});

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

// Dedicated Subdomain Sitemap, Robots & app-ads.txt Discovery Engine
// Ensures crawlers always receive valid XML/TXT payloads and never fall through to SPA index.html
app.get(['/sitemap.xml', '/sitemap-index.xml', '/robots.txt', '/app-ads.txt'], (req, res, next) => {
  const hostname = (req.hostname || '').toLowerCase();
  const filename = req.path.replace('/', '');
  
  let appName = 'web';
  if (hostname.startsWith('games.') || hostname.startsWith('gaming.') || req.query.subdomain === 'games') {
    appName = 'games';
  } else if (hostname.startsWith('beats.') || hostname.startsWith('music.') || req.query.subdomain === 'beats') {
    appName = 'beats';
  } else if (hostname.startsWith('dev.') || req.query.subdomain === 'dev') {
    appName = 'dev';
  } else if (hostname.startsWith('media.') || req.query.subdomain === 'media') {
    appName = 'media';
  }

  // Look in dist first, then fallback to public
  const candidatePaths = [
    path.join(__dirname, '..', appName, 'dist', filename),
    path.join(__dirname, '..', appName, 'public', filename),
    path.join(__dirname, '..', 'web', 'dist', filename),
    path.join(__dirname, '..', 'web', 'public', filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const isXml = filename.endsWith('.xml');
      res.setHeader('Content-Type', isXml ? 'application/xml; charset=utf-8' : 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(candidate);
    }
  }

  next();
});

// 3. Prevent Denial of Service (DoS) by limiting JSON & URL-encoded request body size
// Preserves raw body for Stripe webhook cryptographic signature verification
app.use(
  express.json({
    limit: '250kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '250kb' }));

// 4. Sanitize user data against NoSQL Query Injection (strips $ and . from keys)
app.use(mongoSanitize());

// 5. Prevent HTTP Parameter Pollution (HPP)
app.use(hpp({ whitelist: ['category', 'tags', 'price'] }));

/**
 * ----------------------------------------------------
 * API Tier Routes (Protected by General API Limiter)
 * ----------------------------------------------------
 */
// Branded short link redirector
app.get('/go/l/:slug', async (req, res) => {
  try {
    const record = await findAndTrackShortUrl(req.params.slug);
    if (!record || !record.targetUrl) {
      return res.status(404).send('Short URL not found or expired.');
    }
    return res.redirect(302, record.targetUrl);
  } catch {
    return res.status(500).send('Redirect error.');
  }
});

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
app.get(['/api/og/card', '/og-card.svg', '/og-card'], apiLimiter, generateOgCard);
app.get(['/openapi.json', '/openapi-privacy.json', '/openapi-music.json', '/openapi-schema.json', '/openapi-geo.json', '/openapi-finance.json'], (req, res) => {
  let filename = 'openapi.json';
  if (req.path.includes('privacy')) filename = 'openapi-privacy.json';
  else if (req.path.includes('music')) filename = 'openapi-music.json';
  else if (req.path.includes('schema')) filename = 'openapi-schema.json';
  else if (req.path.includes('geo')) filename = 'openapi-geo.json';
  else if (req.path.includes('finance')) filename = 'openapi-finance.json';
  const specPath = path.join(__dirname, 'public', filename);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(specPath);
});

// Frontend Static Files (Supports main domain, media, beats, dev, and games subdomains)
const webDistPath = path.join(__dirname, '..', 'web', 'dist');
const mediaDistPath = path.join(__dirname, '..', 'media', 'dist');
const beatsDistPath = path.join(__dirname, '..', 'beats', 'dist');
const devDistPath = path.join(__dirname, '..', 'dev', 'dist');
const gamesDistPath = path.join(__dirname, '..', 'games', 'dist');

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
    p.startsWith('/openapi')
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
  const isGamesSubdomain = hostname.startsWith('games.') || hostname.startsWith('gaming.') || hostname.startsWith('tools.') || req.query.subdomain === 'games' || req.path === '/games' || req.path.startsWith('/games/');

  // Dedicated Machine API Gateway (Subdomain: api.dangling-dice-studios.com)
  // If a human browser visits directly, smoothly redirect to the interactive Developer Sandboxes UI;
  // machine clients (cURL, fetch, scripts) receive pure JSON payloads with zero HTML/CSS overhead.
  if (isApiSubdomain) {
    if (req.path === '/' || req.path === '/api') {
      const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html') && !req.headers.accept.includes('application/json');
      if (acceptsHtml && req.query.format !== 'json') {
        return res.redirect(302, 'https://dev.dangling-dice-studios.com/#sandboxes');
      }
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

  // Aggressive long-term caching for static assets (CSS, JS bundles, images, icons, fonts)
  // Prevents browsers, CDNs, and crawlers from repeatedly re-downloading static files on Render / Cloudflare
  const staticOptions = {
    maxAge: '7d', // 7 days browser/CDN cache default
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const normalizedPath = filePath.replace(/\\/g, '/');
      if (normalizedPath.endsWith('/sw.js') || normalizedPath.endsWith('service-worker.js')) {
        // Service workers must NEVER be cached long-term to ensure immediate app updates
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (normalizedPath.endsWith('/manifest.json') || normalizedPath.endsWith('.webmanifest')) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      } else if (normalizedPath.includes('/assets/')) {
        // Fingerprinted Vite production assets in /assets/ can be cached immutably for 1 year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (normalizedPath.endsWith('.html')) {
        // HTML entry files get short cache with revalidation
        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      } else if (normalizedPath.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2|ttf|mp3|wav)$/i)) {
        // Media assets and logos get 7 days cache with 24hr stale-while-revalidate window
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      }
    },
  };

  if (isDevSubdomain && fs.existsSync(devDistPath)) {
    return express.static(devDistPath, staticOptions)(req, res, () => {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.sendFile(path.join(devDistPath, 'index.html'));
    });
  }

  if (isGamesSubdomain && fs.existsSync(gamesDistPath)) {
    return express.static(gamesDistPath, staticOptions)(req, res, () => {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.sendFile(path.join(gamesDistPath, 'index.html'));
    });
  }

  if (isBeatsSubdomain && fs.existsSync(beatsDistPath)) {
    return express.static(beatsDistPath, staticOptions)(req, res, () => {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.sendFile(path.join(beatsDistPath, 'index.html'));
    });
  }

  if (isMediaSubdomain && fs.existsSync(mediaDistPath)) {
    return express.static(mediaDistPath, staticOptions)(req, res, () => {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      res.sendFile(path.join(mediaDistPath, 'index.html'));
    });
  }

  if (fs.existsSync(webDistPath)) {
    return express.static(webDistPath, staticOptions)(req, res, () => {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
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
