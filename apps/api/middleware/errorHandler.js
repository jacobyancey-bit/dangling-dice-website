import { sendErrorAlert } from '../utils/alertManager.js';

/**
 * Middleware to catch requests made to non-existent routes (404)
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized global error-handling middleware.
 * Ensures consistent JSON response structure and hides internal stack traces in production.
 */
export const errorHandler = (err, req, res, next) => {
  // If status code was not explicitly set or remains 200, default to 500 Internal Server Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Friendly error handling for specific Mongoose error types
  let message = err.message;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    res.status(404);
    message = 'Resource not found: invalid ID format';
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    res.status(400);
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400);
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // SRE Sentinel: Dispatch automated Discord alert for unexpected 500 Internal Server Errors
  if (statusCode >= 500) {
    sendErrorAlert({ error: err, req });
  }

  const requestId = req.id || req.headers?.['x-request-id'];

  res.json({
    success: false,
    message,
    ...(requestId ? { requestId } : {}),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
