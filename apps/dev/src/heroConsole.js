// ============================================================================
// Dev hero: live gateway console (right column of the split hero)
// Reuses the API Studio presets so the hero and the full runner never drift.
// Measures real latency against the production gateway instead of quoting a number.
// ============================================================================
import { API_GATEWAY_URL, API_ENDPOINTS } from './apiStudio.js';

const MAX_LINES = 18;

function truncate(text) {
  const lines = text.split('\n');
  return lines.length > MAX_LINES ? `${lines.slice(0, MAX_LINES).join('\n')}\n// … ${lines.length - MAX_LINES} more lines (open the API studio for the full response)` : text;
}

function setState(el, state) {
  el.classList.remove('is-ok', 'is-error', 'is-pending');
  if (state) el.classList.add(state);
}

async function checkHealth(statusEl) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${API_GATEWAY_URL}/v1/health`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    const ms = Math.round(performance.now() - t0);
    const data = await res.json().catch(() => ({}));
    const healthy = res.ok && data.status === 'healthy';
    setState(statusEl, healthy ? 'is-ok' : 'is-error');
    const engines = Array.isArray(data.engines) ? `, ${data.engines.length} engines` : '';
    statusEl.textContent = healthy ? `Online · ${ms} ms${engines}` : `Degraded (HTTP ${res.status})`;
  } catch {
    setState(statusEl, 'is-error');
    statusEl.textContent = 'Unreachable';
  }
}

export function initHeroConsole() {
  const statusEl = document.getElementById('heroGatewayStatus');
  const requestLine = document.getElementById('heroRequestLine');
  const codeEl = document.getElementById('heroStatusCode');
  const latencyEl = document.getElementById('heroLatency');
  const output = document.getElementById('heroResponse');
  const sendBtn = document.getElementById('heroSendBtn');
  const presetBtns = [...document.querySelectorAll('[data-hero-preset]')];
  if (!statusEl || !output || !sendBtn || presetBtns.length === 0) return;

  let preset = API_ENDPOINTS.find((e) => e.id === presetBtns[0].dataset.heroPreset);
  let inFlight = false;

  const selectPreset = (id) => {
    const next = API_ENDPOINTS.find((e) => e.id === id);
    if (!next) return;
    preset = next;
    presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.heroPreset === id)));
    requestLine.textContent = `${preset.method} ${preset.path}`;
    codeEl.textContent = '—';
    latencyEl.textContent = '—';
    setState(codeEl, null);
    output.textContent = preset.payload ? `// Request body\n${JSON.stringify(preset.payload, null, 2)}` : '// No request body (GET)';
  };

  const send = async () => {
    if (inFlight || !preset) return;
    inFlight = true;
    sendBtn.disabled = true;
    output.textContent = `// ${preset.method} ${API_GATEWAY_URL}${preset.path}\n// Waiting for the gateway…`;
    const t0 = performance.now();
    try {
      const res = await fetch(`${API_GATEWAY_URL}${preset.path}`, {
        method: preset.method,
        headers: preset.payload ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: preset.payload ? JSON.stringify(preset.payload) : undefined,
        signal: AbortSignal.timeout(10000),
      });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* non-JSON body */ }
      codeEl.textContent = String(res.status);
      setState(codeEl, res.ok ? 'is-ok' : 'is-error');
      latencyEl.textContent = `${ms} ms`;
      output.textContent = truncate(pretty); // textContent: response is data, never HTML
    } catch (err) {
      codeEl.textContent = 'ERR';
      setState(codeEl, 'is-error');
      latencyEl.textContent = `${Math.round(performance.now() - t0)} ms`;
      output.textContent = `// Network or CORS error: ${err.message}`;
    } finally {
      inFlight = false;
      sendBtn.disabled = false;
    }
  };

  presetBtns.forEach((b) => b.addEventListener('click', () => selectPreset(b.dataset.heroPreset)));
  sendBtn.addEventListener('click', send);
  selectPreset(preset.id);
  checkHealth(statusEl);
}
