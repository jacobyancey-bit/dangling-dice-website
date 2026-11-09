import './style.css';

const SANDBOX_PRESETS = {
  schema: {
    title: 'JSON & Schema Infer',
    endpoint: '/v1/schema/infer',
    payload: {
      rootName: 'UserAccount',
      jsonInput: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'creator@dangling-dice-studios.com',
        plan: 'PRO',
        credits: 2500,
        active: true,
      },
    },
  },
  geo: {
    title: 'GIS & Parcel Acreage',
    endpoint: '/v1/geo/parcel-metrics',
    payload: {
      coordinates: [
        [-86.7816, 36.1627],
        [-86.7796, 36.1627],
        [-86.7796, 36.1642],
        [-86.7816, 36.1642],
      ],
    },
  },
  privacy: {
    title: 'PII & Log Redactor',
    endpoint: '/v1/privacy/redact',
    payload: {
      mode: 'mask',
      text: 'Customer email is jacob@dangling-dice-studios.com, phone (615) 555-0199, SSN 123-45-6789.',
    },
  },
  finance: {
    title: 'Loan & Amortization',
    endpoint: '/v1/finance/amortization',
    payload: {
      principal: 250000,
      annualRatePercent: 6.25,
      termMonths: 360,
    },
  },
};

let activeTabKey = 'schema';

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'flex';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function selectTab(key) {
  if (!SANDBOX_PRESETS[key]) return;
  activeTabKey = key;

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === key);
  });

  const preset = SANDBOX_PRESETS[key];
  const endpointDisplay = document.getElementById('endpointDisplay');
  const inputEl = document.getElementById('sandboxInput');
  const latencyBadge = document.getElementById('latencyBadge');
  const outputEl = document.getElementById('sandboxOutput');

  if (endpointDisplay) endpointDisplay.textContent = `POST ${preset.endpoint}`;
  if (inputEl) inputEl.value = JSON.stringify(preset.payload, null, 2);
  if (latencyBadge) latencyBadge.style.display = 'none';
  if (outputEl) outputEl.textContent = `// Ready. Click "Run Compute Endpoint" to execute live request on ${preset.endpoint}...`;
}

async function runSandbox() {
  const preset = SANDBOX_PRESETS[activeTabKey];
  const inputEl = document.getElementById('sandboxInput');
  const outputEl = document.getElementById('sandboxOutput');
  const latencyBadge = document.getElementById('latencyBadge');
  const runBtn = document.getElementById('runEndpointBtn');

  let payload;
  try {
    payload = JSON.parse(inputEl.value);
  } catch (err) {
    showToast('Invalid JSON input syntax');
    if (outputEl) outputEl.textContent = `Error parsing JSON payload:\n${err.message}`;
    return;
  }

  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = 'Executing...';
  }
  if (outputEl) outputEl.textContent = '// Sending request to high-throughput compute cluster...';

  const startTime = performance.now();
  try {
    const res = await fetch(preset.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(1);

    const data = await res.json();
    if (latencyBadge) {
      latencyBadge.textContent = `${duration} ms [HTTP ${res.status}]`;
      latencyBadge.style.display = 'inline-block';
    }

    if (outputEl) {
      outputEl.textContent = JSON.stringify(data, null, 2);
    }
    showToast(`Execution finished in ${duration}ms`);
  } catch (err) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(1);
    if (latencyBadge) {
      latencyBadge.textContent = `${duration} ms [FAILED]`;
      latencyBadge.style.display = 'inline-block';
    }
    if (outputEl) {
      outputEl.textContent = `Request failed: ${err.message}`;
    }
    showToast('Request failed. Check network console.');
  } finally {
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = '▶ Run Compute Endpoint';
    }
  }
}

function copyOutput() {
  const outputEl = document.getElementById('sandboxOutput');
  if (!outputEl) return;
  navigator.clipboard.writeText(outputEl.textContent).then(() => {
    showToast('JSON output copied to clipboard!');
  });
}

function copyCurl() {
  const preset = SANDBOX_PRESETS[activeTabKey];
  const inputEl = document.getElementById('sandboxInput');
  const payloadStr = (inputEl ? inputEl.value : JSON.stringify(preset.payload)).replace(/\n\s*/g, '');
  const curlCmd = `curl -X POST https://dangling-dice-studios.com${preset.endpoint} \\\n  -H "Content-Type: application/json" \\\n  -d '${payloadStr}'`;
  
  navigator.clipboard.writeText(curlCmd).then(() => {
    showToast('cURL snippet copied to clipboard!');
  });
}

async function loadAffiliates() {
  const grid = document.getElementById('affiliatesGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/affiliates');
    if (!res.ok) throw new Error('Failed to load affiliates');
    const data = await res.json();
    const items = data.affiliates || data || [];

    if (items.length === 0) throw new Error('No items');

    grid.innerHTML = items
      .slice(0, 6)
      .map(
        (aff) => `
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">${escapeHtml(aff.category || 'Cloud')}</span>
          <h4 class="showcase-title">${escapeHtml(aff.name)}</h4>
          <p class="showcase-desc">${escapeHtml(aff.deal || aff.description || 'Verified partner perk for studio developers.')}</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--neon-emerald); font-weight: 700;">${escapeHtml(aff.perkCode || 'Verified Deal')}</span>
          <a href="/go/${encodeURIComponent(aff.slug || '')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
            Claim Perk ↗
          </a>
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">Compute & Hosting</span>
          <h4 class="showcase-title">Render Cloud Hosting</h4>
          <p class="showcase-desc">Zero-downtime microservices and monorepo static hosting with automated SSL and edge CDN.</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--neon-emerald); font-weight: 700;">Verified Host</span>
          <a href="https://render.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Explore ↗</a>
        </div>
      </div>
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">Domain & DNS</span>
          <h4 class="showcase-title">Namecheap DNS Engine</h4>
          <p class="showcase-desc">High-speed global Anycast DNS routing and instant CNAME subdomain propagation.</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--neon-emerald); font-weight: 700;">Verified DNS</span>
          <a href="https://namecheap.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Explore ↗</a>
        </div>
      </div>
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">Database Tier</span>
          <h4 class="showcase-title">MongoDB Atlas Cloud</h4>
          <p class="showcase-desc">Multi-region managed document database with end-to-end TLS encryption and automated failover.</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--neon-emerald); font-weight: 700;">Verified Database</span>
          <a href="https://mongodb.com" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Explore ↗</a>
        </div>
      </div>
    `;
  }
}

async function loadShowcase() {
  const grid = document.getElementById('showcaseGrid');
  if (!grid) return;

  try {
    const res = await fetch('/api/showcase');
    if (!res.ok) throw new Error('Showcase unavailable');
    const data = await res.json();
    const apps = data.apps || data || [];

    if (!Array.isArray(apps) || apps.length === 0) throw new Error('Empty');

    grid.innerHTML = apps
      .map(
        (app) => `
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">${escapeHtml(app.category || 'Community Project')}</span>
          <h4 class="showcase-title">${escapeHtml(app.title)}</h4>
          <p class="showcase-desc">${escapeHtml(app.description || '')}</p>
          ${
            Array.isArray(app.tags) && app.tags.length > 0
              ? `<div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                  ${app.tags.map((t) => `<span style="font-size: 0.68rem; padding: 0.15rem 0.45rem; border-radius: 4px; background: rgba(255,255,255,0.06); color: var(--text-muted);">${escapeHtml(t)}</span>`).join('')}
                </div>`
              : ''
          }
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
  } catch (err) {
    grid.innerHTML = `
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">Flagship Audio App</span>
          <h4 class="showcase-title">Dangling Beats Studio™</h4>
          <p class="showcase-desc">24/7 commercial-free lo-fi, trap, and synthwave producer radio designed for deep work flow state.</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--text-muted);">by <strong style="color: #fff;">Dangling Dice</strong></span>
          <a href="https://beats.dangling-dice-studios.com/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;">Launch ↗</a>
        </div>
      </div>
      <div class="showcase-card">
        <div>
          <span class="showcase-badge">Audio / Video Utility</span>
          <h4 class="showcase-title">Zero-Ad MP3 Transcoder</h4>
          <p class="showcase-desc">Clean 320kbps YouTube and audio stream extraction engine without tracking, popups, or subscriptions.</p>
        </div>
        <div class="showcase-footer">
          <span style="color: var(--text-muted);">by <strong style="color: #fff;">Dangling Dice</strong></span>
          <a href="https://media.dangling-dice-studios.com/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.72rem;">Launch ↗</a>
        </div>
      </div>
    `;
  }
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

document.addEventListener('DOMContentLoaded', () => {
  // Wire Tabs
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  });

  // Wire Sandbox Actions
  const runBtn = document.getElementById('runEndpointBtn');
  const resetBtn = document.getElementById('resetInputBtn');
  const copyCurlBtn = document.getElementById('copyCurlBtn');
  const copyOutputBtn = document.getElementById('copyOutputBtn');

  if (runBtn) runBtn.addEventListener('click', runSandbox);
  if (resetBtn) resetBtn.addEventListener('click', () => selectTab(activeTabKey));
  if (copyCurlBtn) copyCurlBtn.addEventListener('click', copyCurl);
  if (copyOutputBtn) copyOutputBtn.addEventListener('click', copyOutput);

  // Initial load
  selectTab('schema');
  loadAffiliates();
  loadShowcase();
  setupModal();
});

