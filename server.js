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

// 1. HTTP Security Headers with custom Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://youtube.com'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Enable Cross-Origin Resource Sharing
app.use(cors());

// 3. Prevent Denial of Service (DoS) by limiting JSON & URL-encoded request body size
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Sanitize user data against NoSQL Query Injection (strips $ and . from keys)
app.use(mongoSanitize());

// 5. Prevent HTTP Parameter Pollution (HPP)
app.use(hpp({ whitelist: ['category', 'tags', 'price'] }));

/**
 * ----------------------------------------------------
 * Frontend Static Files (Decoupled Client Tier)
 * ----------------------------------------------------
 */
app.use(express.static(path.join(__dirname, 'client')));

/**
 * ----------------------------------------------------
 * API Tier Routes (Protected by General API Limiter)
 * ----------------------------------------------------
 */
// Mount central API router containing /auth and /items with rate limiting
app.use('/api', apiLimiter, apiRoutes);

/**
 * Dedicated Admin Portal route (Decoupled Admin Tier)
 */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'admin.html'));
});

/**
 * Fallback route for decoupled client single page apps
 */
app.get('*', (req, res, next) => {
  // If request begins with /api, pass down to 404 handler
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
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

// Handle unhandled Promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error]: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
