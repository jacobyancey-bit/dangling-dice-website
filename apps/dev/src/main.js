import './style.css';
import { initStaffCommandPalette, initPwaServiceWorker, initStudioShell, icon } from '@dangling-dice/shared';
import { initHeroConsole } from './heroConsole.js';

// Universal PWA Service Worker Registration
initPwaServiceWorker();
import {
  API_GATEWAY_URL,
  API_ENDPOINTS,
  WEBHOOK_PRESETS,
  computeHmacSha256,
  generateCodeSnippets,
} from './apiStudio.js';
import {
  jsonToTypescript,
  jsonToDart,
  jsonToPydantic,
  analyzeRegex,
  decodeJwt,
} from './dataConverters.js';
import {
  TokenBucketSimulator,
  translateCron,
  HTTP_STATUS_CATALOG,
  HTTP_HEADERS_CATALOG,
} from './systemSimulators.js';

// ============================================================================
// Master State & Navigation
// ============================================================================
let currentSection = 'apiStudio';
let activeEndpoint = API_ENDPOINTS[0];
let currentSnippetLang = 'curl';
let currentTargetType = 'ts';
let lastSuccessfulApiResponse = null;

// Simulator instances
const tokenBucket = new TokenBucketSimulator(10, 2);

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'flex';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function switchDevSection(sectionId) {
  currentSection = sectionId;

  const sections = {
    apiStudio: document.getElementById('sectionApiStudio'),
    dataTypes: document.getElementById('sectionDataTypes'),
    systemSim: document.getElementById('sectionSystemSim'),
    showcase: document.getElementById('showcase'),
    billing: document.getElementById('sectionBilling'),
  };

  const buttons = {
    apiStudio: document.getElementById('hubApiStudioBtn'),
    dataTypes: document.getElementById('hubDataTypesBtn'),
    systemSim: document.getElementById('hubSystemSimBtn'),
    showcase: document.getElementById('hubShowcaseBtn'),
    billing: document.getElementById('hubBillingBtn'),
  };

  Object.entries(sections).forEach(([key, el]) => {
    if (el) el.hidden = key !== sectionId;
  });

  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    const selected = key === sectionId;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
}

// WAI-ARIA tabs: Left/Right/Home/End move between sandbox tabs
function initTabKeyboard() {
  const list = document.getElementById('sandboxes');
  if (!list) return;
  list.addEventListener('keydown', (e) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.click();
  });
}

// Static HTML uses <span data-icon="name"> placeholders; swap in the shared stroke icons
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.outerHTML = icon(el.dataset.icon);
  });
}

// ============================================================================
// 1. API Studio: Live Glass-Box Runner & Code Generator
// ============================================================================
function initApiStudio() {
  const select = document.getElementById('endpointSelect');
  if (!select) return;

  select.innerHTML = API_ENDPOINTS.map(
    (ep) => `<option value="${ep.id}">[${ep.method}] ${ep.path} — ${ep.name}</option>`
  ).join('');

  handleEndpointSelect(API_ENDPOINTS[0].id);
  handleWebhookPreset(WEBHOOK_PRESETS[0].id);
}

function handleEndpointSelect(endpointId) {
  const ep = API_ENDPOINTS.find((e) => e.id === endpointId) || API_ENDPOINTS[0];
  activeEndpoint = ep;

  const displayEl = document.getElementById('runnerEndpointDisplay');
  const payloadInput = document.getElementById('runnerPayloadInput');
  const statusBadge = document.getElementById('runnerStatusBadge');
  const latencyBadge = document.getElementById('runnerLatencyBadge');
  const consoleEl = document.getElementById('runnerOutputConsole');

  if (displayEl) displayEl.textContent = `${ep.method} ${ep.path}`;
  if (payloadInput) {
    payloadInput.value = ep.payload ? JSON.stringify(ep.payload, null, 2) : '// No request body required for GET requests.';
    payloadInput.disabled = ep.method === 'GET';
  }
  if (statusBadge) statusBadge.style.display = 'none';
  if (latencyBadge) latencyBadge.style.display = 'none';
  if (consoleEl) {
    consoleEl.textContent = `// Selected: ${ep.name}\n// ${ep.desc}\n// Targeting: ${API_GATEWAY_URL}${ep.path}\n\nClick "Send Request to API Gateway" to execute across origins...`;
  }

  updateCodeSnippets();
}

function resetCurrentPayload() {
  handleEndpointSelect(activeEndpoint.id);
  showToast('Reset request payload to default');
}

function updateCodeSnippets() {
  let parsedPayload = null;
  const inputEl = document.getElementById('runnerPayloadInput');
  if (activeEndpoint.method !== 'GET' && inputEl && inputEl.value) {
    try {
      parsedPayload = JSON.parse(inputEl.value);
    } catch (e) {
      parsedPayload = activeEndpoint.payload;
    }
  }

  const snippets = generateCodeSnippets(activeEndpoint, parsedPayload);
  const codePre = document.getElementById('codeSnippetPre');
  if (!codePre) return;

  if (currentSnippetLang === 'curl') codePre.textContent = snippets.curl;
  else if (currentSnippetLang === 'node') codePre.textContent = snippets.nodeTs;
  else if (currentSnippetLang === 'python') codePre.textContent = snippets.python;
  else if (currentSnippetLang === 'dart') codePre.textContent = snippets.dart;
}

function switchCodeTab(lang) {
  currentSnippetLang = lang;
  document.querySelectorAll('.code-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang));
  });
  updateCodeSnippets();
}

function copyCurrentSnippet() {
  const codePre = document.getElementById('codeSnippetPre');
  if (!codePre) return;
  navigator.clipboard.writeText(codePre.textContent).then(() => {
    showToast('Copied code snippet to clipboard!');
  });
}

async function executeLiveApiCall() {
  const payloadInput = document.getElementById('runnerPayloadInput');
  const consoleEl = document.getElementById('runnerOutputConsole');
  const statusBadge = document.getElementById('runnerStatusBadge');
  const latencyBadge = document.getElementById('runnerLatencyBadge');
  const execBtn = document.getElementById('executeApiBtn');

  let body = null;
  if (activeEndpoint.method !== 'GET') {
    try {
      body = JSON.parse(payloadInput.value);
    } catch (err) {
      showToast('Invalid JSON in request payload');
      if (consoleEl) consoleEl.textContent = `Error: Invalid JSON payload format.\n${err.message}`;
      return;
    }
  }

  if (execBtn) {
    execBtn.disabled = true;
    execBtn.textContent = 'Executing...';
  }

  const fullUrl = `${API_GATEWAY_URL}${activeEndpoint.path}`;
  if (consoleEl) {
    consoleEl.textContent = `// Dispatching ${activeEndpoint.method} ${fullUrl}...\n// Awaiting low-latency response from production cluster...`;
  }

  const startTime = performance.now();
  try {
    const fetchOptions = {
      method: activeEndpoint.method,
      headers: {
        'Accept': 'application/json',
      },
    };
    if (body) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(fullUrl, fetchOptions);
    const duration = Math.round(performance.now() - startTime);

    if (latencyBadge) {
      latencyBadge.textContent = `${duration} ms`;
      latencyBadge.style.display = 'inline-block';
    }

    if (statusBadge) {
      statusBadge.textContent = `${res.status} ${res.statusText || (res.ok ? 'OK' : 'Error')}`;
      statusBadge.className = `tag ${res.ok ? 'is-ok' : 'is-error'}`;
      statusBadge.style.display = 'inline-block';
    }

    // Capture response headers for glass-box transparency
    const headerLines = [];
    const importantHeaders = ['content-type', 'access-control-allow-origin', 'ratelimit-remaining', 'x-render-origin-server'];
    importantHeaders.forEach((h) => {
      const val = res.headers.get(h);
      if (val) headerLines.push(`// Header: ${h}: ${val}`);
    });

    const data = await res.json();
    lastSuccessfulApiResponse = data;

    const outputText = [
      `// HTTP/${res.status} ${res.statusText} (${duration}ms)`,
      headerLines.join('\n'),
      '',
      JSON.stringify(data, null, 2),
    ]
      .filter(Boolean)
      .join('\n');

    if (consoleEl) consoleEl.textContent = outputText;
    showToast(`${activeEndpoint.path} returned HTTP ${res.status} (${duration}ms)`);
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    if (statusBadge) {
      statusBadge.textContent = 'CORS / Network Error';
      statusBadge.className = 'tag is-error';
      statusBadge.style.display = 'inline-block';
    }
    if (consoleEl) {
      consoleEl.textContent = `// Network or CORS Interruption (${duration}ms)\n// Error: ${err.message}\n\nVerify that the API Gateway at ${API_GATEWAY_URL} is online.`;
    }
    showToast(`Request failed: ${err.message}`);
  } finally {
    if (execBtn) {
      execBtn.disabled = false;
      execBtn.textContent = 'Send request to API gateway';
    }
  }
}

// Webhook Tester
function handleWebhookPreset(presetId) {
  const preset = WEBHOOK_PRESETS.find((p) => p.id === presetId) || WEBHOOK_PRESETS[0];
  generateWebhookSignature(preset);
}

async function generateWebhookSignature(presetOverride) {
  const secretInput = document.getElementById('webhookSecretInput');
  const eventSelect = document.getElementById('webhookEventSelect');
  const displayEl = document.getElementById('webhookSigDisplay');

  const preset = presetOverride || WEBHOOK_PRESETS.find((p) => p.id === eventSelect?.value) || WEBHOOK_PRESETS[0];
  const secret = secretInput?.value || 'whsec_dangling_dice_live_secret_2026';
  const payloadStr = JSON.stringify(preset.payload);

  try {
    const hex = await computeHmacSha256(secret, payloadStr);
    if (displayEl) {
      displayEl.innerHTML = `<span class="muted">X-Signature-SHA256:</span> sha256=${hex}`;
    }
  } catch (err) {
    if (displayEl) displayEl.textContent = 'Error computing HMAC signature';
  }
}

// ============================================================================
// 2. Data & Types Studio: JSON-to-Types, Regex, & JWT
// ============================================================================
function initDataTypesStudio() {
  loadSampleConverterJson();
  runRegexEvaluation();
  loadSampleJwtToken();
}

function loadSampleConverterJson() {
  const inputEl = document.getElementById('converterJsonInput');
  if (!inputEl) return;

  const sample = lastSuccessfulApiResponse || {
    userId: 'usr_9021',
    username: 'dice_master',
    profile: {
      avatarUrl: 'https://dangling-dice-studios.com/images/logo.png',
      isVerified: true,
      subscriptionPlan: 'PRO',
      creditsRemaining: 4500,
    },
    roles: ['creator', 'developer'],
    recentOrders: [
      { id: 'ord_1', total: 25.0, status: 'completed' },
      { id: 'ord_2', total: 49.99, status: 'pending' },
    ],
  };

  inputEl.value = JSON.stringify(sample, null, 2);
  runJsonConversion();
}

function runJsonConversion() {
  const inputEl = document.getElementById('converterJsonInput');
  const outputPre = document.getElementById('converterOutputPre');
  if (!inputEl || !outputPre) return;

  let parsed;
  try {
    parsed = JSON.parse(inputEl.value);
  } catch (err) {
    outputPre.textContent = `// Invalid JSON Syntax:\n// ${err.message}`;
    return;
  }

  let result = '';
  if (currentTargetType === 'ts') result = jsonToTypescript(parsed, 'RootModel');
  else if (currentTargetType === 'dart') result = jsonToDart(parsed, 'RootModel');
  else if (currentTargetType === 'pydantic') result = jsonToPydantic(parsed, 'RootModel');

  outputPre.textContent = result;
}

function switchTargetType(type) {
  currentTargetType = type;
  document.getElementById('btnTsType')?.classList.toggle('active', type === 'ts');
  document.getElementById('btnDartType')?.classList.toggle('active', type === 'dart');
  document.getElementById('btnPydanticType')?.classList.toggle('active', type === 'pydantic');
  runJsonConversion();
}

function copyGeneratedModel() {
  const pre = document.getElementById('converterOutputPre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    showToast('Copied model code to clipboard!');
  });
}

function runRegexEvaluation() {
  const patternInput = document.getElementById('regexPatternInput');
  const flagsInput = document.getElementById('regexFlagsInput');
  const testInput = document.getElementById('regexTestString');
  const alertEl = document.getElementById('regexRedosAlert');
  const outputEl = document.getElementById('regexMatchesOutput');

  if (!patternInput || !testInput || !outputEl) return;

  const result = analyzeRegex(patternInput.value, flagsInput?.value || 'g', testInput.value);

  if (alertEl) {
    alertEl.classList.toggle('is-error', Boolean(result.isRedosVulnerable));
    alertEl.classList.toggle('is-ok', !result.isRedosVulnerable);
    alertEl.textContent = result.isRedosVulnerable
      ? result.redosReason
      : 'ReDoS check: safe linear matching complexity O(n).';
  }

  if (!result.valid) {
    outputEl.textContent = `Regex Syntax Error: ${result.error}`;
    return;
  }

  if (result.matches.length === 0) {
    outputEl.textContent = '// Zero matches found for this pattern on the test string.';
    return;
  }

  outputEl.textContent = result.matches
    .map(
      (m, i) =>
        `Match #${i + 1} at index [${m.index}]: "${m.match}"${
          m.groups.length > 0 ? ` — Groups: ${JSON.stringify(m.groups)}` : ''
        }`
    )
    .join('\n');
}

function loadSampleJwtToken() {
  const area = document.getElementById('jwtInputArea');
  if (!area) return;

  // Realistic sample Bearer token
  const sampleToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTA0MiIsIm5hbWUiOiJKYWNvYiBZYW5jZXkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTQyNDAwMDAsImV4cCI6MTc5NDI4MzIwMCwiaXNzIjoiZGFuZ2xpbmctZGljZS1zdHVkaW9zIn0.4g7J9lK2M4P6R8T0V2X4Z6B8D0F2H4J6L8N0P2R4T6V';
  area.value = sampleToken;
  runJwtDecode();
}

function runJwtDecode() {
  const area = document.getElementById('jwtInputArea');
  const display = document.getElementById('jwtColorDisplay');
  if (!area || !display) return;

  const result = decodeJwt(area.value);
  if (!result.valid) {
    display.innerHTML = `<div class="jwt-error">${escapeHtml(String(result.error))}</div>`;
    return;
  }

  // Pasted tokens are attacker-controllable: always escape decoded content before rendering
  display.innerHTML = `
    <div class="jwt-segment jwt-header">
      <div class="readout-label">1. Header (algorithm &amp; token type)</div>
      <pre>${escapeHtml(JSON.stringify(result.header, null, 2))}</pre>
    </div>
    <div class="jwt-segment jwt-payload">
      <div class="readout-label">2. Payload (claims &amp; expiration) — ${escapeHtml(String(result.expRelative))}</div>
      <pre>${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>
    </div>
    <div class="jwt-segment jwt-signature">
      <div class="readout-label">3. Signature</div>
      <div class="jwt-sig">HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)</div>
    </div>
  `;
}

// ============================================================================
// 3. System Sandbox: Rate Limiter, CRON, & HTTP Matrix
// ============================================================================
function initSystemSandbox() {
  renderHttpStatusMatrix();
  runCronTranslation();
  updateBucketUI();
  // Animation ticker for token bucket
  setInterval(() => {
    tokenBucket.refill();
    updateBucketUI();
  }, 500);
}

function handleBucketConfig() {
  const cap = parseInt(document.getElementById('bucketCapRange')?.value, 10) || 10;
  const rate = parseInt(document.getElementById('bucketRateRange')?.value, 10) || 2;

  tokenBucket.capacity = cap;
  tokenBucket.refillRate = rate;

  document.getElementById('bucketCapDisplay').textContent = `${cap} tokens`;
  document.getElementById('bucketRateDisplay').textContent = `${rate} tokens / sec`;
  updateBucketUI();
}

function triggerBucketRequest(count = 1) {
  for (let i = 0; i < count; i++) {
    tokenBucket.sendRequest();
  }
  updateBucketUI();
  renderBucketLogs();
}

function updateBucketUI() {
  const fill = document.getElementById('bucketWaterFill');
  const label = document.getElementById('bucketWaterLabel');
  if (!fill || !label) return;

  const pct = Math.max(0, Math.min(100, (tokenBucket.tokens / tokenBucket.capacity) * 100));
  fill.style.height = `${pct}%`;
  label.textContent = `${Math.floor(tokenBucket.tokens)} / ${tokenBucket.capacity} Tokens`;

  fill.classList.toggle('is-low', pct < 15);
}

function renderBucketLogs() {
  const consoleEl = document.getElementById('bucketLogConsole');
  if (!consoleEl) return;

  consoleEl.innerHTML = tokenBucket.history
    .map(
      (h) => `
      <div class="${h.allowed ? 'log-ok' : 'log-error'}">[${h.timestamp}] ${escapeHtml(String(h.message))} (Remaining: ${h.tokensLeft})</div>
    `
    )
    .join('');
}

function runCronTranslation() {
  const inputEl = document.getElementById('cronExpressionInput');
  const descEl = document.getElementById('cronEnglishDesc');
  const listEl = document.getElementById('cronNextRunsList');
  if (!inputEl || !descEl || !listEl) return;

  const res = translateCron(inputEl.value);
  descEl.textContent = res.english;

  if (res.valid && res.nextRuns) {
    listEl.innerHTML = res.nextRuns.map((r, i) => `<li>Run #${i + 1}: ${escapeHtml(String(r))}</li>`).join('');
  } else {
    listEl.innerHTML = '<li class="is-error">Invalid cron format</li>';
  }
}

function setCronPreset(presetStr) {
  const inputEl = document.getElementById('cronExpressionInput');
  if (inputEl) inputEl.value = presetStr;
  runCronTranslation();
}

function renderHttpStatusMatrix() {
  const grid = document.getElementById('httpStatusGrid');
  if (!grid) return;

  const statusCards = HTTP_STATUS_CATALOG.map(
    (item) => `
      <div class="http-card">
        <span class="tag is-${item.type}">${item.title}</span>
        <p>${item.rule}</p>
      </div>
    `
  ).join('');

  grid.innerHTML = statusCards;
}

// ============================================================================
// 4. Community Showcase & Cloud Tooling
// ============================================================================
async function loadAffiliates() {
  const grid = document.getElementById('affiliatesGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/affiliates');
    if (!res.ok) return;
    const partners = await res.json();
    if (!Array.isArray(partners)) return;

    grid.innerHTML = partners
      .map(
        (p) => `
        <article class="card item-card">
          <span class="tag">${escapeHtml(p.badge || 'Cloud infrastructure')}</span>
          <h3 class="item-title">${escapeHtml(p.name)}</h3>
          <p class="item-desc">${escapeHtml(p.description || '')}</p>
          <div class="item-foot">
            <span>${escapeHtml(p.perk || 'Verified partner')}</span>
            <a href="${escapeHtml(safeHttpUrl(p.url))}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">
              Explore${icon('external-link')}<span class="sr-only"> ${escapeHtml(p.name)} (opens in a new tab)</span>
            </a>
          </div>
        </article>
      `
      )
      .join('');
  } catch (e) {}
}

async function loadShowcase() {
  const grid = document.getElementById('showcaseGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/showcase');
    const apps = await res.json();
    if (!Array.isArray(apps) || apps.length === 0) return;

    grid.innerHTML = apps
      .map(
        (app) => `
        <article class="card item-card">
          <span class="tag">${escapeHtml(app.category || 'Community project')}</span>
          <h3 class="item-title">${escapeHtml(app.title)}</h3>
          <p class="item-desc">${escapeHtml(app.description || '')}</p>
          <div class="item-foot">
            <span class="muted">by <strong class="ink">${escapeHtml(app.author || 'Anonymous')}</strong></span>
            <span class="button-row">
              ${app.repoUrl ? `<a href="${escapeHtml(safeHttpUrl(app.repoUrl))}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">Repo<span class="sr-only"> (opens in a new tab)</span></a>` : ''}
              ${app.url ? `<a href="${escapeHtml(safeHttpUrl(app.url))}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Visit${icon('external-link')}<span class="sr-only"> (opens in a new tab)</span></a>` : ''}
            </span>
          </div>
        </article>
      `
      )
      .join('');
  } catch (err) {}
}

// Only http(s) links from API data may become hrefs (blocks javascript: URLs in community submissions)
function safeHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '')) ? String(url) : '#';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function setupModal() {
  const modal = document.getElementById('submitModal');
  const openBtn = document.getElementById('openSubmitModalBtn');
  const closeBtn = document.getElementById('closeSubmitModalBtn');
  const cancelBtn = document.getElementById('cancelSubmitBtn');
  const form = document.getElementById('submitAppForm');

  const open = () => {
    modal.style.display = 'flex';
    document.getElementById('appTitle')?.focus();
  };
  const close = () => {
    modal.style.display = 'none';
    openBtn?.focus();
  };
  if (openBtn) openBtn.onclick = open;
  if (closeBtn) closeBtn.onclick = close;
  if (cancelBtn) cancelBtn.onclick = close;

  window.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') close();
  });

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('appTitle').value.trim();
      const author = document.getElementById('appAuthor').value.trim();
      const description = document.getElementById('appDesc').value.trim();
      const category = document.getElementById('appCategory').value;
      const url = document.getElementById('appUrl').value.trim();
      const repoUrl = document.getElementById('appRepo').value.trim();
      const tagsStr = document.getElementById('appTags').value.trim();
      const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const turnstileToken = document.querySelector('#submitAppForm [name="cf-turnstile-response"]')?.value || '';

      try {
        const res = await fetch('/api/showcase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            author,
            description,
            category,
            url,
            repoUrl,
            tags,
            'cf-turnstile-response': turnstileToken,
          }),
        });

        if (res.ok) {
          showToast('Project submitted successfully! It will appear after review.');
          form.reset();
          modal.style.display = 'none';
          loadShowcase();
        } else {
          showToast('Failed to submit project. Please try again.');
        }
      } catch (err) {
        showToast('Error submitting project.');
      }
    };
  }
}

// ============================================================================
// SECTION 5: API KEYS & STRIPE BILLING
// ============================================================================
function renderActiveKey(keyDoc) {
  const box = document.getElementById('keyDisplayBox');
  const keyString = document.getElementById('activeKeyString');
  const badge = document.getElementById('activeKeyTierBadge');
  const usage = document.getElementById('keyQuotaUsage');
  const rate = document.getElementById('keyRateLimit');

  if (!box || !keyString || !keyDoc) return;

  box.style.display = 'block';
  keyString.textContent = keyDoc.key || keyDoc.apiKey;

  const tier = (keyDoc.tier || 'free').toUpperCase();
  if (badge) {
    badge.textContent = `${tier} TIER`;
    const tierClass = tier === 'PRO' ? 'tier-pro' : tier === 'ULTRA' || tier === 'ENTERPRISE' ? 'tier-ultra' : 'tier-free';
    badge.className = `tag ${tierClass}`;
  }

  const reqUsed = keyDoc.requestsThisMonth || 0;
  const quota = keyDoc.monthlyQuota ? Number(keyDoc.monthlyQuota).toLocaleString() : '100';
  if (usage) usage.textContent = `Usage: ${reqUsed} / ${quota} requests this month`;
  if (rate) rate.textContent = `Burst: ${keyDoc.rateLimitPerMin || 60} req/min`;
}

async function handleGenerateFreeKey() {
  const emailInput = document.getElementById('devKeyEmailInput');
  const email = (emailInput?.value || '').trim();

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid developer email address.');
    emailInput?.focus();
    return;
  }

  try {
    const res = await fetch(`${API_GATEWAY_URL}/v1/auth/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerEmail: email,
        name: 'Dashboard Free Key',
        tier: 'free',
      }),
    });

    const json = await res.json();
    if (json.success && json.data) {
      localStorage.setItem('dds_developer_key', json.data.apiKey);
      localStorage.setItem('dds_developer_email', email);
      renderActiveKey(json.data);
      showToast('API Key generated successfully! (100 free requests/mo)');
    } else {
      showToast(json.message || 'Error generating API key.');
    }
  } catch (err) {
    showToast(`Gateway connection error: ${err.message}`);
  }
}

function copyActiveKey() {
  const keyEl = document.getElementById('activeKeyString');
  if (!keyEl || !keyEl.textContent) return;
  navigator.clipboard.writeText(keyEl.textContent.trim()).then(() => {
    showToast('Copied API Key to clipboard!');
  });
}

async function handleStripeCheckout(tier = 'pro') {
  const emailInput = document.getElementById('devKeyEmailInput');
  let email = (emailInput?.value || localStorage.getItem('dds_developer_email') || '').trim();

  if (!email || !email.includes('@')) {
    email = prompt('Enter your developer email to associate your subscription:') || '';
    if (!email || !email.includes('@')) {
      showToast('A valid email is required to initiate Stripe checkout.');
      return;
    }
    if (emailInput) emailInput.value = email;
    localStorage.setItem('dds_developer_email', email);
  }

  const currentKey = localStorage.getItem('dds_developer_key') || undefined;

  showToast(`Initiating secure Stripe Checkout for ${tier.toUpperCase()} tier...`);

  try {
    const res = await fetch(`${API_GATEWAY_URL}/api/checkout/create-api-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: email,
        tier,
        apiKey: currentKey,
      }),
    });

    const json = await res.json();
    if (json.success && json.data?.checkoutUrl) {
      if (json.data.apiKey) {
        localStorage.setItem('dds_developer_key', json.data.apiKey);
      }
      window.location.href = json.data.checkoutUrl;
    } else {
      showToast(json.message || 'Failed to create checkout session.');
    }
  } catch (err) {
    showToast(`Checkout initialization error: ${err.message}`);
  }
}

async function initBillingStudio() {
  const savedEmail = localStorage.getItem('dds_developer_email');
  const savedKey = localStorage.getItem('dds_developer_key');

  const emailInput = document.getElementById('devKeyEmailInput');
  if (emailInput && savedEmail) {
    emailInput.value = savedEmail;
  }

  // Handle post-checkout redirect return: #billingSuccess?session_id=...&key=...
  const hash = window.location.hash || '';
  if (hash.includes('billingSuccess')) {
    showToast('Stripe payment confirmed. Your API key quota has been upgraded.');
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const upgradedKey = params.get('key');
    if (upgradedKey) {
      localStorage.setItem('dds_developer_key', upgradedKey);
    }
    window.switchDevSection('billing');
  }

  const keyToLookup = savedKey || (new URLSearchParams(window.location.search)).get('key');
  if (keyToLookup) {
    try {
      const res = await fetch(`${API_GATEWAY_URL}/v1/auth/keys/${encodeURIComponent(keyToLookup)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          renderActiveKey(json.data);
        }
      }
    } catch {
      // offline or unseeded
    }
  }
}

// Stripe-hosted portal login: Stripe emails the customer a one-time code, so only the
// owner of the email can reach their invoices, cards, and subscriptions.
const STRIPE_PORTAL_LOGIN_URL = 'https://billing.stripe.com/p/login/eVqfZj0MAgPa0ibezd5ZC00';

function openStripeCustomerPortal() {
  const emailInput = document.getElementById('devKeyEmailInput');
  const email = (emailInput?.value || localStorage.getItem('dds_developer_email') || '').trim();
  const url = new URL(STRIPE_PORTAL_LOGIN_URL);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    url.searchParams.set('prefilled_email', email.toLowerCase());
  }
  showToast('Opening Stripe Billing Portal — check your email for the sign-in code.');
  window.location.href = url.toString();
}

// Global Exports for HTML Onclicks
window.switchDevSection = switchDevSection;
window.handleEndpointSelect = handleEndpointSelect;
window.resetCurrentPayload = resetCurrentPayload;
window.executeLiveApiCall = executeLiveApiCall;
window.switchCodeTab = switchCodeTab;
window.copyCurrentSnippet = copyCurrentSnippet;
window.handleWebhookPreset = handleWebhookPreset;
window.generateWebhookSignature = generateWebhookSignature;
window.loadSampleConverterJson = loadSampleConverterJson;
window.runJsonConversion = runJsonConversion;
window.switchTargetType = switchTargetType;
window.copyGeneratedModel = copyGeneratedModel;
window.runRegexEvaluation = runRegexEvaluation;
window.loadSampleJwtToken = loadSampleJwtToken;
window.runJwtDecode = runJwtDecode;
window.handleBucketConfig = handleBucketConfig;
window.triggerBucketRequest = triggerBucketRequest;
window.runCronTranslation = runCronTranslation;
window.setCronPreset = setCronPreset;
window.handleGenerateFreeKey = handleGenerateFreeKey;
window.copyActiveKey = copyActiveKey;
window.handleStripeCheckout = handleStripeCheckout;
window.openStripeCustomerPortal = openStripeCustomerPortal;

function initRailwaySandboxUI() {
  const runBtn = document.getElementById('runRailwaySandboxBtn');
  const clearBtn = document.getElementById('clearSandboxTerminalBtn');
  const presetSelect = document.getElementById('sandboxPresetSelect');
  const terminal = document.getElementById('sandboxTerminalOutput');
  if (!runBtn || !terminal) return;

  clearBtn?.addEventListener('click', () => {
    terminal.textContent = '';
  });

  runBtn.addEventListener('click', async () => {
    const preset = presetSelect?.value || 'provably_fair';
    runBtn.disabled = true;
    runBtn.innerHTML = `${icon('loader-circle')} Executing in microVM...`;
    terminal.textContent = `[Sandbox Gateway] Requesting ephemeral Railway microVM for preset '${preset}'...\n`;

    // Staff token is never bundled into public JS. Staff paste it once per tab session.
    let staffToken = sessionStorage.getItem('dds_staff_token') || '';
    if (!staffToken) {
      staffToken = (prompt('Enter staff sandbox token:') || '').trim();
      if (!staffToken) {
        terminal.textContent += '\nStaff token required to run sandboxes.';
        runBtn.disabled = false;
        runBtn.innerHTML = `${icon('play')} Run in Railway sandbox`;
        return;
      }
      sessionStorage.setItem('dds_staff_token', staffToken);
    }

    try {
      const res = await fetch('/api/ui/sandbox/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-token': staffToken,
        },
        body: JSON.stringify({ preset }),
      });
      if (res.status === 403) sessionStorage.removeItem('dds_staff_token');

      const data = await res.json();
      if (data.success) {
        terminal.textContent = data.output + `\n\n[Stats] Container: ${data.sandboxId} | Boot: ${data.bootMs}ms | Exec: ${data.execMs}ms | Mem: ${data.memoryUsedMb}`;
        if (typeof showToast === 'function') {
          showToast(`Sandbox microVM executed (${data.execMs}ms)`);
        }
      } else {
        terminal.textContent += `\nError: ${data.error || 'Sandbox run failed.'}`;
      }
    } catch (err) {
      terminal.textContent += `\nGateway network error: ${err.message}`;
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = `${icon('play')} Run in Railway sandbox`;
    }
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  hydrateIcons();
  initTabKeyboard();
  initHeroConsole();
  initApiStudio();
  initDataTypesStudio();
  initSystemSandbox();
  initBillingStudio();
  loadAffiliates();
  loadShowcase();
  setupModal();
  initStudioShell();
  initStaffCommandPalette();
  initRailwaySandboxUI();
});
