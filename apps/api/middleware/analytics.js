/**
 * Dangling Dice Studios™ - API Telemetry & Crawler Analytics Engine
 * Tracks total requests, response performance, endpoint frequency,
 * and categorizes AI, search, and social media crawlers.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import DailyAnalytics from '../models/DailyAnalytics.js';

const startTime = new Date();

const metrics = {
  totalRequests: 0,
  totalDurationMs: 0,
  avgResponseTimeMs: 0,
  startedAt: startTime.toISOString(),
  lastRequestAt: null,
  crawlers: {
    ai: 0,
    search: 0,
    social: 0,
    browsers: 0,
    tools: 0,
  },
  apiChannels: {
    rapidapi: 0,
    postman: 0,
    web: 0,
    direct: 0,
  },
  campaigns: {
    totalAttributedHits: 0,
    sources: {
      google_ads: 0,
      youtube: 0,
      reddit: 0,
      tiktok: 0,
      discord: 0,
      social: 0,
      other: 0,
    },
    tags: {},
  },
  crawlerBreakdown: {},
  endpoints: {},
  statusCodes: {},
  recentActivity: [],
};

const MAX_RECENT_HISTORY = 20;

/**
 * Robustly inspect request headers, query parameters, referer and user-agent
 * to detect any incoming calls from RapidAPI marketplace proxy.
 */
export function isRapidApiRequest(req) {
  if (!req || !req.headers) return false;
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (ua.includes('rapidapi')) return true;
  for (const h of Object.keys(req.headers)) {
    if (h.startsWith('x-rapidapi') || h.includes('rapidapi')) {
      return true;
    }
  }
  const referer = String(req.headers['referer'] || '').toLowerCase();
  if (referer.includes('rapidapi.com')) return true;
  const origin = String(req.headers['origin'] || '').toLowerCase();
  if (origin.includes('rapidapi.com')) return true;
  const src = String(req.query?.src || req.query?.source || '').toLowerCase();
  if (src.includes('rapidapi')) return true;
  return false;
}

/**
 * Identify the category and specific bot from User-Agent
 */
function classifyUserAgent(ua = '') {
  const uaLower = ua.toLowerCase();

  // 1. AI Search Crawlers & LLMs
  const aiBots = [
    { pattern: 'gptbot', name: 'GPTBot (OpenAI)' },
    { pattern: 'chatgpt-user', name: 'ChatGPT-User' },
    { pattern: 'perplexitybot', name: 'PerplexityBot' },
    { pattern: 'claudebot', name: 'ClaudeBot (Anthropic)' },
    { pattern: 'anthropic-ai', name: 'Anthropic AI' },
    { pattern: 'google-extended', name: 'Google-Extended (Gemini)' },
    { pattern: 'bytespider', name: 'ByteSpider (TikTok/ByteDance)' },
    { pattern: 'ccbot', name: 'Common Crawl' },
    { pattern: 'cohere-ai', name: 'Cohere AI' },
    { pattern: 'diffbot', name: 'Diffbot' },
    { pattern: 'facebookbot', name: 'Meta AI' },
  ];

  for (const bot of aiBots) {
    if (uaLower.includes(bot.pattern)) {
      return { category: 'ai', name: bot.name };
    }
  }

  // 2. Social Media Preview Crawlers (oEmbed / Card scrapers)
  const socialBots = [
    { pattern: 'discordbot', name: 'Discord Bot' },
    { pattern: 'twitterbot', name: 'Twitter / X Bot' },
    { pattern: 'facebookexternalhit', name: 'Facebook / Meta' },
    { pattern: 'redditbot', name: 'Reddit Bot' },
    { pattern: 'slackbot', name: 'Slack Bot' },
    { pattern: 'telegrambot', name: 'Telegram Bot' },
    { pattern: 'linkedinbot', name: 'LinkedIn Bot' },
    { pattern: 'pinterest', name: 'Pinterest Bot' },
    { pattern: 'whatsapp', name: 'WhatsApp Bot' },
  ];

  for (const bot of socialBots) {
    if (uaLower.includes(bot.pattern)) {
      return { category: 'social', name: bot.name };
    }
  }

  // 3. Search Engine Indexing Spiders
  const searchBots = [
    { pattern: 'googlebot', name: 'Googlebot' },
    { pattern: 'bingbot', name: 'Bingbot' },
    { pattern: 'yandexbot', name: 'Yandex' },
    { pattern: 'duckduckbot', name: 'DuckDuckGo' },
    { pattern: 'baiduspider', name: 'Baidu' },
    { pattern: 'applebot', name: 'Applebot' },
  ];

  for (const bot of searchBots) {
    if (uaLower.includes(bot.pattern)) {
      return { category: 'search', name: bot.name };
    }
  }

  // 4. Developer Tools & CLI
  if (
    uaLower.includes('curl') ||
    uaLower.includes('postman') ||
    uaLower.includes('insomnia') ||
    uaLower.includes('python-requests') ||
    uaLower.includes('node-fetch') ||
    uaLower.includes('axios') ||
    uaLower.includes('http_request')
  ) {
    return { category: 'tools', name: ua.split('/')[0] || 'HTTP Client' };
  }

  // 5. Standard Browsers / Users
  return { category: 'browsers', name: 'Browser' };
}

/**
 * Mask IP address for GDPR/privacy compliance (192.168.1.100 -> 192.168.1.xxx)
 */
export function maskIp(rawIp = '') {
  // X-Forwarded-For may be a comma-separated hop list; the client is the first entry.
  let ip = String(rawIp || '').split(',')[0].trim();
  if (!ip) return 'unknown';
  // IPv4-mapped IPv6 (::ffff:1.2.3.4) -> treat as IPv4
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) ip = mapped[1];
  // IPv4 (optionally with :port) -> /24
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}(?::\d+)?$/);
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.xxx`;
  // IPv6 (strip [brackets], :port and %zone) -> expand, keep first 3 hextets (/48)
  ip = ip.replace(/^\[([^\]]+)\](?::\d+)?$/, '$1').replace(/%.*$/, '');
  if (ip.includes(':') && /^[0-9a-f:]+$/i.test(ip)) {
    const halves = ip.split('::');
    if (halves.length > 2) return 'masked';
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const fill = halves.length === 2 ? Array(Math.max(0, 8 - head.length - tail.length)).fill('0') : [];
    const groups = [...head, ...fill, ...tail];
    if (groups.length !== 8) return 'masked';
    return `${groups.slice(0, 3).map((g) => g.toLowerCase().replace(/^0+(?=.)/, '')).join(':')}::xxx`;
  }
  return 'masked';
}
export const maskIpForTesting = maskIp;

// Cap dictionary-style counters so random-path scanners or junk UTM values cannot grow memory unbounded
const MAX_COUNTER_KEYS = 500;
function bumpCounter(obj, key) {
  if (!(key in obj) && Object.keys(obj).length >= MAX_COUNTER_KEYS) key = '(other)';
  obj[key] = (obj[key] || 0) + 1;
}

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,64}$/;

/**
 * Check if a request path is a static frontend asset or internal admin health poll
 */
function isNonApiTraffic(req) {
  const p = (req.originalUrl || req.url || req.path || '').split('?')[0].toLowerCase();
  const rawUa = (req.headers['user-agent'] || '').toLowerCase();

  // If request carries RapidAPI identifiers, it is ALWAYS legitimate API traffic!
  if (isRapidApiRequest(req)) {
    return false;
  }

  // Ignore static files (images, CSS, JS bundles, fonts, favicons, source maps)
  if (
    p === '/' ||
    p === '/index.html' ||
    p === '/admin' ||
    p === '/admin.html' ||
    p === '/manifest.json' ||
    p === '/robots.txt' ||
    p === '/app-ads.txt' ||
    p === '/sitemap.xml' ||
    p.startsWith('/images/') ||
    p.startsWith('/assets/') ||
    p.startsWith('/css/') ||
    p.startsWith('/js/') ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf)$/.test(p)
  ) {
    return true;
  }

  // Ignore automated Admin Portal polling (/api/health called from /admin)
  const referer = (req.headers['referer'] || '').toLowerCase();
  if ((p === '/api/health' || p === '/health') && referer.includes('/admin')) {
    return true;
  }

  // Dedicated API subdomain (api.dangling-dice-studios.com) routes are always API traffic
  const host = (req.headers['host'] || req.hostname || '').toLowerCase();
  if (host.startsWith('api.')) {
    return false;
  }

  // Only count legitimate API & partner routes (/api/*, /v1/*, /go/*, /media/*, /items/*, /health)
  if (
    !p.startsWith('/api') &&
    !p.startsWith('/v1') &&
    !p.startsWith('/go/') &&
    !p.startsWith('/media') &&
    !p.startsWith('/items') &&
    !p.startsWith('/health') &&
    !p.startsWith('/showcase') &&
    !p.startsWith('/auth')
  ) {
    return true;
  }

  return false;
}

/**
 * Express middleware to track incoming requests, inject request correlation IDs,
 * and track high-precision performance telemetry
 */
export const analyticsMiddleware = (req, res, next) => {
  const start = performance.now();
  const inboundId = req.headers['x-request-id'];
  const requestId = (typeof inboundId === 'string' && SAFE_REQUEST_ID.test(inboundId) && inboundId) || `dds_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Hook writeHead to inject high-precision latency & W3C Server-Timing headers
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const elapsed = Math.round(performance.now() - start);
      res.setHeader('X-Response-Time', `${elapsed}ms`);
      res.setHeader('Server-Timing', `total;dur=${elapsed}`);
    }
    return originalWriteHead.apply(this, args);
  };

  const rawUa = req.headers['user-agent'] || 'Unknown';
  const classification = classifyUserAgent(rawUa);

  // Always record verified AI, Search Engine, and Social Media crawlers (even on '/')
  if (
    classification.category === 'ai' ||
    classification.category === 'search' ||
    classification.category === 'social'
  ) {
    metrics.crawlers[classification.category] = (metrics.crawlers[classification.category] || 0) + 1;
    metrics.crawlerBreakdown[classification.name] = (metrics.crawlerBreakdown[classification.name] || 0) + 1;
  }

  // Track external marketing & ad-click attribution (Google Ads gclid, Reddit rdt_cid, TikTok ttclid, FB fbclid, UTMs)
  const q = req.query || {};
  const utmSource = String(q.utm_source || q.ref || '').trim().toLowerCase();
  const utmCampaign = String(q.utm_campaign || '').trim().toLowerCase();
  let detectedSource = null;
  if (q.gclid || utmSource.includes('google') || utmSource === 'adwords') {
    detectedSource = 'google_ads';
  } else if (q.rdt_cid || utmSource.includes('reddit')) {
    detectedSource = 'reddit';
  } else if (utmSource.includes('youtube') || utmSource === 'yt' || utmSource === 'yt_shorts') {
    detectedSource = 'youtube';
  } else if (q.ttclid || utmSource.includes('tiktok')) {
    detectedSource = 'tiktok';
  } else if (utmSource.includes('discord')) {
    detectedSource = 'discord';
  } else if (q.fbclid || utmSource.includes('facebook') || utmSource.includes('instagram') || utmSource.includes('twitter') || utmSource === 'x') {
    detectedSource = 'social';
  } else if (utmSource) {
    detectedSource = 'other';
  }

  if (detectedSource) {
    metrics.campaigns.totalAttributedHits += 1;
    metrics.campaigns.sources[detectedSource] = (metrics.campaigns.sources[detectedSource] || 0) + 1;
    const tagKey = utmCampaign || utmSource || detectedSource;
    bumpCounter(metrics.campaigns.tags, tagKey.slice(0, 80));
  }

  // Skip static assets, random 404 bot scans (/wp-admin), and Admin Portal polling for API pull counts
  if (isNonApiTraffic(req)) {
    return next();
  }

  // Increment real API metrics
  metrics.totalRequests += 1;
  metrics.lastRequestAt = new Date().toISOString();
  if (classification.category === 'browsers' || classification.category === 'tools') {
    metrics.crawlers[classification.category] = (metrics.crawlers[classification.category] || 0) + 1;
  }

  // Track API marketplace channel source (RapidAPI vs Web vs Direct)
  if (isRapidApiRequest(req)) {
    metrics.apiChannels.rapidapi += 1;
  } else if (classification.category === 'browsers') {
    metrics.apiChannels.web += 1;
  } else {
    metrics.apiChannels.direct += 1;
  }

  if (classification.category === 'tools') {
    metrics.crawlerBreakdown[classification.name] = (metrics.crawlerBreakdown[classification.name] || 0) + 1;
  }

  const endpointPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  bumpCounter(metrics.endpoints, endpointPath);

  // Track response completion
  res.on('finish', () => {
    const duration = Math.round(performance.now() - start);
    metrics.totalDurationMs = (metrics.totalDurationMs || 0) + duration;
    metrics.avgResponseTimeMs = Math.round(metrics.totalDurationMs / (metrics.totalRequests || 1));
    const code = res.statusCode;
    metrics.statusCodes[code] = (metrics.statusCodes[code] || 0) + 1;

    // Log to recent activity
    metrics.recentActivity.unshift({
      time: new Date().toISOString(),
      method: req.method,
      path: endpointPath, // query string dropped: may carry emails, tokens, or click IDs
      status: code,
      durationMs: duration,
      category: classification.category,
      client: classification.name,
      ip: maskIp(req.ip || req.headers['x-forwarded-for']),
    });

    if (metrics.recentActivity.length > MAX_RECENT_HISTORY) {
      metrics.recentActivity.pop();
    }
  });

  next();
};

/**
 * Returns read-only snapshot of system analytics
 */
export const getAnalyticsSummary = () => {
  const uptimeSeconds = Math.round((Date.now() - startTime.getTime()) / 1000);

  // Top endpoints sorted by hit volume
  const topEndpoints = Object.entries(metrics.endpoints)
    .map(([path, hits]) => ({ path, hits }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10);

  return {
    totalRequests: metrics.totalRequests,
    avgResponseTimeMs: metrics.avgResponseTimeMs || 0,
    uptimeSeconds,
    startedAt: metrics.startedAt,
    lastRequestAt: metrics.lastRequestAt,
    crawlers: metrics.crawlers,
    apiChannels: metrics.apiChannels,
    campaigns: metrics.campaigns,
    crawlerBreakdown: metrics.crawlerBreakdown,
    topEndpoints,
    statusCodes: metrics.statusCodes,
    recentActivity: metrics.recentActivity.slice(0, 15),
  };
};

/**
 * Initialize and restore today's metrics from MongoDB DailyAnalytics collection upon startup
 */
export async function initializeDailyMetrics() {
  if (mongoose.connection?.readyState !== 1) return;
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    const existing = await DailyAnalytics.findOne({ date: todayStr });
    if (existing) {
      metrics.totalRequests = Math.max(metrics.totalRequests, existing.totalRequests || 0);
      if (existing.crawlers) {
        metrics.crawlers.ai = Math.max(metrics.crawlers.ai, existing.crawlers.ai || 0);
        metrics.crawlers.search = Math.max(metrics.crawlers.search, existing.crawlers.search || 0);
        metrics.crawlers.social = Math.max(metrics.crawlers.social, existing.crawlers.social || 0);
        metrics.crawlers.browsers = Math.max(metrics.crawlers.browsers, existing.crawlers.browsers || 0);
        metrics.crawlers.tools = Math.max(metrics.crawlers.tools, existing.crawlers.tools || 0);
      }
      if (existing.apiChannels) {
        metrics.apiChannels.rapidapi = Math.max(metrics.apiChannels.rapidapi, existing.apiChannels.rapidapi || 0);
        metrics.apiChannels.web = Math.max(metrics.apiChannels.web, existing.apiChannels.web || 0);
        metrics.apiChannels.direct = Math.max(metrics.apiChannels.direct, existing.apiChannels.direct || 0);
      }
      if (existing.endpoints) {
        const epObj = existing.endpoints instanceof Map ? Object.fromEntries(existing.endpoints) : existing.endpoints;
        for (const [ep, count] of Object.entries(epObj)) {
          metrics.endpoints[ep] = Math.max(metrics.endpoints[ep] || 0, count);
        }
      }
    }
  } catch (err) {
    // Graceful startup fallback
  }
}

/**
 * Persist current metrics snapshot to MongoDB DailyAnalytics collection
 */
export async function flushDailyMetrics() {
  if (mongoose.connection?.readyState !== 1) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  try {
    return await DailyAnalytics.findOneAndUpdate(
      { date: todayStr },
      {
        $set: {
          totalRequests: metrics.totalRequests,
          crawlers: metrics.crawlers,
          apiChannels: metrics.apiChannels,
          endpoints: metrics.endpoints,
          statusCodes: metrics.statusCodes,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    return null;
  }
}

// Automatically sync metrics to MongoDB every 5 minutes (unref so tests/scripts exit cleanly)
const syncTimer = setInterval(flushDailyMetrics, 5 * 60 * 1000);
if (syncTimer.unref) {
  syncTimer.unref();
}

