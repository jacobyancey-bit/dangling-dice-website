import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
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
 * Security & Core Middleware
 * ----------------------------------------------------
 */
// Set security HTTP headers (customized to allow modern inline client scripts and styles)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Enable Cross-Origin Resource Sharing for decoupled clients
app.use(cors());

// Body parsing middleware for JSON payloads
app.use(express.json());

// Body parsing middleware for URL-encoded payloads
app.use(express.urlencoded({ extended: true }));

/**
 * ----------------------------------------------------
 * Frontend Static Files (Decoupled Client Tier)
 * ----------------------------------------------------
 */
app.use(express.static(path.join(__dirname, 'client')));

/**
 * ----------------------------------------------------
 * API Tier Routes
 * ----------------------------------------------------
 */
// Mount central API router containing /auth and /items
app.use('/api', apiRoutes);

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
