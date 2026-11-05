import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { redirectPartner } from './controllers/affiliateController.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

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
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://youtube.com', 'https://js.stripe.com'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Enable Cross-Origin Resource Sharing
app.use(cors());

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
// Root info endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Dangling Dice Studios™ REST API',
    version: '1.0.0',
    documentation: '/api',
  });
});

// Privacy-preserving outbound affiliate & partner redirector
app.get('/go/:slug', redirectPartner);

// Mount central API router containing /auth, /items, /checkout, /orders, /affiliates with rate limiting
app.use('/api', apiLimiter, apiRoutes);

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
