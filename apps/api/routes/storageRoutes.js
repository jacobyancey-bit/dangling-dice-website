import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { storeAsset, getAssetUrl, getStorageStatus, isR2Configured, remoteAssetExists } from '../config/storage.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localStorageDir = path.join(__dirname, '..', 'public', 'storage');
// Bundled fallbacks (e.g. the free studio sound kit) used when an object is not (yet) in R2
const LOCAL_FALLBACK_DIRS = [
  localStorageDir,
  path.join(__dirname, '..', '..', 'web', 'dist', 'downloads'),
  path.join(__dirname, '..', '..', 'web', 'public', 'downloads'),
];

function findLocalAsset(filename) {
  for (const dir of LOCAL_FALLBACK_DIRS) {
    const candidate = path.join(dir, filename);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

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
    const isRemoteUrl = assetUrl.startsWith('http://') || assetUrl.startsWith('https://');

    // Only redirect when the object really exists in R2; otherwise a missing upload yields a broken
    // NoSuchKey page for visitors. (Public-domain-only setups cannot HEAD, so they redirect as before.)
    if (isRemoteUrl && (!isR2Configured || (await remoteAssetExists(rawFilename)))) {
      // Direct CDN / R2 Edge 302 Redirect (0 server bandwidth consumed!)
      // Short cache: presigned URLs expire, so the redirect itself must not outlive them.
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.redirect(302, assetUrl);
    }

    // Local container / bundled fallback
    const localFilePath = findLocalAsset(rawFilename);
    if (localFilePath) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
      return res.download(localFilePath, rawFilename);
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
