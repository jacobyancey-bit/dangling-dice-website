import express from 'express';
import { getMyOrders } from '../controllers/checkoutController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getMyOrders);

export default router;

