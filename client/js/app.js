/**
 * Dangling Dice Studios™ — Public Catalog Client Application
 */

const API_BASE = window.location.origin + '/api';

// YouTube Embed Helper (Supports single videos, playlists, shortlinks)
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (playlistMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    const standardMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (standardMatch) {
      return `https://www.youtube.com/embed/${standardMatch[1]}`;
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Cinema Modal Controls
function openCinemaModal(title, embedUrl) {
  const modal = document.getElementById('cinemaModal');
  const titleEl = document.getElementById('cinemaTitle');
  const iframeEl = document.getElementById('cinemaIframe');
  if (titleEl) titleEl.textContent = title;
  if (iframeEl) iframeEl.src = embedUrl;
  if (modal) modal.style.display = 'flex';
}

function closeCinemaModal() {
  const modal = document.getElementById('cinemaModal');
  const iframeEl = document.getElementById('cinemaIframe');
  if (modal) modal.style.display = 'none';
  if (iframeEl) iframeEl.src = '';
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCinemaModal();
});

document.addEventListener('click', (e) => {
  const modal = document.getElementById('cinemaModal');
  if (e.target === modal) closeCinemaModal();
});

// Logging helper (Developer Console)
function logMessage(msg, type = 'info') {
  if (type === 'error') console.error(`[DanglingDice] ${msg}`);
  else if (type === 'success') console.log(`%c[DanglingDice] ${msg}`, 'color: #10b981;');
  else console.log(`[DanglingDice] ${msg}`);
}

// Health Check
async function checkHealth() {
  const statusLabel = document.getElementById('statusLabel');
  const statusBadge = document.getElementById('connectionStatus');
  try {
    const start = performance.now();
    const res = await fetch(`${API_BASE}/`);
    const duration = Math.round(performance.now() - start);
    if (res.ok) {
      if (statusLabel) statusLabel.textContent = `API Online (${duration}ms)`;
      if (statusBadge) {
        statusBadge.style.color = 'var(--neon-emerald)';
        statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      }
      logMessage(`API Health check OK: status 200 (${duration}ms)`, 'success');
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    if (statusLabel) statusLabel.textContent = 'API Offline';
    if (statusBadge) {
      statusBadge.style.color = '#f87171';
      statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
    logMessage(`API connection error: ${err.message}`, 'error');
  }
}

let allResources = [];
let selectedCategory = 'All';
let searchQuery = '';
let sortOption = 'newest';

// Search and Sort Handlers
function handleSearch(val) {
  searchQuery = (val || '').trim().toLowerCase();
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
  renderCatalog();
}

function clearSearch() {
  const input = document.getElementById('catalogSearchInput');
  if (input) input.value = '';
  handleSearch('');
}

function handleSort(val) {
  sortOption = val;
  renderCatalog();
}

// Category Filter
function filterCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll('.pill-btn').forEach(btn => {
    const text = btn.textContent;
    const matches = (cat === 'All' && text.includes('All')) ||
                    (cat === 'Coding Tutorials' && text.includes('Coding')) ||
                    (cat === 'Beats & Audio' && text.includes('Beats')) ||
                    (cat === 'Mobile Apps' && text.includes('Mobile Apps')) ||
                    (cat === 'Studio Games' && text.includes('Games')) ||
                    (cat === 'Developer Tools' && text.includes('Developer Tools'));
    btn.classList.toggle('active', matches);
  });
  renderCatalog();
}

// Resources Fetch
async function fetchResources() {
  const grid = document.getElementById('resourcesGrid');
  try {
    logMessage(`GET /api/items...`);
    const res = await fetch(`${API_BASE}/items`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    allResources = json.data || [];
    logMessage(`Loaded ${allResources.length} items from database.`, 'success');
    renderCatalog();
  } catch (err) {
    if (grid) grid.innerHTML = `<div style="grid-column: 1 / -1; color: #f87171; text-align: center; padding: 2rem;">Error: ${escapeHtml(err.message)}</div>`;
    logMessage(`Fetch error: ${err.message}`, 'error');
  }
}

// Render Filtered and Sorted Catalog
function renderCatalog() {
  const grid = document.getElementById('resourcesGrid');
  const countBadge = document.getElementById('countBadge');
  if (!grid) return;

  // 1. Filter by Category & Search Query
  let filtered = allResources.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;

    const titleMatch = (item.title || '').toLowerCase().includes(searchQuery);
    const descMatch = (item.description || '').toLowerCase().includes(searchQuery);
    const catMatch = (item.category || '').toLowerCase().includes(searchQuery);
    const cleanQuery = searchQuery.replace(/^#/, '');
    const tagsMatch = (item.tags || []).some(t => t.toLowerCase().includes(cleanQuery));

    return titleMatch || descMatch || catMatch || tagsMatch;
  });

  // 2. Sort
  if (sortOption === 'alpha') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortOption === 'price-low') {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sortOption === 'price-high') {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // 3. Count Badge
  if (countBadge) {
    if (searchQuery || selectedCategory !== 'All') {
      countBadge.textContent = `${filtered.length} of ${allResources.length} Items`;
    } else {
      countBadge.textContent = `${filtered.length} ${filtered.length === 1 ? 'Resource' : 'Resources'}`;
    }
  }

  // 4. Empty State
  if (filtered.length === 0) {
    const filterNotice = searchQuery
      ? `No items matching "<strong>${escapeHtml(searchQuery)}</strong>"${selectedCategory !== 'All' ? ` in ${escapeHtml(selectedCategory)}` : ''}.`
      : `No items found in category <strong>${escapeHtml(selectedCategory)}</strong>.`;

    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; color: var(--text-muted); border: 2px dashed var(--border-subtle); border-radius: var(--radius-md);">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔍</div>
        <h4 style="font-size: 1.15rem; color: var(--text-main); margin-bottom: 0.5rem;">No matching releases found</h4>
        <p style="margin-bottom: 1.25rem;">${filterNotice}</p>
        <button class="btn btn-secondary btn-sm" onclick="clearSearch(); filterCategory('All');">Reset All Filters</button>
      </div>
    `;
    return;
  }

  // 5. Render Grid Cards
  grid.innerHTML = filtered.map(item => {
    const priceLabel = item.price === 0 ? 'FREE' : `$${Number(item.price).toFixed(2)}`;
    const thumb = item.imageUrl || '/images/banner.jpg';
    const tagsHtml = (item.tags || []).map(t => `<span class="tag-chip" style="cursor: pointer;" onclick="document.getElementById('catalogSearchInput').value='${escapeHtml(t)}'; handleSearch('${escapeHtml(t)}');" title="Filter by tag">#${escapeHtml(t)}</span>`).join('');
    const ytEmbed = getYouTubeEmbedUrl(item.mediaUrl);
    const safeTitle = escapeHtml(item.title).replace(/'/g, "\\'");

    let actionButtons = '';
    if (ytEmbed) {
      actionButtons = `
        <button class="btn btn-youtube btn-sm" onclick="openCinemaModal('${safeTitle}', '${ytEmbed}')">▶ Stream on Site</button>
        <a href="${escapeHtml(item.mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Open on YouTube">↗</a>
      `;
    } else if (item.mediaUrl && item.mediaUrl.includes('play.google.com')) {
      actionButtons = `<a href="${escapeHtml(item.mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-playstore btn-sm">▶ Google Play Store</a>`;
    } else if (item.mediaUrl) {
      actionButtons = `<a href="${escapeHtml(item.mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">▶ Open Link</a>`;
    }

    return `
      <div class="resource-card">
        <div class="resource-thumb-box" ${ytEmbed ? `style="cursor: pointer;" onclick="openCinemaModal('${safeTitle}', '${ytEmbed}')" title="Click to Play"` : ''}>
          <img src="${thumb}" alt="${escapeHtml(item.title)}" class="resource-thumb" onerror="this.src='/images/banner.jpg'" />
          ${ytEmbed ? `
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.45)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
              <div style="width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #ff0033, #cc0000); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.15rem; box-shadow: 0 4px 16px rgba(255,0,51,0.5);">▶</div>
            </div>
          ` : ''}
          <span class="badge-category">${escapeHtml(item.category)}</span>
          <span class="badge-price">${priceLabel}</span>
        </div>
        <div class="resource-body">
          <h3 class="resource-title">${escapeHtml(item.title)}</h3>
          <p class="resource-desc">${escapeHtml(item.description)}</p>
          <div class="tag-chips">${tagsHtml}</div>
          <div class="resource-footer">
            <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
              ${actionButtons}
            </div>
            <span style="font-size: 0.72rem; color: var(--text-faint);">${item.user ? escapeHtml(item.user.name) : 'Studio'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

// Startup
window.addEventListener('DOMContentLoaded', async () => {
  await checkHealth();
  await fetchResources();
});
