import './style.css';
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
  };

  const buttons = {
    apiStudio: document.getElementById('hubApiStudioBtn'),
    dataTypes: document.getElementById('hubDataTypesBtn'),
    systemSim: document.getElementById('hubSystemSimBtn'),
    showcase: document.getElementById('hubShowcaseBtn'),
  };

  Object.entries(sections).forEach(([key, el]) => {
    if (el) el.style.display = key === sectionId ? 'block' : 'none';
  });

  Object.entries(buttons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle('active', key === sectionId);
  });

  if (sectionId === 'showcase') {
    const tooling = document.getElementById('tooling');
    if (tooling) tooling.style.display = 'block';
  }
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
      statusBadge.className = `glass-badge ${res.ok ? 'badge-status-ok' : 'badge-status-err'}`;
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
    showToast(`✅ ${activeEndpoint.path} returned HTTP ${res.status} (${duration}ms)`);
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    if (statusBadge) {
      statusBadge.textContent = 'CORS / Network Error';
      statusBadge.className = 'glass-badge badge-status-err';
      statusBadge.style.display = 'inline-block';
    }
    if (consoleEl) {
      consoleEl.textContent = `// Network or CORS Interruption (${duration}ms)\n// Error: ${err.message}\n\nVerify that the API Gateway at ${API_GATEWAY_URL} is online.`;
    }
    showToast(`Request failed: ${err.message}`);
  } finally {
    if (execBtn) {
      execBtn.disabled = false;
      execBtn.textContent = '▶ Send Request to API Gateway';
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
      displayEl.innerHTML = `<span style="color: #94a3b8;">X-Signature-SHA256:</span> sha256=${hex}`;
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
    if (result.isRedosVulnerable) {
      alertEl.style.background = 'rgba(239, 68, 68, 0.15)';
      alertEl.style.borderColor = '#ef4444';
      alertEl.style.color = '#f87171';
      alertEl.textContent = result.redosReason;
    } else {
      alertEl.style.background = 'rgba(16, 185, 129, 0.1)';
      alertEl.style.borderColor = '#10b981';
      alertEl.style.color = '#34d399';
      alertEl.textContent = '🟢 ReDoS Check: Safe linear matching complexity O(n).';
    }
  }

  if (!result.valid) {
    outputEl.textContent = `Regex Syntax Error: ${result.error}`;
    return;
  }

  if (result.matches.length === 0) {
    outputEl.textContent = '// Zero matches found for this pattern on the test string.';
    return;
  }

  outputEl.innerHTML = result.matches
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
    display.innerHTML = `<div style="color: #ef4444; font-size: 0.82rem; font-family: monospace;">${result.error}</div>`;
    return;
  }

  display.innerHTML = `
    <div class="jwt-segment-box jwt-header-box">
      <div class="jwt-seg-title" style="color: #f87171;">1. Header (Algorithm &amp; Token Type)</div>
      <pre style="font-family: monospace; font-size: 0.8rem; color: #fca5a5; margin: 0;">${JSON.stringify(
        result.header,
        null,
        2
      )}</pre>
    </div>
    <div class="jwt-segment-box jwt-payload-box">
      <div class="jwt-seg-title" style="color: #c084fc;">2. Payload (Claims &amp; Expiration) — ${result.expRelative}</div>
      <pre style="font-family: monospace; font-size: 0.8rem; color: #e9d5ff; margin: 0;">${JSON.stringify(
        result.payload,
        null,
        2
      )}</pre>
    </div>
    <div class="jwt-segment-box jwt-sig-box">
      <div class="jwt-seg-title" style="color: #22d3ee;">3. Signature</div>
      <div style="font-family: monospace; font-size: 0.8rem; color: #67e8f9; word-break: break-all;">
        HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
      </div>
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

  if (pct < 15) {
    fill.style.background = 'linear-gradient(180deg, #ef4444, #b91c1c)';
  } else {
    fill.style.background = 'linear-gradient(180deg, rgba(6, 182, 212, 0.8), rgba(59, 130, 246, 0.9))';
  }
}

function renderBucketLogs() {
  const consoleEl = document.getElementById('bucketLogConsole');
  if (!consoleEl) return;

  consoleEl.innerHTML = tokenBucket.history
    .map(
      (h) => `
      <div style="color: ${h.allowed ? '#34d399' : '#f87171'}; padding: 2px 0;">
        [${h.timestamp}] ${h.message} (Remaining: ${h.tokensLeft})
      </div>
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
    listEl.innerHTML = res.nextRuns.map((r, i) => `<li>• Run #${i + 1}: ${r}</li>`).join('');
  } else {
    listEl.innerHTML = '<li style="color: #ef4444;">Invalid cron format</li>';
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

  const statusCards = HTTP_STATUS_CATALOG.map((item) => {
    let color = '#34d399';
    if (item.type === 'client_error') color = '#f87171';
    else if (item.type === 'server_error') color = '#f43f5e';
    else if (item.type === 'redirect') color = '#38bdf8';

    return `
      <div class="http-status-card">
        <span class="glass-badge" style="background: rgba(255,255,255,0.06); color: ${color};">${item.title}</span>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.5;">${item.rule}</p>
      </div>
    `;
  }).join('');

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
        <div class="showcase-card">
          <div>
            <span class="showcase-badge">${p.badge || 'Cloud Infrastructure'}</span>
            <h4 class="showcase-title">${p.name}</h4>
            <p class="showcase-desc">${p.description}</p>
          </div>
          <div class="showcase-footer">
            <span style="color: var(--neon-cyan); font-weight: 700;">${p.perk || 'Verified Partner'}</span>
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;">
              Explore ↗
            </a>
          </div>
        </div>
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
        <div class="showcase-card">
          <div>
            <span class="showcase-badge">${escapeHtml(app.category || 'Community Project')}</span>
            <h4 class="showcase-title">${escapeHtml(app.title)}</h4>
            <p class="showcase-desc">${escapeHtml(app.description || '')}</p>
          </div>
          <div class="showcase-footer">
            <span style="color: var(--text-muted);">by <strong style="color: #fff;">${escapeHtml(app.author || 'Anonymous')}</strong></span>
            <div style="display: flex; gap: 0.4rem;">
              ${app.repoUrl ? `<a href="${escapeHtml(app.repoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;">Repo</a>` : ''}
              ${app.url ? `<a href="${escapeHtml(app.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;">Visit ↗</a>` : ''}
            </div>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {}
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

  if (openBtn) openBtn.onclick = () => (modal.style.display = 'flex');
  if (closeBtn) closeBtn.onclick = () => (modal.style.display = 'none');
  if (cancelBtn) cancelBtn.onclick = () => (modal.style.display = 'none');

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
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

      try {
        const res = await fetch('/api/showcase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, author, description, category, url, repoUrl, tags }),
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initApiStudio();
  initDataTypesStudio();
  initSystemSandbox();
  loadAffiliates();
  loadShowcase();
  setupModal();
});
