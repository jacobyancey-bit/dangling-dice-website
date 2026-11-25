/**
 * @fileoverview Shared Domain Contracts, Constants, and Schema Definitions.
 * Acts as the Single Source of Truth (SSOT) across all Dangling Dice Studios apps.
 */

export const ITEM_CATEGORIES = [
  'Coding Tutorials',
  'Beats & Audio',
  'Mobile Apps',
  'Studio Games',
  'Developer Tools',
  'General',
];

export const USER_ROLES = ['user', 'admin'];

export const STUDIO_DIVISIONS = [
  {
    id: 'beats',
    name: 'Dangling Beats Studio',
    tagline: 'Lofi, dark trap, and synthwave productions for creators & streamers',
    category: 'Beats & Audio',
  },
  {
    id: 'apps',
    name: 'Mobile Apps & AI Utilities',
    tagline: 'Smart Android productivity utilities, including the AI Calculator on Google Play',
    category: 'Mobile Apps',
  },
  {
    id: 'coding',
    name: 'Dangling Dice Coding',
    tagline: 'Full-stack engineering, interactive game dev, and secure web tutorials',
    category: 'Coding Tutorials',
  },
  {
    id: 'games',
    name: 'Studio Games & RPG Tools',
    tagline: 'Custom tabletop RPG companions, digital dice rollers, and interactive developer assets',
    category: 'Studio Games',
  },
];

/**
 * Developer Tool Classifications
 */
export const TOOL_TYPES = [
  'web-utility',
  'standalone-app',
  'mobile-companion',
  'api-service',
];

/**
 * Universal Progressive Web App (PWA) Service Worker Initializer
 */
export function initPwaServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('[PWA] Service worker registration skipped:', err.message);
      });
    });
  }
}

/**
 * Curated Affiliate & Partner Categories
 */
export const AFFILIATE_CATEGORIES = [
  'Cloud Hosting & Databases',
  'Developer Utilities & IDEs',
  'Mobile & Android Dev',
  'Audio & Media Tech',
];

/**
 * Commercial Licensing Tiers for Dangling Beats & Digital Studio Assets.
 */
export const LICENSE_TIERS = {
  STANDARD_LEASE: {
    id: 'standard_lease',
    name: 'Standard MP3 Lease',
    description: 'Untagged MP3 audio, up to 100,000 streams, non-exclusive commercial rights.',
    defaultPriceUsd: 19.99,
  },
  PREMIUM_TRACKOUT: {
    id: 'premium_trackout',
    name: 'Premium WAV & Trackout',
    description: 'High-definition 24-bit WAV plus individual tracked-out stems for mixing.',
    defaultPriceUsd: 49.99,
  },
  EXCLUSIVE_RIGHTS: {
    id: 'exclusive_rights',
    name: 'Exclusive Studio Ownership',
    description: 'Full copyright transfer, unlimited broadcasting, removed from store.',
    defaultPriceUsd: 199.99,
  },
  DIGITAL_ASSET: {
    id: 'digital_asset',
    name: 'Standard Digital License',
    description: 'Single-seat commercial license for tools, sound kits, code templates, or RPG companions.',
    defaultPriceUsd: 9.99,
  },
};

export const ORDER_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

export const API_ENDPOINTS = {
  HEALTH: '/api',
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    PROFILE: '/api/auth/profile',
  },
  ITEMS: {
    BASE: '/api/items',
    BY_ID: (id) => `/api/items/${id}`,
  },
  CHECKOUT: {
    CREATE_SESSION: '/api/checkout/create-session',
    WEBHOOK: '/api/checkout/webhook',
  },
  ORDERS: {
    BASE: '/api/orders',
    BY_ID: (id) => `/api/orders/${id}`,
  },
};
