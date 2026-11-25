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
import { protect, admin } from '../middleware/authMiddleware.js';
import { requireTurnstile } from '../middleware/turnstile.js';

const router = express.Router();

// Public routes
router.get('/', getPublicShowcase);
router.post(['/', '/submit'], requireTurnstile, submitDevProject);

// Admin-only management routes
router.get('/admin', protect, admin, getAdminShowcase);
router.get('/config/rotation', protect, admin, getRotationConfig);
router.put('/config/rotation', protect, admin, toggleRotationConfig);
router.post('/rotate-now', protect, admin, forceRotateNow);
router.put('/:id/status', protect, admin, updateProjectStatus);
router.put('/:id/feature', protect, admin, setAppOfTheWeek);
router.delete('/:id', protect, admin, deleteShowcaseProject);

export default router;

