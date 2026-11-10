import mongoose from 'mongoose';
import crypto from 'crypto';

// In-memory fallback map for offline / test environments
const memoryKeyStore = new Map();

const apiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: 'Default API Key',
      trim: true,
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    monthlyQuota: {
      type: Number,
      default: 1000,
    },
    requestsThisMonth: {
      type: Number,
      default: 0,
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    rateLimitPerMin: {
      type: Number,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

let ApiKeyModel;
try {
  ApiKeyModel = mongoose.model('ApiKey');
} catch {
  ApiKeyModel = mongoose.model('ApiKey', apiKeySchema);
}

/**
 * Generate a cryptographically secure random API key prefixed with 'dds_live_'
 */
export function generateKeyString(prefix = 'dds_live_') {
  return `${prefix}${crypto.randomBytes(24).toString('hex')}`;
}

/**
 * Store a new API key record with MongoDB or in-memory fallback
 */
export async function createApiKeyRecord({ ownerEmail, name = 'Production App', tier = 'free' }) {
  const quotas = {
    free: 1000,
    pro: 50000,
    enterprise: 1000000,
  };
  const rateLimits = {
    free: 60,
    pro: 300,
    enterprise: 1200,
  };

  const key = generateKeyString();
  const quota = quotas[tier] || 1000;
  const rateLimit = rateLimits[tier] || 60;

  const keyDoc = {
    key,
    ownerEmail: ownerEmail.toLowerCase().trim(),
    name: name.trim(),
    tier,
    monthlyQuota: quota,
    requestsThisMonth: 0,
    totalRequests: 0,
    rateLimitPerMin: rateLimit,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryKeyStore.set(key, { ...keyDoc });

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await ApiKeyModel.create(keyDoc);
      return created.toObject();
    } catch {
      // fallback to memory record
    }
  }

  return keyDoc;
}

/**
 * Find and validate an API key record
 */
export async function findApiKeyRecord(key) {
  if (!key || typeof key !== 'string') return null;

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const found = await ApiKeyModel.findOne({ key, isActive: true });
      if (found) return found;
    } catch {
      // fallback to memory
    }
  }

  const mem = memoryKeyStore.get(key);
  if (mem && mem.isActive) {
    return mem;
  }
  return null;
}

/**
 * Record API key usage increment
 */
export async function incrementApiKeyUsage(key) {
  if (!key) return;

  const mem = memoryKeyStore.get(key);
  if (mem) {
    mem.requestsThisMonth += 1;
    mem.totalRequests += 1;
    mem.lastUsedAt = new Date();
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      await ApiKeyModel.updateOne(
        { key },
        {
          $inc: { requestsThisMonth: 1, totalRequests: 1 },
          $set: { lastUsedAt: new Date() },
        }
      );
    } catch {
      // silent
    }
  }
}

/**
 * Deactivate / revoke an API key
 */
export async function revokeApiKeyRecord(key) {
  const mem = memoryKeyStore.get(key);
  if (mem) {
    mem.isActive = false;
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const res = await ApiKeyModel.findOneAndUpdate(
        { key },
        { isActive: false },
        { new: true }
      );
      return !!res;
    } catch {
      // fallback
    }
  }

  return !!mem;
}

export default ApiKeyModel;
