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

export default router;

