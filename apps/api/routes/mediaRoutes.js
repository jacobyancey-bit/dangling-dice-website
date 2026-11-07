import express from 'express';
import { resolveMediaInfo, streamMediaDownload, serveMediaFile, debugStream } from '../controllers/mediaController.js';

const router = express.Router();

router.post('/convert', resolveMediaInfo);
router.post('/resolve', resolveMediaInfo);
router.get('/download', streamMediaDownload);
router.get('/file/:id', serveMediaFile);
router.get('/debug-stream', debugStream);

export default router;

