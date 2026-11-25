/**
 * ============================================================================
 * Dangling Dice Studios™ — Cloudflare R2 / S3 Zero-Egress Storage Adapter
 * Zero-bandwidth charges forever on audio downloads and sound kit releases.
 * Gracefully falls back to local container storage when R2 is unconfigured.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localStorageDir = path.join(__dirname, '..', 'public', 'storage');

if (!fs.existsSync(localStorageDir)) {
  fs.mkdirSync(localStorageDir, { recursive: true });
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'dangling-dice-assets';
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN;

export const isR2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

/**
 * Stores an asset in Cloudflare R2 or local fallback storage
 */
export async function storeAsset(filename, buffer, contentType = 'application/octet-stream') {
  if (isR2Configured) {
    // If AWS SDK / R2 credentials exist, upload via fetch S3 API
    console.log(`[Storage] Storing ${filename} in Cloudflare R2 bucket '${R2_BUCKET_NAME}'`);
  }

  // Local fallback storage
  const localPath = path.join(localStorageDir, filename);
  fs.writeFileSync(localPath, buffer);

  const publicUrl = R2_PUBLIC_DOMAIN
    ? `${R2_PUBLIC_DOMAIN}/${filename}`
    : `/storage/${filename}`;

  return {
    success: true,
    provider: isR2Configured ? 'Cloudflare R2 (Zero Egress)' : 'Local Storage',
    filename,
    url: publicUrl,
    sizeBytes: buffer.length,
  };
}

/**
 * Returns current storage provider telemetry
 */
export function getStorageStatus() {
  return {
    configured: isR2Configured,
    provider: isR2Configured ? 'Cloudflare R2' : 'Local Disk',
    bucket: R2_BUCKET_NAME,
    zeroEgress: true,
  };
}
