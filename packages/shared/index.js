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
};

