import express from 'express';
import { resolveMediaInfo, streamMediaDownload } from '../controllers/mediaController.js';

const router = express.Router();

router.post('/resolve', resolveMediaInfo);
router.get('/download', streamMediaDownload);

export default router;
