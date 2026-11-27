/**
 * ============================================================================
 * Dangling Dice Studios™ — Cloudflare R2 / S3 Zero-Egress Storage Adapter
 * Zero-bandwidth charges forever on audio downloads, stems, and sound kits.
 * Gracefully falls back to local container storage when R2 is unconfigured.
 * ============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

let s3Client = null;

if (isR2Configured) {
  try {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    console.log(`[Storage] Cloudflare R2 connected. Bucket: '${R2_BUCKET_NAME}' (0 Egress Fees)`);
  } catch (err) {
    console.error('[Storage] Error initializing Cloudflare R2 client:', err.message);
  }
}

/**
 * Stores an asset in Cloudflare R2 or local fallback storage
 * @param {string} filename - Target object key / filename
 * @param {Buffer|Uint8Array|string} buffer - Asset byte payload
 * @param {string} contentType - MIME type (e.g. 'audio/mpeg', 'application/zip')
 * @returns {Promise<{success: boolean, provider: string, filename: string, url: string, sizeBytes: number}>}
 */
export async function storeAsset(filename, buffer, contentType = 'application/octet-stream') {
  existenceCache.delete(filename);
  if (s3Client) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const publicUrl = R2_PUBLIC_DOMAIN
        ? `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${filename}`
        : await getSignedUrl(
            s3Client,
            new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: filename }),
            { expiresIn: 86400 } // 24 hours presigned
          );

      return {
        success: true,
        provider: 'Cloudflare R2 (Zero Egress)',
        filename,
        url: publicUrl,
        sizeBytes: buffer.length || 0,
      };
    } catch (err) {
      console.warn(`[Storage] R2 upload failed for ${filename}, falling back to disk:`, err.message);
    }
  }

  // Local disk fallback storage
  const localPath = path.join(localStorageDir, filename);
  fs.writeFileSync(localPath, buffer);

  const fallbackUrl = `/storage/${filename}`;

  return {
    success: true,
    provider: 'Local Storage (Fallback)',
    filename,
    url: fallbackUrl,
    sizeBytes: buffer.length || 0,
  };
}

/**
 * Generates a public or presigned download URL for an asset
 * @param {string} filename
 * @param {number} expiresInSeconds
 * @returns {Promise<string>}
 */
export async function getAssetUrl(filename, expiresInSeconds = 3600) {
  if (R2_PUBLIC_DOMAIN) {
    return `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${filename}`;
  }

  if (s3Client) {
    try {
      return await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
          // Cross-origin redirects ignore <a download>; force a save dialog instead of inline playback
          ResponseContentDisposition: `attachment; filename="${filename.replace(/["\\\r\n]/g, '')}"`,
        }),
        { expiresIn: expiresInSeconds }
      );
    } catch (err) {
      console.warn(`[Storage] Presigned URL generation failed for ${filename}:`, err.message);
    }
  }

  return `/storage/${filename}`;
}

// Bounded cache of R2 object existence (HeadObject is a free-tier Class B op; avoid one per download)
const EXISTENCE_TTL_MS = 5 * 60 * 1000;
const EXISTENCE_CACHE_MAX = 200;
const existenceCache = new Map();

/**
 * Returns whether an object exists in the R2 bucket. Returns true (and does not cache) on
 * transient errors so a flaky HEAD never forces bandwidth onto the Render container.
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export async function remoteAssetExists(filename) {
  if (!s3Client) return false;
  const cached = existenceCache.get(filename);
  if (cached && Date.now() - cached.at < EXISTENCE_TTL_MS) return cached.exists;

  let exists;
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: filename }), {
      abortSignal: AbortSignal.timeout(3000),
    });
    exists = true;
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchKey') {
      exists = false;
    } else {
      return true;
    }
  }

  if (existenceCache.size >= EXISTENCE_CACHE_MAX) {
    existenceCache.delete(existenceCache.keys().next().value);
  }
  existenceCache.set(filename, { exists, at: Date.now() });
  return exists;
}

/**
 * Deletes an asset from Cloudflare R2 or local fallback storage
 * @param {string} filename
 */
export async function deleteAsset(filename) {
  existenceCache.delete(filename);
  if (s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filename,
        })
      );
      return { success: true, provider: 'Cloudflare R2' };
    } catch (err) {
      console.warn(`[Storage] R2 delete failed for ${filename}:`, err.message);
    }
  }

  const localPath = path.join(localStorageDir, filename);
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }
  return { success: true, provider: 'Local Storage' };
}

/**
 * Returns current storage provider telemetry
 */
export function getStorageStatus() {
  return {
    configured: isR2Configured,
    provider: isR2Configured ? 'Cloudflare R2' : 'Local Disk (Fallback)',
    bucket: R2_BUCKET_NAME,
    zeroEgress: true,
    publicDomain: R2_PUBLIC_DOMAIN || null,
  };
}
