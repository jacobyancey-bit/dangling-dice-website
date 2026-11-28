/**
 * Dangling Dice Gaming Lab™ — Application Logic
 */

import {
  initStaffCommandPalette,
  initPwaServiceWorker,
  initStudioShell,
  initTabKeyboard,
  icon,
  hydrateIcons,
} from '@dangling-dice/shared';
import { GAMES_CATALOG, ACCESSORIES_CATALOG, SOFTWARE_GUIDE, AUDIO_SETUPS } from './gameData.js';

// Swap <span data-icon> placeholders for stroke icons before any handlers run
hydrateIcons();

// Universal PWA Service Worker Registration
initPwaServiceWorker();

const API_GATEWAY_URL = (typeof window !== 'undefined' && window.location.hostname.includes('localhost'))
  ? 'http://localhost:5000'
  : 'https://api.dangling-dice-studios.com';

const DISCORD_URL = 'https://discord.gg/uFYMQahNZz';

// State
let selectedGameId = 'warzone';
let activeDashboardTab = 'audio';
let activeGearCategory = 'all';
let activeAudioSetupId = 'analog-35mm';

const currentGame = () => GAMES_CATALOG.find((g) => g.id === selectedGameId) || GAMES_CATALOG[0];
const findGame = (gameId) => GAMES_CATALOG.find((g) => g.id === gameId);
const fileSlug = (name) => name.toLowerCase().replace(/\s+/g, '_');

// Security Escape Helper
function escapeHtml(str) {
  if (str === null || str === undefined || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast${type === 'success' ? ' toast-success' : type === 'error' ? ' toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// URL Sanitizer (Guards against javascript: or invalid pseudo-protocols)
function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '#';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (['http:', 'https:', 'mailto:', 'steam:'].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch (e) {
    if (trimmed.startsWith('steam://')) return trimmed;
  }
  return '#';
}

// Download Helper (Generates client-side text blob with sanitized filename & memory cleanup)
function downloadTextFile(filename, content) {
  const safeFilename = String(filename || 'download.txt').replace(/[/\\?%*:|"<>]/g, '_');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
  showToast(`Downloaded ${safeFilename}`, 'success');
  checkDownloadMilestoneForTip();
}

// Milestone Download Helper (Respectful, non-intrusive Buy Me a Coffee prompt on 3rd download)
function checkDownloadMilestoneForTip() {
  if (localStorage.getItem('dds_bmc_dismissed') === 'true') return;

  const cooldownUntil = Number(localStorage.getItem('dds_bmc_cooldown')) || 0;
  if (Date.now() < cooldownUntil) return;

  const currentCount = (Number(localStorage.getItem('dds_dl_count')) || 0) + 1;
  localStorage.setItem('dds_dl_count', currentCount);

  // Trigger on milestone: 3rd download, or every 10 downloads if not dismissed
  if (currentCount === 3 || (currentCount > 3 && currentCount % 10 === 0)) {
    setTimeout(() => {
      showGentleMilestoneTipCard(currentCount);
    }, 1500);
  }
}

function showGentleMilestoneTipCard(count) {
  const existing = document.getElementById('bmcGentleTipCard');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.id = 'bmcGentleTipCard';
  card.className = 'tip-card';
  card.setAttribute('role', 'status');
  card.innerHTML = `
    <div class="tip-card-head">
      <span class="tip-card-title">Download #${Number(count)} complete</span>
      <button type="button" class="btn btn-ghost btn-icon btn-sm" onclick="window.dismissBmcTip(false)" aria-label="Dismiss">${icon('x')}</button>
    </div>
    <p class="small muted">
      Enjoying the free game configs? Everything stays free with zero paywalls. If our settings helped your gameplay, a tip helps cover server costs.
    </p>
    <div class="button-row">
      <a href="https://buymeacoffee.com/danglingdicestudios" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" onclick="window.dismissBmcTip(true)">
        ${icon('coffee')}Buy a coffee<span class="sr-only"> (opens in a new tab)</span>
      </a>
      <button type="button" class="btn btn-sm" onclick="window.dismissBmcTip(false)">Maybe later</button>
    </div>
  `;

  document.body.appendChild(card);

  setTimeout(() => {
    if (document.getElementById('bmcGentleTipCard')) {
      window.dismissBmcTip(false);
    }
  }, 18000);
}

function dismissBmcTip(isSupporter) {
  const card = document.getElementById('bmcGentleTipCard');
  if (card) {
    card.classList.add('is-leaving');
    setTimeout(() => card.remove(), 300);
  }

  if (isSupporter) {
    localStorage.setItem('dds_bmc_dismissed', 'true');
  } else {
    // 14-day silence cooldown
    localStorage.setItem('dds_bmc_cooldown', Date.now() + 1209600000);
  }
}

window.dismissBmcTip = dismissBmcTip;

// Clipboard Copy Helper
async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || 'Copied to clipboard', 'success');
  } catch (err) {
    showToast('Failed to copy. Please select and copy manually.', 'error');
  }
}

// ============================================================================
// 10-band EQ curve (canvas). Colors come from design tokens so the chart follows the site accent.
// ============================================================================
function drawEqCurve(canvas, bands) {
  if (!canvas || !bands || bands.length < 2) return;
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(name).trim();
  const accent = token('--dds-accent');
  const grid = token('--dds-border-color');
  const zero = token('--dds-border-control');
  const muted = token('--dds-ink-muted');

  const w = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const zeroY = h / 2;
  const dbToY = (db) => zeroY - (db / 10) * (h / 2 - 12); // +/- 10 dB fills the height

  // Grid: +6 / -6 dB, then the 0 dB line on top
  ctx.lineWidth = 1;
  ctx.strokeStyle = grid;
  [6, -6].forEach((db) => {
    ctx.beginPath();
    ctx.moveTo(0, dbToY(db));
    ctx.lineTo(w, dbToY(db));
    ctx.stroke();
  });
  ctx.strokeStyle = zero;
  ctx.beginPath();
  ctx.moveTo(0, zeroY);
  ctx.lineTo(w, zeroY);
  ctx.stroke();

  const points = bands.map((b, i) => ({
    x: (i / (bands.length - 1)) * (w - 32) + 16,
    y: dbToY(b.gain),
    gain: b.gain,
  }));

  const tracePath = () => {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
    }
  };

  // Flat translucent fill between the curve and 0 dB (no gradients)
  ctx.beginPath();
  tracePath();
  ctx.lineTo(points[points.length - 1].x, zeroY);
  ctx.lineTo(points[0].x, zeroY);
  ctx.closePath();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  tracePath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = p.gain > 0 ? accent : muted;
    ctx.fill();
  });
}

function redrawCharts() {
  const game = currentGame();
  drawEqCurve(document.getElementById('heroEqCanvas'), game.audioProfile.bands);
  if (activeDashboardTab === 'audio') drawEqCurve(document.getElementById('eqCanvas'), game.audioProfile.bands);
}

const formatGain = (gain) => `${gain > 0 ? '+' : ''}${gain} dB`;

// Hero tool: live footstep EQ preview for the selected game
function renderHeroEq() {
  const game = currentGame();
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('heroEqTitle', game.title);
  set('heroEqProfile', game.audioProfile.profileName);
  set('heroEqMix', game.audioProfile.targetMix);

  const peaks = document.getElementById('heroEqPeaks');
  if (peaks) {
    peaks.innerHTML = [...game.audioProfile.bands]
      .filter((b) => b.gain > 0)
      .sort((a, b) => b.gain - a.gain)
      .slice(0, 3)
      .map((b) => `<li><span class="mono muted">${escapeHtml(b.freq)}</span><span class="mono ink">${formatGain(b.gain)}</span><span class="muted">${escapeHtml(b.label)}</span></li>`)
      .join('');
  }
  requestAnimationFrame(() => drawEqCurve(document.getElementById('heroEqCanvas'), game.audioProfile.bands));
}

// ============================================================================
// Quick game chips (most played)
// ============================================================================
const TOP_PLAYED_GAME_IDS = ['warzone', 'cs2', 'tarkov', 'rust', 'fortnite', 'apex', 'r6-siege', 'valorant'];

function renderGameChips() {
  const container = document.getElementById('gameChipsRow');
  if (!container) return;

  const topGames = TOP_PLAYED_GAME_IDS.map((id) => findGame(id)).filter(Boolean);

  // If a game outside the top list is currently selected, include it dynamically
  const activeCustomGame = !TOP_PLAYED_GAME_IDS.includes(selectedGameId) ? findGame(selectedGameId) : null;
  const chip = (g) => {
    const active = selectedGameId === g.id;
    return `<button type="button" class="btn btn-sm game-chip${active ? ' active' : ''}" aria-pressed="${active}" onclick="window.selectGame('${g.id}', { scroll: false })">${escapeHtml(g.shortName)}</button>`;
  };

  container.innerHTML = [
    ...topGames.map(chip),
    activeCustomGame ? chip(activeCustomGame) : '',
    `<button type="button" class="btn btn-ghost btn-sm game-chip-all" onclick="window.selectGameChip('all')">All ${GAMES_CATALOG.length} games${icon('chevron-down')}</button>`,
  ].join('');
}

// Game Search Aliases Dictionary for intelligent search matching
const GAME_ALIASES = {
  'warzone': ['cod', 'call of duty', 'bo6', 'black ops', 'black ops 6', 'mw3', 'mw2', 'modern warfare', 'wz', 'iw9', 'options.3.cod24.cst'],
  'cs2': ['cs', 'csgo', 'counter strike', 'counter-strike', 'counterstrike', 'source 2', 'valve', 'autoexec.cfg', 'autoexec', 'esports'],
  'apex': ['apex legends', 'respawn', 'titanfall', 'autoexec.cfg', 'source'],
  'valorant': ['val', 'riot', 'vanguard', 'hero shooter', 'tactical'],
  'tarkov': ['eft', 'escape from tarkov', 'arena', 'tarkov arena', 'battlestate', 'bsg', 'local.ini', 'extraction', 'binaural'],
  'rust': ['facepunch', 'survival', 'airlock', 'base raid', 'client.cfg', 'gc.buffer'],
  'hunt-showdown': ['hunt', 'showdown', 'hunt 1896', 'cryengine', 'crytek', 'attributes.xml', 'binaural', 'extraction'],
  'hell-let-loose': ['hll', 'hell let loose', 'ww2', 'world war 2', 'milsim', 'engine.ini', 'artillery'],
  'r6-siege': ['r6', 'rainbow', 'rainbow six', 'rainbow six siege', 'siege', 'ubisoft', 'gamesettings.ini', 'night mode'],
  'dayz': ['day z', 'bohemia', 'chernarus', 'survival', 'dayz.cfg', 'enfusion'],
  'pubg': ['pubg', 'battlegrounds', 'playerunknown', 'krafton', 'gameusersettings.ini', 'br'],
  'the-finals': ['finals', 'the finals', 'embark', 'chaos physics', 'gameusersettings.ini', 'destruction'],
  'fortnite': ['fn', 'fort', 'epic games', 'zero build', 'battle royale', 'gameusersettings.ini', 'performance mode', 'linear'],
  'arma-reforger': ['arma', 'reforger', 'arma 4', 'arma 3', 'bohemia', 'enfusion', 'armareforger.json', 'milsim'],
  'arc-raiders': ['arc', 'raiders', 'arc raiders', 'embark', 'gameusersettings.ini', 'extraction', 'ue5'],
  'battlefield-6': ['bf', 'bf6', 'battlefield', 'dice', 'frostbite', 'user.cfg', 'wartapes'],
  'squad': ['offworld', 'milsim', 'tactical', 'engine.ini', 'ue4'],
  'tf2': ['team fortress', 'team fortress 2', 'valve', 'autoexec.cfg', 'source'],
  'rocket-league': ['rl', 'rocket league', 'psyonix', 'car soccer', 'tasystemsettings.ini'],
  'steam-deck-cyberpunk': ['deck', 'steam deck', 'steamdeck', 'cyberpunk', 'cyberpunk 2077', 'cdpr', 'vdf', 'gyro', 'steam input'],
};

function matchesGameQuery(game, rawQ) {
  if (!rawQ) return true;
  const q = rawQ.toLowerCase().trim();
  if (game.title.toLowerCase().includes(q)) return true;
  if (game.shortName.toLowerCase().includes(q)) return true;
  if (game.id.toLowerCase().includes(q)) return true;
  if (game.genre.toLowerCase().includes(q)) return true;
  if (game.engine.toLowerCase().includes(q)) return true;
  if (game.summary && game.summary.toLowerCase().includes(q)) return true;
  if (game.configProfile?.fileName && game.configProfile.fileName.toLowerCase().includes(q)) return true;
  if (game.audioProfile?.profileName && game.audioProfile.profileName.toLowerCase().includes(q)) return true;

  const aliases = GAME_ALIASES[game.id] || [];
  return aliases.some((alias) => alias.includes(q) || q.includes(alias));
}

// ============================================================================
// Search combobox (input + listbox of matching games)
// ============================================================================
let focusedDropdownIndex = -1;

function setDropdownOpen(open) {
  const dropdown = document.getElementById('searchResultsDropdown');
  const input = document.getElementById('gameSearchInput');
  if (dropdown) dropdown.style.display = open ? 'block' : 'none';
  if (input) {
    input.setAttribute('aria-expanded', String(open));
    if (!open) input.removeAttribute('aria-activedescendant');
  }
}

function renderSearchDropdown(query = '') {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!dropdown) return;

  const q = query.trim();
  if (!q) {
    dropdown.innerHTML = '';
    focusedDropdownIndex = -1;
    setDropdownOpen(false);
    return;
  }

  const matches = GAMES_CATALOG.filter((g) => matchesGameQuery(g, q));

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div class="search-empty">
        <p class="ink">No calibrated profile matching "${escapeHtml(q)}"</p>
        <p class="muted small">Request this title's EQ curves and configs in our <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Discord community<span class="sr-only"> (opens in a new tab)</span></a>.</p>
      </div>
    `;
    focusedDropdownIndex = -1;
    setDropdownOpen(true);
    document.getElementById('gameSearchInput')?.removeAttribute('aria-activedescendant');
    return;
  }

  dropdown.innerHTML = `
    <div class="search-results-head small muted">
      <span>${matches.length} matching profile${matches.length === 1 ? '' : 's'}</span>
      <span>Enter to open · Esc to close</span>
    </div>
    <ul class="search-options" id="searchResultsList" role="listbox" aria-label="Matching games">
      ${matches
        .map(
          (g, idx) => `
        <li class="search-option${idx === 0 ? ' focused' : ''}" role="option" id="searchOpt-${g.id}" aria-selected="${idx === 0}" data-game-id="${g.id}" data-index="${idx}" onclick="window.selectGameFromSearch('${g.id}')">
          <span class="search-option-title"><span class="ink">${escapeHtml(g.title)}</span><span class="tag">${escapeHtml(g.badge)}</span></span>
          <span class="muted small">${escapeHtml(g.audioProfile.profileName)} · <code>${escapeHtml(g.configProfile.fileName)}</code></span>
        </li>`
        )
        .join('')}
    </ul>
  `;

  focusedDropdownIndex = 0;
  setDropdownOpen(true);
  document.getElementById('gameSearchInput')?.setAttribute('aria-activedescendant', `searchOpt-${matches[0].id}`);
}

window.selectGameFromSearch = function (gameId) {
  setDropdownOpen(false);

  const searchInput = document.getElementById('gameSearchInput');
  const game = findGame(gameId);
  if (searchInput && game) {
    searchInput.value = game.shortName;
  }

  window.selectGame(gameId);
};

// ============================================================================
// Games catalog grid
// ============================================================================
function renderGamesCatalog(query = '') {
  const grid = document.getElementById('gamesGrid');
  const countBadge = document.getElementById('gamesCountBadge');
  if (!grid) return;

  const filtered = GAMES_CATALOG.filter((g) => matchesGameQuery(g, query));

  if (countBadge) {
    countBadge.textContent = `${filtered.length} game${filtered.length === 1 ? '' : 's'} available`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card empty-state">
        <p class="ink">No games found matching "${escapeHtml(query)}"</p>
        <p class="muted small">
          Want calibrated sound profiles and configs for this game?
          <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Request it in Discord<span class="sr-only"> (opens in a new tab)</span></a>
        </p>
      </div>
    `;
    return;
  }

  // Card pattern: the title button is the single focus stop; its ::after stretches over the card
  grid.innerHTML = filtered
    .map(
      (g) => `
    <article class="card game-card${g.id === selectedGameId ? ' is-selected' : ''}">
      <span class="tag">${escapeHtml(g.badge)}</span>
      <h3 class="game-card-title">
        <button type="button" class="game-card-link" onclick="window.selectGame('${g.id}')">${escapeHtml(g.title)}</button>
      </h3>
      <p class="muted small">${escapeHtml(g.summary)}</p>
      <div class="game-card-foot small">
        <span class="muted">${escapeHtml(g.genre)}</span>
        <span class="ink">View profiles${icon('arrow-right')}</span>
      </div>
    </article>
  `
    )
    .join('');
}

// ============================================================================
// Selected game dashboard (5 tabs)
// ============================================================================
const DASHBOARD_TABS = [
  { id: 'audio', label: 'Audio & footstep EQ', icon: 'headphones', panel: 'tabContentAudio' },
  { id: 'controller', label: 'Controller & stick curves', icon: 'gamepad-2', panel: 'tabContentController' },
  { id: 'console', label: 'Console (PS5 & Xbox)', icon: 'monitor', panel: 'tabContentConsole' },
  { id: 'config', label: 'Config files & FPS', icon: 'file-code', panel: 'tabContentConfig' },
  { id: 'sens', label: 'Sens & crosshairs', icon: 'crosshair', panel: 'tabContentSens' },
];

// PS5 Tempest 3D headphone EQ: one calibrated 5-band curve for every title
const PS5_BANDS = [
  { freq: '100 Hz', gain: -3, label: 'Mud cut' },
  { freq: '400 Hz', gain: -1, label: 'Debris' },
  { freq: '1 kHz', gain: 0, label: 'Comms' },
  { freq: '4 kHz', gain: 6, label: 'Footsteps' },
  { freq: '10 kHz', gain: -3, label: 'Gun ring' },
];

const specGrid = (items) => `
  <dl class="spec-grid">
    ${items.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
  </dl>`;

const bandGrid = (bands, extraClass = '') => `
  <ul class="band-grid ${extraClass}">
    ${bands
      .map(
        (b) => `
      <li class="band${b.gain > 0 ? ' is-boost' : ''}">
        <span class="band-freq mono">${escapeHtml(b.freq)}</span>
        <span class="band-gain mono">${formatGain(b.gain)}</span>
        <span class="band-label" title="${escapeHtml(b.label)}">${escapeHtml(b.label)}</span>
      </li>`
      )
      .join('')}
  </ul>`;

function gearCardHtml(item, { compact = false } = {}) {
  return `
    <article class="card gear-card">
      <p class="eyebrow mono">${escapeHtml(item.categoryLabel)}</p>
      <h3 class="gear-title">${escapeHtml(item.title)}</h3>
      <p class="small ink">${escapeHtml(item.tag)}</p>
      <p class="muted small">${escapeHtml(item.desc)}</p>
      ${compact ? '' : `<p class="muted small mono gear-specs">${escapeHtml(item.specs)}</p>`}
      <div class="gear-foot">
        <span class="gear-price mono">${escapeHtml(item.price)}</span>
        <span class="gear-rating small muted">${icon('star')}<span class="sr-only">Rated </span>${escapeHtml(item.rating)}</span>
        <a href="${sanitizeUrl(item.link)}" target="_blank" rel="noopener noreferrer sponsored" class="btn btn-primary btn-sm push-right">
          Check deal<span class="sr-only"> for ${escapeHtml(item.title)} (opens in a new tab)</span>
        </a>
      </div>
    </article>`;
}

// Contextual gear for a dashboard tab: only the recommended items in that tab's category
function renderContextualGearHtml(gearIds = [], category, heading) {
  const items = ACCESSORIES_CATALOG.filter((item) => gearIds.includes(item.id) && (!category || item.category === category));
  if (items.length === 0) return '';
  return `
    <div class="dash-block">
      <h4 class="eyebrow mono">${escapeHtml(heading)}</h4>
      <div class="gear-grid gear-grid-compact">${items.map((item) => gearCardHtml(item, { compact: true })).join('')}</div>
    </div>`;
}

function renderGameDashboard() {
  const dashboard = document.getElementById('gameDashboardSection');
  if (!dashboard) return;

  const game = currentGame();
  const cp = game.controllerProfile;
  const ap = game.audioProfile;

  dashboard.style.display = 'block';
  dashboard.innerHTML = `
    <div class="section-head section-head-row">
      <div>
        <p class="eyebrow mono">Selected game · ${escapeHtml(game.genre)} · ${escapeHtml(game.engine)}</p>
        <h2 class="section-title" id="dashboardGameTitle" tabindex="-1">${escapeHtml(game.title)}</h2>
      </div>
      <span class="tag">${escapeHtml(game.badge)}</span>
    </div>

    <div class="tabs" role="tablist" aria-label="${escapeHtml(game.shortName)} profiles" id="dashboardTabs">
      ${DASHBOARD_TABS.map((t) => {
        const active = activeDashboardTab === t.id;
        return `<button type="button" class="tab${active ? ' active' : ''}" role="tab" id="dashTab-${t.id}" data-tab="${t.id}" aria-selected="${active}" aria-controls="${t.panel}" tabindex="${active ? 0 : -1}" onclick="window.switchDashboardTab('${t.id}')">${icon(t.icon)}${escapeHtml(t.label)}</button>`;
      }).join('')}
    </div>

    <!-- Tab 1: Audio EQ -->
    <div class="tab-panel" id="tabContentAudio" role="tabpanel" aria-labelledby="dashTab-audio" tabindex="0"${activeDashboardTab === 'audio' ? '' : ' hidden'}>
      <h3 class="panel-title">${escapeHtml(ap.profileName)}</h3>
      <p class="muted">${escapeHtml(ap.description)} Target in-game mix: <strong class="ink">${escapeHtml(ap.targetMix)}</strong></p>

      <div class="eq-box">
        <canvas id="eqCanvas" class="eq-canvas eq-canvas-lg" width="900" height="180" aria-hidden="true"></canvas>
        ${bandGrid(ap.bands)}
      </div>

      <div class="button-row">
        <button type="button" class="btn btn-primary" onclick="window.downloadApoTxtConfig('${game.id}')">${icon('download')}Download .txt (Equalizer APO)</button>
        <button type="button" class="btn" onclick="window.downloadPeaceConfig('${game.id}')">${icon('download')}Download .peace (Peace GUI)</button>
        <button type="button" class="btn" onclick="window.copyApoTxtConfig('${game.id}')">${icon('copy')}Copy config.txt code</button>
        <button type="button" class="btn" onclick="window.copySonarValues('${game.id}')">${icon('copy')}Copy Sonar values</button>
        <button type="button" class="btn" onclick="window.copyDolbyValues('${game.id}')">${icon('copy')}Copy Dolby Atmos</button>
      </div>

      <p class="note">${icon('info')}<span>New to Equalizer APO or Peace GUI? <a href="#softwareSection">Read the 2-minute setup guide</a>.</span></p>

      ${renderContextualGearHtml(game.recommendedGear, 'audio', 'Recommended audio gear for this profile')}
    </div>

    <!-- Tab 2: Controller -->
    <div class="tab-panel" id="tabContentController" role="tabpanel" aria-labelledby="dashTab-controller" tabindex="0"${activeDashboardTab === 'controller' ? '' : ' hidden'}>
      <h3 class="panel-title">${escapeHtml(cp.profileName)}</h3>
      <p class="muted">Optimized deadzone threshold and acceleration curve targeting micro-adjustments with zero stick drift.</p>
      ${specGrid([
        ['Response curve', cp.curveType],
        ['Left stick deadzone', cp.leftStickDeadzoneMin],
        ['Right stick deadzone', cp.rightStickDeadzoneMin],
        ['Trigger threshold', cp.leftTriggerDeadzone],
      ])}
      <div class="button-row">
        ${cp.steamConfigCode ? `<a href="${sanitizeUrl(cp.steamConfigCode)}" class="btn btn-primary">${icon('external-link')}Apply Steam Input config</a>` : ''}
        ${cp.ds4xmlSnippet ? `<button type="button" class="btn" onclick="window.copyDs4Config('${game.id}')">${icon('copy')}Copy DS4Windows XML</button>` : ''}
        <button type="button" class="btn" onclick="window.copyControllerValues('${game.id}')">${icon('copy')}Copy deadzone specs</button>
      </div>
      ${renderContextualGearHtml(game.recommendedGear, 'controllers', 'Recommended controller upgrades')}
    </div>

    <!-- Tab 3: Console Guide (PS5 & Xbox) -->
    <div class="tab-panel" id="tabContentConsole" role="tabpanel" aria-labelledby="dashTab-console" tabindex="0"${activeDashboardTab === 'console' ? '' : ' hidden'}>
      <h3 class="panel-title">PlayStation 5 and Xbox Series X|S calibration</h3>
      <p class="muted">
        Every setting here works on console. Follow these steps to apply the footstep EQ and controller curve inside your PS5 or Xbox system menus.
      </p>

      <div class="console-grid">
        <div class="card console-card">
          <div class="console-card-head">
            <h4 class="feature-title">PlayStation 5 (Tempest 3D)</h4>
            <span class="tag">Native 5-band EQ</span>
          </div>
          <ol class="step-list">
            <li>Plug your headset into the DualSense controller jack or a PS5 USB port.</li>
            <li>Go to <strong class="ink">Settings &gt; Sound &gt; Audio Output &gt; Headphone Equalizer</strong>.</li>
            <li>Select a <strong class="ink">Custom Preset</strong> and set the 5 sliders:</li>
          </ol>
          <p class="eyebrow mono">Calibrated PS5 sliders for ${escapeHtml(game.shortName)}</p>
          ${bandGrid(PS5_BANDS, 'band-grid-5')}
          <p class="muted small">In-game mix: open ${escapeHtml(game.shortName)} settings &gt; Audio and set Master Audio Mix to <strong class="ink">${escapeHtml(ap.targetMix)}</strong>.</p>
        </div>

        <div class="card console-card">
          <div class="console-card-head">
            <h4 class="feature-title">Xbox Series X|S and One (Dolby Access)</h4>
            <span class="tag">10-band Atmos EQ</span>
          </div>
          <ol class="step-list">
            <li>Download the free <strong class="ink">Dolby Access</strong> app from the Xbox Store.</li>
            <li>In Xbox Settings &gt; General &gt; Volume &amp; audio output, set Headset audio to <strong class="ink">Dolby Atmos for Headphones</strong>.</li>
            <li>Open Dolby Access &gt; Settings &gt; Custom 1 and enter this 10-band curve:</li>
          </ol>
          <p class="eyebrow mono">Calibrated Dolby Access settings</p>
          <pre class="code-block code-block-wrap"><code>${escapeHtml(ap.dolbyValues)}</code></pre>
          <p class="muted small">In-game mix: open ${escapeHtml(game.shortName)} settings &gt; Audio and set Master Audio Mix to <strong class="ink">${escapeHtml(ap.targetMix)}</strong>.</p>
        </div>
      </div>

      <div class="dash-block">
        <h4 class="eyebrow mono">In-game controller settings (PS5 / Xbox menu)</h4>
        ${specGrid([
          ['Response curve type', cp.curveType],
          ['Left stick min deadzone', cp.leftStickDeadzoneMin],
          ['Right stick min deadzone', cp.rightStickDeadzoneMin],
          ['Sensitivity multipliers', `Look: ${cp.horizontalSens} | ADS: ${cp.verticalSens}`],
        ])}
      </div>

      <div class="button-row">
        <button type="button" class="btn btn-primary" onclick="window.copyConsoleCheatSheet('${game.id}')">${icon('copy')}Copy console cheat sheet</button>
        <button type="button" class="btn" onclick="window.downloadConsoleGuideTxt('${game.id}')">${icon('download')}Download console .txt guide</button>
      </div>
    </div>

    <!-- Tab 4: Config Files -->
    <div class="tab-panel" id="tabContentConfig" role="tabpanel" aria-labelledby="dashTab-config" tabindex="0"${activeDashboardTab === 'config' ? '' : ' hidden'}>
      <div class="config-head">
        <h3 class="panel-title mono">${escapeHtml(game.configProfile.fileName)}</h3>
        <span class="tag">${escapeHtml(game.engine)}</span>
        <span class="tag push-right">Plain-text preset · no ban risk</span>
      </div>
      <p class="config-path small muted">
        <span>Target path:</span>
        <code>${escapeHtml(game.configProfile.targetPath)}</code>
        <button type="button" class="btn btn-ghost btn-sm" onclick="window.copyTargetFilePath('${game.id}')">${icon('copy')}Copy path</button>
      </p>

      <div class="callout">
        <strong class="ink">Quick setup:</strong> if you'd rather not download a file, click <strong class="ink">Copy raw code</strong>, paste it into a blank Notepad file and save it into the target directory.
      </div>

      <div class="code-frame">
        <div class="code-frame-head small">
          <span class="mono muted">${escapeHtml(game.configProfile.fileName)}</span>
          <button type="button" class="btn btn-ghost btn-sm" onclick="window.copyConfigFileContent('${game.id}')">${icon('copy')}Copy code</button>
        </div>
        <pre class="code-block code-block-scroll" tabindex="0" aria-label="${escapeHtml(game.configProfile.fileName)} contents"><code>${escapeHtml(game.configProfile.fileContent)}</code></pre>
      </div>

      <div class="button-row">
        <button type="button" class="btn btn-primary" onclick="window.copyConfigFileContent('${game.id}')">${icon('copy')}Copy raw code (recommended)</button>
        <button type="button" class="btn" onclick="window.downloadGameConfigFile('${game.id}')">${icon('download')}Download ${escapeHtml(game.configProfile.fileName)}</button>
        <button type="button" class="btn" onclick="window.copyTargetFilePath('${game.id}')">${icon('copy')}Copy target directory path</button>
      </div>

      <div class="dash-block">
        <h4 class="eyebrow mono">Installation and performance tips</h4>
        <ul class="tips-list">
          ${game.configProfile.fpsTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Tab 5: Sens & Crosshairs -->
    <div class="tab-panel" id="tabContentSens" role="tabpanel" aria-labelledby="dashTab-sens" tabindex="0"${activeDashboardTab === 'sens' ? '' : ' hidden'}>
      <h3 class="panel-title">Sensitivity and pro crosshair codes</h3>
      <p class="muted">Verified competitive sensitivity multipliers and ready-to-import crosshair codes.</p>
      ${specGrid([
        ['Horizontal / base sens', cp.horizontalSens],
        ['Vertical / ADS multiplier', cp.verticalSens],
        ['Aim assist / input mode', cp.aimAssistType],
      ])}
      <div class="button-row">
        <button type="button" class="btn" onclick="window.copySensValues('${game.id}')">${icon('copy')}Copy sens values</button>
      </div>
    </div>
  `;

  // Draw the EQ curve onto the canvas if on Audio tab
  if (activeDashboardTab === 'audio') {
    requestAnimationFrame(() => drawEqCurve(document.getElementById('eqCanvas'), ap.bands));
  }
}

// ============================================================================
// Gear directory, software guide and audio setup wizard
// ============================================================================
function renderMasterAccessories(cat = 'all') {
  const grid = document.getElementById('accessoriesGrid');
  if (!grid) return;

  const filtered = ACCESSORIES_CATALOG.filter((item) => cat === 'all' || item.category === cat);
  grid.innerHTML = filtered.map((item) => gearCardHtml(item)).join('');
}

function renderSoftwareGuide() {
  const container = document.getElementById('softwareGrid');
  if (!container) return;

  // steps / troubleshooting are trusted static markup from gameData.js (they contain <strong>/<code>)
  container.innerHTML = SOFTWARE_GUIDE.map(
    (tool) => `
    <article class="card software-card">
      <div class="software-head">
        <span class="software-icon">${icon(tool.icon)}</span>
        <div>
          <h3 class="feature-title">${escapeHtml(tool.name)}</h3>
          <p class="muted small">${escapeHtml(tool.category)}</p>
        </div>
        <span class="tag push-right">${escapeHtml(tool.price)}</span>
      </div>

      <p class="muted small">${escapeHtml(tool.description)}</p>
      <p class="small"><strong class="ink">Why you need it:</strong> <span class="muted">${escapeHtml(tool.whyNeedIt)}</span></p>

      <h4 class="eyebrow mono">Step-by-step setup</h4>
      <ol class="step-list">
        ${tool.steps.map((s) => `<li>${s}</li>`).join('')}
      </ol>

      ${
        tool.troubleshooting && tool.troubleshooting.length > 0
          ? `
        <div class="callout is-warn">
          <strong class="ink">Tips and troubleshooting</strong>
          <ul class="tips-list">
            ${tool.troubleshooting.map((t) => `<li>${t}</li>`).join('')}
          </ul>
        </div>`
          : ''
      }

      <div class="button-row software-actions">
        <a href="${sanitizeUrl(tool.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          ${icon('download')}Official download (${escapeHtml(tool.version)})<span class="sr-only"> (opens in a new tab)</span>
        </a>
        ${
          tool.id === 'equalizer-apo' || tool.id === 'peace-gui'
            ? `<button type="button" class="btn btn-sm" onclick="window.downloadSetupGuideTxt()">${icon('download')}Setup guide (.txt)</button>`
            : ''
        }
        <a href="${sanitizeUrl(tool.officialSite)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">
          Docs<span class="sr-only"> for ${escapeHtml(tool.name)} (opens in a new tab)</span>${icon('external-link')}
        </a>
      </div>
    </article>
  `
  ).join('');
}

function renderAudioSetupWizard() {
  const selectorGrid = document.getElementById('audioSetupSelectorGrid');
  const detailBox = document.getElementById('audioSetupDetailBox');
  if (!selectorGrid || !detailBox) return;

  selectorGrid.innerHTML = AUDIO_SETUPS.map((s) => {
    const active = activeAudioSetupId === s.id;
    return `
    <button type="button" class="setup-option${active ? ' active' : ''}" aria-pressed="${active}" onclick="window.selectAudioSetup('${s.id}')">
      ${icon(s.icon)}
      <span class="eyebrow mono">${escapeHtml(s.category)}</span>
      <span class="setup-option-title">${escapeHtml(s.shortTitle)}</span>
      <span class="muted small">${escapeHtml(s.badge)}</span>
    </button>`;
  }).join('');

  const setup = AUDIO_SETUPS.find((s) => s.id === activeAudioSetupId) || AUDIO_SETUPS[0];

  // steps / windowsSettings are trusted static markup from gameData.js
  detailBox.innerHTML = `
    <div class="setup-detail-head">
      <span class="software-icon">${icon(setup.icon)}</span>
      <div>
        <h3 class="panel-title">${escapeHtml(setup.title)}</h3>
        <p class="muted small">Typical gear: ${escapeHtml(setup.examples)}</p>
      </div>
      <span class="tag push-right">${escapeHtml(setup.badge)}</span>
    </div>

    ${specGrid([
      ['Equalizer APO target device', setup.configuratorCheck],
      ['Required install mode', setup.installMode],
      ['Recommended software', setup.softwareRecommendation],
    ])}

    <div class="setup-columns">
      <div>
        <h4 class="eyebrow mono">Installation steps</h4>
        <ol class="step-list">
          ${setup.steps.map((st) => `<li>${st}</li>`).join('')}
        </ol>
      </div>
      <div>
        <h4 class="eyebrow mono">Windows sound settings (mmsys.cpl)</h4>
        <ul class="tips-list">
          ${setup.windowsSettings.map((ws) => `<li>${ws}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="callout is-warn">
      <strong class="ink">Common hardware trap and fix:</strong> <span class="muted">${escapeHtml(setup.pitfalls)}</span>
    </div>

    <div class="button-row">
      <button type="button" class="btn btn-primary btn-sm" onclick="window.downloadAudioSetupCheatSheet('${setup.id}')">${icon('download')}Download ${escapeHtml(setup.shortTitle)} guide (.txt)</button>
      <button type="button" class="btn btn-sm" onclick="window.copyAudioSetupChecklist('${setup.id}')">${icon('copy')}Copy setup checklist</button>
      <a href="#softwareSection" class="btn btn-ghost btn-sm">View software downloads</a>
    </div>
  `;
}

// ============================================================================
// Global Window Handlers
// ============================================================================
window.selectGame = function (gameId, { scroll = true } = {}) {
  if (!findGame(gameId)) return;
  selectedGameId = gameId;
  renderGameChips();
  renderHeroEq();
  renderGameDashboard();
  document.querySelectorAll('.game-card').forEach((card) => {
    card.classList.toggle('is-selected', card.querySelector('.game-card-link')?.getAttribute('onclick')?.includes(`'${gameId}'`) || false);
  });
  if (scroll) {
    const dashEl = document.getElementById('gameDashboardSection');
    if (dashEl) dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Move keyboard focus to the newly opened profile so screen reader users land on it
    document.getElementById('dashboardGameTitle')?.focus({ preventScroll: true });
  }
};

// Kept for legacy chip markup / deep links; chips now wrap instead of scrolling
window.scrollGameChips = function (offset) {
  document.getElementById('gameChipsRow')?.scrollBy({ left: offset, behavior: 'smooth' });
};

window.selectGameChip = function (chipId) {
  if (chipId === 'all') {
    const input = document.getElementById('gameSearchInput');
    if (input) input.value = '';
    renderGamesCatalog('');
    const catalogEl = document.getElementById('gamesCatalogSection');
    if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.selectGame(chipId);
  }
};

// Switch tabs in place (no re-render) so keyboard focus stays on the tab
window.switchDashboardTab = function (tabName) {
  if (!DASHBOARD_TABS.some((t) => t.id === tabName)) return;
  activeDashboardTab = tabName;
  DASHBOARD_TABS.forEach((t) => {
    const btn = document.getElementById(`dashTab-${t.id}`);
    const panel = document.getElementById(t.panel);
    const active = t.id === tabName;
    if (btn) {
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
    }
    if (panel) panel.hidden = !active;
  });
  if (tabName === 'audio') {
    requestAnimationFrame(() => drawEqCurve(document.getElementById('eqCanvas'), currentGame().audioProfile.bands));
  }
};

window.downloadApoTxtConfig = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  const content = `# ==============================================================================
# Dangling Dice Gaming Lab™ — Equalizer APO Native Configuration
# Game: ${game.title}
# Profile: ${game.audioProfile.profileName}
# Target Mix: ${game.audioProfile.targetMix}
#
# QUICK INSTALLATION:
# Option 1: Open C:\\Program Files\\EqualizerAPO\\config\\config.txt in Notepad,
#           paste lines below, and press Ctrl+S. (Updates in real-time!)
# Option 2: Place this file in C:\\Program Files\\EqualizerAPO\\config\\
#           and add this line to your config.txt:
#           Include: ${fileSlug(game.shortName)}_eq.txt
# ==============================================================================

Preamp: -3.0 dB
${game.audioProfile.peaceConfig}
`;
  downloadTextFile(`${fileSlug(game.shortName)}_eq.txt`, content);
};

window.copyApoTxtConfig = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  const content = `# Dangling Dice Gaming Lab™ — ${game.shortName} Footstep Audio EQ
Preamp: -3.0 dB
${game.audioProfile.peaceConfig}`;
  copyToClipboard(content, `Copied Equalizer APO config text for ${game.shortName}`);
};

window.downloadSetupGuideTxt = function () {
  const guideContent = `==============================================================================
DANGLING DICE GAMING LAB™ — EQUALIZER APO & PEACE GUI SETUP CHEAT SHEET
Website: https://games.dangling-dice-studios.com/
Discord: https://discord.gg/uFYMQahNZz
==============================================================================

WHAT IS EQUALIZER APO?
----------------------
Equalizer APO is a 100% free, open-source 32-bit floating-point parametric
audio engine that hooks directly into the Windows audio pipeline with 0ms
latency and zero CPU overhead.

WHAT IS PEACE GUI?
------------------
Peace is the graphical slider interface and preset manager for Equalizer APO.
Equalizer APO runs purely as a background text engine; Peace provides visual
equalizer sliders, instant hotkeys, and 1-click preset importing.

------------------------------------------------------------------------------
STEP-BY-STEP INSTALLATION GUIDE (WINDOWS 10 / 11)
------------------------------------------------------------------------------
STEP 1: INSTALL EQUALIZER APO
  1. Download EqualizerAPO64 from https://sourceforge.net/projects/equalizerapo/
  2. Run the installer.
  3. During setup, the "Configurator" window opens. Click the "Playback devices" tab.
  4. Check the box ONLY for your active output device (e.g. Headphones or USB DAC).
  5. Click OK.
  6. CRITICAL: Restart your computer when prompted. The Windows audio filter
     driver requires a reboot to hook into your sound card.

STEP 2: INSTALL PEACE GUI
  1. Download PeaceSetup.exe from https://sourceforge.net/projects/peace-equalizer-apo-extension/
  2. Run PeaceSetup.exe and click "Install".
  3. Choose "Start with Peace" and select the standard 10-band interface.

STEP 3: HOW TO USE THE .TXT OR .PEACE FILES
  METHOD A (Peace GUI - Easiest):
    1. On https://games.dangling-dice-studios.com/, click "Download .peace" for your game.
    2. In Peace GUI, click the "Import" button (bottom right).
    3. Select your downloaded .peace (or .txt) file.
    4. The 10 frequency sliders will immediately load. Click "Save".

  METHOD B (Native Equalizer APO without Peace):
    1. On our website, click "Download .txt" for your game (e.g. warzone_eq.txt).
    2. Move the file to:
       C:\\Program Files\\EqualizerAPO\\config\\
    3. Open "config.txt" in Notepad from that same folder.
    4. Add this single line to the bottom:
       Include: warzone_eq.txt
    5. Press Ctrl + S. The changes take effect immediately in real-time!

------------------------------------------------------------------------------
TROUBLESHOOTING & COMMON FIXES
------------------------------------------------------------------------------
PROBLEM: "I don't hear any difference when moving sliders in Peace."
FIX:
  1. Open C:\\Program Files\\EqualizerAPO\\Configurator.exe as Administrator.
  2. Click on your active headphone device.
  3. Check "Troubleshooting options".
  4. Change "Install as" from "SFX/EFX" to "Install as LFX/GFX".
  5. Click OK and restart your PC or the Windows Audio service.

PROBLEM: "My volume is clipping or distorting when firing weapons."
FIX:
  Always keep the "Preamp" slider set to at least -3.0 dB to give the audio
  stream digital headroom for our footstep frequency boosts.

Need help or want custom EQ for your specific headset?
Join our Discord: https://discord.gg/uFYMQahNZz
==============================================================================
`;
  downloadTextFile('EQUALIZER_APO_SETUP_GUIDE.txt', guideContent);
};

window.downloadPeaceConfig = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  downloadTextFile(`${fileSlug(game.shortName)}_peace_eq.peace`, game.audioProfile.peaceConfig);
};

window.copySonarValues = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(game.audioProfile.sonarValues.join('\n'), 'Copied SteelSeries Sonar parametric values');
};

window.copyDolbyValues = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(game.audioProfile.dolbyValues, 'Copied Dolby Atmos settings');
};

window.copyDs4Config = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(game.controllerProfile.ds4xmlSnippet, 'Copied DS4Windows XML snippet');
};

window.copyControllerValues = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  const p = game.controllerProfile;
  const txt = `Curve: ${p.curveType}\nLeft Min Deadzone: ${p.leftStickDeadzoneMin}\nRight Min Deadzone: ${p.rightStickDeadzoneMin}\nTriggers: ${p.leftTriggerDeadzone}\nSens: ${p.horizontalSens}`;
  copyToClipboard(txt, 'Copied deadzone and controller tuning specs');
};

window.downloadGameConfigFile = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  downloadTextFile(game.configProfile.fileName, game.configProfile.fileContent);
};

window.copyConfigFileContent = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(game.configProfile.fileContent, `Copied ${game.configProfile.fileName} contents`);
};

window.copyTargetFilePath = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(game.configProfile.targetPath, `Copied target path for ${game.shortName}`);
};

window.copySensValues = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  const p = game.controllerProfile;
  copyToClipboard(`Horizontal Sens: ${p.horizontalSens}\nVertical Sens: ${p.verticalSens}\nMode: ${p.aimAssistType}`, 'Copied sensitivity specs');
};

// Plain-text console guide shared by the copy and download actions
function buildConsoleGuide(game) {
  const cp = game.controllerProfile;
  return `================================================================================\n` +
    `DANGLING DICE GAMING LAB™ — CONSOLE SETUP QUICK-GUIDE (PS5 & XBOX)\n` +
    `Game: ${game.title}\n` +
    `Target In-Game Audio Mix: ${game.audioProfile.targetMix}\n` +
    `Website: https://games.dangling-dice-studios.com/\n` +
    `================================================================================\n\n` +
    `[PLAYSTATION 5] TEMPEST 3D NATIVE 5-BAND EQ\n` +
    `Location: Settings > Sound > Audio Output > Headphone Equalizer > Custom\n` +
    `  • 100 Hz:  -3 dB (Cuts sub-bass mud and explosion artillery rumble)\n` +
    `  • 400 Hz:  -1 dB (Clears voice / debris clutter)\n` +
    `  • 1 kHz:    0 dB (Natural team comms & weapon reloads)\n` +
    `  • 4 kHz:   +6 dB (CRITICAL: Isolates footsteps, tile clicks & broken glass)\n` +
    `  • 10 kHz:  -3 dB (Tames shrill gunshot ear fatigue)\n\n` +
    `[XBOX] SERIES X|S & ONE (DOLBY ACCESS 10-BAND EQ)\n` +
    `Location: Xbox Store > Dolby Access app > Settings > Custom 1\n` +
    `  • Values: ${game.audioProfile.dolbyValues}\n\n` +
    `[CONTROLLER] CONSOLE IN-GAME CONTROLLER SETTINGS\n` +
    `  • Response Curve: ${cp.curveType}\n` +
    `  • Left Stick Deadzone: ${cp.leftStickDeadzoneMin}\n` +
    `  • Right Stick Deadzone: ${cp.rightStickDeadzoneMin}\n` +
    `  • Max Deadzone: ${cp.stickDeadzoneMax}\n` +
    `  • Sensitivity: Look (${cp.horizontalSens}) / ADS (${cp.verticalSens})\n` +
    `  • Aim Assist Mode: ${cp.aimAssistType}\n\n` +
    `[GRAPHICS] CONSOLE GRAPHICS & FPS TIPS:\n` +
    `  • Turn OFF Motion Blur & Depth of Field in game settings.\n` +
    `  • Enable 120Hz / Performance Mode in console display settings.\n` +
    `  • Set Field of View (FOV) to 105 - 115 if supported.`;
}

window.copyConsoleCheatSheet = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  copyToClipboard(buildConsoleGuide(game), `Copied PS5 & Xbox console cheat sheet for ${game.shortName}`);
};

window.downloadConsoleGuideTxt = function (gameId) {
  const game = findGame(gameId);
  if (!game) return;
  const filename = `${game.shortName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_console_setup.txt`;
  downloadTextFile(filename, buildConsoleGuide(game));
};

// Audio Setup Wizard Handlers
window.selectAudioSetup = function (setupId) {
  activeAudioSetupId = setupId;
  renderAudioSetupWizard();
  // Re-rendering replaced the pressed button; keep keyboard focus on the new one
  document.querySelector('#audioSetupSelectorGrid .setup-option.active')?.focus();
};

window.downloadAudioSetupCheatSheet = function (setupId) {
  const setup = AUDIO_SETUPS.find((s) => s.id === setupId) || AUDIO_SETUPS[0];
  const content = `==============================================================================
DANGLING DICE GAMING LAB™ — AUDIO HARDWARE SETUP GUIDE
Hardware Configuration: ${setup.title}
Compatibility: ${setup.badge}
Website: https://games.dangling-dice-studios.com/
Discord: https://discord.gg/uFYMQahNZz
==============================================================================

CONNECTED HARDWARE EXAMPLES:
${setup.examples}

WINDOWS PLAYBACK DEVICE:
${setup.windowsDeviceName}

EQUALIZER APO CONFIGURATOR INSTRUCTIONS:
- Target Device to Check: ${setup.configuratorCheck}
- Install Mode: ${setup.installMode}

RECOMMENDED SOFTWARE STACK:
${setup.softwareRecommendation}

STEP-BY-STEP SETUP INSTRUCTIONS:
${setup.steps.map((st, i) => `${i + 1}. ${st.replace(/<[^>]+>/g, '')}`).join('\n')}

WINDOWS SOUND CONTROL PANEL SETTINGS (mmsys.cpl):
${setup.windowsSettings.map((ws) => `- ${ws.replace(/<[^>]+>/g, '')}`).join('\n')}

CRITICAL PITFALL & HARDWARE TRAP:
${setup.pitfalls}

==============================================================================
`;
  downloadTextFile(`AUDIO_SETUP_${setup.id.toUpperCase().replace(/-/g, '_')}.txt`, content);
};

window.copyAudioSetupChecklist = function (setupId) {
  const setup = AUDIO_SETUPS.find((s) => s.id === setupId) || AUDIO_SETUPS[0];
  const text = `Setup: ${setup.title}\n` +
    `Target: ${setup.configuratorCheck}\n` +
    `Mode: ${setup.installMode}\n` +
    `Pitfall: ${setup.pitfalls}`;
  copyToClipboard(text, `Copied setup checklist for ${setup.shortTitle}`);
};

// ============================================================================
// Search input, combobox keyboard handling
// ============================================================================
const searchInput = document.getElementById('gameSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

function updateDropdownFocus(items) {
  items.forEach((item, idx) => {
    const focused = idx === focusedDropdownIndex;
    item.classList.toggle('focused', focused);
    item.setAttribute('aria-selected', String(focused));
    if (focused) {
      item.scrollIntoView({ block: 'nearest' });
      searchInput?.setAttribute('aria-activedescendant', item.id);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (clearSearchBtn) clearSearchBtn.style.display = val ? 'inline-flex' : 'none';
    renderSearchDropdown(val);
    renderGamesCatalog(val);
  });

  searchInput.addEventListener('keydown', (e) => {
    const dropdown = document.getElementById('searchResultsDropdown');
    const isDropdownOpen = dropdown && dropdown.style.display !== 'none';
    const items = dropdown ? dropdown.querySelectorAll('.search-option') : [];

    if (e.key === 'ArrowDown' && isDropdownOpen) {
      e.preventDefault();
      if (items.length > 0) {
        focusedDropdownIndex = (focusedDropdownIndex + 1) % items.length;
        updateDropdownFocus(items);
      }
    } else if (e.key === 'ArrowUp' && isDropdownOpen) {
      e.preventDefault();
      if (items.length > 0) {
        focusedDropdownIndex = (focusedDropdownIndex - 1 + items.length) % items.length;
        updateDropdownFocus(items);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && items.length > 0) {
        const target = items[focusedDropdownIndex >= 0 ? focusedDropdownIndex : 0];
        const gameId = target?.getAttribute('data-game-id');
        if (gameId) window.selectGameFromSearch(gameId);
      } else {
        const val = searchInput.value.trim();
        const firstMatch = GAMES_CATALOG.find((g) => matchesGameQuery(g, val));
        if (firstMatch) window.selectGameFromSearch(firstMatch.id);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  });

  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) {
      renderSearchDropdown(searchInput.value);
    }
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    clearSearchBtn.style.display = 'none';
    renderSearchDropdown('');
    renderGamesCatalog('');
  });
}

// Close search dropdown when clicking outside
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.search');
  if (searchContainer && !searchContainer.contains(e.target)) {
    setDropdownOpen(false);
  }
});

// Gear Filter Pills Listener
const gearPills = document.querySelectorAll('.gear-filter-pill');
gearPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    gearPills.forEach((p) => {
      p.classList.remove('active');
      p.setAttribute('aria-pressed', 'false');
    });
    pill.classList.add('active');
    pill.setAttribute('aria-pressed', 'true');
    activeGearCategory = pill.getAttribute('data-cat') || 'all';
    renderMasterAccessories(activeGearCategory);
  });
});

// Hero preview download uses whichever game is selected
document.getElementById('heroEqDownloadBtn')?.addEventListener('click', () => window.downloadApoTxtConfig(selectedGameId));

// Dashboard tabs: arrow keys / Home / End (delegated, survives re-renders)
initTabKeyboard(document.getElementById('gameDashboardSection'));

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  renderGameChips();
  renderHeroEq();
  renderGamesCatalog('');
  renderGameDashboard();
  renderSoftwareGuide();
  renderAudioSetupWizard();
  renderMasterAccessories('all');

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(redrawCharts);
  });
});

// ============================================================================
// Provably Fair Dice Arena & Duels Engine
// Commit-reveal: the SHA-256 of the next server seed is published before the roll,
// the seed itself is revealed after, and both rolls derive from HMAC-SHA256(seed, clientSeed:nonce).
// ============================================================================
let arenaState = {
  playerScore: 0,
  botScore: 0,
  streak: Number(localStorage.getItem('dds_dice_streak') || 0),
  nonce: 1,
  isRolling: false,
  clientSeed: '',
  nextServerSeed: null,
  nextServerHash: null,
};

const randomHex = (bytes) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function updateStreakBadge() {
  setText('arenaStreakCount', arenaState.streak);
}

function randomizeClientSeed() {
  const input = document.getElementById('arenaClientSeed');
  if (input) {
    input.value = `seed_${randomHex(8)}`;
    showToast('New random client seed generated');
  }
}

function toggleProofDetails() {
  const content = document.getElementById('proofDetailsContent');
  const btn = document.getElementById('proofToggleBtn');
  if (content) {
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'grid' : 'none';
    if (btn) {
      btn.setAttribute('aria-expanded', String(isHidden));
      btn.classList.toggle('is-open', isHidden);
    }
  }
}

async function computeHmacSha256Browser(keyStr, messageStr) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keyStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(messageStr));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function computeSha256Browser(text) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate and publish the commitment for the next roll
async function prepareNextCommitment() {
  arenaState.nextServerSeed = randomHex(32);
  arenaState.nextServerHash = await computeSha256Browser(arenaState.nextServerSeed);
  setText('proofNextHash', arenaState.nextServerHash);
}

async function playDiceDuel() {
  if (arenaState.isRolling) return;
  arenaState.isRolling = true;

  const diceSides = parseInt(document.getElementById('arenaDiceType')?.value || '20', 10);
  const clientSeed = document.getElementById('arenaClientSeed')?.value?.trim() || 'default_seed';
  arenaState.clientSeed = clientSeed;

  const rollBtn = document.getElementById('rollDiceDuelBtn');
  const pBox = document.getElementById('playerDiceBox');
  const bBox = document.getElementById('botDiceBox');
  const pRoll = document.getElementById('playerRollNum');
  const bRoll = document.getElementById('botRollNum');
  const pCard = document.getElementById('playerOneCard');
  const bCard = document.getElementById('playerTwoCard');
  const banner = document.getElementById('duelMatchBanner');
  const bannerText = document.getElementById('duelMatchText');

  if (rollBtn) rollBtn.disabled = true;
  if (pBox) pBox.classList.add('is-rolling');
  if (bBox) bBox.classList.add('is-rolling');
  if (pCard) pCard.className = 'duel-player';
  if (bCard) bCard.className = 'duel-player';
  if (banner) banner.style.display = 'none';

  // Haptic feedback
  if ('vibrate' in navigator) navigator.vibrate(50);

  // Animate rolls for ~750ms
  const shakeInterval = setInterval(() => {
    if (pRoll) pRoll.textContent = Math.floor(Math.random() * diceSides) + 1;
    if (bRoll) bRoll.textContent = Math.floor(Math.random() * diceSides) + 1;
  }, 75);

  if (!arenaState.nextServerSeed) await prepareNextCommitment();
  const serverSeed = arenaState.nextServerSeed;
  const serverHash = arenaState.nextServerHash;
  const nonce = arenaState.nonce;
  const message = `${clientSeed}:${nonce}`;
  const hmacSig = await computeHmacSha256Browser(serverSeed, message);

  setTimeout(async () => {
    clearInterval(shakeInterval);
    if (pBox) pBox.classList.remove('is-rolling');
    if (bBox) bBox.classList.remove('is-rolling');

    // Deterministic dice derivation from HMAC
    const pVal = (parseInt(hmacSig.slice(0, 8), 16) % diceSides) + 1;
    const bVal = (parseInt(hmacSig.slice(8, 16), 16) % diceSides) + 1;

    if (pRoll) pRoll.textContent = pVal;
    if (bRoll) bRoll.textContent = bVal;

    arenaState.nonce++;

    // Reveal this roll's proof, then commit to the next one
    setText('proofServerHash', serverHash);
    setText('proofServerSeed', serverSeed);
    setText('proofMessage', message);
    setText('proofHmac', hmacSig);
    prepareNextCommitment();

    // Evaluate Round
    if (pVal > bVal) {
      arenaState.playerScore++;
      if (pCard) pCard.classList.add('is-winner');
      if (bCard) bCard.classList.add('is-loser');
      showToast(`Round won: you rolled ${pVal} vs Byte's ${bVal}`, 'success');
    } else if (bVal > pVal) {
      arenaState.botScore++;
      if (bCard) bCard.classList.add('is-winner');
      if (pCard) pCard.classList.add('is-loser');
      showToast(`Round lost: Byte rolled ${bVal} vs your ${pVal}`);
    } else {
      showToast(`Tie at ${pVal}`);
    }

    setText('playerScoreBadge', `Rounds won: ${arenaState.playerScore}`);
    setText('botScoreBadge', `Rounds won: ${arenaState.botScore}`);

    // Check Match Completion (Best of 3)
    if (arenaState.playerScore >= 2 || arenaState.botScore >= 2) {
      if (banner) banner.style.display = 'block';
      if (arenaState.playerScore >= 2) {
        arenaState.streak++;
        localStorage.setItem('dds_dice_streak', arenaState.streak);
        if (banner) {
          banner.className = 'callout duel-banner is-ok';
          bannerText.textContent = `Match victory: you beat Byte 2-${arenaState.botScore}. Streak: ${arenaState.streak}`;
        }
        submitLeaderboardScore(arenaState.streak);
      } else {
        arenaState.streak = 0;
        localStorage.setItem('dds_dice_streak', 0);
        if (banner) {
          banner.className = 'callout duel-banner is-error';
          bannerText.textContent = `Match defeat: Byte took it 2-${arenaState.playerScore}. Streak reset.`;
        }
      }
      updateStreakBadge();
      // Reset match scores
      arenaState.playerScore = 0;
      arenaState.botScore = 0;
    }

    if (rollBtn) rollBtn.disabled = false;
    arenaState.isRolling = false;
  }, 750);
}

/**
 * Global Dice Duel Leaderboard API Integration
 */
const leaderboardMessage = (text) => `<li class="muted small">${escapeHtml(text)}</li>`;

async function loadLeaderboardStandings() {
  const container = document.getElementById('arenaLeaderboardList');
  if (!container) return;

  try {
    const res = await fetch(`${API_GATEWAY_URL}/v1/games/leaderboard/dice_duel`);
    if (!res.ok) {
      container.innerHTML = leaderboardMessage('Leaderboard ready for new champion rolls.');
      return;
    }
    const json = await res.json();
    const list = json?.data?.leaderboard || [];
    renderLeaderboardUi(list);
  } catch (err) {
    container.innerHTML = leaderboardMessage('Standings are temporarily unavailable.');
  }
}

function renderLeaderboardUi(standings = []) {
  const container = document.getElementById('arenaLeaderboardList');
  if (!container) return;

  if (!standings || standings.length === 0) {
    container.innerHTML = leaderboardMessage('No duel champions recorded yet. Claim rank #1.');
    return;
  }

  // Player names come from the API (user-submitted): always escape
  container.innerHTML = standings
    .slice(0, 5)
    .map((item, idx) => `
      <li class="leaderboard-row${idx === 0 ? ' is-first' : ''}">
        <span class="mono muted">#${idx + 1}</span>
        <span class="ink">${escapeHtml(String(item.playerName || 'Anonymous').slice(0, 18))}</span>
        <span class="mono push-right">Streak ${Number(item.score) || 0}</span>
      </li>
    `)
    .join('');
}

async function submitLeaderboardScore(streak) {
  if (!streak || streak < 1) return;
  const storedName = localStorage.getItem('dds_player_callsign') || 'Studio Champion';

  try {
    const res = await fetch(`${API_GATEWAY_URL}/v1/games/leaderboard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'dice_duel',
        playerName: storedName,
        score: streak,
        stats: {
          clientSeed: arenaState.clientSeed,
          roundsWon: arenaState.playerScore,
          mode: 'provably-fair',
        },
      }),
    });
    if (res.ok) {
      showToast(`Win streak of ${streak} recorded to the global leaderboard`, 'success');
      loadLeaderboardStandings();
    }
  } catch (err) {
    console.debug('[Leaderboard Submit]', err.message);
  }
}

// Global Exports
window.randomizeClientSeed = randomizeClientSeed;
window.toggleProofDetails = toggleProofDetails;
window.playDiceDuel = playDiceDuel;
window.refreshLeaderboard = loadLeaderboardStandings;

// Initialize streak count, the first fairness commitment and the live leaderboard on boot
updateStreakBadge();
prepareNextCommitment();
loadLeaderboardStandings();

// Shared ecosystem shell behavior + hidden staff command palette (Ctrl+K)
initStudioShell();
initStaffCommandPalette();
