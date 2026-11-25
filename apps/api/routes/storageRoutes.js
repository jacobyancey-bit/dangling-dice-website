import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { storeAsset, getAssetUrl, getStorageStatus, isR2Configured } from '../config/storage.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localStorageDir = path.join(__dirname, '..', 'public', 'storage');

const router = express.Router();

/**
 * @desc    Storage provider status & health telemetry
 * @route   GET /api/storage/status
 * @access  Public
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    storage: getStorageStatus(),
  });
});

/**
 * @desc    Direct Zero-Egress Download Redirect
 *          Redirects 302 directly to Cloudflare R2 presigned / public edge URL.
 *          Bypasses the Render container to eliminate server egress bandwidth charges.
 * @route   GET /api/storage/download/:filename
 * @access  Public
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const rawFilename = path.basename(req.params.filename);
    if (!rawFilename || rawFilename.startsWith('.')) {
      return res.status(400).json({ success: false, error: 'Invalid filename requested' });
    }

    const assetUrl = await getAssetUrl(rawFilename);

    if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
      // Direct CDN / R2 Edge 302 Redirect (0 server bandwidth consumed!)
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(302, assetUrl);
    }

    // Local container storage fallback
    const localFilePath = path.join(localStorageDir, rawFilename);
    if (fs.existsSync(localFilePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.sendFile(localFilePath);
    }

    return res.status(404).json({ success: false, error: `Asset '${rawFilename}' not found` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @desc    Upload an asset directly into Cloudflare R2 storage
 * @route   POST /api/storage/upload
 * @access  Private (Staff / Admin)
 */
router.post('/upload', protect, admin, async (req, res) => {
  try {
    const { filename, data, contentType } = req.body;

    if (!filename || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filename and base64 data payload',
      });
    }

    const safeFilename = path.basename(filename);
    const buffer = Buffer.from(data, 'base64');

    const result = await storeAsset(safeFilename, buffer, contentType || 'application/octet-stream');

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
