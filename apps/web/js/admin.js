/**
 * Dangling Dice Studios™ — Administrator Portal Client Application
 */

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '5000' && window.location.port !== '3000'
  ? 'http://localhost:5000/api'
  : window.location.origin + '/api';
let adminToken = localStorage.getItem('dangling_admin_jwt');
let adminUser = null;
let selectedCategory = 'All';
let catalogItems = [];

// Logging helper
function logAdmin(msg, isSuccess = false) {
  const box = document.getElementById('adminLogBox');
  if (!box) return;
  const time = new Date().toLocaleTimeString();
  const div = document.createElement('div');
  div.className = 'log-line';
  div.innerHTML = `<span style="color: var(--text-faint)">[${time}]</span> <span style="color: ${isSuccess ? 'var(--neon-emerald)' : 'var(--text-muted)'}">${msg}</span>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function showAlert(id, msg, isSuccess = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert ${isSuccess ? 'alert-success' : 'alert-error'}`;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  el.textContent = '';
}

// Authentication Handlers
async function handleAdminLogin(e) {
  e.preventDefault();
  clearAlert('loginAlert');
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const turnstileToken = document.querySelector('#adminLoginForm [name="cf-turnstile-response"]')?.value || '';

  try {
    logAdmin(`Authenticating ${email}...`);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, 'cf-turnstile-response': turnstileToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');

    if (json.data.role !== 'admin') {
      throw new Error('Access Denied: This account does not possess administrator privileges.');
    }

    adminToken = json.data.token;
    adminUser = json.data;
    localStorage.setItem('dangling_admin_jwt', adminToken);
    logAdmin(`Authenticated as Administrator: ${adminUser.name}`, true);
    showDashboard();
  } catch (err) {
    showAlert('loginAlert', err.message);
    logAdmin(`Authentication failed: ${err.message}`);
  }
}

function logoutAdmin() {
  adminToken = null;
  adminUser = null;
  localStorage.removeItem('dangling_admin_jwt');
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  const headerStatusPill = document.getElementById('headerStatusPill');
  const headerRefreshBtn = document.getElementById('headerRefreshBtn');
  if (loginView) loginView.style.display = 'block';
  if (dashboardView) dashboardView.style.display = 'none';
  if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
  if (headerStatusPill) headerStatusPill.style.display = 'none';
  if (headerRefreshBtn) headerRefreshBtn.style.display = 'none';
  logAdmin('Signed out of Administrator Portal.');
}

async function verifyExistingSession() {
  if (!adminToken) return;
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (res.ok && json.data.role === 'admin') {
      adminUser = json.data;
      showDashboard();
    } else {
      logoutAdmin();
    }
  } catch (err) {
    logoutAdmin();
  }
}

function switchAdminTab(tabId = 'overview') {
  const panels = document.querySelectorAll('.admin-tab-panel');
  const buttons = document.querySelectorAll('.admin-nav-btn');
  panels.forEach((p) => p.classList.toggle('active', p.id === `tab-${tabId}`));
  buttons.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  try {
    localStorage.setItem('dds_admin_active_tab', tabId);
  } catch {}
}

function showDashboard() {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  const headerStatusPill = document.getElementById('headerStatusPill');
  const headerRefreshBtn = document.getElementById('headerRefreshBtn');
  const statAdminName = document.getElementById('statAdminName');
  if (loginView) loginView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'block';
  if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-flex';
  if (headerStatusPill) headerStatusPill.style.display = 'inline-flex';
  if (headerRefreshBtn) headerRefreshBtn.style.display = 'inline-flex';
  if (statAdminName && adminUser) statAdminName.textContent = `${adminUser.name} (${adminUser.email})`;

  const savedTab = localStorage.getItem('dds_admin_active_tab') || 'overview';
  switchAdminTab(savedTab);

  fetchInventory();
  fetchTelemetry();
  fetchOrders();
  loadScheduledQueue();
  loadShowcaseSubmissions();
}

// Fetch live API telemetry and crawler intelligence (Private Admin)
async function fetchTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json().catch(() => null);
    if (!data) return;
    const analytics = data.analytics || {};

    const statApiPulls = document.getElementById('statApiPulls');
    if (statApiPulls) statApiPulls.textContent = (analytics.totalRequests || 0).toLocaleString();

    const avgMs = analytics.avgResponseTimeMs !== undefined ? `${analytics.avgResponseTimeMs} ms` : '-- ms';
    const statAvgLatency = document.getElementById('statAvgLatency');
    if (statAvgLatency) statAvgLatency.textContent = avgMs;

    const navLatencyBadge = document.getElementById('navLatencyBadge');
    if (navLatencyBadge) navLatencyBadge.textContent = avgMs;

    const headerStatusText = document.getElementById('headerStatusText');
    if (headerStatusText) {
      headerStatusText.textContent = data.status === 'healthy'
        ? `Operational • ${avgMs}`
        : 'Degraded';
    }

    const statDbStatus = document.getElementById('statDbStatus');
    if (statDbStatus && data.database) {
      statDbStatus.textContent = data.database.connected ? 'Online (Atlas)' : 'Disconnected';
      statDbStatus.style.color = data.database.connected ? 'var(--neon-emerald)' : 'var(--neon-red)';
    }

    // Live 9-Pillar Infrastructure Matrix Badges
    const mongoBadge = document.getElementById('infraMongoBadge');
    const mongoSub = document.getElementById('infraMongoSub');
    if (mongoBadge && data.database) {
      mongoBadge.textContent = data.database.connected ? 'Connected' : 'Offline';
      mongoBadge.className = `infra-badge ${data.database.connected ? '' : 'err'}`;
      if (mongoSub && data.database.name) mongoSub.textContent = data.database.name;
    }

    const redisBadge = document.getElementById('infraRedisBadge');
    if (redisBadge && data.redis) {
      redisBadge.textContent = data.redis.connected ? 'Connected' : 'In-Memory';
      redisBadge.className = `infra-badge ${data.redis.connected ? '' : 'warn'}`;
    }

    const r2Badge = document.getElementById('infraR2Badge');
    const r2Sub = document.getElementById('infraR2Sub');
    if (r2Badge && data.storage) {
      r2Badge.textContent = data.storage.configured ? '$0 Egress' : 'Not Set';
      r2Badge.className = `infra-badge ${data.storage.configured ? '' : 'warn'}`;
      if (r2Sub && data.storage.bucket) r2Sub.textContent = data.storage.bucket;
    }

    const aiEl = document.getElementById('telemetryAiHits');
    if (aiEl) aiEl.textContent = (analytics.crawlers?.ai || 0).toLocaleString();

    const searchEl = document.getElementById('telemetrySearchHits');
    if (searchEl) searchEl.textContent = (analytics.crawlers?.search || 0).toLocaleString();

    const socialEl = document.getElementById('telemetrySocialHits');
    if (socialEl) socialEl.textContent = (analytics.crawlers?.social || 0).toLocaleString();

    const toolsEl = document.getElementById('telemetryToolsHits');
    if (toolsEl) toolsEl.textContent = (analytics.crawlers?.tools || 0).toLocaleString();

    const rapidEl = document.getElementById('telemetryRapidApiHits');
    if (rapidEl) rapidEl.textContent = (analytics.apiChannels?.rapidapi || 0).toLocaleString();

    const directEl = document.getElementById('telemetryDirectHits');
    if (directEl) directEl.textContent = (analytics.apiChannels?.direct || 0).toLocaleString();

    const uptimeEl = document.getElementById('apiUptimeBadge');
    if (uptimeEl) {
      const mins = Math.round((analytics.uptimeSeconds || 0) / 60);
      uptimeEl.textContent = `Uptime: ${mins > 60 ? (mins / 60).toFixed(1) + ' hrs' : mins + ' mins'}`;
    }

    const topEl = document.getElementById('telemetryTopEndpoints');
    if (topEl && analytics.topEndpoints) {
      topEl.innerHTML = analytics.topEndpoints.map(e => `
        <span class="tag-chip" style="font-family: var(--font-mono); font-size: 0.75rem; background: #07090e; border: 1px solid rgba(6,182,212,0.3);">
          ${escapeHtml(e.path)} <strong style="color: var(--neon-cyan); margin-left: 0.25rem;">${e.hits.toLocaleString()}</strong>
        </span>
      `).join('') || '<span style="color: var(--text-muted); font-size: 0.75rem;">None recorded yet</span>';
    }

    // Live Recent Request Activity Feed
    const activityBody = document.getElementById('recentActivityTableBody');
    if (activityBody && Array.isArray(analytics.recentActivity)) {
      if (analytics.recentActivity.length === 0) {
        activityBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.25rem;">No recent requests logged yet.</td></tr>`;
      } else {
        activityBody.innerHTML = analytics.recentActivity.slice(0, 12).map((evt) => {
          const statusColor = evt.status >= 500 ? '#f87171' : evt.status >= 400 ? '#fbbf24' : '#34d399';
          const timeStr = evt.time ? new Date(evt.time).toLocaleTimeString() : '-';
          return `
            <tr>
              <td><span class="method-pill ${escapeHtml(evt.method || 'GET')}">${escapeHtml(evt.method || 'GET')}</span></td>
              <td style="font-family: var(--font-mono); font-size: 0.78rem; color: #e2e8f0;">${escapeHtml(evt.path || '/')}</td>
              <td style="font-family: var(--font-mono); font-weight: 700; color: ${statusColor};">${evt.status || 200}</td>
              <td style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-muted);">${evt.durationMs ?? 0} ms</td>
              <td style="font-size: 0.76rem; color: var(--text-muted);">${escapeHtml(evt.client || 'Browser')} <span style="opacity:0.65;">(${escapeHtml(evt.ip || 'masked')})</span></td>
              <td style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">${escapeHtml(timeStr)}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (e) {
    logAdmin(`Telemetry load error: ${e.message}`);
  }
}

// Category Filter
function filterCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll('.pill-btn').forEach(btn => {
    const text = btn.textContent;
    const matches = (cat === 'All' && text.includes('All')) ||
                    (cat === 'Coding Tutorials' && text.includes('Coding')) ||
                    (cat === 'Beats & Audio' && text.includes('Beats')) ||
                    (cat === 'Mobile Apps' && text.includes('Mobile')) ||
                    (cat === 'Studio Games' && text.includes('Games')) ||
                    (cat === 'Developer Tools' && text.includes('Dev Tools'));
    btn.classList.toggle('active', matches);
  });
  fetchInventory();
}

// Inventory CRUD
async function fetchInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  const countEl = document.getElementById('statItemCount');
  if (!tbody) return;
  try {
    const query = selectedCategory !== 'All' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
    logAdmin(`GET /api/items${query}...`);
    const res = await fetch(`${API_BASE}/items${query}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    catalogItems = json.data || [];
    if (countEl) countEl.textContent = catalogItems.length;
    const navCatBadge = document.getElementById('navCatalogBadge');
    if (navCatBadge) navCatBadge.textContent = catalogItems.length;

    renderInventoryRows(catalogItems);
    logAdmin(`Loaded ${catalogItems.length} items from MongoDB Atlas.`, true);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--neon-red); text-align: center; padding: 2rem;">Error: ${escapeHtml(err.message)}</td></tr>`;
    logAdmin(`Fetch error: ${err.message}`);
  }
}

function renderInventoryRows(items = []) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching items found. Click "+ Publish New Item" to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const priceLabel = item.price === 0 ? 'FREE' : `$${Number(item.price).toFixed(2)}`;
    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: #fff;">${escapeHtml(item.title)}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); max-width: 380px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.description)}</div>
        </td>
        <td><span class="badge-tag">${escapeHtml(item.category)}</span></td>
        <td style="font-weight: 600;">${priceLabel}</td>
        <td>
          ${item.mediaUrl ? `<a href="${escapeHtml(item.mediaUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--neon-cyan); text-decoration: none; font-size: 0.8rem;">Open Link ↗</a>` : '<span style="color: var(--text-faint);">-</span>'}
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="openEditModal('${item._id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDelete('${item._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterInventorySearch(query = '') {
  const q = String(query).trim().toLowerCase();
  if (!q) return renderInventoryRows(catalogItems);
  const filtered = catalogItems.filter((item) => {
    const hay = `${item.title || ''} ${item.description || ''} ${item.category || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
  renderInventoryRows(filtered);
}

// Orders & Stripe Revenue Ledger
async function fetchOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody || !adminToken) return;
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load orders');

    const orders = json.data || [];
    const navOrdersBadge = document.getElementById('navOrdersBadge');
    if (navOrdersBadge) navOrdersBadge.textContent = orders.length;

    const totalCountEl = document.getElementById('ordersTotalCount');
    if (totalCountEl) totalCountEl.textContent = orders.length.toLocaleString();

    const completed = orders.filter((o) => ['completed', 'paid', 'fulfilled'].includes(String(o.status || '').toLowerCase()));
    const completedEl = document.getElementById('ordersCompletedCount');
    if (completedEl) completedEl.textContent = completed.length.toLocaleString();

    const gross = completed.reduce((sum, o) => sum + (Number(o.amountTotal) || 0), 0);
    const revEl = document.getElementById('ordersTotalRevenue');
    if (revEl) revEl.textContent = `$${gross.toFixed(2)}`;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No Stripe orders recorded yet. Sales &amp; API subscriptions will appear here automatically.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o) => {
      const dt = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';
      const statusStr = String(o.status || 'pending').toUpperCase();
      const statusBadge = ['COMPLETED', 'PAID', 'FULFILLED'].includes(statusStr) ? '' : 'warn';
      const itemTitle = o.item?.title || o.licenseTier || 'Studio Digital License';
      return `
        <tr>
          <td style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(dt)}</td>
          <td style="font-weight: 600; color: #fff;">${escapeHtml(o.customerEmail || '-')}</td>
          <td style="font-size: 0.8rem;">${escapeHtml(itemTitle)}</td>
          <td style="font-weight: 700; color: var(--neon-emerald);">$${(Number(o.amountTotal) || 0).toFixed(2)}</td>
          <td><span class="infra-badge ${statusBadge}">${escapeHtml(statusStr)}</span></td>
          <td style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--neon-cyan);">${escapeHtml(o.licenseKey || '—')}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Unable to load orders: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function refreshAllAdminData() {
  fetchTelemetry();
  fetchInventory();
  fetchOrders();
  loadScheduledQueue();
  loadShowcaseSubmissions();
  logAdmin('Refreshed all live telemetry, catalog, orders, and showcase data.', true);
}

function clearAdminLogs() {
  const box = document.getElementById('adminLogBox');
  if (box) box.innerHTML = '<div class="log-line">[System] Console log cleared.</div>';
}

// Publish Modal
function openPublishModal() {
  clearAlert('publishAlert');
  const form = document.getElementById('publishForm');
  const modal = document.getElementById('publishModal');
  if (form) form.reset();
  if (modal) modal.style.display = 'flex';
}

function closePublishModal() {
  const modal = document.getElementById('publishModal');
  if (modal) modal.style.display = 'none';
  clearAlert('publishAlert');
}

async function handlePublishSubmit(e) {
  e.preventDefault();
  clearAlert('publishAlert');

  const title = document.getElementById('newTitle').value;
  const category = document.getElementById('newCategory').value;
  const mediaUrl = document.getElementById('newMediaUrl').value;
  const tags = document.getElementById('newTags').value;
  const price = parseFloat(document.getElementById('newPrice').value) || 0;
  const description = document.getElementById('newDesc').value;

  try {
    logAdmin(`POST /api/items creating "${title}"...`);
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title,
        category,
        mediaUrl,
        tags,
        price,
        description,
        imageUrl: category === 'Beats & Audio' ? '/images/banner.jpg' : '/images/logo.png'
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    logAdmin(`Successfully published resource "${json.data.title}"`, true);
    closePublishModal();
    fetchInventory();
  } catch (err) {
    showAlert('publishAlert', err.message);
    logAdmin(`Publish error: ${err.message}`);
  }
}

// Edit Modal
function openEditModal(id) {
  const item = catalogItems.find(i => i._id === id || i.id === id);
  if (!item) return;

  const editModal = document.getElementById('editModal');
  document.getElementById('editItemId').value = item._id;
  document.getElementById('editTitle').value = item.title || '';
  document.getElementById('editCategory').value = item.category || 'Coding Tutorials';
  document.getElementById('editMediaUrl').value = item.mediaUrl || '';
  document.getElementById('editTags').value = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
  document.getElementById('editPrice').value = item.price !== undefined ? item.price : 0;
  document.getElementById('editDesc').value = item.description || '';
  clearAlert('editAlert');

  if (editModal) editModal.style.display = 'flex';
}

function closeEditModal() {
  const editModal = document.getElementById('editModal');
  if (editModal) editModal.style.display = 'none';
  clearAlert('editAlert');
}

async function handleEditSubmit(e) {
  e.preventDefault();
  clearAlert('editAlert');

  const id = document.getElementById('editItemId').value;
  const title = document.getElementById('editTitle').value;
  const category = document.getElementById('editCategory').value;
  const mediaUrl = document.getElementById('editMediaUrl').value;
  const tags = document.getElementById('editTags').value;
  const price = parseFloat(document.getElementById('editPrice').value) || 0;
  const description = document.getElementById('editDesc').value;

  try {
    logAdmin(`PUT /api/items/${id} updating "${title}"...`);
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title,
        category,
        mediaUrl,
        tags,
        price,
        description
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    logAdmin(`Successfully updated resource "${json.data.title}"`, true);
    closeEditModal();
    fetchInventory();
  } catch (err) {
    showAlert('editAlert', err.message);
    logAdmin(`Update error: ${err.message}`);
  }
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to permanently delete this resource from the catalog?')) return;
  try {
    logAdmin(`DELETE /api/items/${id}...`);
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    logAdmin(`Deleted resource ${id}`, true);
    fetchInventory();
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
    logAdmin(`Delete error: ${err.message}`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Marketing Broadcast & Omnipost Engine
async function dispatchDiscordBroadcast() {
  const btn = document.getElementById('broadcastDiscordBtn');
  const alertBox = document.getElementById('broadcastStatusAlert');
  const title = document.getElementById('broadcastTitle')?.value || '';
  const link = document.getElementById('broadcastLink')?.value || '';
  const description = document.getElementById('broadcastDesc')?.value || '';
  const category = document.getElementById('broadcastCategory')?.value || 'Developer Tools';

  if (!title && !description) {
    showAlert('broadcastStatusAlert', 'Please enter a title or description for your broadcast.');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Dispatching to Discord...';
    }
    logAdmin(`POST /api/broadcast/discord: "${title}"...`);

    const res = await fetch(`${API_BASE}/broadcast/discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title, link, description, category })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Discord broadcast failed');

    showAlert('broadcastStatusAlert', `✅ Broadcast delivered to #${json.channel}! Check Discord.`, true);
    logAdmin(`Broadcast dispatched successfully to Discord!`, true);
  } catch (err) {
    showAlert('broadcastStatusAlert', `❌ Broadcast error: ${err.message}`);
    logAdmin(`Broadcast failure: ${err.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🚀 1-Click Broadcast to Discord';
    }
  }
}

const OMNIPOST_PRESETS = {
  beats: {
    title: 'Dangling Beats Studio — 100% Free Browser DAW & MIDI Generator',
    link: 'https://beats.dangling-dice-studios.com/',
    category: 'Beats & Audio',
    desc: 'Complete in-browser music workstation: 16-pad drum machine, chord progression MIDI generator, delay/reverb timing calculators, and Web MIDI controller support. No accounts, zero subscriptions, instant studio master audio.',
    question: 'What DAW do you produce in (FL Studio, Ableton, Logic, or Reaper), and what tool would speed up your workflow most?'
  },
  media: {
    title: 'Free 320kbps YouTube to MP3 Converter — 100% Ad-Free & Zero Logs',
    link: 'https://media.dangling-dice-studios.com/',
    category: 'Developer Tools',
    desc: 'Tired of closing 5 scam popup tabs just to grab an audio sample for FL Studio or Ableton? We built a fast, ad-free 320kbps in-browser converter for beatmakers and video editors. Direct downloads with zero tracking.',
    question: 'What audio format or sample rate do you prefer when grabbing reference tracks for your projects?'
  },
  games: {
    title: 'OmniSound Directional Audio Radar & Gaming Audio Lab',
    link: 'https://games.dangling-dice-studios.com/',
    category: 'Affiliate Deals',
    desc: 'Tired of muddy in-game audio where you cannot hear enemy footsteps over deafening gunfire? We mapped competitive EQ curves and real-time directional audio HUD profiles for competitive FPS games with zero anti-cheat penalties.',
    question: 'What competitive game has the worst default audio mix right now? (Warzone, Apex, Valorant, or CS2?)'
  },
  dev: {
    title: '13 Free In-Browser Developer Sandboxes & Sub-15ms REST Compute',
    link: 'https://dev.dangling-dice-studios.com/',
    category: 'Developer Tools',
    desc: 'Free interactive developer utilities right in your browser: JSON-to-Zod schema transformer, GIS parcel acreage calculator, Luhn PII credit card redactor, and loan amortization engine with zero telemetry tracking.',
    question: 'What repetitive utility or script do you wish you did not have to write from scratch every project?'
  },
  calculator: {
    title: 'AI Calculator on Google Play — Camera Math Solver & Step-by-Step Arithmetic',
    link: 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator',
    category: 'Mobile Apps',
    desc: 'Published our standalone AI Calculator on Google Play. Snap a photo of handwritten homework or complex equations to get step-by-step arithmetic and algebra explanations instantly.',
    question: 'What math topic or formula gives you the biggest headache to solve?'
  },
  gear_jbl: {
    title: 'JBL Tune 680NC Adaptive Noise-Cancelling Headphones (Prime Deal)',
    link: 'https://dangling-dice-studios.com/go/gear-jbl-680nc',
    category: 'Affiliate Deals',
    desc: 'Detailed studio review and breakdown of the JBL Tune 680NC wireless adaptive noise-cancelling headphones: punchy low-end response, 44-hour battery life, and ultra-lightweight comfort for long coding or beatmaking sessions.',
    question: 'Do you prefer over-ear studio monitoring headphones or lightweight IEMs for focus sessions?'
  }
};

let currentEngagementQuestion = '';

function applyOmnipostPreset(presetKey) {
  const p = OMNIPOST_PRESETS[presetKey];
  if (!p) return;
  const titleEl = document.getElementById('broadcastTitle');
  const linkEl = document.getElementById('broadcastLink');
  const descEl = document.getElementById('broadcastDesc');
  const catEl = document.getElementById('broadcastCategory');

  if (titleEl) titleEl.value = p.title;
  if (linkEl) linkEl.value = p.link;
  if (descEl) descEl.value = p.desc;
  if (catEl) catEl.value = p.category;
  currentEngagementQuestion = p.question;

  generateAllOmnipostFormats();
  logAdmin(`Applied Omnipost preset: "${p.title}"`, true);
}

function generateFromSmartPrompt() {
  const textInput = document.getElementById('smartPromptText');
  const linkInput = document.getElementById('smartPromptLink');
  const text = (textInput?.value || '').trim();
  let link = (linkInput?.value || '').trim();

  if (!text) {
    alert('Please enter what you want to announce in the prompt box!');
    if (textInput) textInput.focus();
    return;
  }

  const lower = text.toLowerCase();
  let category = 'Studio Update';
  let defaultLink = 'https://dangling-dice-studios.com/';
  let question = 'What feature or tool should we drop next? Let us know below!';

  if (/\b(beat|beats|music|drum|drums|midi|fl studio|ableton|logic|chord|chords|808|sample|samples|synth|tempo|bpm)\b/.test(lower)) {
    category = 'Beats & Audio';
    defaultLink = 'https://beats.dangling-dice-studios.com/';
    question = 'What DAW do you produce in (FL Studio, Ableton, Logic, Reaper), and what sound kit should I drop next?';
  } else if (/\b(game|gaming|fps|radar|omnisound|footstep|footsteps|headphone|headphones|iem|iems|controller|keyboard|jbl|aim)\b/.test(lower)) {
    category = 'Affiliate Deals';
    defaultLink = 'https://games.dangling-dice-studios.com/';
    question = 'What competitive FPS game has the most frustrating audio mix right now? (Warzone, Apex, Valorant, CS2)';
  } else if (/\b(convert|converter|mp3|mp4|youtube|transcode|transcoder|extract|video|download)\b/.test(lower)) {
    category = 'Developer Tools';
    defaultLink = 'https://media.dangling-dice-studios.com/';
    question = 'What format and sample rate do you prefer when grabbing audio samples or reference tracks?';
  } else if (/\b(api|apis|code|json|schema|zod|developer|sandbox|sandboxes|typescript|compute|database|sql|acreage|polygon|redact)\b/.test(lower)) {
    category = 'Developer Tools';
    defaultLink = 'https://dev.dangling-dice-studios.com/';
    question = 'What repetitive developer utility or boilerplate script do you find yourself writing over and over?';
  } else if (/\b(calculator|math|algebra|homework|camera|ocr|android|play store|formula)\b/.test(lower)) {
    category = 'Mobile Apps';
    defaultLink = 'https://play.google.com/store/apps/details?id=com.danglingdicestudios.aicalculator';
    question = 'What math formula or problem type gives you the biggest headache to solve?';
  }

  if (!link) {
    link = defaultLink;
    if (linkInput) linkInput.value = link;
  }

  // Capitalize clean title
  let cleanTitle = text.replace(/^added\s+/i, 'New: ')
                       .replace(/^built\s+/i, 'Released: ')
                       .replace(/^dropped\s+/i, 'Fresh Drop: ')
                       .replace(/^announcing\s+/i, 'Announcing: ');
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  if (!cleanTitle.includes('—') && !cleanTitle.includes('-')) {
    cleanTitle += ' — Dangling Dice Studios™';
  }

  const desc = `${text}. Built 100% ad-free and open for creators and developers without paywalls, bloatware, or sketchy trackers. Instant access directly in your browser.`;

  const titleEl = document.getElementById('broadcastTitle');
  const linkEl = document.getElementById('broadcastLink');
  const descEl = document.getElementById('broadcastDesc');
  const catEl = document.getElementById('broadcastCategory');

  if (titleEl) titleEl.value = cleanTitle;
  if (linkEl) linkEl.value = link;
  if (descEl) descEl.value = desc;
  if (catEl) catEl.value = category;
  currentEngagementQuestion = question;

  generateAllOmnipostFormats();
  logAdmin(`Generated Omnipost from prompt: "${cleanTitle}"`, true);
}

function generateAllOmnipostFormats() {
  const title = document.getElementById('broadcastTitle')?.value || 'Dangling Dice Studios™ Update';
  const link = document.getElementById('broadcastLink')?.value || 'https://dangling-dice-studios.com';
  const desc = document.getElementById('broadcastDesc')?.value || '';
  const category = document.getElementById('broadcastCategory')?.value || 'Studio Update';
  const question = currentEngagementQuestion || 'What feature or tool should we build next? Let us know below!';

  // 1. Reddit (Community-focused, value first, soft link, discussion question)
  const redditEl = document.getElementById('redditPreview');
  if (redditEl) {
    redditEl.value = `Hey everyone,\n\n${desc}\n\nKey highlights:\n• 100% Ad-Free (Zero popup tabs, trackers, or paywalls)\n• Built lightweight for instant performance and clean workflow\n• Live now at: ${link}\n\nQuestion for the community: ${question}\n\nWould love your feedback or feature ideas!`;
  }

  // 2. YouTube Community & Video Description
  const ytEl = document.getElementById('youtubePreview');
  if (ytEl) {
    ytEl.value = `🚀 ${title.toUpperCase()} is LIVE!\n\n${desc}\n\n⚡ Test it out free: ${link}\n🎧 Studio Catalog: https://dangling-dice-studios.com/#catalog\n💬 Community Discord: https://discord.gg/uFYMQahNZz\n\n💬 QUESTION OF THE DROP: ${question} Drop your thoughts in the comments below! 👇`;
  }

  // 3. Twitter / X Thread (Hook in Tweet 1, Link in Reply Tweet to maximize algorithmic reach)
  const twEl = document.getElementById('twitterPreview');
  if (twEl) {
    twEl.value = `[TWEET 1/2]\n${title} ⚡\n\n${desc.slice(0, 160)}...\n\n💬 ${question}\n\n#danglingdice #buildinpublic #tools #creators\n\n---\n[TWEET 2/2 (Reply)]\nTry it free here (100% ad-free & private):\n${link}`;
  }

  // 4. Facebook (Groups & Pages - High Engagement with Emoji Highlights & Community Hook)
  const fbEl = document.getElementById('facebookPreview');
  if (fbEl) {
    fbEl.value = `🚀 ${title} is officially live!\n\n${desc}\n\nWhat makes this different:\n⚡ 100% Ad-Free (No spam redirects or paywalls)\n🔒 Zero data logging & privacy first\n🎯 Instant browser-based workflow\n\n👉 Test it out for free here: ${link}\n\n💬 Community Question: ${question} Let us know in the comments below! 👇`;
  }

  // 5. Instagram (Reels, Carousels & Stories - Save CTA + Trending Tags)
  const igEl = document.getElementById('instagramPreview');
  if (igEl) {
    igEl.value = `${title} 🚀\n\n${desc}\n\n⚡ 100% ad-free & privacy first\n💾 Save this post for your next session!\n👉 Link in bio: ${link}\n\n💬 Drop a comment: ${question}\n\n#flstudio #musicproducer #beatmaker #developer #webdev #indiedev #danglingdice`;
  }

  // 6. TikTok (3-Second Visual Hook Script + Caption + FYP Tags)
  const ttEl = document.getElementById('tiktokPreview');
  if (ttEl) {
    ttEl.value = `[ON-SCREEN HOOK (0-3s)]\nPOV: When you finally find a studio tool that DOESN'T make you sign up or close 5 ad popups 😭\n\n[CAPTION]\n${desc.slice(0, 100)}... 100% free & ad-free! Link in bio ⚡\n\n${question}\n\n#producer #flstudio #webdev #indiedev #audiotools #fyp`;
  }

  // 7. Dev.to / Hashnode Technical Article
  const devtoEl = document.getElementById('devtoPreview');
  if (devtoEl) {
    devtoEl.value = `---
title: ${title}
published: true
tags: webdev, javascript, node, programming
---

## Overview
${desc}

## Why We Built This
Most legacy tools in this space are clogged with invasive advertisements, paywalls, and heavy tracking scripts. We built this with a sub-15ms clean architecture, zero dependencies on predatory ad-tech, and direct browser performance.

Live demo: ${link}

## Discussion
${question}`;
  }

  // 8. GitHub Public-APIs Pull Request Formatter
  const apiReadmeEl = document.getElementById('publicApisReadmePreview');
  if (apiReadmeEl) {
    apiReadmeEl.value = `| ${title} | ${desc.slice(0, 100)}... | \`apiKey\` | Yes | https://dangling-dice-studios.com/api/openapi.json |`;
  }
}

function copyOmnipost(elementId) {
  const el = document.getElementById(elementId);
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    alert('Copied to clipboard!');
  }).catch(() => {
    el.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
  });
}

// Product Hunt Launch Kit Modal
function openProductHuntModal() {
  const el = document.getElementById('productHuntModal');
  if (el) el.style.display = 'flex';
}

function closeProductHuntModal() {
  const el = document.getElementById('productHuntModal');
  if (el) el.style.display = 'none';
}

function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(() => {
    alert('Copied to clipboard!');
  }).catch(() => {
    el.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
  });
}

// Scheduled Post Queue Engine
async function queueScheduledBroadcast() {
  const title = document.getElementById('broadcastTitle')?.value;
  const link = document.getElementById('broadcastLink')?.value;
  const description = document.getElementById('broadcastDesc')?.value;
  const category = document.getElementById('broadcastCategory')?.value;
  const timeInput = document.getElementById('broadcastScheduleTime')?.value;

  if (!title || !description) {
    alert('Please enter a campaign title and hook description.');
    return;
  }

  if (!timeInput) {
    alert('Please select a date and time to schedule the drop.');
    return;
  }

  const scheduledDate = new Date(timeInput);
  if (scheduledDate <= new Date()) {
    alert('Please choose a future date and time for the scheduled drop.');
    return;
  }

  try {
    logAdmin(`Queueing scheduled drop for ${scheduledDate.toLocaleString()}...`);
    const res = await fetch(`${API_BASE}/broadcast/scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title,
        link,
        description,
        category,
        scheduledFor: scheduledDate.toISOString()
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to queue post');

    showAlert('broadcastStatusAlert', `✅ Drop successfully scheduled for ${scheduledDate.toLocaleString()}!`, true);
    logAdmin(`Drop queued successfully: "${title}"`, true);
    loadScheduledQueue();
  } catch (err) {
    showAlert('broadcastStatusAlert', `❌ Scheduling error: ${err.message}`);
    logAdmin(`Scheduling error: ${err.message}`);
  }
}

async function loadScheduledQueue() {
  const section = document.getElementById('scheduledQueueSection');
  const container = document.getElementById('scheduledQueueList');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/broadcast/scheduled`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const json = await res.json();
    if (!res.ok || !json.data || json.data.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }

    if (section) section.style.display = 'block';
    container.innerHTML = json.data.map(post => {
      const isPending = post.status === 'PENDING';
      const statusColor = isPending ? '#fbbf24' : post.status === 'SENT' ? '#10b981' : '#f43f5e';
      const scheduledTime = new Date(post.scheduledFor).toLocaleString();

      return `
        <div style="background: rgba(6, 9, 14, 0.85); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 3px; background: rgba(255,255,255,0.05); color: ${statusColor}; border: 1px solid ${statusColor}40;">
              ${escapeHtml(post.status)}
            </span>
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #fff;">${escapeHtml(post.title)}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                Scheduled for: <strong style="color: var(--neon-cyan);">${scheduledTime}</strong> &bull; Category: ${escapeHtml(post.category)}
              </div>
            </div>
          </div>
          <div>
            ${isPending ? `<button class="btn btn-danger btn-sm" onclick="cancelScheduledPost('${escapeHtml(post._id)}')" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">Cancel Drop</button>` : `<span style="font-size: 0.72rem; color: #10b981;">✓ Delivered to #studio-drops</span>`}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load scheduled queue:', err);
  }
}

async function cancelScheduledPost(id) {
  if (!confirm('Are you sure you want to cancel this scheduled drop?')) return;
  try {
    const res = await fetch(`${API_BASE}/broadcast/scheduled/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    logAdmin(`Scheduled drop cancelled.`);
    loadScheduledQueue();
  } catch (err) {
    alert(`Failed to cancel drop: ${err.message}`);
  }
}

// Showcase Submissions & App of the Week Admin Handlers
async function loadShowcaseSubmissions() {
  const tbody = document.getElementById('showcaseTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/showcase/admin`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    const submissions = json.data || [];
    const navShowcaseBadge = document.getElementById('navShowcaseBadge');
    if (navShowcaseBadge) navShowcaseBadge.textContent = submissions.length;
    if (submissions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            No showcase submissions yet. Community apps submitted on your homepage will appear here!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = submissions.map(item => {
      const isApproved = item.status === 'APPROVED';
      const isPending = item.status === 'PENDING';
      const isAOTW = item.isAppOfTheWeek;
      const statusColor = isApproved ? 'var(--neon-emerald)' : isPending ? '#fbbf24' : 'var(--neon-red)';
      const safeUrl = item.appUrl && (item.appUrl.startsWith('http://') || item.appUrl.startsWith('https://'))
        ? encodeURI(item.appUrl)
        : '#';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${escapeHtml(item.title)}</div>
            <div style="font-size: 0.72rem; color: var(--neon-cyan);">${escapeHtml(item.tagline)}</div>
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; color: var(--text-muted); text-decoration: underline;">
              ${escapeHtml(item.appUrl)} ↗
            </a>
          </td>
          <td>
            <div style="font-weight: 600; color: #fff; font-size: 0.8rem;">${escapeHtml(item.authorName)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${escapeHtml(item.authorSocial || 'No social')}</div>
          </td>
          <td>
            <span class="pill-tag pill-tag-cyan" style="font-size: 0.68rem; padding: 0.1rem 0.4rem;">${escapeHtml(item.category)}</span>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${(item.techStack || []).map(escapeHtml).join(', ')}
            </div>
          </td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${statusColor};">
              ${escapeHtml(item.status)}
            </span>
          </td>
          <td>
            ${isAOTW 
              ? `<span style="font-size: 0.75rem; font-weight: 800; color: #fbbf24; background: rgba(245, 158, 11, 0.2); padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">⭐ Current AOTW</span>`
              : `<button class="btn btn-primary btn-sm" onclick="setAppOfTheWeekAdmin('${escapeHtml(item._id)}')" style="font-size: 0.68rem; padding: 0.2rem 0.5rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 700;">Set AOTW ⭐</button>`
            }
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${isPending ? `
                <button class="btn btn-primary btn-sm" onclick="updateShowcaseStatus('${escapeHtml(item._id)}', 'APPROVED')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Approve</button>
                <button class="btn btn-secondary btn-sm" onclick="updateShowcaseStatus('${escapeHtml(item._id)}', 'REJECTED')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Reject</button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="updateShowcaseStatus('${escapeHtml(item._id)}', '${isApproved ? 'PENDING' : 'APPROVED'}')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">
                  ${isApproved ? 'Un-approve' : 'Re-approve'}
                </button>
              `}
              <button class="btn btn-danger btn-sm" onclick="deleteShowcaseItem('${escapeHtml(item._id)}')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load showcase submissions:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neon-red); padding: 1.5rem;">Error loading submissions: ${err.message}</td></tr>`;
  }
}

async function updateShowcaseStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/showcase/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    logAdmin(`Project status updated: ${status}`, true);
    loadShowcaseSubmissions();
  } catch (err) {
    alert(`Failed to update status: ${err.message}`);
  }
}

async function setAppOfTheWeekAdmin(id) {
  const broadcastShoutout = confirm('Make this the App of the Week AND broadcast an announcement to your Discord community (#studio-drops)?');
  try {
    const res = await fetch(`${API_BASE}/showcase/${id}/feature`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isAppOfTheWeek: true, broadcastShoutout })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    logAdmin(`New App of the Week activated!`, true);
    loadShowcaseSubmissions();
  } catch (err) {
    alert(`Failed to set App of the Week: ${err.message}`);
  }
}

async function deleteShowcaseItem(id) {
  if (!confirm('Permanently delete this project submission?')) return;
  try {
    const res = await fetch(`${API_BASE}/showcase/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    logAdmin(`Showcase project deleted.`);
    loadShowcaseSubmissions();
  } catch (err) {
    alert(`Failed to delete project: ${err.message}`);
  }
}

async function toggleAutoRotation(enabled) {
  try {
    const res = await fetch(`${API_BASE}/showcase/config/rotation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ enabled }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    logAdmin(`Auto-rotation updated: ${enabled ? 'ENABLED' : 'PAUSED'}`, true);
  } catch (err) {
    alert(`Failed to update auto-rotation: ${err.message}`);
  }
}

async function triggerManualRotationNow(category = 'all') {
  if (!confirm(`Force an immediate rotation for ${category === 'all' ? 'ALL category spotlights' : category + ' spotlight'}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/showcase/rotate-now`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ category }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);
    alert(json.message);
    logAdmin(json.message, true);
    loadShowcaseSubmissions();
  } catch (err) {
    alert(`Rotation error: ${err.message}`);
  }
}

// Global scope bindings for inline HTML handlers
window.handleAdminLogin = handleAdminLogin;
window.logoutAdmin = logoutAdmin;
window.filterCategory = filterCategory;
window.openPublishModal = openPublishModal;
window.closePublishModal = closePublishModal;
window.handlePublishSubmit = handlePublishSubmit;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.handleEditSubmit = handleEditSubmit;
window.handleDelete = handleDelete;
window.dispatchDiscordBroadcast = dispatchDiscordBroadcast;
window.generateAllOmnipostFormats = generateAllOmnipostFormats;
window.applyOmnipostPreset = applyOmnipostPreset;
window.generateFromSmartPrompt = generateFromSmartPrompt;
window.copyOmnipost = copyOmnipost;
window.openProductHuntModal = openProductHuntModal;
window.closeProductHuntModal = closeProductHuntModal;
window.copyText = copyText;
window.queueScheduledBroadcast = queueScheduledBroadcast;
window.loadScheduledQueue = loadScheduledQueue;
window.cancelScheduledPost = cancelScheduledPost;
window.loadShowcaseSubmissions = loadShowcaseSubmissions;
window.updateShowcaseStatus = updateShowcaseStatus;
window.setAppOfTheWeekAdmin = setAppOfTheWeekAdmin;
window.deleteShowcaseItem = deleteShowcaseItem;
window.toggleAutoRotation = toggleAutoRotation;
window.triggerManualRotationNow = triggerManualRotationNow;
window.switchAdminTab = switchAdminTab;
window.filterInventorySearch = filterInventorySearch;
window.fetchTelemetry = fetchTelemetry;
window.fetchOrders = fetchOrders;
window.refreshAllAdminData = refreshAllAdminData;
window.clearAdminLogs = clearAdminLogs;

// Startup
window.addEventListener('DOMContentLoaded', () => {
  verifyExistingSession();
  generateAllOmnipostFormats();
  loadScheduledQueue();
});
