import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public item read operations & Admin-only item creation
 */
router.route('/')
  .get(getItems)
  .post(protect, admin, createItem);

/**
 * Public item read-by-id & Admin-only update and deletion
 */
router.route('/:id')
  .get(getItemById)
  .put(protect, admin, updateItem)
  .delete(protect, admin, deleteItem);

export default router;
