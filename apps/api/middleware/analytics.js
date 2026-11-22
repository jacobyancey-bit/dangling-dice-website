/**
 * Dangling Dice Studios™ - API Telemetry & Crawler Analytics Engine
 * Tracks total requests, response performance, endpoint frequency,
 * and categorizes AI, search, and social media crawlers.
 */

import mongoose from 'mongoose';
import DailyAnalytics from '../models/DailyAnalytics.js';

const startTime = new Date();

const metrics = {
  totalRequests: 0,
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
  crawlerBreakdown: {},
  endpoints: {},
  statusCodes: {},
  recentActivity: [],
};

const MAX_RECENT_HISTORY = 20;

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
function maskIp(ip = '') {
  if (!ip) return 'unknown';
  if (ip.includes('.')) {
    return ip.replace(/\.\d+$/, '.xxx');
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 3).join(':')}::xxx`;
  }
  return 'masked';
}

/**
 * Check if a request path is a static frontend asset or internal admin health poll
 */
function isNonApiTraffic(req) {
  const p = (req.originalUrl || req.url || req.path || '').split('?')[0].toLowerCase();
  const rawUa = (req.headers['user-agent'] || '').toLowerCase();

  // If request carries RapidAPI or Postman identifiers, it is ALWAYS legitimate API traffic!
  if (
    req.headers['x-rapidapi-key'] ||
    req.headers['x-rapidapi-host'] ||
    req.headers['x-rapidapi-proxy-secret'] ||
    rawUa.includes('rapidapi') ||
    req.headers['postman-token'] ||
    rawUa.includes('postman')
  ) {
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
 * Express middleware to track incoming requests
 */
export const analyticsMiddleware = (req, res, next) => {
  const start = performance.now();
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

  // Track API marketplace channel source (RapidAPI vs Postman vs Web vs Direct)
  const uaLower = rawUa.toLowerCase();
  if (
    req.headers['x-rapidapi-key'] ||
    req.headers['x-rapidapi-host'] ||
    req.headers['x-rapidapi-proxy-secret'] ||
    uaLower.includes('rapidapi')
  ) {
    metrics.apiChannels.rapidapi += 1;
  } else if (req.headers['postman-token'] || uaLower.includes('postman')) {
    metrics.apiChannels.postman += 1;
  } else if (classification.category === 'browsers') {
    metrics.apiChannels.web += 1;
  } else {
    metrics.apiChannels.direct += 1;
  }

  if (classification.category === 'tools') {
    metrics.crawlerBreakdown[classification.name] = (metrics.crawlerBreakdown[classification.name] || 0) + 1;
  }

  const endpointPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  metrics.endpoints[endpointPath] = (metrics.endpoints[endpointPath] || 0) + 1;

  // Track response completion
  res.on('finish', () => {
    const duration = Math.round(performance.now() - start);
    const code = res.statusCode;
    metrics.statusCodes[code] = (metrics.statusCodes[code] || 0) + 1;

    // Log to recent activity
    metrics.recentActivity.unshift({
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
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
    uptimeSeconds,
    startedAt: metrics.startedAt,
    lastRequestAt: metrics.lastRequestAt,
    crawlers: metrics.crawlers,
    apiChannels: metrics.apiChannels,
    crawlerBreakdown: metrics.crawlerBreakdown,
    topEndpoints,
    statusCodes: metrics.statusCodes,
    recentActivity: metrics.recentActivity.slice(0, 15),
  };
};

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

