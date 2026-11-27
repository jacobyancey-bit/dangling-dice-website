import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireTurnstile } from '../middleware/turnstile.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (Protected by rate limiter + Cloudflare Turnstile)
 */
router.post('/register', authLimiter, requireTurnstile, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials & return JWT
 * @access  Public (Protected by rate limiter)
 */
router.post('/login', authLimiter, requireTurnstile, loginUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Fetch authenticated user's profile
 * @access  Private (Protected by JWT)
 */
router.get('/profile', protect, getUserProfile);

export default router;
