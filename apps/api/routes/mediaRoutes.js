import express from 'express';
import { resolveMediaInfo, streamMediaDownload, serveMediaFile } from '../controllers/mediaController.js';

const router = express.Router();

router.post('/convert', resolveMediaInfo);
router.post('/resolve', resolveMediaInfo);
router.get('/download', streamMediaDownload);
router.get('/file/:id', serveMediaFile);

export default router;

