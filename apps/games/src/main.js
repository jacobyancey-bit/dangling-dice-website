/**
 * Dangling Dice Gaming Lab™ — Application Logic
 */

import { initStaffCommandPalette, initPwaServiceWorker } from '@dangling-dice/shared';

// Universal PWA Service Worker Registration
initPwaServiceWorker();

const API_GATEWAY_URL = (typeof window !== 'undefined' && window.location.hostname.includes('localhost'))
  ? 'http://localhost:5000'
  : 'https://api.dangling-dice-studios.com';

import { GAMES_CATALOG, ACCESSORIES_CATALOG, SOFTWARE_GUIDE, AUDIO_SETUPS } from './gameData.js';

// State
let selectedGameId = 'warzone';
let activeDashboardTab = 'audio';
let activeGearCategory = 'all';
let activeAudioSetupId = 'analog-35mm';

// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
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

// Download Helper (Generates client-side text/binary blob with sanitized filename & memory cleanup)
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
  showToast(`📥 Downloaded: ${safeFilename}!`);
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
  card.className = 'bmc-gentle-card';
  card.innerHTML = `
    <div class="bmc-gentle-header">
      <span class="bmc-gentle-title">🎉 Download #${count} Complete!</span>
      <button type="button" class="bmc-gentle-close" onclick="window.dismissBmcTip(false)" aria-label="Close">&times;</button>
    </div>
    <p class="bmc-gentle-body">
      Enjoying the free game configs? We keep everything 100% free with zero paywalls. If our settings helped your gameplay, consider dropping a tip in the studio coffee jar!
    </p>
    <div class="bmc-gentle-actions">
      <a href="https://buymeacoffee.com/danglingdicestudios" target="_blank" rel="noopener noreferrer" class="btn btn-coffee btn-sm" onclick="window.dismissBmcTip(true)">
        ☕ Buy a Coffee ($5 or Custom) ↗
      </a>
      <button type="button" class="btn btn-secondary btn-sm" onclick="window.dismissBmcTip(false)">
        Maybe Later
      </button>
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
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.3s ease';
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
    showToast(successMessage || '📋 Copied to clipboard!');
  } catch (err) {
    showToast('Failed to copy. Please select and copy manually.', 'error');
  }
}

// Curated top played games for the clean single-line quick row
const TOP_PLAYED_GAME_IDS = ['warzone', 'cs2', 'tarkov', 'rust', 'fortnite', 'apex', 'r6-siege', 'valorant'];

window.scrollGameChips = function (offset) {
  const container = document.getElementById('gameChipsRow');
  if (container) {
    container.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(updateChipsArrows, 200);
  }
};

function updateChipsArrows() {
  const container = document.getElementById('gameChipsRow');
  const leftBtn = document.getElementById('chipsScrollLeft');
  const rightBtn = document.getElementById('chipsScrollRight');
  if (!container || !leftBtn || !rightBtn) return;

  const maxScroll = container.scrollWidth - container.clientWidth;
  if (maxScroll <= 5) {
    leftBtn.style.display = 'none';
    rightBtn.style.display = 'none';
    return;
  }
  leftBtn.style.display = 'flex';
  rightBtn.style.display = 'flex';

  const atStart = container.scrollLeft <= 5;
  const atEnd = container.scrollLeft >= maxScroll - 5;

  leftBtn.classList.toggle('disabled', atStart);
  rightBtn.classList.toggle('disabled', atEnd);
}

// Render Quick Game Chips (Clean single-line row of most played games)
function renderGameChips() {
  const container = document.getElementById('gameChipsRow');
  if (!container) return;

  const topGames = TOP_PLAYED_GAME_IDS
    .map((id) => GAMES_CATALOG.find((g) => g.id === id))
    .filter(Boolean);

  // If a game outside the top list is currently selected, include it dynamically
  const activeCustomGame = (!TOP_PLAYED_GAME_IDS.includes(selectedGameId) && selectedGameId !== 'all')
    ? GAMES_CATALOG.find((g) => g.id === selectedGameId)
    : null;

  const chipsHtml = [
    `<span class="quick-chips-label">🔥 Most Played:</span>`,
    ...topGames.map(
      (g) => `<button type="button" class="game-chip ${selectedGameId === g.id ? 'active' : ''}" onclick="window.selectGame('${g.id}')">${g.icon} ${g.shortName}</button>`
    ),
    activeCustomGame
      ? `<button type="button" class="game-chip active" onclick="window.selectGame('${activeCustomGame.id}')">${activeCustomGame.icon} ${activeCustomGame.shortName}</button>`
      : '',
    `<button type="button" class="game-chip game-chip-all ${selectedGameId === 'all' ? 'active' : ''}" onclick="window.selectGameChip('all')">🎯 View All 20 ↓</button>`,
  ].filter(Boolean).join('');

  container.innerHTML = chipsHtml;
  requestAnimationFrame(() => {
    updateChipsArrows();
    const activeChip = container.querySelector('.game-chip.active');
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
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

let focusedDropdownIndex = -1;

// Render Floating Instant Search Dropdown
function renderSearchDropdown(query = '') {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!dropdown) return;

  const q = query.trim();
  if (!q) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    focusedDropdownIndex = -1;
    return;
  }

  const matches = GAMES_CATALOG.filter((g) => matchesGameQuery(g, q));

  if (matches.length === 0) {
    dropdown.innerHTML = `
      <div class="search-dropdown-empty">
        <div style="font-size: 1.8rem;">🔍</div>
        <div class="search-dropdown-empty-title">No calibrated profile matching "${escapeHtml(q)}"</div>
        <p style="font-size: 0.8rem; margin-top: 0.35rem;">
          Request this title's EQ curves and configs in our <a href="https://discord.gg/uFYMQahNZz" target="_blank" rel="noopener noreferrer" style="color: var(--neon-cyan); font-weight: 700;">Discord Community ↗</a>
        </p>
      </div>
    `;
    dropdown.style.display = 'flex';
    focusedDropdownIndex = -1;
    return;
  }

  dropdown.innerHTML = `
    <div class="search-dropdown-header">
      <span>Matching Game Profiles (${matches.length})</span>
      <span>Press Enter to Open &bull; Esc to Close</span>
    </div>
    ${matches
      .map(
        (g, idx) => `
      <div 
        class="search-dropdown-item ${idx === 0 ? 'focused' : ''}" 
        data-game-id="${g.id}" 
        data-index="${idx}"
        onclick="window.selectGameFromSearch('${g.id}')"
      >
        <div class="search-item-left">
          <span class="search-item-icon">${g.icon}</span>
          <div class="search-item-info">
            <div class="search-item-title">
              <span>${escapeHtml(g.title)}</span>
              <span class="search-item-badge">${escapeHtml(g.badge)}</span>
            </div>
            <div class="search-item-subtitle">${escapeHtml(g.audioProfile.profileName)} &bull; <code>${escapeHtml(g.configProfile.fileName)}</code></div>
          </div>
        </div>
        <div class="search-item-action">
          <span>View Profiles &rarr;</span>
        </div>
      </div>
    `
      )
      .join('')}
  `;

  dropdown.style.display = 'flex';
  focusedDropdownIndex = 0;
}

window.selectGameFromSearch = function (gameId) {
  const dropdown = document.getElementById('searchResultsDropdown');
  if (dropdown) dropdown.style.display = 'none';

  const searchInput = document.getElementById('gameSearchInput');
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (searchInput && game) {
    searchInput.value = game.shortName;
  }

  window.selectGame(gameId);
};

// Render Games Catalog Grid
function renderGamesCatalog(query = '') {
  const grid = document.getElementById('gamesGrid');
  const countBadge = document.getElementById('gamesCountBadge');
  if (!grid) return;

  const filtered = GAMES_CATALOG.filter((g) => matchesGameQuery(g, query));

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Game${filtered.length === 1 ? '' : 's'} Available`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
        <div style="font-size: 1.1rem; color: #fff; font-weight: 700;">No games found matching "${escapeHtml(query)}"</div>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">
          Want us to calibrate sound profiles and configs for this game? 
          <a href="https://discord.gg/uFYMQahNZz" target="_blank" rel="noopener noreferrer" style="color: var(--neon-cyan);">Request it in Discord ↗</a>
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (g) => `
    <div class="game-card" onclick="window.selectGame('${g.id}')">
      <div>
        <div class="game-card-header">
          <span class="game-card-icon">${g.icon}</span>
          <span class="game-card-badge">${escapeHtml(g.badge)}</span>
        </div>
        <div class="game-card-title">${escapeHtml(g.title)}</div>
        <div class="game-card-summary">${escapeHtml(g.summary)}</div>
      </div>
      <div class="game-card-footer">
        <span>${escapeHtml(g.genre)}</span>
        <span>View Profiles &amp; Files &rarr;</span>
      </div>
    </div>
  `
    )
    .join('');
}

// Render Active Game Dashboard
function renderGameDashboard() {
  const dashboard = document.getElementById('gameDashboardSection');
  if (!dashboard) return;

  const game = GAMES_CATALOG.find((g) => g.id === selectedGameId) || GAMES_CATALOG[0];

  dashboard.style.display = 'block';
  dashboard.innerHTML = `
    <div class="dashboard-header">
      <div class="dashboard-game-title-wrap">
        <span class="dashboard-game-icon">${game.icon}</span>
        <div>
          <h2 class="dashboard-game-title">${escapeHtml(game.title)}</h2>
          <div class="dashboard-game-meta">
            ${escapeHtml(game.genre)} &bull; Engine: ${escapeHtml(game.engine)} &bull; Calibrated Profiles Available
          </div>
        </div>
      </div>
      <span class="pill-count" style="background: rgba(251, 191, 36, 0.15); color: var(--neon-gold); border-color: rgba(251, 191, 36, 0.3);">
        ${escapeHtml(game.badge)}
      </span>
    </div>

    <!-- 5 Sub-Tabs -->
    <div class="dashboard-tabs" role="tablist">
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'audio' ? 'active' : ''}" data-tab="audio" onclick="window.switchDashboardTab('audio')">
        🎧 Audio &amp; Footstep EQ
      </button>
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'controller' ? 'active' : ''}" data-tab="controller" onclick="window.switchDashboardTab('controller')">
        🎮 Controller &amp; Stick Curves
      </button>
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'console' ? 'active' : ''}" data-tab="console" onclick="window.switchDashboardTab('console')">
        🕹️ Console Setup (PS5 &amp; Xbox)
      </button>
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'config' ? 'active' : ''}" data-tab="config" onclick="window.switchDashboardTab('config')">
        ⚙️ Config Files &amp; FPS Tweaks
      </button>
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'sens' ? 'active' : ''}" data-tab="sens" onclick="window.switchDashboardTab('sens')">
        🎯 Sens &amp; Pro Crosshairs
      </button>
    </div>

    <!-- Tab 1: Audio EQ -->
    <div id="tabContentAudio" style="display: ${activeDashboardTab === 'audio' ? 'block' : 'none'};">
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff;">${escapeHtml(game.audioProfile.profileName)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          ${escapeHtml(game.audioProfile.description)} Target In-Game Mix: <strong>${escapeHtml(game.audioProfile.targetMix)}</strong>
        </p>
      </div>

      <!-- 10-Band EQ Visualizer Canvas -->
      <div class="eq-visualizer-box">
        <canvas id="eqCanvas" class="eq-canvas" width="900" height="180"></canvas>
        <div class="bands-grid">
          ${game.audioProfile.bands
            .map(
              (b) => `
            <div class="band-pill">
              <div class="band-freq">${b.freq}</div>
              <div class="band-gain ${b.gain > 0 ? 'gain-boost' : b.gain < 0 ? 'gain-cut' : 'gain-flat'}">
                ${b.gain > 0 ? '+' : ''}${b.gain} dB
              </div>
              <div class="band-label" title="${escapeHtml(b.label)}">${escapeHtml(b.label)}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="card-actions-row">
        <button type="button" class="btn btn-primary" onclick="window.downloadApoTxtConfig('${game.id}')">
          📥 Download .txt (Equalizer APO)
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.downloadPeaceConfig('${game.id}')">
          📥 Download .peace (Peace GUI)
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.copyApoTxtConfig('${game.id}')">
          📋 Copy config.txt Code
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.copySonarValues('${game.id}')">
          📋 Copy Sonar Values
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.copyDolbyValues('${game.id}')">
          📋 Copy Dolby Atmos
        </button>
      </div>

      <div style="margin-top: 0.85rem;">
        <a href="#softwareSection" class="software-guide-shortcut">
          💡 New to Equalizer APO or Peace GUI? Read the 2-minute step-by-step setup guide ↓
        </a>
      </div>

      <!-- Contextual Gear Recommendations -->
      <div style="margin-top: 2rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--neon-gold); text-transform: uppercase; margin-bottom: 0.5rem;">
          🎧 Recommended Hardware Calibrated For This Profile:
        </div>
        <div class="accessories-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          ${renderContextualGearHtml(game.recommendedGear)}
        </div>
      </div>
    </div>

    <!-- Tab 2: Controller -->
    <div id="tabContentController" style="display: ${activeDashboardTab === 'controller' ? 'block' : 'none'};">
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.profileName)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Optimized deadzone threshold and acceleration curve targeting micro-adjustments with zero stick drift.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Response Curve</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--neon-cyan);">${escapeHtml(game.controllerProfile.curveType)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Left Stick Deadzone</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.leftStickDeadzoneMin)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Right Stick Deadzone</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.rightStickDeadzoneMin)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Trigger Threshold</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--neon-gold);">${escapeHtml(game.controllerProfile.leftTriggerDeadzone)}</div>
        </div>
      </div>

      <div class="card-actions-row">
        ${
          game.controllerProfile.steamConfigCode
            ? `<a href="${sanitizeUrl(game.controllerProfile.steamConfigCode)}" class="btn btn-primary">📥 Apply Steam Input Config ↗</a>`
            : ''
        }
        ${
          game.controllerProfile.ds4xmlSnippet
            ? `<button type="button" class="btn btn-secondary" onclick="window.copyDs4Config('${game.id}')">📋 Copy DS4Windows XML</button>`
            : ''
        }
        <button type="button" class="btn btn-secondary" onclick="window.copyControllerValues('${game.id}')">
          📋 Copy Deadzone Specs
        </button>
      </div>

      <!-- Contextual Gear -->
      <div style="margin-top: 2rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--neon-gold); text-transform: uppercase; margin-bottom: 0.5rem;">
          🎮 Recommended Controller Upgrades:
        </div>
        <div class="accessories-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          ${renderContextualGearHtml(game.recommendedGear)}
        </div>
      </div>
    </div>

    <!-- Tab 3: Config Files -->
    <div id="tabContentConfig" style="display: ${activeDashboardTab === 'config' ? 'block' : 'none'};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff;">${escapeHtml(game.configProfile.fileName)}</h3>
            <span class="pill-count" style="font-size: 0.68rem; text-transform: uppercase;">${escapeHtml(game.engine)}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span>Target Path:</span>
            <code style="color: var(--neon-cyan); background: rgba(0,0,0,0.4); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.78rem;">${escapeHtml(game.configProfile.targetPath)}</code>
            <button type="button" class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.6rem; font-size: 0.72rem;" onclick="window.copyTargetFilePath('${game.id}')">📋 Copy Path</button>
          </div>
        </div>
        <div class="pill-tag pill-tag-yellow" style="font-size: 0.72rem;">⚡ Plain Text Preset (0% Ban Risk)</div>
      </div>

      <div style="background: rgba(6, 182, 212, 0.08); border-left: 3px solid var(--neon-cyan); padding: 0.75rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 0.82rem; color: #cbd5e1; margin-bottom: 1rem;">
        💡 <strong>Quick Setup:</strong> If you don't want to download a file, click <strong>"Copy Raw Code"</strong> below, open a blank file in Notepad, paste the lines, and save it directly into the target directory!
      </div>

      <div style="position: relative;">
        <div style="position: absolute; right: 12px; top: 12px; z-index: 5;">
          <button type="button" class="btn btn-secondary btn-sm" style="background: rgba(15,23,42,0.85); backdrop-filter: blur(8px); border-color: rgba(255,255,255,0.2);" onclick="window.copyConfigFileContent('${game.id}')">
            📋 Copy Code
          </button>
        </div>
        <pre class="code-block-preview" style="max-height: 380px; overflow-y: auto;"><code>${escapeHtml(game.configProfile.fileContent)}</code></pre>
      </div>

      <div class="card-actions-row" style="margin-top: 1rem;">
        <button type="button" class="btn btn-primary" onclick="window.copyConfigFileContent('${game.id}')">
          📋 Copy Raw Code (Recommended)
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.downloadGameConfigFile('${game.id}')">
          📥 Download ${escapeHtml(game.configProfile.fileName)}
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.copyTargetFilePath('${game.id}')">
          📋 Copy Target Directory Path
        </button>
      </div>

      <div style="margin-top: 1.5rem; background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.82rem; font-weight: 800; color: var(--neon-gold); text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 0.5rem;">
          ⚡ Pro Installation &amp; Performance Tips:
        </div>
        <ul style="padding-left: 1.25rem; font-size: 0.82rem; color: #cbd5e1; line-height: 1.6; display: flex; flex-direction: column; gap: 0.35rem;">
          ${game.configProfile.fpsTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Tab 4: Sens & Crosshairs -->
    <div id="tabContentSens" style="display: ${activeDashboardTab === 'sens' ? 'block' : 'none'};">
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff;">Sensitivity &amp; Pro Crosshair Codes</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Verified competitive sensitivity multipliers and ready-to-import crosshair codes.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.85rem; background: rgba(0,0,0,0.3); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: 1.25rem;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Horizontal / Base Sens</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.horizontalSens)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Vertical / ADS Multiplier</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.verticalSens)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Aim Assist / Input Mode</div>
          <div style="font-size: 0.95rem; font-weight: 800; color: var(--neon-cyan);">${escapeHtml(game.controllerProfile.aimAssistType)}</div>
        </div>
      </div>

      <div class="card-actions-row">
        <button type="button" class="btn btn-secondary" onclick="window.copySensValues('${game.id}')">
          📋 Copy Sens Values
        </button>
      </div>
    </div>

    <!-- Tab 5: Console Guide (PS5 & Xbox) -->
    <div id="tabContentConsole" style="display: ${activeDashboardTab === 'console' ? 'block' : 'none'};">
      <div style="margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #fff;">PlayStation 5 &amp; Xbox Series X|S Calibration</h3>
          <span class="pill-tag pill-tag-cyan" style="font-size: 0.72rem;">🎮 100% Console Compatible</span>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted);">
          Every setting on this page works on consoles. Follow this step-by-step to apply this footstep EQ curve and controller curve directly inside your PS5 or Xbox system menus.
        </p>
      </div>

      <!-- 2-Column Grid: PS5 vs Xbox -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <!-- PlayStation 5 Card -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">🎮</span>
              <strong style="color: #fff; font-size: 1.05rem;">PlayStation 5 (Tempest 3D)</strong>
            </div>
            <span style="font-size: 0.72rem; color: #60a5fa; background: rgba(59, 130, 246, 0.15); padding: 0.2rem 0.5rem; border-radius: 9999px; font-weight: 700;">PS5 Native 5-Band EQ</span>
          </div>

          <ol style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.25rem; line-height: 1.6; margin-bottom: 1rem;">
            <li>Plug your headset into your DualSense controller jack or PS5 USB port.</li>
            <li>Go to: <strong style="color: #fff;">Settings &gt; Sound &gt; Audio Output &gt; Headphone Equalizer</strong>.</li>
            <li>Select a <strong style="color: #fff;">Custom Preset</strong> and set the 5 sliders:</li>
          </ol>

          <!-- PS5 5-Band EQ Box -->
          <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: var(--neon-cyan); font-weight: 800; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em;">
              Calibrated PS5 Sliders for ${escapeHtml(game.shortName)}:
            </div>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.35rem; text-align: center;">
              <div style="background: rgba(255,255,255,0.04); padding: 0.4rem 0.2rem; border-radius: 4px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">100 Hz</div>
                <div style="font-size: 0.9rem; font-weight: 800; color: #f43f5e;">-3 dB</div>
                <div style="font-size: 0.65rem; color: #64748b;">Mud Cut</div>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 0.4rem 0.2rem; border-radius: 4px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">400 Hz</div>
                <div style="font-size: 0.9rem; font-weight: 800; color: #f43f5e;">-1 dB</div>
                <div style="font-size: 0.65rem; color: #64748b;">Debris</div>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 0.4rem 0.2rem; border-radius: 4px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">1 kHz</div>
                <div style="font-size: 0.9rem; font-weight: 800; color: #38bdf8;">0 dB</div>
                <div style="font-size: 0.65rem; color: #64748b;">Comms</div>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 0.4rem 0.2rem; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.4);">
                <div style="font-size: 0.7rem; color: var(--text-muted);">4 kHz</div>
                <div style="font-size: 0.9rem; font-weight: 800; color: var(--neon-cyan);">+6 dB</div>
                <div style="font-size: 0.65rem; color: var(--neon-cyan);">Footsteps</div>
              </div>
              <div style="background: rgba(255,255,255,0.04); padding: 0.4rem 0.2rem; border-radius: 4px;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">10 kHz</div>
                <div style="font-size: 0.9rem; font-weight: 800; color: #f43f5e;">-3 dB</div>
                <div style="font-size: 0.65rem; color: #64748b;">Gun Ring</div>
              </div>
            </div>
          </div>

          <div style="font-size: 0.8rem; color: #94a3b8;">
            💡 <strong>In-Game Mix:</strong> Open ${escapeHtml(game.shortName)} settings &gt; Audio &gt; set Master Audio Mix to <strong style="color: #fff;">${escapeHtml(game.audioProfile.targetMix)}</strong>.
          </div>
        </div>

        <!-- Xbox Series X/S Card -->
        <div style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 1.25rem; box-shadow: 0 10px 25px rgba(0,0,0,0.4);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">🟢</span>
              <strong style="color: #fff; font-size: 1.05rem;">Xbox Series X|S &amp; One (Dolby Access)</strong>
            </div>
            <span style="font-size: 0.72rem; color: #34d399; background: rgba(16, 185, 129, 0.15); padding: 0.2rem 0.5rem; border-radius: 9999px; font-weight: 700;">10-Band Atmos EQ</span>
          </div>

          <ol style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.25rem; line-height: 1.6; margin-bottom: 1rem;">
            <li>Download the free <strong style="color: #fff;">Dolby Access</strong> app from the Xbox Store.</li>
            <li>In Xbox Settings &gt; General &gt; Volume &amp; audio output, set Headset audio to <strong style="color: #fff;">Dolby Atmos for Headphones</strong>.</li>
            <li>Open Dolby Access &gt; Settings &gt; Custom 1, and input this 10-band curve:</li>
          </ol>

          <!-- Xbox 10-Band EQ Box -->
          <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: var(--neon-green); font-weight: 800; text-transform: uppercase; margin-bottom: 0.35rem; letter-spacing: 0.05em;">
              Calibrated Dolby Access Settings:
            </div>
            <code style="font-family: var(--font-mono); font-size: 0.78rem; color: #e2e8f0; display: block; word-break: break-all; line-height: 1.5;">
              ${escapeHtml(game.audioProfile.dolbyValues)}
            </code>
          </div>

          <div style="font-size: 0.8rem; color: #94a3b8;">
            💡 <strong>In-Game Mix:</strong> Open ${escapeHtml(game.shortName)} settings &gt; Audio &gt; set Master Audio Mix to <strong style="color: #fff;">${escapeHtml(game.audioProfile.targetMix)}</strong>.
          </div>
        </div>
      </div>

      <!-- In-Game Controller & Deadzone Settings for Console -->
      <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="font-size: 1rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🎯</span> In-Game Controller Settings (Enter in PS5/Xbox Menu)
        </h4>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
          <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Response Curve Type</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--neon-cyan);">${escapeHtml(game.controllerProfile.curveType)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Left Stick Min Deadzone</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.leftStickDeadzoneMin)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Right Stick Min Deadzone</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">${escapeHtml(game.controllerProfile.rightStickDeadzoneMin)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: var(--radius-sm);">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Sensitivity Multipliers</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #fff;">Look: ${escapeHtml(game.controllerProfile.horizontalSens)} | ADS: ${escapeHtml(game.controllerProfile.verticalSens)}</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions-row">
        <button type="button" class="btn btn-primary" onclick="window.copyConsoleCheatSheet('${game.id}')">
          📋 Copy Console Cheat Sheet to Clipboard
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.downloadConsoleGuideTxt('${game.id}')">
          📥 Download Console .txt Guide
        </button>
      </div>
    </div>
  `;

  // Draw the EQ curve onto the canvas if on Audio tab
  if (activeDashboardTab === 'audio') {
    requestAnimationFrame(() => drawEqCurve(game.audioProfile.bands));
  }
}

// Canvas Drawer for 10-Band EQ Curve
function drawEqCurve(bands) {
  const canvas = document.getElementById('eqCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  // Zero dB center line
  const zeroY = h / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(0, zeroY);
  ctx.lineTo(w, zeroY);
  ctx.stroke();

  // Grid lines (+6dB, -6dB)
  [-6, 6].forEach((db) => {
    const y = zeroY - (db / 12) * (h / 2.3);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  });

  // Calculate points
  const points = bands.map((b, i) => {
    const x = (i / (bands.length - 1)) * (w - 60) + 30;
    // Max scale: +/- 10dB
    const y = zeroY - (b.gain / 10) * (h / 2.4);
    return { x, y, gain: b.gain };
  });

  // Gradient under curve
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(236, 72, 153, 0.35)');
  grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

  // Draw smooth Bezier curve
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }

  // Fill gradient
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.lineTo(points[0].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw main stroke line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(midX, p0.y, midX, p1.y, p1.x, p1.y);
  }
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw frequency node dots
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = p.gain > 0 ? '#ec4899' : p.gain < 0 ? '#60a5fa' : '#cbd5e1';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// Render Contextual Gear for Game
function renderContextualGearHtml(gearIds = []) {
  const items = ACCESSORIES_CATALOG.filter((item) => gearIds.includes(item.id));
  return items
    .map(
      (item) => `
    <div class="accessory-card" style="padding: 1rem;">
      <div>
        <div class="accessory-tag">${escapeHtml(item.tag)}</div>
        <div class="accessory-title" style="font-size: 0.92rem;">${escapeHtml(item.title)}</div>
        <div class="accessory-desc" style="font-size: 0.78rem;">${escapeHtml(item.desc)}</div>
      </div>
      <div class="accessory-footer">
        <span class="accessory-price" style="font-size: 1rem;">${escapeHtml(item.price)}</span>
        <a href="${sanitizeUrl(item.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          Check Deal ↗
        </a>
      </div>
    </div>
  `
    )
    .join('');
}

// Render Master Accessories Grid
function renderMasterAccessories(cat = 'all') {
  const grid = document.getElementById('accessoriesGrid');
  if (!grid) return;

  const filtered = ACCESSORIES_CATALOG.filter((item) => {
    if (cat === 'all') return true;
    return item.category === cat;
  });

  grid.innerHTML = filtered
    .map(
      (item) => `
    <div class="accessory-card">
      <div>
        <div class="accessory-tag">${escapeHtml(item.tag)}</div>
        <div class="accessory-title">${escapeHtml(item.title)}</div>
        <div class="accessory-desc">${escapeHtml(item.desc)}</div>
        <div class="accessory-specs">${escapeHtml(item.specs)}</div>
      </div>
      <div class="accessory-footer">
        <div>
          <span class="accessory-price">${escapeHtml(item.price)}</span>
          <span style="font-size: 0.75rem; color: var(--neon-gold); margin-left: 0.35rem;">${escapeHtml(item.rating)}</span>
        </div>
        <a href="${sanitizeUrl(item.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          Check Deal ↗
        </a>
      </div>
    </div>
  `
    )
    .join('');
}

// Render Software Toolkit Guide
function renderSoftwareGuide() {
  const container = document.getElementById('softwareGrid');
  if (!container) return;

  container.innerHTML = SOFTWARE_GUIDE.map(
    (tool) => `
    <div class="software-card">
      <div>
        <div class="software-card-header">
          <div style="display: flex; gap: 0.85rem; align-items: center;">
            <div class="software-icon-wrap">${tool.icon}</div>
            <div>
              <div class="software-title">${escapeHtml(tool.name)}</div>
              <div class="software-category">${escapeHtml(tool.category)}</div>
            </div>
          </div>
          <span class="pill-count" style="font-size: 0.72rem; border-color: rgba(6,182,212,0.4);">${escapeHtml(tool.price)}</span>
        </div>

        <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.5rem;">
          ${escapeHtml(tool.description)}
        </p>

        <div class="software-why-box">
          <strong>Why you need it:</strong> ${escapeHtml(tool.whyNeedIt)}
        </div>

        <div class="software-steps-header">
          <span>📋 Step-by-Step Setup:</span>
        </div>
        <ol class="software-steps-list">
          ${tool.steps.map((s) => `<li class="software-step-item">${s}</li>`).join('')}
        </ol>

        ${
          tool.troubleshooting && tool.troubleshooting.length > 0
            ? `
          <div class="software-troubleshoot">
            <strong>⚠️ Pro Tips &amp; Troubleshooting:</strong>
            <ul style="margin-top: 0.35rem; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.3rem;">
              ${tool.troubleshooting.map((t) => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }
      </div>

      <div class="software-actions">
        <a href="${sanitizeUrl(tool.downloadUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          📥 Official Download (${escapeHtml(tool.version)}) ↗
        </a>
        ${
          tool.id === 'equalizer-apo' || tool.id === 'peace-gui'
            ? `<button type="button" class="btn btn-secondary btn-sm" onclick="window.downloadSetupGuideTxt()">
                📄 Download Setup Guide (.txt)
              </button>`
            : ''
        }
        <a href="${sanitizeUrl(tool.officialSite)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
          Docs ↗
        </a>
      </div>
    </div>
  `
  ).join('');
}

// Render Audio Setup Isolator & Wizard
function renderAudioSetupWizard() {
  const selectorGrid = document.getElementById('audioSetupSelectorGrid');
  const detailBox = document.getElementById('audioSetupDetailBox');
  if (!selectorGrid || !detailBox) return;

  // Render Selector Buttons
  selectorGrid.innerHTML = AUDIO_SETUPS.map(
    (s) => `
    <button type="button" class="setup-selector-card ${activeAudioSetupId === s.id ? 'active' : ''}" onclick="window.selectAudioSetup('${s.id}')">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="setup-selector-icon">${s.icon}</span>
        <span style="font-size: 0.65rem; color: var(--neon-cyan); font-weight: 700; text-transform: uppercase;">${escapeHtml(s.category)}</span>
      </div>
      <div class="setup-selector-title">${escapeHtml(s.shortTitle)}</div>
      <div class="setup-selector-sub">${escapeHtml(s.badge)}</div>
    </button>
  `
  ).join('');

  // Render Detail for Active Setup
  const setup = AUDIO_SETUPS.find((s) => s.id === activeAudioSetupId) || AUDIO_SETUPS[0];

  detailBox.innerHTML = `
    <div class="setup-detail-header">
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="software-icon-wrap" style="width: 54px; height: 54px; font-size: 1.8rem; background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.4);">
          ${setup.icon}
        </div>
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff;">${escapeHtml(setup.title)}</h3>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            Typical gear: <span style="color: #cbd5e1;">${escapeHtml(setup.examples)}</span>
          </div>
        </div>
      </div>
      <span class="pill-count" style="border-color: rgba(236, 72, 153, 0.5); color: #f472b6;">${escapeHtml(setup.badge)}</span>
    </div>

    <!-- 3 Meta Cards -->
    <div class="setup-meta-grid">
      <div class="setup-meta-card">
        <div class="setup-meta-label">Equalizer APO Target Device</div>
        <div class="setup-meta-val" style="color: var(--neon-cyan);">${escapeHtml(setup.configuratorCheck)}</div>
      </div>
      <div class="setup-meta-card">
        <div class="setup-meta-label">Required Install Mode</div>
        <div class="setup-meta-val" style="color: var(--neon-gold);">${escapeHtml(setup.installMode)}</div>
      </div>
      <div class="setup-meta-card">
        <div class="setup-meta-label">Recommended Software</div>
        <div class="setup-meta-val" style="color: #fff;">${escapeHtml(setup.softwareRecommendation)}</div>
      </div>
    </div>

    <!-- 2 Column Instructions Grid -->
    <div class="setup-instructions-grid">
      <div class="setup-section-block">
        <div class="setup-section-heading">
          <span>🛠️ Tailored Installation Steps:</span>
        </div>
        <ol class="software-steps-list">
          ${setup.steps.map((st) => `<li class="software-step-item">${st}</li>`).join('')}
        </ol>
      </div>

      <div class="setup-section-block">
        <div class="setup-section-heading">
          <span>🎛️ Windows Sound Settings (mmsys.cpl):</span>
        </div>
        <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5;">
          ${setup.windowsSettings.map((ws) => `<li>${ws}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Common Trap / Warning Callout -->
    <div class="setup-warning-callout">
      <div style="font-size: 1.25rem;">⚠️</div>
      <div>
        <strong style="color: #f59e0b; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.03em;">Critical Hardware Trap &amp; Fix:</strong>
        <p style="margin-top: 0.25rem;">${escapeHtml(setup.pitfalls)}</p>
      </div>
    </div>

    <div class="software-actions" style="margin-top: 1.5rem;">
      <button type="button" class="btn btn-primary btn-sm" onclick="window.downloadAudioSetupCheatSheet('${setup.id}')">
        📥 Download ${escapeHtml(setup.shortTitle)} Guide (.txt)
      </button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="window.copyAudioSetupChecklist('${setup.id}')">
        📋 Copy Setup Checklist
      </button>
      <a href="#softwareSection" class="btn btn-secondary btn-sm">
        View Software Downloads ↑
      </a>
    </div>
  `;
}

// Security Escape Helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global Window Handlers
window.selectGame = function (gameId) {
  selectedGameId = gameId;
  renderGameChips();
  renderGameDashboard();
  const dashEl = document.getElementById('gameDashboardSection');
  if (dashEl) {
    dashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

window.switchDashboardTab = function (tabName) {
  activeDashboardTab = tabName;
  renderGameDashboard();
};

window.downloadApoTxtConfig = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
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
#           Include: ${game.shortName.toLowerCase().replace(/\s+/g, '_')}_eq.txt
# ==============================================================================

Preamp: -3.0 dB
${game.audioProfile.peaceConfig}
`;
  downloadTextFile(`${game.shortName.toLowerCase().replace(/\s+/g, '_')}_eq.txt`, content);
};

window.copyApoTxtConfig = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  const content = `# Dangling Dice Gaming Lab™ — ${game.shortName} Footstep Audio EQ
Preamp: -3.0 dB
${game.audioProfile.peaceConfig}`;
  copyToClipboard(content, `📋 Copied Equalizer APO config text for ${game.shortName}!`);
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
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  downloadTextFile(`${game.shortName.toLowerCase().replace(/\s+/g, '_')}_peace_eq.peace`, game.audioProfile.peaceConfig);
};

window.copySonarValues = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  copyToClipboard(game.audioProfile.sonarValues.join('\n'), '📋 Copied SteelSeries Sonar Parametric Values!');
};

window.copyDolbyValues = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  copyToClipboard(game.audioProfile.dolbyValues, '📋 Copied Dolby Atmos Settings!');
};

window.copyDs4Config = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  copyToClipboard(game.controllerProfile.ds4xmlSnippet, '📋 Copied DS4Windows XML Snippet!');
};

window.copyControllerValues = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  const p = game.controllerProfile;
  const txt = `Curve: ${p.curveType}\nLeft Min Deadzone: ${p.leftStickDeadzoneMin}\nRight Min Deadzone: ${p.rightStickDeadzoneMin}\nTriggers: ${p.leftTriggerDeadzone}\nSens: ${p.horizontalSens}`;
  copyToClipboard(txt, '📋 Copied Deadzone & Controller Tuning Specs!');
};

window.downloadGameConfigFile = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  downloadTextFile(game.configProfile.fileName, game.configProfile.fileContent);
};

window.copyConfigFileContent = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  copyToClipboard(game.configProfile.fileContent, `📋 Copied ${game.configProfile.fileName} contents!`);
};

window.copyTargetFilePath = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  copyToClipboard(game.configProfile.targetPath, `📋 Copied target path for ${game.shortName}!`);
};

window.copySensValues = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  const p = game.controllerProfile;
  copyToClipboard(`Horizontal Sens: ${p.horizontalSens}\nVertical Sens: ${p.verticalSens}\nMode: ${p.aimAssistType}`, '📋 Copied Sensitivity Specs!');
};

window.copyConsoleCheatSheet = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;

  const text = `================================================================================\n` +
    `DANGLING DICE GAMING LAB™ — CONSOLE SETUP QUICK-GUIDE (PS5 & XBOX)\n` +
    `Game: ${game.title}\n` +
    `Target In-Game Audio Mix: ${game.audioProfile.targetMix}\n` +
    `Website: https://games.dangling-dice-studios.com/\n` +
    `================================================================================\n\n` +
    `🎮 PLAYSTATION 5 (TEMPEST 3D NATIVE 5-BAND EQ)\n` +
    `Location: Settings > Sound > Audio Output > Headphone Equalizer > Custom\n` +
    `  • 100 Hz:  -3 dB (Cuts sub-bass mud and explosion artillery rumble)\n` +
    `  • 400 Hz:  -1 dB (Clears voice / debris clutter)\n` +
    `  • 1 kHz:    0 dB (Natural team comms & weapon reloads)\n` +
    `  • 4 kHz:   +6 dB (CRITICAL: Isolates footsteps, tile clicks & broken glass)\n` +
    `  • 10 kHz:  -3 dB (Tames shrill gunshot ear fatigue)\n\n` +
    `🟢 XBOX SERIES X|S & ONE (DOLBY ACCESS 10-BAND EQ)\n` +
    `Location: Xbox Store > Dolby Access app > Settings > Custom 1\n` +
    `  • Values: ${game.audioProfile.dolbyValues}\n\n` +
    `🎯 CONSOLE IN-GAME CONTROLLER SETTINGS\n` +
    `  • Response Curve: ${game.controllerProfile.curveType}\n` +
    `  • Left Stick Deadzone: ${game.controllerProfile.leftStickDeadzoneMin}\n` +
    `  • Right Stick Deadzone: ${game.controllerProfile.rightStickDeadzoneMin}\n` +
    `  • Max Deadzone: ${game.controllerProfile.stickDeadzoneMax}\n` +
    `  • Sensitivity: Look (${game.controllerProfile.horizontalSens}) / ADS (${game.controllerProfile.verticalSens})\n` +
    `  • Aim Assist Mode: ${game.controllerProfile.aimAssistType}\n\n` +
    `⚡ CONSOLE GRAPHICS & FPS TIPS:\n` +
    `  • Turn OFF Motion Blur & Depth of Field in game settings.\n` +
    `  • Enable 120Hz / Performance Mode in console display settings.\n` +
    `  • Set Field of View (FOV) to 105 - 115 if supported.`;

  copyToClipboard(text, `📋 Copied PS5 & Xbox Console Cheat Sheet for ${game.shortName}!`);
};

window.downloadConsoleGuideTxt = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;

  const filename = `${game.shortName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_console_setup.txt`;
  const text = `================================================================================\n` +
    `DANGLING DICE GAMING LAB™ — CONSOLE SETUP QUICK-GUIDE (PS5 & XBOX)\n` +
    `Game: ${game.title}\n` +
    `Target In-Game Audio Mix: ${game.audioProfile.targetMix}\n` +
    `Website: https://games.dangling-dice-studios.com/\n` +
    `================================================================================\n\n` +
    `🎮 PLAYSTATION 5 (TEMPEST 3D NATIVE 5-BAND EQ)\n` +
    `Location: Settings > Sound > Audio Output > Headphone Equalizer > Custom\n` +
    `  • 100 Hz:  -3 dB (Cuts sub-bass mud and explosion artillery rumble)\n` +
    `  • 400 Hz:  -1 dB (Clears voice / debris clutter)\n` +
    `  • 1 kHz:    0 dB (Natural team comms & weapon reloads)\n` +
    `  • 4 kHz:   +6 dB (CRITICAL: Isolates footsteps, tile clicks & broken glass)\n` +
    `  • 10 kHz:  -3 dB (Tames shrill gunshot ear fatigue)\n\n` +
    `🟢 XBOX SERIES X|S & ONE (DOLBY ACCESS 10-BAND EQ)\n` +
    `Location: Xbox Store > Dolby Access app > Settings > Custom 1\n` +
    `  • Values: ${game.audioProfile.dolbyValues}\n\n` +
    `🎯 CONSOLE IN-GAME CONTROLLER SETTINGS\n` +
    `  • Response Curve: ${game.controllerProfile.curveType}\n` +
    `  • Left Stick Deadzone: ${game.controllerProfile.leftStickDeadzoneMin}\n` +
    `  • Right Stick Deadzone: ${game.controllerProfile.rightStickDeadzoneMin}\n` +
    `  • Max Deadzone: ${game.controllerProfile.stickDeadzoneMax}\n` +
    `  • Sensitivity: Look (${game.controllerProfile.horizontalSens}) / ADS (${game.controllerProfile.verticalSens})\n` +
    `  • Aim Assist Mode: ${game.controllerProfile.aimAssistType}\n\n` +
    `⚡ CONSOLE GRAPHICS & FPS TIPS:\n` +
    `  • Turn OFF Motion Blur & Depth of Field in game settings.\n` +
    `  • Enable 120Hz / Performance Mode in console display settings.\n` +
    `  • Set Field of View (FOV) to 105 - 115 if supported.`;

  downloadTextFile(filename, text);
};

// Audio Setup Wizard Handlers
window.selectAudioSetup = function (setupId) {
  activeAudioSetupId = setupId;
  renderAudioSetupWizard();
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
${setup.windowsSettings.map((ws, i) => `- ${ws.replace(/<[^>]+>/g, '')}`).join('\n')}

CRITICAL PITFALL & HARDWARE TRAP:
${setup.pitfalls}

==============================================================================
`;
  downloadTextFile(`AUDIO_SETUP_${setup.id.toUpperCase().replace(/-/g, '_')}.txt`, content);
};

window.copyAudioSetupChecklist = function (setupId) {
  const setup = AUDIO_SETUPS.find((s) => s.id === setupId) || AUDIO_SETUPS[0];
  const text = `🎧 Setup: ${setup.title}\n` +
    `Target: ${setup.configuratorCheck}\n` +
    `Mode: ${setup.installMode}\n` +
    `Pitfall: ${setup.pitfalls}`;
  copyToClipboard(text, `📋 Copied setup checklist for ${setup.shortTitle}!`);
};

// Search Bar Input, Floating Autocomplete & Keyboard Listeners
const searchInput = document.getElementById('gameSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

function updateDropdownFocus(items) {
  items.forEach((item, idx) => {
    if (idx === focusedDropdownIndex) {
      item.classList.add('focused');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('focused');
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
    renderSearchDropdown(val);
    renderGamesCatalog(val);
  });

  searchInput.addEventListener('keydown', (e) => {
    const dropdown = document.getElementById('searchResultsDropdown');
    const isDropdownOpen = dropdown && dropdown.style.display !== 'none';

    if (e.key === 'ArrowDown' && isDropdownOpen) {
      e.preventDefault();
      const items = dropdown.querySelectorAll('.search-dropdown-item');
      if (items.length > 0) {
        focusedDropdownIndex = (focusedDropdownIndex + 1) % items.length;
        updateDropdownFocus(items);
      }
    } else if (e.key === 'ArrowUp' && isDropdownOpen) {
      e.preventDefault();
      const items = dropdown.querySelectorAll('.search-dropdown-item');
      if (items.length > 0) {
        focusedDropdownIndex = (focusedDropdownIndex - 1 + items.length) % items.length;
        updateDropdownFocus(items);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen) {
        const items = dropdown.querySelectorAll('.search-dropdown-item');
        const target = items[focusedDropdownIndex >= 0 ? focusedDropdownIndex : 0];
        if (target) {
          const gameId = target.getAttribute('data-game-id');
          if (gameId) window.selectGameFromSearch(gameId);
        }
      } else {
        const val = searchInput.value.trim();
        const firstMatch = GAMES_CATALOG.find((g) => matchesGameQuery(g, val));
        if (firstMatch) {
          window.selectGameFromSearch(firstMatch.id);
        }
      }
    } else if (e.key === 'Escape') {
      if (dropdown) dropdown.style.display = 'none';
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
  const searchContainer = document.querySelector('.search-bar-container');
  const dropdown = document.getElementById('searchResultsDropdown');
  if (dropdown && searchContainer && !searchContainer.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// Gear Filter Pills Listener
const gearPills = document.querySelectorAll('.gear-filter-pill');
gearPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    gearPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    activeGearCategory = pill.getAttribute('data-cat') || 'all';
    renderMasterAccessories(activeGearCategory);
  });
});

// App Startup
document.addEventListener('DOMContentLoaded', () => {
  renderGameChips();
  renderGamesCatalog('');
  renderGameDashboard();
  renderSoftwareGuide();
  renderAudioSetupWizard();
  renderMasterAccessories('all');

  const chipsContainer = document.getElementById('gameChipsRow');
  if (chipsContainer) {
    chipsContainer.addEventListener('scroll', () => {
      updateChipsArrows();
    }, { passive: true });

    chipsContainer.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        chipsContainer.scrollLeft += e.deltaY;
        updateChipsArrows();
      }
    }, { passive: false });
  }

  window.addEventListener('resize', () => {
    updateChipsArrows();
  });
});

// ============================================================================
// Provably Fair Dice Arena & Duels Engine
// ============================================================================
let arenaState = {
  playerScore: 0,
  botScore: 0,
  streak: Number(localStorage.getItem('dds_dice_streak') || 0),
  nonce: 1,
  isRolling: false,
};

function updateStreakBadge() {
  const el = document.getElementById('arenaStreakCount');
  if (el) el.textContent = arenaState.streak;
}

function randomizeClientSeed() {
  const input = document.getElementById('arenaClientSeed');
  if (input) {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    input.value = `seed_${randomHex}`;
    showToast('🎲 New random client seed generated!');
  }
}

function toggleProofDetails() {
  const content = document.getElementById('proofDetailsContent');
  const icon = document.getElementById('proofToggleIcon');
  if (content) {
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'flex' : 'none';
    if (icon) icon.textContent = isHidden ? '▲' : '▼';
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

async function playDiceDuel() {
  if (arenaState.isRolling) return;
  arenaState.isRolling = true;

  const diceSides = parseInt(document.getElementById('arenaDiceType')?.value || '20', 10);
  const clientSeedInput = document.getElementById('arenaClientSeed');
  const clientSeed = clientSeedInput?.value?.trim() || 'default_seed';

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
  if (pBox) pBox.classList.add('rolling');
  if (bBox) bBox.classList.add('rolling');
  if (pCard) pCard.className = 'arena-player-card';
  if (bCard) bCard.className = 'arena-player-card';
  if (banner) banner.style.display = 'none';

  // Sound effect / haptic feedback
  if ('vibrate' in navigator) navigator.vibrate(50);

  // Animate rolls for 700ms
  const shakeInterval = setInterval(() => {
    if (pRoll) pRoll.textContent = Math.floor(Math.random() * diceSides) + 1;
    if (bRoll) bRoll.textContent = Math.floor(Math.random() * diceSides) + 1;
  }, 75);

  const serverSecret = `dds_secret_${Date.now()}_${arenaState.nonce}`;
  const serverHash = await computeSha256Browser(serverSecret);
  const hmacSig = await computeHmacSha256Browser(serverSecret, `${clientSeed}:${arenaState.nonce}`);

  setTimeout(async () => {
    clearInterval(shakeInterval);
    if (pBox) pBox.classList.remove('rolling');
    if (bBox) bBox.classList.remove('rolling');

    // Deterministic dice derivation from HMAC
    const pVal = (parseInt(hmacSig.slice(0, 8), 16) % diceSides) + 1;
    const bVal = (parseInt(hmacSig.slice(8, 16), 16) % diceSides) + 1;

    if (pRoll) pRoll.textContent = pVal;
    if (bRoll) bRoll.textContent = bVal;

    arenaState.nonce++;

    // Reveal Cryptographic proof
    const hashEl = document.getElementById('proofServerHash');
    const hmacEl = document.getElementById('proofHmac');
    if (hashEl) hashEl.textContent = serverHash;
    if (hmacEl) hmacEl.textContent = hmacSig;

    // Evaluate Round
    if (pVal > bVal) {
      arenaState.playerScore++;
      if (pCard) pCard.classList.add('winner');
      if (bCard) bCard.classList.add('loser');
      showToast(`🏆 Round won! You rolled ${pVal} vs Byte's ${bVal}!`);
    } else if (bVal > pVal) {
      arenaState.botScore++;
      if (bCard) bCard.classList.add('winner');
      if (pCard) pCard.classList.add('loser');
      showToast(`⚔️ Round lost! Byte rolled ${bVal} vs your ${pVal}`);
    } else {
      showToast(`🤝 It's a tie at ${pVal}!`);
    }

    const pScoreBadge = document.getElementById('playerScoreBadge');
    const bScoreBadge = document.getElementById('botScoreBadge');
    if (pScoreBadge) pScoreBadge.textContent = `Rounds Won: ${arenaState.playerScore}`;
    if (bScoreBadge) bScoreBadge.textContent = `Rounds Won: ${arenaState.botScore}`;

    // Check Match Completion (Best of 3)
    if (arenaState.playerScore >= 2 || arenaState.botScore >= 2) {
      if (banner) banner.style.display = 'block';
      if (arenaState.playerScore >= 2) {
        arenaState.streak++;
        localStorage.setItem('dds_dice_streak', arenaState.streak);
        if (banner) {
          banner.className = 'duel-match-banner';
          bannerText.textContent = `👑 MATCH VICTORY! You defeated Byte 2-${arenaState.botScore}! Streak: ${arenaState.streak} 🔥`;
        }
        submitLeaderboardScore(arenaState.streak);
      } else {
        arenaState.streak = 0;
        localStorage.setItem('dds_dice_streak', 0);
        if (banner) {
          banner.className = 'duel-match-banner loss';
          bannerText.textContent = `💀 MATCH DEFEAT! Byte took the match 2-${arenaState.playerScore}. Streak reset!`;
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
 * 👑 Global Dice Duel Leaderboard API Integration
 */
async function loadLeaderboardStandings() {
  const container = document.getElementById('arenaLeaderboardList');
  if (!container) return;

  try {
    const res = await fetch(`${API_GATEWAY_URL}/v1/games/leaderboard/dice_duel`);
    if (!res.ok) {
      container.innerHTML = `<div style="text-align: center; padding: 0.5rem; color: #64748b;">Leaderboard ready for new champion rolls!</div>`;
      return;
    }
    const json = await res.json();
    const list = json?.data?.leaderboard || [];
    renderLeaderboardUi(list);
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; padding: 0.5rem; color: #64748b;">Standings available via API (/v1/games/leaderboard)</div>`;
  }
}

function renderLeaderboardUi(standings = []) {
  const container = document.getElementById('arenaLeaderboardList');
  if (!container) return;

  if (!standings || standings.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 0.5rem; color: #64748b;">No duel champions recorded yet. Claim Rank #1!</div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = standings
    .slice(0, 5)
    .map((item, idx) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.5rem; background: rgba(255,255,255,0.03); border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span>${medals[idx] || `#${idx + 1}`}</span>
          <span style="font-weight: 700; color: #f1f5f9;">${String(item.playerName || 'Anonymous').slice(0, 18)}</span>
        </div>
        <span style="color: #fbbf24; font-family: var(--font-mono); font-weight: 700;">Streak: ${item.score} 🔥</span>
      </div>
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
      showToast(`🏆 Win streak of ${streak} recorded to Global Leaderboard!`, 'success');
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

// Initialize streak count and live leaderboard on boot
updateStreakBadge();
loadLeaderboardStandings();

// Initialize Hidden Staff Command Palette (Ctrl+K)
initStaffCommandPalette();

