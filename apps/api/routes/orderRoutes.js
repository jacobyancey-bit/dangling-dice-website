import express from 'express';
import { getMyOrders } from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyOrders);

export default router;

