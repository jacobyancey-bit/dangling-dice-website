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
      enum: ['free', 'pro', 'ultra', 'enterprise'],
      default: 'free',
    },
    monthlyQuota: {
      type: Number,
      default: 100,
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
export const API_TIER_CONFIG = {
  free: {
    name: 'Free Basic Plan',
    priceUsd: 0,
    monthlyQuota: 100,
    rateLimitPerMin: 60,
    desc: 'Hobbyists and sandbox integration testing.',
  },
  pro: {
    name: 'Pro Developer Plan',
    priceUsd: 9.99,
    monthlyQuota: 5000,
    rateLimitPerMin: 300,
    desc: 'Discord bots, commercial web utilities, and active apps.',
  },
  ultra: {
    name: 'Commercial Ultra Plan',
    priceUsd: 29.99,
    monthlyQuota: 25000,
    rateLimitPerMin: 1200,
    desc: 'High-volume production SaaS, media conversion pipelines, and scale.',
  },
  enterprise: {
    name: 'Enterprise Scale Plan',
    priceUsd: 99.99,
    monthlyQuota: 1000000,
    rateLimitPerMin: 3000,
    desc: 'Dedicated enterprise infrastructure & uncapped throughput.',
  },
};

/**
 * Store a new API key record with MongoDB or in-memory fallback
 */
export async function createApiKeyRecord({ ownerEmail, name = 'Production App', tier = 'free' }) {
  const selectedTier = API_TIER_CONFIG[tier] ? tier : 'free';
  const cfg = API_TIER_CONFIG[selectedTier];

  const key = generateKeyString();

  const keyDoc = {
    key,
    ownerEmail: ownerEmail.toLowerCase().trim(),
    name: name.trim(),
    tier: selectedTier,
    monthlyQuota: cfg.monthlyQuota,
    requestsThisMonth: 0,
    totalRequests: 0,
    rateLimitPerMin: cfg.rateLimitPerMin,
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

/**
 * Upgrade an API key tier and quota upon confirmed Stripe payment
 */
export async function upgradeApiKeyTier({ key, tier }) {
  if (!key || !API_TIER_CONFIG[tier]) return null;
  const cfg = API_TIER_CONFIG[tier];

  const mem = memoryKeyStore.get(key);
  if (mem) {
    mem.tier = tier;
    mem.monthlyQuota = cfg.monthlyQuota;
    mem.rateLimitPerMin = cfg.rateLimitPerMin;
    mem.isActive = true;
    mem.updatedAt = new Date();
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const updated = await ApiKeyModel.findOneAndUpdate(
        { key },
        {
          tier,
          monthlyQuota: cfg.monthlyQuota,
          rateLimitPerMin: cfg.rateLimitPerMin,
          isActive: true,
        },
        { new: true }
      );
      if (updated) return updated.toObject();
    } catch {
      // fallback
    }
  }

  return mem || null;
}

export default ApiKeyModel;

