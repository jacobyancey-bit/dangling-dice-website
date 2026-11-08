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

// =========================================================================
// 1. Finance Engine (/v1/finance/*)
// =========================================================================
router.post('/finance/amortization', (req, res) => {
  const start = performance.now();
  try {
    const out = calculateAmortization(req.body || {});
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/compound-interest', (req, res) => {
  const start = performance.now();
  try {
    const out = calculateCompoundInterest(req.body || {});
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/extra-payments', (req, res) => {
  const start = performance.now();
  try {
    const out = simulateExtraPayments(req.body || {});
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/cashflow', (req, res) => {
  const start = performance.now();
  try {
    const out = calculateCashFlowMetrics(req.body || {});
    return sendEngineSuccess(req, res, 'finance', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/finance/project-scope', (req, res) => {
  const start = performance.now();
  try {
    const out = calculateProjectScope(req.body || {});
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
    const out = inferFromJson(req.body || {});
    return sendEngineSuccess(req, res, 'schema', start, out);
  } catch (err) {
    return res.status(400).json({ error: 'BadRequest', message: err.message });
  }
});

router.post('/schema/sql-to-ts', (req, res) => {
  const start = performance.now();
  try {
    const out = sqlToTypeScript(req.body || {});
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
    const out = calculateDistanceAndBearing(req.body || {});
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
    const out = scrubHipaaTelemetry(req.body || {});
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
  return sendEngineSuccess(req, res, 'schema', start, {
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
  return sendEngineSuccess(req, res, 'schema', start, {
    model: body.modelType || 'marketing_leviathan',
    upstreamEngine: process.env.LOCAL_AI_URL || 'http://127.0.0.1:8000/v1/chat',
    status: 'DISPATCHED',
    promptPreview: String(body.prompt).slice(0, 120),
  });
});

export default router;
