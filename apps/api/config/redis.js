/**
 * ============================================================================
 * Dangling Dice Studios™ — High-Performance Redis & Cache Layer
 * Automatically connects to Railway Redis when REDIS_URL is provided,
 * with seamless in-memory Map fallback when running locally or unconfigured.
 * ============================================================================
 */

import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL;

class MemoryFallbackStore {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
  }

  async get(key) {
    if (this.expirations.has(key) && Date.now() > this.expirations.get(key)) {
      this.store.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, String(value));
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.store.set(key, String(value));
    this.expirations.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async del(key) {
    this.expirations.delete(key);
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    const val = parseInt(await this.get(key) || '0', 10) + 1;
    await this.set(key, val);
    return val;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.expirations.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }
}

let redisClient = null;
let isConnected = false;
let providerName = 'Local In-Memory Cache';

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.connect().then(() => {
      isConnected = true;
      providerName = 'Railway Redis';
      console.log('⚡ [Redis] Successfully connected to Railway Redis cache.');
    }).catch((err) => {
      console.warn('⚠️ [Redis] Railway Redis connection failed, falling back to in-memory store:', err.message);
      redisClient = new MemoryFallbackStore();
    });

    redisClient.on('error', (err) => {
      // Suppress unhandled crash on intermittent disconnects
      console.debug('[Redis] Network event:', err.message);
    });
  } catch (err) {
    console.warn('⚠️ [Redis] Initialization failed, using in-memory store:', err.message);
    redisClient = new MemoryFallbackStore();
  }
} else {
  redisClient = new MemoryFallbackStore();
}

/**
 * Returns current Redis & caching health telemetry
 */
export function getRedisStatus() {
  return {
    connected: isConnected,
    provider: providerName,
    configured: Boolean(redisUrl),
  };
}

export default redisClient;
