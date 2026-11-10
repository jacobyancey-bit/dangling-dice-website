import mongoose from 'mongoose';
import crypto from 'crypto';

const memoryShortUrls = new Map();

const shortUrlSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: '',
    },
    clicks: {
      type: Number,
      default: 0,
    },
    lastClickedAt: {
      type: Date,
      default: null,
    },
    createdByEmail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

let ShortUrlModel;
try {
  ShortUrlModel = mongoose.model('ShortUrl');
} catch {
  ShortUrlModel = mongoose.model('ShortUrl', shortUrlSchema);
}

export function generateSlug(length = 6) {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = crypto.randomBytes(length);
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars[bytes[i] % chars.length];
  }
  return res;
}

export async function createShortUrl({ targetUrl, customSlug, title, createdByEmail }) {
  const slug = (customSlug ? customSlug.trim() : generateSlug()).toLowerCase();

  const record = {
    slug,
    targetUrl: targetUrl.trim(),
    title: title ? title.trim() : '',
    clicks: 0,
    lastClickedAt: null,
    createdByEmail: createdByEmail || null,
    createdAt: new Date(),
    shortUrl: `https://dangling-dice-studios.com/go/l/${slug}`,
  };

  memoryShortUrls.set(slug, { ...record });

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await ShortUrlModel.create(record);
      return {
        ...created.toObject(),
        shortUrl: `https://dangling-dice-studios.com/go/l/${slug}`,
      };
    } catch {
      // fallback
    }
  }

  return record;
}

export async function findAndTrackShortUrl(slug) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  const mem = memoryShortUrls.get(cleanSlug);
  if (mem) {
    mem.clicks += 1;
    mem.lastClickedAt = new Date();
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const found = await ShortUrlModel.findOneAndUpdate(
        { slug: cleanSlug },
        {
          $inc: { clicks: 1 },
          $set: { lastClickedAt: new Date() },
        },
        { new: true }
      );
      if (found) return found.toObject();
    } catch {
      // fallback
    }
  }

  return mem || null;
}

export default ShortUrlModel;
