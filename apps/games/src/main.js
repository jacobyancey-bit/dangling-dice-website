/**
 * Dangling Dice Gaming Lab™ — Application Logic
 */

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

// Download Helper (Generates client-side text/binary blob)
function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => link.remove(), 1000);
  showToast(`📥 Downloaded: ${filename}!`);
}

// Clipboard Copy Helper
async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || '📋 Copied to clipboard!');
  } catch (err) {
    showToast('Failed to copy. Please select and copy manually.', 'error');
  }
}

// Render Quick Game Chips
function renderGameChips() {
  const container = document.getElementById('gameChipsRow');
  if (!container) return;

  const chipsHtml = [
    `<button type="button" class="game-chip ${selectedGameId === 'all' ? 'active' : ''}" onclick="window.selectGameChip('all')">🎯 All Games</button>`,
    ...GAMES_CATALOG.map(
      (g) => `<button type="button" class="game-chip ${selectedGameId === g.id ? 'active' : ''}" onclick="window.selectGame('${g.id}')">${g.icon} ${g.shortName}</button>`
    ),
  ].join('');

  container.innerHTML = chipsHtml;
}

// Render Games Catalog Grid
function renderGamesCatalog(query = '') {
  const grid = document.getElementById('gamesGrid');
  const countBadge = document.getElementById('gamesCountBadge');
  if (!grid) return;

  const filtered = GAMES_CATALOG.filter((g) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      g.title.toLowerCase().includes(q) ||
      g.shortName.toLowerCase().includes(q) ||
      g.genre.toLowerCase().includes(q) ||
      g.engine.toLowerCase().includes(q)
    );
  });

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
          <a href="https://discord.gg/uFYMQahNZz" target="_blank" style="color: var(--neon-cyan);">Request it in Discord ↗</a>
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

    <!-- 4 Sub-Tabs -->
    <div class="dashboard-tabs" role="tablist">
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'audio' ? 'active' : ''}" data-tab="audio" onclick="window.switchDashboardTab('audio')">
        🎧 Audio &amp; Footstep EQ
      </button>
      <button type="button" class="dashboard-tab-btn ${activeDashboardTab === 'controller' ? 'active' : ''}" data-tab="controller" onclick="window.switchDashboardTab('controller')">
        🎮 Controller &amp; Stick Curves
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
            ? `<a href="${game.controllerProfile.steamConfigCode}" class="btn btn-primary">📥 Apply Steam Input Config ↗</a>`
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
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff;">${escapeHtml(game.configProfile.fileName)}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
          Target Path: <code style="color: var(--neon-cyan); font-family: var(--font-mono);">${escapeHtml(game.configProfile.targetPath)}</code>
        </p>
      </div>

      <pre class="code-block-preview"><code>${escapeHtml(game.configProfile.fileContent)}</code></pre>

      <div class="card-actions-row">
        <button type="button" class="btn btn-primary" onclick="window.downloadGameConfigFile('${game.id}')">
          📥 Download ${escapeHtml(game.configProfile.fileName)}
        </button>
        <button type="button" class="btn btn-secondary" onclick="window.copyConfigFileContent('${game.id}')">
          📋 Copy File Content
        </button>
      </div>

      <div style="margin-top: 1.5rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--neon-gold); margin-bottom: 0.35rem;">⚡ Performance Tips:</div>
        <ul style="padding-left: 1.25rem; font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
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
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
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
        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
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
        <a href="${tool.downloadUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          📥 Official Download (${escapeHtml(tool.version)}) ↗
        </a>
        ${
          tool.id === 'equalizer-apo' || tool.id === 'peace-gui'
            ? `<button type="button" class="btn btn-secondary btn-sm" onclick="window.downloadSetupGuideTxt()">
                📄 Download Setup Guide (.txt)
              </button>`
            : ''
        }
        <a href="${tool.officialSite}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
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

window.copySensValues = function (gameId) {
  const game = GAMES_CATALOG.find((g) => g.id === gameId);
  if (!game) return;
  const p = game.controllerProfile;
  copyToClipboard(`Horizontal Sens: ${p.horizontalSens}\nVertical Sens: ${p.verticalSens}\nMode: ${p.aimAssistType}`, '📋 Copied Sensitivity Specs!');
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

// Search Bar Input Listener
const searchInput = document.getElementById('gameSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
    renderGamesCatalog(val);
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    clearSearchBtn.style.display = 'none';
    renderGamesCatalog('');
  });
}

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
});

