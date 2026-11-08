import express from 'express';
import {
  getPublicShowcase,
  submitDevProject,
  getAdminShowcase,
  updateProjectStatus,
  setAppOfTheWeek,
  deleteShowcaseProject,
  getRotationConfig,
  toggleRotationConfig,
  forceRotateNow,
} from '../controllers/showcaseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPublicShowcase);
router.post('/submit', submitDevProject);

// Admin-only management routes
router.get('/admin', protect, authorize('admin'), getAdminShowcase);
router.get('/config/rotation', protect, authorize('admin'), getRotationConfig);
router.put('/config/rotation', protect, authorize('admin'), toggleRotationConfig);
router.post('/rotate-now', protect, authorize('admin'), forceRotateNow);
router.put('/:id/status', protect, authorize('admin'), updateProjectStatus);
router.put('/:id/feature', protect, authorize('admin'), setAppOfTheWeek);
router.delete('/:id', protect, authorize('admin'), deleteShowcaseProject);

export default router;

