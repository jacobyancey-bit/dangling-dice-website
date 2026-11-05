import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Route protection middleware
 * Intercepts incoming requests, validates Bearer JWT token from Authorization header,
 * and attaches authenticated User object (sans password) to req.user.
 */
export const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract token from "Bearer <token>"
      token = authHeader.split(' ')[1];

      // Verify token signature against JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request, excluding password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized: User belonging to this token no longer exists');
      }

      next();
    } catch (error) {
      res.status(401);
      next(new Error(`Not authorized: ${error.message || 'Token verification failed'}`));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized: No Bearer token provided in Authorization header'));
  }
};

/**
 * Admin authorization middleware
 * Ensures the authenticated user possesses the 'admin' role.
 * Must be executed AFTER the protect middleware.
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    next(new Error('Forbidden: Admin access privileges required'));
  }
};

/**
 * Optional authentication middleware
 * Attaches req.user if a valid Bearer token is provided, but does not block anonymous users.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};
