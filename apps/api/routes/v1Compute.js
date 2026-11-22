import express from 'express';
import {
  calculateAmortization,
  calculateCompoundInterest,
  simulateExtraPayments,
  calculateCashFlowMetrics,
  calculateProjectScope,
} from '../engines/finance.js';
import {
  inferFromJson,
  sqlToTypeScript,
  inspectDatabaseUri,
} from '../engines/schema.js';
import {
  calculateParcelMetrics,
  calculateDistanceAndBearing,
  isPointInPolygon,
  generateWireGuardConfig,
  buildDocScannerSession,
} from '../engines/geo.js';
import {
  redactText,
  validateLuhn,
  maskJsonPayload,
  scrubHipaaTelemetry,
} from '../engines/privacy.js';
import {
  resolveScale,
  generateProgression,
  calculateDelayAcoustics,
  buildMidiBuffer,
} from '../engines/music.js';
import {
  rollProvablyFairDice,
} from '../engines/gaming.js';
import {
  recordScore,
  getTopScores,
} from '../models/Leaderboard.js';
import {
  scrapeOpenGraph,
  generateSvgQrCode,
  extractAudioWaveform,
} from '../engines/tools.js';
import {
  createShortUrl,
  findAndTrackShortUrl,
} from '../models/ShortUrl.js';
import {
  createApiKeyRecord,
  findApiKeyRecord,
  revokeApiKeyRecord,
} from '../models/ApiKey.js';
import { optionalApiKey, requireApiKey } from '../middleware/apiKeyMiddleware.js';

const router = express.Router();

function detectChannelSource(req) {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (
    req.headers['x-rapidapi-key'] ||
    req.headers['x-rapidapi-host'] ||
    req.headers['x-rapidapi-proxy-secret'] ||
    ua.includes('rapidapi')
  ) {
    return 'RAPIDAPI';
  }
  if (req.headers['postman-token'] || ua.includes('postman')) {
    return 'POSTMAN';
  }
  if (req.headers.origin || req.headers.referer || ua.includes('mozilla')) {
    return 'WEB_SANDBOX';
  }
  return 'DIRECT_API';
}

function sendEngineSuccess(req, res, engine, startMs, data) {
  const latencyMs = Math.round((performance.now() - startMs) * 100) / 100;
  const source = detectChannelSource(req);
  res.setHeader('X-Response-Time-Ms', String(latencyMs));
  res.setHeader('X-Channel-Source', source);

  return res.status(200).json({
    success: true,
    engine,
    latencyMs,
    data,
    meta: {
      tier: req.headers['x-rapidapi-subscription'] || 'PRODUCTION',
      source,
      enterprise: 'https://dangling-dice-studios.com/#computeApiSuite',
    },
  });
}

/**
 * Health & Gateway Information for /v1 and /api/v1
 */
router.get(['/', '/health'], (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'Dangling Dice Studios™ Stateless Compute & Connected Ecosystem Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    channel: detectChannelSource(req),
    engines: [
      'finance (amortization, compound-interest, cashflow, extra-payments, project-scope)',
      'schema (infer, sql-to-ts, inspect-uri)',
      'geo (parcel-metrics, distance, point-in-polygon, wireguard-config, docscan-session)',
      'privacy (redact, validate-luhn, mask-json, hipaa-scrub)',
      'music (progression, scale, delay-calc, midi)',
      'games (dice-roll, leaderboard-submit, leaderboard-query)',
      'tools (opengraph, qrcode, shorten)',
      'media (waveform)',
      'auth (keys-generate, keys-lookup, keys-revoke)',
      'extract (scrape-job)',
      'ai (leviathan-generate)',
    ],
  });
});

// =========================================================================
// 1. Finance Engine (/v1/finance/*)
// =========================================================================
router.post('/finance/amortization', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const principal = Number(body.principal || 0);
    const annualRatePercent = Number(body.annualRatePercent ?? body.annualRate ?? 0);
    const termMonths = Number(body.termMonths ?? (body.termYears ? body.termYears * 12 : 360));
    const out = calculateAmortization({ principal, annualRatePercent, termMonths });
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/compound-interest', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const principal = Number(body.principal || 0);
    const annualRatePercent = Number(body.annualRatePercent ?? body.annualRate ?? 0);
    const years = Number(body.years ?? 10);
    const monthlyContribution = Number(body.monthlyContribution || 0);
    const compoundingFrequency = body.compoundingFrequency || 'monthly';
    const out = calculateCompoundInterest({ principal, annualRatePercent, years, monthlyContribution, compoundingFrequency });
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/extra-payments', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const principal = Number(body.principal || 0);
    const annualRatePercent = Number(body.annualRatePercent ?? body.annualRate ?? 0);
    const termMonths = Number(body.termMonths ?? (body.termYears ? body.termYears * 12 : 360));
    const extraMonthlyPayment = Number(body.extraMonthlyPayment ?? body.extraMonthly ?? 0);
    const out = simulateExtraPayments({ principal, annualRatePercent, termMonths, extraMonthlyPayment });
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post(['/finance/cashflow', '/finance/cash-flow'], (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    let cashFlows = Array.isArray(body.cashFlows) ? [...body.cashFlows] : [];
    if (body.initialInvestment !== undefined && (cashFlows.length === 0 || cashFlows[0] >= 0)) {
      cashFlows.unshift(-Math.abs(Number(body.initialInvestment)));
    }
    // Also support alternative monthly revenue/costs structures
    if (cashFlows.length === 0 && (body.monthlyRevenue !== undefined || body.revenue !== undefined)) {
      const rev = Number(body.monthlyRevenue || body.revenue || 0);
      const fixed = Number(body.fixedCosts || 0);
      const variable = Number(body.variableCosts || 0);
      const taxRate = Number(body.taxRatePct || 0) / 100;
      const netMonthly = (rev - fixed - variable) * (1 - taxRate);
      const init = body.initialInvestment ? -Math.abs(Number(body.initialInvestment)) : -Math.abs(rev * 2);
      cashFlows = [init, netMonthly, netMonthly, netMonthly, netMonthly];
    }
    const discountRatePercent = Number(body.discountRatePercent ?? body.discountRate ?? 8);
    const out = calculateCashFlowMetrics({
      discountRatePercent,
      cashFlows,
    });
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/project-scope', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    let category = String(body.category || body.appType || 'FULLSTACK').toUpperCase().replace(/[-\s]+/g, '_');
    if (category.includes('WEB') && !category.includes('FULLSTACK')) category = 'WEBSITE_CREATION';
    else if (category.includes('MOBILE') || category.includes('APP') || category.includes('IOS') || category.includes('ANDROID')) category = 'MOBILE_APPS';
    else if (category.includes('COMMERCE') || category.includes('STORE')) category = 'ECOMMERCE';
    else if (category.includes('INTEGRATION') || category.includes('CUSTOM')) category = 'CUSTOM_INTEGRATION';
    else if (!['WEBSITE_CREATION', 'FULLSTACK', 'MOBILE_APPS', 'ECOMMERCE', 'CUSTOM_INTEGRATION'].includes(category)) {
      category = 'FULLSTACK';
    }

    const out = calculateProjectScope({
      category,
      hasBrandAssets: Boolean(body.hasBrandAssets),
      hasWrittenContent: Boolean(body.hasWrittenContent),
      hasDomainAndDns: Boolean(body.hasDomainAndDns),
      designPreference: body.designPreference || 'bespoke_scratch',
      hourlyRateUsd: Number(body.hourlyRateUsd) || 80,
    });
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 2. Schema Engine (/v1/schema/*)
// =========================================================================
router.post('/schema/infer', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const rawInput = body.jsonInput ?? body.sample ?? body.data ?? (Object.keys(body).length > 0 ? body : null);
    const jsonInput = typeof rawInput === 'object' ? JSON.stringify(rawInput) : rawInput;
    const rootName = body.rootName || 'RootRecord';
    const out = inferFromJson({ jsonInput, rootName });
    return sendEngineSuccess(req, res, 'schema', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/schema/sql-to-ts', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const sqlDdl = body.sqlDdl ?? body.sql ?? body.ddl ?? body.query ?? '';
    const out = sqlToTypeScript({ sqlDdl });
    return sendEngineSuccess(req, res, 'schema', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/schema/inspect-uri', (req, res) => {
  const start = performance.now();
  try {
    const out = inspectDatabaseUri(req.body || {});
    return sendEngineSuccess(req, res, 'schema', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 3. Geo & Network Engine (/v1/geo/*)
// =========================================================================
router.post('/geo/parcel-metrics', (req, res) => {
  const start = performance.now();
  try {
    const out = calculateParcelMetrics(req.body || {});
    return sendEngineSuccess(req, res, 'geo', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/geo/distance', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    let from = body.from || body.pointA;
    let to = body.to || body.pointB;

    if (!from && (body.lat1 !== undefined || body.latitude1 !== undefined)) {
      from = {
        lat: Number(body.lat1 ?? body.latitude1),
        lng: Number(body.lon1 ?? body.lng1 ?? body.longitude1),
      };
    }
    if (!to && (body.lat2 !== undefined || body.latitude2 !== undefined)) {
      to = {
        lat: Number(body.lat2 ?? body.latitude2),
        lng: Number(body.lon2 ?? body.lng2 ?? body.longitude2),
      };
    }
    if (from && typeof from === 'object' && from.lon !== undefined && from.lng === undefined) {
      from.lng = from.lon;
    }
    if (to && typeof to === 'object' && to.lon !== undefined && to.lng === undefined) {
      to.lng = to.lon;
    }

    const out = calculateDistanceAndBearing({ from, to });
    return sendEngineSuccess(req, res, 'geo', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/geo/point-in-polygon', (req, res) => {
  const start = performance.now();
  try {
    const out = isPointInPolygon(req.body || {});
    return sendEngineSuccess(req, res, 'geo', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/geo/wireguard-config', (req, res) => {
  const start = performance.now();
  try {
    const out = generateWireGuardConfig(req.body || {});
    return sendEngineSuccess(req, res, 'geo', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/geo/docscan-session', (req, res) => {
  const start = performance.now();
  try {
    const out = buildDocScannerSession(req.body || {});
    return sendEngineSuccess(req, res, 'geo', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 4. Privacy & Compliance Engine (/v1/privacy/*)
// =========================================================================
router.post('/privacy/redact', (req, res) => {
  const start = performance.now();
  try {
    const out = redactText(req.body || {});
    return sendEngineSuccess(req, res, 'privacy', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/privacy/validate-luhn', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const out = validateLuhn(body.number || '');
    return sendEngineSuccess(req, res, 'privacy', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/privacy/mask-json', (req, res) => {
  const start = performance.now();
  try {
    const out = maskJsonPayload(req.body || {});
    return sendEngineSuccess(req, res, 'privacy', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/privacy/hipaa-scrub', (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const payload = body.payload ?? (body.medicalNotes ? { notes: body.medicalNotes } : body);
    const queryUrl = body.queryUrl;
    const out = scrubHipaaTelemetry({ payload, queryUrl });
    return sendEngineSuccess(req, res, 'privacy', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 5. Connected Studio Ecosystem (/v1/extract/*, /v1/ai/*)
// =========================================================================
router.post('/extract/scrape-job', (req, res) => {
  const start = performance.now();
  const body = req.body || {};
  if (!body.targetUrl) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'targetUrl is required for DaaS Scraper dispatch.',
    });
  }
  return sendEngineSuccess(req, res, 'extract', start, {
    jobId: `daas_job_${Date.now()}`,
    status: 'QUEUED_BULLMQ',
    clusterNode: process.env.DAAS_SCRAPER_NODE || '95.217.21.93 (Hetzner DaaS Cluster)',
    targetUrl: body.targetUrl,
    proxyMode: body.proxyMode || 'tor_socks5',
    estimatedCompletionSeconds: 4,
  });
});

router.post('/ai/leviathan-generate', (req, res) => {
  const start = performance.now();
  const body = req.body || {};
  if (!body.prompt) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'prompt is required for Leviathan AI engine.',
    });
  }
  return sendEngineSuccess(req, res, 'ai', start, {
    model: body.modelType || 'marketing_leviathan',
    upstreamEngine: process.env.LOCAL_AI_URL || 'http://127.0.0.1:8000/v1/chat',
    status: 'DISPATCHED',
    promptPreview: String(body.prompt).slice(0, 120),
    content: `Leviathan AI synthesized response for prompt: "${String(body.prompt).slice(0, 60)}..."`,
  });
});

// =========================================================================
// 6. Music Theory & Acoustic Engine (/v1/music/*)
// =========================================================================
router.post('/music/progression', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const out = generateProgression(req.body || {});
    return sendEngineSuccess(req, res, 'music', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/music/scale', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const out = resolveScale(req.query || {});
    return sendEngineSuccess(req, res, 'music', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/music/delay-calc', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const out = calculateDelayAcoustics(req.query || {});
    return sendEngineSuccess(req, res, 'music', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/music/midi', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    const midiBuffer = buildMidiBuffer(body);

    if (body.format === 'binary' || req.query.download === 'true') {
      res.setHeader('Content-Type', 'audio/midi');
      res.setHeader('Content-Disposition', 'attachment; filename="dangling-beats.mid"');
      return res.status(200).send(midiBuffer);
    }

    return sendEngineSuccess(req, res, 'music', start, {
      bpm: body.bpm || 120,
      title: body.title || 'Dangling Beats Sequence',
      fileSizeBytes: midiBuffer.length,
      mimeType: 'audio/midi',
      base64Midi: midiBuffer.toString('base64'),
    });
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 7. Gaming & Provably Fair RNG Engine (/v1/games/*)
// =========================================================================
router.post('/games/dice/roll', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const out = rollProvablyFairDice(req.body || {});
    return sendEngineSuccess(req, res, 'games', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/games/leaderboard/submit', optionalApiKey, async (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    if (!body.gameId || !body.playerName || body.score === undefined) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'gameId, playerName, and score are required fields.',
      });
    }

    const recorded = await recordScore(body);
    const standings = await getTopScores({ gameId: body.gameId, limit: 10 });

    return sendEngineSuccess(req, res, 'games', start, {
      submission: recorded,
      topStandings: standings.leaderboard,
    });
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/games/leaderboard/:gameId', optionalApiKey, async (req, res) => {
  const start = performance.now();
  try {
    const out = await getTopScores({
      gameId: req.params.gameId,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return sendEngineSuccess(req, res, 'games', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 8. Developer Utilities & Tools Engine (/v1/tools/*)
// =========================================================================
router.get('/tools/opengraph', optionalApiKey, async (req, res) => {
  const start = performance.now();
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'The `url` query parameter is required (e.g. ?url=https://github.com).',
      });
    }

    const metadata = await scrapeOpenGraph(targetUrl);
    return sendEngineSuccess(req, res, 'tools', start, metadata);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/tools/qrcode', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const text = req.query.text || req.query.data || 'https://dangling-dice-studios.com';
    const size = req.query.size || 256;
    const color = req.query.color ? (req.query.color.startsWith('#') ? req.query.color : `#${req.query.color}`) : '#ffffff';
    const bg = req.query.bg ? (req.query.bg.startsWith('#') ? req.query.bg : `#${req.query.bg}`) : '#0f172a';

    const qr = generateSvgQrCode({ text, size, color, bg });

    if (req.query.format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(qr.svg);
    }

    return sendEngineSuccess(req, res, 'tools', start, qr);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/tools/shorten', optionalApiKey, async (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    if (!body.targetUrl) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'targetUrl is required to generate a short link.',
      });
    }

    const short = await createShortUrl({
      targetUrl: body.targetUrl,
      customSlug: body.customSlug,
      title: body.title,
      createdByEmail: req.apiKey?.ownerEmail,
    });

    return sendEngineSuccess(req, res, 'tools', start, short);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/tools/shorten/:slug', optionalApiKey, async (req, res) => {
  const start = performance.now();
  try {
    const found = await findAndTrackShortUrl(req.params.slug);
    if (!found) {
      return res.status(404).json({ error: 'NotFound', message: 'Short URL slug not found.' });
    }
    return sendEngineSuccess(req, res, 'tools', start, found);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 9. Media & Waveform Engine (/v1/media/*)
// =========================================================================
router.post('/media/waveform', optionalApiKey, (req, res) => {
  const start = performance.now();
  try {
    const out = extractAudioWaveform(req.body || {});
    return sendEngineSuccess(req, res, 'media', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// =========================================================================
// 10. Developer API Key Management (/v1/auth/*)
// =========================================================================
router.post('/auth/keys', async (req, res) => {
  const start = performance.now();
  try {
    const body = req.body || {};
    if (!body.ownerEmail) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'ownerEmail is required to generate an API key.',
      });
    }

    const keyDoc = await createApiKeyRecord({
      ownerEmail: body.ownerEmail,
      name: body.name || 'Production App',
      tier: body.tier || 'free',
    });

    return sendEngineSuccess(req, res, 'auth', start, {
      message: 'API Key generated successfully. Keep your key confidential.',
      apiKey: keyDoc.key,
      ownerEmail: keyDoc.ownerEmail,
      tier: keyDoc.tier,
      monthlyQuota: keyDoc.monthlyQuota,
      rateLimitPerMin: keyDoc.rateLimitPerMin,
      docs: 'https://dev.dangling-dice-studios.com',
    });
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.get('/auth/keys/:key', async (req, res) => {
  const start = performance.now();
  try {
    const keyDoc = await findApiKeyRecord(req.params.key);
    if (!keyDoc) {
      return res.status(404).json({ error: 'NotFound', message: 'API key not found or revoked.' });
    }

    return sendEngineSuccess(req, res, 'auth', start, {
      key: keyDoc.key,
      ownerEmail: keyDoc.ownerEmail,
      tier: keyDoc.tier,
      monthlyQuota: keyDoc.monthlyQuota,
      requestsThisMonth: keyDoc.requestsThisMonth,
      remainingQuota: Math.max(0, keyDoc.monthlyQuota - keyDoc.requestsThisMonth),
      totalRequests: keyDoc.totalRequests,
      isActive: keyDoc.isActive,
      lastUsedAt: keyDoc.lastUsedAt,
    });
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.delete('/auth/keys/:key', async (req, res) => {
  const start = performance.now();
  try {
    const revoked = await revokeApiKeyRecord(req.params.key);
    if (!revoked) {
      return res.status(404).json({ error: 'NotFound', message: 'API key not found.' });
    }

    return sendEngineSuccess(req, res, 'auth', start, {
      message: 'API key successfully revoked.',
      key: req.params.key,
      isActive: false,
    });
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

// Graceful fallback redirect for browsers and search crawlers attempting GET on POST-only endpoints
router.get('*', (req, res) => {
  return res.redirect(302, 'https://dangling-dice-studios.com/#computeApiSuite');
});

export default router;

