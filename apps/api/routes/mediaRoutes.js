import express from 'express';
import { resolveMediaInfo, streamMediaDownload, serveMediaFile, debugStream, getMediaProgress } from '../controllers/mediaController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/convert', resolveMediaInfo);
router.post('/resolve', resolveMediaInfo);
router.get('/download', streamMediaDownload);
router.get('/progress', getMediaProgress);
router.get('/file/:id', serveMediaFile);
// Staff-only diagnostics: spends paid RapidAPI quota, spawns ffmpeg, and exposes server paths.
router.get('/debug-stream', protect, admin, debugStream);

export default router;

