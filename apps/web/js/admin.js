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

  try {
    logAdmin(`Authenticating ${email}...`);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
  if (loginView) loginView.style.display = 'block';
  if (dashboardView) dashboardView.style.display = 'none';
  if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
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

function showDashboard() {
  const loginView = document.getElementById('loginView');
  const dashboardView = document.getElementById('dashboardView');
  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  const statAdminName = document.getElementById('statAdminName');
  if (loginView) loginView.style.display = 'none';
  if (dashboardView) dashboardView.style.display = 'block';
  if (headerLogoutBtn) headerLogoutBtn.style.display = 'inline-flex';
  if (statAdminName && adminUser) statAdminName.textContent = `${adminUser.name} (${adminUser.email})`;
  fetchInventory();
  fetchTelemetry();
  loadScheduledQueue();
  loadShowcaseSubmissions();
}

// Fetch live API telemetry and crawler intelligence (Private Admin)
async function fetchTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return;
    const data = await res.json();
    const analytics = data.analytics || {};

    const statApiPulls = document.getElementById('statApiPulls');
    if (statApiPulls) statApiPulls.textContent = (analytics.totalRequests || 0).toLocaleString();

    const statDbStatus = document.getElementById('statDbStatus');
    if (statDbStatus && data.database) {
      statDbStatus.textContent = data.database.connected ? 'Online (Atlas)' : 'Disconnected';
      statDbStatus.style.color = data.database.connected ? 'var(--neon-emerald)' : 'var(--neon-red)';
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

    const postmanEl = document.getElementById('telemetryPostmanHits');
    if (postmanEl) postmanEl.textContent = (analytics.apiChannels?.postman || 0).toLocaleString();

    const uptimeEl = document.getElementById('apiUptimeBadge');
    if (uptimeEl) {
      const mins = Math.round((analytics.uptimeSeconds || 0) / 60);
      uptimeEl.textContent = `Server Uptime: ${mins > 60 ? (mins / 60).toFixed(1) + ' hrs' : mins + ' mins'}`;
    }

    const topEl = document.getElementById('telemetryTopEndpoints');
    if (topEl && analytics.topEndpoints) {
      topEl.innerHTML = analytics.topEndpoints.map(e => `
        <span class="tag-chip" style="font-family: var(--font-mono); font-size: 0.75rem; background: #07090e; border: 1px solid rgba(6,182,212,0.3);">
          ${escapeHtml(e.path)} <strong style="color: var(--neon-cyan); margin-left: 0.25rem;">${e.hits.toLocaleString()}</strong>
        </span>
      `).join('') || '<span style="color: var(--text-muted); font-size: 0.75rem;">None recorded yet</span>';
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

    if (catalogItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No items found in this category. Click "+ Publish New Item" above to add one.</td></tr>`;
      return;
    }

    tbody.innerHTML = catalogItems.map(item => {
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

    logAdmin(`Loaded ${catalogItems.length} items from MongoDB Atlas.`, true);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--neon-red); text-align: center; padding: 2rem;">Error: ${escapeHtml(err.message)}</td></tr>`;
    logAdmin(`Fetch error: ${err.message}`);
  }
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
      headers: { 'Content-Type': 'application/json' },
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

function generateAllOmnipostFormats() {
  const title = document.getElementById('broadcastTitle')?.value || 'Dangling Dice Studios™ Update';
  const link = document.getElementById('broadcastLink')?.value || 'https://media.dangling-dice-studios.com';
  const desc = document.getElementById('broadcastDesc')?.value || '';

  // 1. Reddit (Helpful tone, markdown bullets, soft link at end)
  const redditEl = document.getElementById('redditPreview');
  if (redditEl) {
    redditEl.value = `Hey producers and creators,\n\n${desc}\n\nKey features:\n• 100% Ad-Free (Zero spam redirects or fake download buttons)\n• Studio Master 320kbps MP3 audio & 1080p MP4 video\n• Drag and drop straight into your DAW (FL Studio / Ableton)\n\nCheck it out here if you need it for your workflow: ${link}\n\nHope this helps save some time!`;
  }

  // 2. YouTube Community & Video Description
  const ytEl = document.getElementById('youtubePreview');
  if (ytEl) {
    ytEl.value = `🚀 ${title.toUpperCase()} is LIVE!\n\n${desc}\n\n⚡ Try it now for free: ${link}\n🎧 Stream Dangling Beats: https://dangling-dice-studios.com/#beatsStudio\n💻 Developer API: https://rapidapi.com/jacob-yancey-z5na1bjQ/api/dangling-dice-studios-central-api\n\nDrop a comment with what tool or sound kit you want next! 🎲`;
  }

  // 3. Twitter / X Thread (Hook + Value in Tweet 1, Link in Tweet 2 to bypass algorithm suppression)
  const twEl = document.getElementById('twitterPreview');
  if (twEl) {
    twEl.value = `[TWEET 1/2]\n${title} ⚡\n\n${desc.slice(0, 150)}...\n\n#beatmaker #flstudio #producer #audio\n\n---\n[TWEET 2/2 (Reply)]\nGrab the direct tool here (100% ad-free & private):\n${link}`;
  }

  // 4. Facebook (Groups & Pages - High Engagement with Emoji Highlights & Community Hook)
  const fbEl = document.getElementById('facebookPreview');
  if (fbEl) {
    fbEl.value = `🚀 ${title} is officially live!\n\n${desc}\n\nWhat makes this different:\n⚡ 100% Ad-Free (Zero spam redirects or fake buttons)\n🎧 Studio Master 320kbps MP3 & 1080p MP4 quality\n🎹 Drag-and-drop straight into your DAW (FL Studio, Ableton, Premiere)\n🔒 100% In-Browser Privacy — zero activity logs\n\n👉 Test it out for free here: ${link}\n💬 Join our creator Discord: https://discord.gg/uFYMQahNZz\n\nWhat is your go-to software for sampling audio right now? Let us know below! 👇`;
  }

  // 5. Instagram (Reels, Carousels & Stories - Save CTA + Trending Producer Tags)
  const igEl = document.getElementById('instagramPreview');
  if (igEl) {
    igEl.value = `Stop closing 5 scam tabs just to grab an audio sample 💀\n\n${desc}\n\nWe built a 100% ad-free, high-speed media converter for music producers and video creators:\n🎵 320kbps Studio Master MP3\n🎬 1080p Full HD MP4\n⚡ Drops straight into your Downloads folder\n\n👉 Tap the link in our bio to use it free: ${link}\n💾 Save this post for your next late-night studio session!\n\n#flstudio #musicproducer #beatmaker #producerlife #sampling #hiphopproducer #audiotools #beatstars #vstplugins #danglingbeats`;
  }

  // 6. TikTok (3-Second Visual Hook Script + Caption + Viral FYP Tags)
  const ttEl = document.getElementById('tiktokPreview');
  if (ttEl) {
    ttEl.value = `[ON-SCREEN TEXT HOOK]\nPOV: You finally found a YouTube to MP3 converter that DOESN'T have virus popups 😭\n\n[CAPTION]\nFinally built this for my own FL Studio sessions. 320kbps audio, 1-click download, 100% ad-free ⚡ Link in bio!\n\n#producertok #flstudio #beatmaker #musicproducer #sampleflip #producerlife #flstudiotips #audiotools #fyp`;
  }

  // 7. Dev.to / Hashnode Technical Article
  const devtoEl = document.getElementById('devtoPreview');
  if (devtoEl) {
    devtoEl.value = `---
title: Building ${title} — Clean Architecture & In-Browser Media Processing
published: true
tags: webdev, javascript, node, programming
---

## The Problem
${desc}

## How We Built It
We engineered a clean monorepo architecture leveraging:
- Express & Fastify sub-15ms compute engines
- Node.js & FFmpeg 320kbps audio extraction pipeline
- Zero server-side activity logs to guarantee user privacy

Try it live here: ${link}

Would love your architectural feedback or feature requests in the comments!`;
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
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API_BASE}/broadcast/scheduled`);
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
              ${post.status}
            </span>
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #fff;">${post.title}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">
                Scheduled for: <strong style="color: var(--neon-cyan);">${scheduledTime}</strong> &bull; Category: ${post.category}
              </div>
            </div>
          </div>
          <div>
            ${isPending ? `<button class="btn btn-danger btn-sm" onclick="cancelScheduledPost('${post._id}')" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">Cancel Drop</button>` : `<span style="font-size: 0.72rem; color: #10b981;">✓ Delivered to #studio-drops</span>`}
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
    const res = await fetch(`${API_BASE}/broadcast/scheduled/${id}`, {
      method: 'DELETE'
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

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${item.title}</div>
            <div style="font-size: 0.72rem; color: var(--neon-cyan);">${item.tagline}</div>
            <a href="${item.appUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.7rem; color: var(--text-muted); text-decoration: underline;">
              ${item.appUrl} ↗
            </a>
          </td>
          <td>
            <div style="font-weight: 600; color: #fff; font-size: 0.8rem;">${item.authorName}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${item.authorSocial || 'No social'}</div>
          </td>
          <td>
            <span class="pill-tag pill-tag-cyan" style="font-size: 0.68rem; padding: 0.1rem 0.4rem;">${item.category}</span>
            <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 0.25rem;">
              ${(item.techStack || []).join(', ')}
            </div>
          </td>
          <td>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${statusColor};">
              ${item.status}
            </span>
          </td>
          <td>
            ${isAOTW 
              ? `<span style="font-size: 0.75rem; font-weight: 800; color: #fbbf24; background: rgba(245, 158, 11, 0.2); padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">⭐ Current AOTW</span>`
              : `<button class="btn btn-primary btn-sm" onclick="setAppOfTheWeekAdmin('${item._id}')" style="font-size: 0.68rem; padding: 0.2rem 0.5rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 700;">Set AOTW ⭐</button>`
            }
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${isPending ? `
                <button class="btn btn-primary btn-sm" onclick="updateShowcaseStatus('${item._id}', 'APPROVED')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Approve</button>
                <button class="btn btn-secondary btn-sm" onclick="updateShowcaseStatus('${item._id}', 'REJECTED')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Reject</button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="updateShowcaseStatus('${item._id}', '${isApproved ? 'PENDING' : 'APPROVED'}')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">
                  ${isApproved ? 'Un-approve' : 'Re-approve'}
                </button>
              `}
              <button class="btn btn-danger btn-sm" onclick="deleteShowcaseItem('${item._id}')" style="font-size: 0.68rem; padding: 0.2rem 0.45rem;">Delete</button>
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

async function triggerManualRotationNow() {
  if (!confirm('Force an immediate rotation to the next candidate App of the Week?')) return;
  try {
    const res = await fetch(`${API_BASE}/showcase/rotate-now`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
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

// Startup
window.addEventListener('DOMContentLoaded', () => {
  verifyExistingSession();
  generateAllOmnipostFormats();
  loadScheduledQueue();
});
