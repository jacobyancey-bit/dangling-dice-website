import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public item read operations & Protected item creation
 */
router.route('/')
  .get(getItems)
  .post(protect, createItem);

/**
 * Public item read-by-id & Protected update and deletion
 */
router.route('/:id')
  .get(getItemById)
  .put(protect, updateItem)
  .delete(protect, deleteItem);

export default router;
