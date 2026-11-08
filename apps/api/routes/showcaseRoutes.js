import express from 'express';
import {
  getPublicShowcase,
  submitDevProject,
  getAdminShowcase,
  updateProjectStatus,
  setAppOfTheWeek,
  deleteShowcaseProject,
} from '../controllers/showcaseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPublicShowcase);
router.post('/submit', submitDevProject);

// Admin-only management routes
router.get('/admin', protect, authorize('admin'), getAdminShowcase);
router.put('/:id/status', protect, authorize('admin'), updateProjectStatus);
router.put('/:id/feature', protect, authorize('admin'), setAppOfTheWeek);
router.delete('/:id', protect, authorize('admin'), deleteShowcaseProject);

export default router;
