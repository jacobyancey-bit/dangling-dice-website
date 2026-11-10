import { findApiKeyRecord, incrementApiKeyUsage } from '../models/ApiKey.js';

/**
 * Extracts API key from request headers or query params
 */
export function extractApiKey(req) {
  const headerKey = req.headers['x-api-key'];
  if (headerKey && typeof headerKey === 'string') {
    return headerKey.trim();
  }

  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer dds_')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  const queryKey = req.query?.apiKey || req.query?.key;
  if (queryKey && typeof queryKey === 'string') {
    return queryKey.trim();
  }

  return null;
}

/**
 * Strict middleware: requires an active API key with available quota
 */
export async function requireApiKey(req, res, next) {
  const rawKey = extractApiKey(req);

  if (!rawKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing API key. Provide via `x-api-key` header, `Bearer dds_...`, or `?apiKey=` query param.',
      docs: 'https://dev.dangling-dice-studios.com',
    });
  }

  const keyRecord = await findApiKeyRecord(rawKey);
  if (!keyRecord || !keyRecord.isActive) {
    return res.status(401).json({
      success: false,
      error: 'InvalidApiKey',
      message: 'The provided API key is invalid, revoked, or expired.',
      docs: 'https://dev.dangling-dice-studios.com',
    });
  }

  if (keyRecord.requestsThisMonth >= keyRecord.monthlyQuota) {
    return res.status(429).json({
      success: false,
      error: 'QuotaExceeded',
      message: `Monthly quota of ${keyRecord.monthlyQuota} requests reached for tier "${keyRecord.tier}". Upgrade tier at dev.dangling-dice-studios.com.`,
      tier: keyRecord.tier,
      monthlyQuota: keyRecord.monthlyQuota,
    });
  }

  // Increment usage async
  incrementApiKeyUsage(rawKey).catch(() => {});

  req.apiKey = {
    key: keyRecord.key,
    ownerEmail: keyRecord.ownerEmail,
    tier: keyRecord.tier,
    monthlyQuota: keyRecord.monthlyQuota,
    requestsThisMonth: keyRecord.requestsThisMonth + 1,
  };

  next();
}

/**
 * Optional middleware: attaches key if present, otherwise marks as DEMO / GUEST
 */
export async function optionalApiKey(req, res, next) {
  const rawKey = extractApiKey(req);

  if (!rawKey) {
    req.apiKey = {
      key: null,
      tier: 'DEMO_SANDBOX',
      monthlyQuota: 100,
      requestsThisMonth: 0,
    };
    return next();
  }

  const keyRecord = await findApiKeyRecord(rawKey);
  if (keyRecord && keyRecord.isActive) {
    if (keyRecord.requestsThisMonth >= keyRecord.monthlyQuota) {
      return res.status(429).json({
        success: false,
        error: 'QuotaExceeded',
        message: `Monthly quota of ${keyRecord.monthlyQuota} requests reached.`,
      });
    }
    incrementApiKeyUsage(rawKey).catch(() => {});
    req.apiKey = {
      key: keyRecord.key,
      ownerEmail: keyRecord.ownerEmail,
      tier: keyRecord.tier,
      monthlyQuota: keyRecord.monthlyQuota,
      requestsThisMonth: keyRecord.requestsThisMonth + 1,
    };
  } else {
    req.apiKey = {
      key: null,
      tier: 'DEMO_SANDBOX',
      monthlyQuota: 100,
      requestsThisMonth: 0,
    };
  }

  next();
}
