/**
 * Dangling Dice Studios™ — Public Catalog & Developer Tools Client Application
 */

const API_BASE =
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  window.location.port !== "5000" &&
  window.location.port !== "3000"
    ? "http://localhost:5000/api"
    : window.location.origin + "/api";

// YouTube Embed Helper with Privacy-Enhanced Mode (youtube-nocookie.com)
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const vMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    
    // Privacy-Enhanced Mode (youtube-nocookie.com prevents tracking cookies until user plays):
    if (vMatch && playlistMatch) {
      return `https://www.youtube-nocookie.com/embed/${vMatch[1]}?list=${playlistMatch[1]}&autoplay=1`;
    }
    if (playlistMatch) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1`;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?autoplay=1`;
    }
    if (vMatch) {
      return `https://www.youtube-nocookie.com/embed/${vMatch[1]}?autoplay=1`;
    }
    if (url.includes("youtube.com/embed/") || url.includes("youtube-nocookie.com/embed/")) {
      const sanitized = url.replace("www.youtube.com/embed/", "www.youtube-nocookie.com/embed/");
      return sanitized.includes('autoplay=1') ? sanitized : (sanitized.includes('?') ? `${sanitized}&autoplay=1` : `${sanitized}?autoplay=1`);
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Cinema Modal Controls
function openCinemaModal(title, urlOrEmbed) {
  const modal = document.getElementById("cinemaModal");
  const titleEl = document.getElementById("cinemaTitle");
  const iframeEl = document.getElementById("cinemaIframe");

  // Pause corner mini-player if it is running to prevent overlapping audio
  const dockIframe = document.getElementById("dockIframe");
  if (dockIframe && isDockAudioActive) {
    dockIframe.src = "";
    const dockDrawer = document.getElementById("dockVideoDrawer");
    if (dockDrawer) dockDrawer.style.display = "none";
    const dock = document.getElementById("beatsDock");
    const btn = document.getElementById("dockPlayBtn");
    if (dock) dock.classList.remove("playing");
    if (btn) btn.textContent = "▶ Play";
    isDockAudioActive = false;
  }
  
  // Guarantee valid embed format in Privacy-Enhanced mode
  let embedUrl = (urlOrEmbed && (urlOrEmbed.includes("youtube.com/embed/") || urlOrEmbed.includes("youtube-nocookie.com/embed/")))
    ? urlOrEmbed.replace("www.youtube.com/embed/", "www.youtube-nocookie.com/embed/")
    : (getYouTubeEmbedUrl(urlOrEmbed) || urlOrEmbed);

  if (titleEl) titleEl.textContent = title;
  if (iframeEl) iframeEl.src = embedUrl;
  if (modal) modal.style.display = "flex";
}

function closeCinemaModal() {
  const modal = document.getElementById("cinemaModal");
  const iframeEl = document.getElementById("cinemaIframe");
  if (modal) modal.style.display = "none";
  if (iframeEl) iframeEl.src = "";
}

// Expose modal functions to window for inline HTML onclick handlers
window.openCinemaModal = openCinemaModal;
window.closeCinemaModal = closeCinemaModal;

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCinemaModal();
});

document.addEventListener("click", (e) => {
  const modal = document.getElementById("cinemaModal");
  if (e.target === modal) closeCinemaModal();
});

// Logging helper (Developer Console)
function logMessage(msg, type = "info") {
  if (type === "error") console.error(`[DanglingDice] ${msg}`);
  else if (type === "success")
    console.log(`%c[DanglingDice] ${msg}`, "color: #10b981;");
  else console.log(`[DanglingDice] ${msg}`);
}

// Silent Health Check & Background Poller
async function checkHealth() {
  try {
    const start = performance.now();
    const res = await fetch(`${API_BASE}/health`);
    const duration = Math.round(performance.now() - start);
    if (res.ok) {
      const data = await res.json();
      const totalPulls = data?.analytics?.totalRequests || 0;
      logMessage(`API Health check OK: status 200 (${duration}ms, ${totalPulls} total pulls)`, "success");
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    logMessage(`API connection error: ${err.message}`, "error");
  }
}

// Private Owner Helper: Type window.getStudioTelemetry() in DevTools to inspect pulls anytime
window.getStudioTelemetry = async function () {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    console.table(data.analytics?.crawlers);
    console.table(data.analytics?.topEndpoints);
    return data;
  } catch (e) {
    console.error('Failed to retrieve studio telemetry', e);
  }
};

let allResources = [];
let selectedCategory = "All";
let searchQuery = "";
let sortOption = "newest";
let isCatalogExpanded = false;
const RECENT_ROW_LIMIT = 6;

// Category Filtering
window.filterCategory = function (cat) {
  selectedCategory = cat;
  isCatalogExpanded = false;
  document.querySelectorAll(".pill-btn").forEach((btn) => {
    const text = btn.textContent;
    const matches =
      (cat === "All" && text.includes("All")) ||
      (cat === "Coding Tutorials" && text.includes("Coding")) ||
      (cat === "Beats & Audio" && text.includes("Beats")) ||
      (cat === "Mobile Apps" && text.includes("Mobile Apps")) ||
      (cat === "Developer Tools" && text.includes("Dev Tools"));
    btn.classList.toggle("active", matches);
  });
  renderCatalog();
};

window.handleSearch = function (q) {
  searchQuery = (q || "").trim().toLowerCase();
  isCatalogExpanded = false;
  const clearBtn = document.getElementById("searchClearBtn");
  if (clearBtn) clearBtn.style.display = searchQuery ? "block" : "none";
  renderCatalog();
};

window.clearSearch = function () {
  const input = document.getElementById("catalogSearchInput");
  if (input) input.value = "";
  searchQuery = "";
  isCatalogExpanded = false;
  const clearBtn = document.getElementById("searchClearBtn");
  if (clearBtn) clearBtn.style.display = "none";
  renderCatalog();
};

window.handleSort = function (opt) {
  sortOption = opt;
  renderCatalog();
};

window.toggleCatalogExpand = function () {
  isCatalogExpanded = !isCatalogExpanded;
  renderCatalog();
};

// Resources Fetch
async function fetchResources() {
  const grid = document.getElementById("resourcesGrid");
  try {
    logMessage(`GET /api/items...`);
    const res = await fetch(`${API_BASE}/items`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    allResources = json.data || [];
    logMessage(`Loaded ${allResources.length} items from database.`, "success");
    renderCatalog();
  } catch (err) {
    if (grid)
      grid.innerHTML = `<div style="grid-column: 1 / -1; color: #f87171; text-align: center; padding: 2rem;">Error: ${escapeHtml(err.message)}</div>`;
    logMessage(`Fetch error: ${err.message}`, "error");
  }
}

// Render Filtered and Sorted Catalog
function renderCatalog() {
  const grid = document.getElementById("resourcesGrid");
  const countBadge = document.getElementById("countBadge");
  const expandWrapper = document.getElementById("catalogExpandWrapper");
  const toggleBtn = document.getElementById("toggleCatalogBtn");
  if (!grid) return;

  // 1. Filter to strictly Dangling Dice Studios™ In-House Releases (exclude partner/affiliate items & dead legacy placeholders)
  const studioOnlyResources = allResources.filter((item) => {
    if (item.isAffiliate) return false;
    const url = (item.liveUrl || item.mediaUrl || "").toLowerCase();
    if (url.includes("vpn.danglingdice.com") || url === "#mongoinspector") return false;
    return true;
  });

  // 2. Filter by Category & Search Query
  let filtered = studioOnlyResources.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;

    const titleMatch = (item.title || "").toLowerCase().includes(searchQuery);
    const descMatch = (item.description || "")
      .toLowerCase()
      .includes(searchQuery);
    const catMatch = (item.category || "").toLowerCase().includes(searchQuery);
    const cleanQuery = searchQuery.replace(/^#/, "");
    const tagsMatch = (item.tags || []).some((t) =>
      t.toLowerCase().includes(cleanQuery),
    );

    return titleMatch || descMatch || catMatch || tagsMatch;
  });

  // 2. Sort
  if (sortOption === "alpha") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortOption === "price-low") {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sortOption === "price-high") {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else {
    filtered.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );
  }

  // 3. Count Badge
  if (countBadge) {
    if (searchQuery || selectedCategory !== "All") {
      countBadge.textContent = `${filtered.length} of ${studioOnlyResources.length} Releases`;
    } else {
      countBadge.textContent = `${filtered.length} Studio ${filtered.length === 1 ? "Release" : "Releases"}`;
    }
  }

  // 4. Empty State
  if (filtered.length === 0) {
    if (expandWrapper) expandWrapper.style.display = "none";
    const filterNotice = searchQuery
      ? `No items matching "<strong>${escapeHtml(searchQuery)}</strong>"${selectedCategory !== "All" ? ` in ${escapeHtml(selectedCategory)}` : ""}.`
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

  // 5. Expand Button Visibility & Label
  const totalMatches = filtered.length;
  if (expandWrapper && toggleBtn) {
    if (totalMatches > RECENT_ROW_LIMIT) {
      expandWrapper.style.display = "block";
      toggleBtn.innerHTML = isCatalogExpanded
        ? "▲ Show Recent Uploads Only"
        : `📂 View Entire Course Catalog (${totalMatches} Items) ▾`;
    } else {
      expandWrapper.style.display = "none";
    }
  }

  // 6. Slice to Recent Row unless Expanded
  const itemsToRender = isCatalogExpanded
    ? filtered
    : filtered.slice(0, RECENT_ROW_LIMIT);

  // 7. Render Grid Cards (Every card & thumbnail is 100% clickable)
  grid.innerHTML = itemsToRender
    .map((item) => {
      const thumb = item.imageUrl || "/images/banner.jpg";
      const ytEmbed = getYouTubeEmbedUrl(item.mediaUrl);
      const safeTitle = escapeHtml(item.title).replace(/'/g, "\\'");
      const targetUrl = item.liveUrl || item.mediaUrl || "#catalog";
      const isInternalAnchor = targetUrl.startsWith("#");
      const safeTargetUrl = escapeHtml(targetUrl).replace(/'/g, "\\'");

      const cardClickHandler = ytEmbed
        ? `openCinemaModal('${safeTitle}', '${ytEmbed}')`
        : isInternalAnchor
          ? `const el = document.querySelector('${safeTargetUrl}'); if (el) el.scrollIntoView({ behavior: 'smooth' });`
          : `window.open('${safeTargetUrl}', '_blank', 'noopener,noreferrer')`;

      let actionButtons = "";

      if (item.isTool) {
        actionButtons = `
        <a href="${escapeHtml(targetUrl)}" onclick="event.stopPropagation();" ${isInternalAnchor ? "" : 'target="_blank" rel="noopener noreferrer"'} class="btn btn-primary btn-sm" style="min-width: 152px;">
          ${isInternalAnchor ? "Explore Sandboxes ⚡" : "Launch Web App ↗"}
        </a>
      `;
      } else if (ytEmbed) {
        actionButtons = `
        <button class="btn btn-youtube btn-sm" style="min-width: 152px;" onclick="event.stopPropagation(); openCinemaModal('${safeTitle}', '${ytEmbed}')">▶ Stream on Site</button>
      `;
      } else if (item.mediaUrl && item.mediaUrl.includes("play.google.com")) {
        actionButtons = `<a href="${escapeHtml(item.mediaUrl)}" onclick="event.stopPropagation();" target="_blank" rel="noopener noreferrer" class="btn btn-playstore btn-sm" style="min-width: 152px;">▶ Google Play ↗</a>`;
      } else if (item.mediaUrl) {
        actionButtons = `<a href="${escapeHtml(item.mediaUrl)}" onclick="event.stopPropagation();" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="min-width: 152px;">▶ Open Channel ↗</a>`;
      }

      return `
      <div class="resource-card ${item.isTool ? "resource-card-tool" : ""}" style="cursor: pointer;" onclick="${cardClickHandler}" title="Click to open ${escapeHtml(item.title)}">
        <div class="resource-thumb-box">
          <img src="${thumb}" alt="${escapeHtml(item.title)}" class="resource-thumb" onerror="this.src='/images/banner.jpg'" />
          ${
            ytEmbed
              ? `
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.45)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'">
              <div style="width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #ff0033, #cc0000); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.15rem; box-shadow: 0 4px 16px rgba(255,0,51,0.5);">▶</div>
            </div>
          `
              : ""
          }
        </div>
        <div class="resource-body">
          <h3 class="resource-title">${escapeHtml(item.title)}</h3>
          <p class="resource-desc">${escapeHtml(item.description)}</p>
          <div class="resource-footer">
            <span style="font-size: 0.72rem; color: var(--text-muted); white-space: nowrap;">${escapeHtml(item.category || "Official Release")}</span>
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

/**
 * ============================================================================
 * Interactive MongoDB Connection URI & Query Inspector (100% Client-Side)
 * Strictly in-memory; zero network calls or credentials transmitted.
 * ============================================================================
 */
window.inspectMongoUri = function (uri) {
  const cleanUri = (uri || "").trim();
  const resultsBox = document.getElementById("inspectorResults");
  const warningBox = document.getElementById("uriWarningBox");

  if (!cleanUri) {
    if (resultsBox) resultsBox.style.display = "none";
    return;
  }

  if (resultsBox) resultsBox.style.display = "block";

  let protocol = "Unknown";
  let host = "—";
  let dbName = "default (test)";
  let warnings = [];

  try {
    if (cleanUri.startsWith("mongodb+srv://")) {
      protocol = "mongodb+srv (DNS Seedlist / Atlas)";
    } else if (cleanUri.startsWith("mongodb://")) {
      protocol = "mongodb (Standard Connection)";
    } else {
      warnings.push(
        "URI must start with either <code>mongodb://</code> or <code>mongodb+srv://</code>",
      );
    }

    // Parse user:password@host/db
    const withoutProtocol = cleanUri.replace(/^mongodb(\+srv)?:\/\//, "");
    const atSplit = withoutProtocol.split("@");

    let hostAndDbPart = withoutProtocol;
    if (atSplit.length > 1) {
      const creds = atSplit[0];
      hostAndDbPart = atSplit.slice(1).join("@");

      // Check for unencoded special characters in password
      const colonIndex = creds.indexOf(":");
      if (colonIndex !== -1) {
        const rawPassword = creds.substring(colonIndex + 1);
        const forbiddenChars = [
          { char: "@", code: "%40" },
          { char: ":", code: "%3A" },
          { char: "#", code: "%23" },
          { char: "%", code: "%25" },
          { char: "&", code: "%26" },
          { char: "?", code: "%3F" },
          { char: "/", code: "%2F" },
        ];

        forbiddenChars.forEach(({ char, code }) => {
          if (rawPassword.includes(char)) {
            warnings.push(
              `Your password contains an unescaped <code>${char}</code> symbol. MongoDB requires this to be percent-encoded as <code>${code}</code> to prevent connection parser failures.`,
            );
          }
        });
      }
    }

    // Extract Host & Database
    const slashSplit = hostAndDbPart.split("/");
    host = slashSplit[0] || "localhost";

    if (slashSplit.length > 1) {
      const dbAndQuery = slashSplit[1].split("?");
      dbName = dbAndQuery[0] || "default";
    }

    const resProto = document.getElementById("resProtocol");
    const resH = document.getElementById("resHost");
    const resD = document.getElementById("resDb");
    const resHealth = document.getElementById("resHealth");

    if (resProto) resProto.textContent = protocol;
    if (resH) resH.textContent = host;
    if (resD) resD.textContent = dbName;

    // Render Warnings or Health
    if (warnings.length > 0) {
      if (resHealth)
        resHealth.innerHTML =
          '<span style="color: #f87171;">Syntax Issues Detected</span>';
      if (warningBox) {
        warningBox.style.display = "block";
        warningBox.innerHTML = `⚠️ <strong>Configuration Alert:</strong><ul style="margin: 0.5rem 0 0 1rem; padding: 0;">${warnings.map((w) => `<li>${w}</li>`).join("")}</ul>`;
      }
    } else {
      if (resHealth)
        resHealth.innerHTML =
          '<span style="color: var(--neon-emerald);">Valid Connection String</span>';
      if (warningBox) warningBox.style.display = "none";
    }

    // Generate sanitized .env output (Strips real password for PII protection)
    let sanitizedUri = cleanUri;
    if (atSplit.length > 1) {
      const creds = atSplit[0];
      const colonIndex = creds.indexOf(":");
      const user = colonIndex !== -1 ? creds.substring(0, colonIndex) : creds;
      sanitizedUri = `mongodb+srv://${user}:<YOUR_PASSWORD_HERE>@${host}/${dbName}?retryWrites=true&w=majority`;
    }

    const envSnippet = `# MongoDB Atlas Connection (Generated by Dangling Dice DevTools)\nPORT=5000\nNODE_ENV=production\nMONGODB_URI="${sanitizedUri}"\nMONGODB_DB_NAME="${dbName}"`;
    const envOutput = document.getElementById("envOutputSnippet");
    if (envOutput) envOutput.textContent = envSnippet;
  } catch (err) {
    if (warningBox) {
      warningBox.style.display = "block";
      warningBox.textContent = `Parse error: ${err.message}`;
    }
  }
};

window.loadSampleUri = function () {
  const sample =
    "mongodb+srv://studio_admin:MyPass123!@dangling-cluster.nnmqrde.mongodb.net/dangling_dice_db?retryWrites=true&w=majority";
  const input = document.getElementById("uriInput");
  if (input) {
    input.value = sample;
    window.inspectMongoUri(sample);
  }
};

// Universal Toast Notification System (10015.io inspired)
window.showToast = function (message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type === "success" ? "toast-success" : ""}`;
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, 3200);
};

window.copyEnvSnippet = function () {
  const snippet = document.getElementById("envOutputSnippet")?.textContent;
  if (snippet) {
    navigator.clipboard.writeText(snippet);
    window.showToast(
      "Sanitized .env snippet copied to clipboard! (Remember to substitute your real password)",
      "success",
    );
  }
};

// WireGuard Sample Configuration Tools (10015.io & Transform.tools inspired)
window.loadSampleWireGuard = function () {
  const sample = `# Dangling Dice WireGuard Client Configuration
# Generated for client tunnel (Zero Server Logs)
[Interface]
PrivateKey = aAAAa111SampleClientPrivateKeyHereGenerated1=
Address = 10.13.13.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = sSSSs222SampleServerPublicKeyHereValidated2=
Endpoint = vpn.dangling-dice-studios.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`;

  const output = document.getElementById("wgSampleOutput");
  if (output) {
    output.textContent = sample;
    window.showToast("Loaded sample WireGuard client config!", "success");
  }
};

window.copyWireGuardConfig = function () {
  const output = document.getElementById("wgSampleOutput");
  const text = output?.textContent;
  if (text && !text.startsWith('# Click "Load Sample Config"')) {
    navigator.clipboard.writeText(text);
    window.showToast("WireGuard configuration copied to clipboard!", "success");
  } else {
    window.loadSampleWireGuard();
    const generated = document.getElementById("wgSampleOutput")?.textContent;
    if (generated) navigator.clipboard.writeText(generated);
    window.showToast("Generated and copied sample config!", "success");
  }
};

// ============================================================================
// Multi-Station Beats Audio Dock & Indie Music Radio Engine
// ============================================================================
let isDockAudioActive = false;
let isPlaylistDrawerOpen = false;

// 1. Official Dangling Beats Studio Stations (Privacy-Enhanced Mode via youtube-nocookie.com)
const officialStations = [
  {
    id: "lofi-drive",
    title: "Dangling Beats • Lo-Fi Drive",
    subtitle: "Official Lo-Fi Focus Radio",
    badge: "Lo-Fi",
    videoId: "2J-U0EUATHs",
    url: "https://www.youtube-nocookie.com/embed/2J-U0EUATHs?list=PLAg2ptU_xF5c&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "dreamcore",
    title: "Dangling Beats • Dreamcore",
    subtitle: "Ethereal Ambient Soundscapes",
    badge: "Dreamcore",
    videoId: "BGW1y-9bVJc",
    url: "https://www.youtube-nocookie.com/embed/BGW1y-9bVJc?list=PLByFVPrF7p0s&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "relaxing-jazz",
    title: "Dangling Beats • Relaxing Jazz",
    subtitle: "Smooth Rhodes & Jazzy Vibes",
    badge: "Jazz",
    videoId: "0YknzKYiDXo",
    url: "https://www.youtube-nocookie.com/embed/0YknzKYiDXo?list=PLZzyR4Y8j_gA&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "jk-pop",
    title: "Dangling Beats • J/K Pop Background",
    subtitle: "Upbeat Coding & Creative Rhythm",
    badge: "Pop",
    videoId: "8Z0e3VIb-4U",
    url: "https://www.youtube-nocookie.com/embed/8Z0e3VIb-4U?list=PLUOqd5Jfm3gw&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "yacht-rock",
    title: "Dangling Beats • Yacht Rock",
    subtitle: "Classic Sunset Grooves",
    badge: "Groove",
    videoId: "2Onu8sRtlk8",
    url: "https://www.youtube-nocookie.com/embed/2Onu8sRtlk8?list=PLOQPFjHz5Vs4&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "sleep-music",
    title: "Dangling Beats • Sleep Music",
    subtitle: "Deep Relaxation & Binaural Waves",
    badge: "Sleep",
    videoId: "fdBVmykxMqE",
    url: "https://www.youtube-nocookie.com/embed/fdBVmykxMqE?list=PLJL6dnrrRw-k&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "music-albums",
    title: "Dangling Beats • Music Albums",
    subtitle: "Full Studio Album Catalog",
    badge: "Albums",
    videoId: "YIaOzPji1Kk",
    url: "https://www.youtube-nocookie.com/embed/YIaOzPji1Kk?list=PLR6uUDnIO7P0&autoplay=1&enablejsapi=1&playsinline=1",
  },
  {
    id: "live-videos",
    title: "Dangling Beats • Live Sessions",
    subtitle: "Live Studio Broadcasts",
    badge: "Live",
    videoId: "YY8mKBKGM5o",
    url: "https://www.youtube-nocookie.com/embed/YY8mKBKGM5o?list=PLFLqzwDKWUyQ&autoplay=1&enablejsapi=1&playsinline=1",
  },
];

// 2. Custom User Added Playlists (Persisted in localStorage)
let customStations = [];
try {
  customStations = JSON.parse(localStorage.getItem("customBeatsStations") || "[]");
} catch (e) {
  customStations = [];
}

// 3. Featured Indie Music Producer Stations (Dynamically expanded via /api/showcase)
let indieStations = [];

let activeStationId = localStorage.getItem("activeBeatsStation") || "lofi-drive";

function getActiveStation() {
  return (
    officialStations.find((s) => s.id === activeStationId) ||
    customStations.find((s) => s.id === activeStationId) ||
    indieStations.find((s) => s.id === activeStationId) ||
    officialStations[0]
  );
}

function renderStationsList() {
  const customSection = document.getElementById("customStationsSection");
  const customContainer = document.getElementById("customStationsList");
  const officialContainer = document.getElementById("officialStationsList");
  const indieContainer = document.getElementById("indieStationsList");

  // Render Custom Playlists
  if (customContainer && customSection) {
    if (customStations.length > 0) {
      customSection.style.display = "block";
      customContainer.innerHTML = customStations
        .map(
          (s) => `
          <div class="dock-station-item ${s.id === activeStationId ? "active" : ""}" onclick="selectStation('${s.id}')">
            <div class="dock-station-info">
              <span class="dock-station-title">${s.title}</span>
              <span class="dock-station-sub" style="color: #67e8f9;">${s.subtitle}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 0.72rem; color: ${s.id === activeStationId ? "#f472b6" : "var(--text-muted)"};">
                ${s.id === activeStationId ? "▶ Playing" : "▶"}
              </span>
              <button type="button" onclick="removeCustomStation('${s.id}', event)" title="Remove playlist" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 0.8rem; padding: 0.1rem 0.25rem;">&times;</button>
            </div>
          </div>
        `
        )
        .join("");
    } else {
      customSection.style.display = "none";
    }
  }

  // Render Official Dangling Beats Playlists
  if (officialContainer) {
    officialContainer.innerHTML = officialStations
      .map(
        (s) => `
        <div class="dock-station-item ${s.id === activeStationId ? "active" : ""}" onclick="selectStation('${s.id}')">
          <div class="dock-station-info">
            <span class="dock-station-title">${s.title}</span>
            <span class="dock-station-sub">${s.subtitle}</span>
          </div>
          <span style="font-size: 0.75rem; color: ${s.id === activeStationId ? "#f472b6" : "var(--text-muted)"};">
            ${s.id === activeStationId ? "▶ Playing" : "▶"}
          </span>
        </div>
      `
      )
      .join("");
  }

  // Render Indie Producer Stations
  if (indieContainer) {
    if (indieStations.length === 0) {
      indieContainer.innerHTML = `
        <div style="font-size: 0.72rem; color: var(--text-muted); padding: 0.5rem; text-align: center;">
          No community beats yet. Click <strong>+ Submit Beats</strong> above!
        </div>
      `;
    } else {
      indieContainer.innerHTML = indieStations
        .map(
          (s) => `
          <div class="dock-station-item ${s.id === activeStationId ? "active" : ""}" onclick="selectStation('${s.id}')">
            <div class="dock-station-info">
              <span class="dock-station-title">${s.title}</span>
              <span class="dock-station-sub" style="color: #67e8f9;">${s.subtitle}</span>
            </div>
            <span style="font-size: 0.75rem; color: ${s.id === activeStationId ? "#f472b6" : "var(--text-muted)"};">
              ${s.id === activeStationId ? "▶ Playing" : "▶"}
            </span>
          </div>
        `
        )
        .join("");
    }
  }
}

window.toggleCustomStationForm = function () {
  const form = document.getElementById("dockAddStationForm");
  if (!form) return;
  const isHidden = form.style.display === "none";
  form.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    const titleInput = document.getElementById("customStationTitle");
    if (titleInput) titleInput.focus();
  }
};

window.submitCustomStation = function () {
  const titleInput = document.getElementById("customStationTitle");
  const urlInput = document.getElementById("customStationUrl");
  const title = titleInput?.value?.trim() || "";
  const url = urlInput?.value?.trim() || "";

  if (!url) {
    window.showToast("Please enter a YouTube playlist or video link", "error");
    return;
  }

  const embed = getYouTubeEmbedUrl(url);
  if (!embed) {
    window.showToast("Invalid YouTube URL. Please provide a playlist or watch link.", "error");
    return;
  }

  const stationName = title || "Custom Beats Playlist";
  const newStation = {
    id: "custom-" + Date.now(),
    title: stationName,
    subtitle: "Custom YouTube Station",
    badge: "Custom",
    url: embed.includes("autoplay=1") ? embed : `${embed}${embed.includes("?") ? "&" : "?"}autoplay=1&enablejsapi=1`,
    isCustom: true,
  };

  customStations.unshift(newStation);
  try {
    localStorage.setItem("customBeatsStations", JSON.stringify(customStations));
  } catch (e) {}

  if (titleInput) titleInput.value = "";
  if (urlInput) urlInput.value = "";
  window.toggleCustomStationForm();
  renderStationsList();
  window.selectStation(newStation.id);
  window.showToast(`✅ Added & playing: ${stationName}`, "success");
};

window.removeCustomStation = function (stationId, event) {
  if (event) event.stopPropagation();
  customStations = customStations.filter((s) => s.id !== stationId);
  try {
    localStorage.setItem("customBeatsStations", JSON.stringify(customStations));
  } catch (e) {}
  if (activeStationId === stationId) {
    window.selectStation(officialStations[0].id);
  } else {
    renderStationsList();
  }
  window.showToast("Station removed", "info");
};

function isMobileViewport() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

window.togglePlaylistDrawer = function () {
  const drawer = document.getElementById("dockPlaylistDrawer");
  const backdrop = document.getElementById("dockBackdrop");
  if (!drawer) return;
  isPlaylistDrawerOpen = !isPlaylistDrawerOpen;
  drawer.style.display = isPlaylistDrawerOpen ? "flex" : "none";
  if (backdrop) {
    backdrop.style.display = (isPlaylistDrawerOpen && isMobileViewport()) ? "block" : "none";
  }
  if (isPlaylistDrawerOpen) {
    renderStationsList();
  }
};

window.selectStation = function (stationId) {
  activeStationId = stationId;
  try {
    localStorage.setItem("activeBeatsStation", stationId);
  } catch (e) {}

  const station = getActiveStation();
  const titleEl = document.getElementById("dockTrackTitle");
  const subEl = document.getElementById("dockTrackSubtitle");
  if (titleEl) titleEl.textContent = station.title;
  if (subEl) subEl.textContent = station.subtitle;

  const iframe = document.getElementById("dockIframe");
  const drawer = document.getElementById("dockVideoDrawer");
  const dock = document.getElementById("beatsDock");
  const btn = document.getElementById("dockPlayBtn");

  // On desktop PC, show mini video drawer; on phone, stream background audio without blocking screen
  if (drawer) {
    drawer.style.display = isMobileViewport() ? "none" : "block";
  }
  if (dock) {
    dock.classList.add("playing");
    if (!isMobileViewport()) {
      dock.classList.remove("minimized");
    }
  }
  if (btn) btn.textContent = "⏸ Pause";
  isDockAudioActive = true;

  // Set iframe src synchronously within the click event to preserve browser user activation
  if (iframe) {
    const origin = window.location.origin;
    let url = station.url;
    if (!url.includes("origin=")) {
      url += (url.includes("?") ? "&" : "?") + `origin=${encodeURIComponent(origin)}`;
    }
    iframe.src = url;
  }

  // Close drawer and backdrop after selection
  isPlaylistDrawerOpen = false;
  const pDrawer = document.getElementById("dockPlaylistDrawer");
  if (pDrawer) pDrawer.style.display = "none";
  const backdrop = document.getElementById("dockBackdrop");
  if (backdrop) backdrop.style.display = "none";

  renderStationsList();
  window.showToast(`▶ Now Playing: ${station.title}`, "success");
};

window.openCurrentStationCinema = function () {
  const station = getActiveStation();
  if (window.openCinemaModal) {
    window.openCinemaModal(station.title, station.url);
  }
};

window.toggleDockAudio = function () {
  const dock = document.getElementById("beatsDock");
  const btn = document.getElementById("dockPlayBtn");
  const drawer = document.getElementById("dockVideoDrawer");
  const iframe = document.getElementById("dockIframe");
  isDockAudioActive = !isDockAudioActive;

  const currentStation = getActiveStation();

  if (isDockAudioActive) {
    if (dock) {
      dock.classList.add("playing");
      if (!isMobileViewport()) {
        dock.classList.remove("minimized");
      }
    }
    const minBtn = dock?.querySelector(".beats-dock-min-btn");
    if (minBtn && dock && !dock.classList.contains("minimized")) {
      minBtn.textContent = "—";
    }

    if (btn) btn.textContent = "⏸ Pause";
    // On desktop, show video drawer; on mobile phone, keep hidden to save screen space
    if (drawer) {
      drawer.style.display = isMobileViewport() ? "none" : "block";
    }
    if (iframe) {
      const origin = window.location.origin;
      let url = currentStation.url;
      if (!url.includes("origin=")) {
        url += (url.includes("?") ? "&" : "?") + `origin=${encodeURIComponent(origin)}`;
      }
      iframe.src = url;
    }
    window.showToast(`▶ Streaming ${currentStation.title}`, "success");
  } else {
    if (dock) dock.classList.remove("playing");
    if (btn) btn.textContent = "▶ Play";
    if (iframe) iframe.src = "";
    if (drawer) drawer.style.display = "none";
  }
};

window.toggleDockMinimize = function () {
  const dock = document.getElementById("beatsDock");
  const minBtn = dock?.querySelector(".beats-dock-min-btn");
  if (!dock) return;
  const isMin = dock.classList.toggle("minimized");
  if (minBtn) minBtn.textContent = isMin ? "+" : "—";

  // Hide playlist drawer if minimized
  if (isMin) {
    const drawer = document.getElementById("dockPlaylistDrawer");
    if (drawer) drawer.style.display = "none";
    const backdrop = document.getElementById("dockBackdrop");
    if (backdrop) backdrop.style.display = "none";
    isPlaylistDrawerOpen = false;
  }

  try {
    localStorage.setItem("beatsDockMinimized", isMin ? "true" : "false");
  } catch (e) {}
};

function initDockState() {
  const isMobile = isMobileViewport();
  try {
    const savedMin = localStorage.getItem("beatsDockMinimized");
    const dock = document.getElementById("beatsDock");
    const minBtn = dock?.querySelector(".beats-dock-min-btn");

    // Phone vs PC separation:
    // On mobile phone, start minimized by default so it never covers the screen.
    // On desktop PC, start open unless the user previously minimized it.
    if (savedMin === "true" || (savedMin === null && isMobile)) {
      if (dock) dock.classList.add("minimized");
      if (minBtn) minBtn.textContent = "+";
    }
  } catch (e) {}

  const currentStation = getActiveStation();
  const titleEl = document.getElementById("dockTrackTitle");
  const subEl = document.getElementById("dockTrackSubtitle");
  if (titleEl) titleEl.textContent = currentStation.title;
  if (subEl) subEl.textContent = currentStation.subtitle;

  renderStationsList();

  const dockPlayBtn = document.getElementById("dockPlayBtn");
  if (dockPlayBtn) {
    dockPlayBtn.onclick = function (e) {
      if (e) e.preventDefault();
      window.toggleDockAudio();
    };
  }
}

// Studio Tech Stack Directory (Wes Bos inspired)
async function fetchTechStack() {
  const grid = document.getElementById("techStackGrid");
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/affiliates`);
    let partners = [];
    if (res.ok) {
      const json = await res.json();
      partners = json.data || [];
    }

    if (!partners || partners.length === 0) {
      partners = [
        {
          slug: "atlas",
          name: "MongoDB Atlas Cloud",
          category: "Cloud Hosting & Databases",
          description:
            "Fully managed cloud document database with auto-scaling, global clusters, and vector search.",
          perkBadge: "Free 512MB M0 Cluster",
          icon: "🍃",
          redirectUrl: "/go/atlas",
        },
        {
          slug: "digitalocean",
          name: "DigitalOcean Droplets",
          category: "Cloud Hosting & Databases",
          description:
            "Simple, scalable cloud computing and virtual machines built for developers and startups.",
          perkBadge: "$200 Free 60-Day Credit",
          icon: "🌊",
          redirectUrl: "/go/digitalocean",
        },
        {
          slug: "vpn",
          name: "Dangling Dice WireGuard VPN",
          category: "Developer Tools",
          description:
            "Ultra-fast in-kernel WireGuard encrypted tunnel with zero activity logs and leak protection.",
          perkBadge: "100% Free Developer Tool",
          icon: "🛡️",
          redirectUrl: "/go/vpn",
        },
        {
          slug: "calculator",
          name: "AI Calculator on Google Play",
          category: "Mobile Apps",
          description:
            "Smart Android homework solver with step-by-step arithmetic, scientific calculation, and AI OCR scanning.",
          perkBadge: "Official Google Play App",
          icon: "📱",
          redirectUrl: "/go/calculator",
        },
        {
          slug: "youtube",
          name: "Dangling Beats Official Channel",
          category: "Official Channels",
          description:
            "Original lofi, dark trap, and synthwave instrumentals crafted for code sessions and content creators.",
          perkBadge: "24/7 Focus Beats & Masterclasses",
          icon: "🎧",
          redirectUrl: "/go/youtube",
        },
      ];
    }

    grid.innerHTML = partners
      .map(
        (p) => `
      <div class="tech-stack-card">
        <div>
          <div class="tech-card-header">
            <span class="tech-card-icon">${escapeHtml(p.icon || "⚡")}</span>
            <span class="tech-card-badge">${escapeHtml(p.perkBadge || "Verified Partner")}</span>
          </div>
          <div class="pill-tag pill-tag-cyan" style="display: inline-block; margin-bottom: 0.5rem; font-size: 0.68rem; padding: 0.15rem 0.5rem;">
            ${escapeHtml(p.category || "Tech Stack")}
          </div>
          <h3 class="tech-card-title">${escapeHtml(p.name)}</h3>
          <p class="tech-card-desc">${escapeHtml(p.description)}</p>
        </div>
        <div class="tech-card-footer">
          <span style="font-size: 0.72rem; color: var(--text-muted);">
            Verified Partner Perk
          </span>
          <a href="${escapeHtml(p.redirectUrl)}?src=tech_stack" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Access Deal ↗
          </a>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    logMessage(`Failed to load tech stack: ${err.message}`, "error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================================================================
// Live Cloud Sandbox Runner (Executes 24/7 against Render /v1/* Endpoints)
// =========================================================================
const SANDBOX_PRESETS = {
  schema: {
    title: "🧩 JSON & SQL Schema Converter",
    endpoint: "/v1/schema/infer",
    payload: {
      rootName: "UserAccount",
      jsonInput: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "creator@dangling-dice-studios.com",
        plan: "PRO",
        credits: 2500,
        active: true,
      },
    },
  },
  geo: {
    title: "🗺️ Land Acreage & GPS Calculator",
    endpoint: "/v1/geo/parcel-metrics",
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
    title: "🛡️ Sensitive Data & Log Redactor",
    endpoint: "/v1/privacy/redact",
    payload: {
      mode: "mask",
      text: "Customer email is jacob@dangling-dice-studios.com, phone (615) 555-0199, SSN 123-45-6789.",
    },
  },
  finance: {
    title: "💰 Loan Payoff & ROI Calculator",
    endpoint: "/v1/finance/amortization",
    payload: {
      principal: 250000,
      annualRatePercent: 6.25,
      termMonths: 360,
    },
  },
};

let activeSandboxKey = "schema";

window.openCloudSandbox = async function (key) {
  const preset = SANDBOX_PRESETS[key] || SANDBOX_PRESETS.schema;
  activeSandboxKey = key in SANDBOX_PRESETS ? key : "schema";
  const drawer = document.getElementById("cloudSandboxDrawer");
  const titleEl = document.getElementById("sandboxTitle");
  const badgeEl = document.getElementById("sandboxBadge");
  const inputEl = document.getElementById("sandboxInput");

  if (titleEl) titleEl.textContent = preset.title;
  if (badgeEl) badgeEl.textContent = `LIVE CLOUD SANDBOX • POST ${preset.endpoint}`;
  if (inputEl) inputEl.value = JSON.stringify(preset.payload, null, 2);
  if (drawer) {
    drawer.style.display = "block";
    drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  await window.runCloudSandbox();
};

window.runCloudSandbox = async function () {
  const preset = SANDBOX_PRESETS[activeSandboxKey] || SANDBOX_PRESETS.schema;
  const inputEl = document.getElementById("sandboxInput");
  const outputEl = document.getElementById("sandboxOutput");
  const labelEl = document.getElementById("sandboxOutputLabel");

  if (!inputEl || !outputEl) return;
  outputEl.textContent = "Executing on Dangling Dice Cloud Engine...";

  try {
    const parsedBody = JSON.parse(inputEl.value);
    const baseOrigin =
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      window.location.port !== "5000" &&
      window.location.port !== "3000"
        ? "http://localhost:5000"
        : window.location.origin;

    const res = await fetch(`${baseOrigin}${preset.endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedBody),
    });
    const json = await res.json();
    if (labelEl) {
      labelEl.textContent = `Live Engine Output (${json.latencyMs ?? 1}ms • ${res.status} OK)`;
    }
    if (activeSandboxKey === "finance" && json.data?.schedule) {
      outputEl.textContent = JSON.stringify(
        {
          monthlyPayment: json.data.monthlyPayment,
          totalPrincipal: json.data.totalPrincipal,
          totalInterest: json.data.totalInterest,
          totalCost: json.data.totalCost,
          first3MonthsPreview: json.data.schedule.slice(0, 3),
        },
        null,
        2,
      );
    } else {
      outputEl.textContent = JSON.stringify(json.data || json, null, 2);
    }
  } catch (err) {
    outputEl.textContent = `Error: ${err.message}`;
  }
};

// ============================================================================
// Multi-Category Indie Developer & Creator Showcase
// ============================================================================
function populateCategorySpotlight(prefix, app, defaultCategory) {
  if (!app) return;
  const titleEl = document.getElementById(`${prefix}SpotlightTitle`);
  const taglineEl = document.getElementById(`${prefix}SpotlightTagline`);
  const descEl = document.getElementById(`${prefix}SpotlightDesc`);
  const authorEl = document.getElementById(`${prefix}SpotlightAuthor`);
  const liveEl = document.getElementById(`${prefix}SpotlightLive`);
  const githubEl = document.getElementById(`${prefix}SpotlightGithub`);
  const badgeEl = document.getElementById(`${prefix}SpotlightCatBadge`);
  const stackEl = document.getElementById(`${prefix}SpotlightStack`);

  if (titleEl) titleEl.textContent = app.title;
  if (taglineEl) taglineEl.textContent = app.tagline;
  if (descEl) descEl.textContent = app.description;
  if (authorEl) {
    authorEl.textContent = app.authorSocial ? `${app.authorName} (${app.authorSocial})` : app.authorName;
  }
  if (liveEl) liveEl.href = app.appUrl;
  if (githubEl) {
    if (app.githubUrl) {
      githubEl.href = app.githubUrl;
      githubEl.style.display = "inline-flex";
    } else {
      githubEl.style.display = "none";
    }
  }
  if (badgeEl) badgeEl.textContent = app.category || defaultCategory;
  if (stackEl && Array.isArray(app.techStack)) {
    const pillClass = prefix === "creator" ? "pill-tag-purple" : prefix === "music" ? "pill-tag-pink" : "pill-tag-cyan";
    stackEl.innerHTML = app.techStack
      .map((tech) => `<span class="pill-tag ${pillClass}">${tech}</span>`)
      .join("");
  }
}

async function fetchDevShowcase() {
  try {
    const res = await fetch(`${API_BASE}/showcase`);
    if (!res.ok) return;
    const json = await res.json();
    const data = json.data || {};

    // 1. Populate Category-Specific Spotlights across all Suites
    const spotlights = data.spotlights || {};
    populateCategorySpotlight("creator", spotlights.creator, "Social & Video");
    populateCategorySpotlight("music", spotlights.music, "Audio & Music");
    populateCategorySpotlight("developer", spotlights.developer, "Developer Tools");

    // 1b. Update Dynamic Indie Music Producer Stations in Floating Beats Dock
    if (Array.isArray(data.projects)) {
      const musicProjects = data.projects.filter(
        (p) => p.categoryGroup === "music" || p.category === "Audio & Music"
      );
      if (musicProjects.length > 0) {
        indieStations = musicProjects.map((p) => ({
          id: p._id,
          title: p.title,
          subtitle: `Producer: ${p.authorSocial || p.authorName}`,
          badge: "Indie Producer",
          url: getYouTubeEmbedUrl(p.appUrl) || p.appUrl,
        }));
        renderStationsList();
      }
    }

    // 2. Render App of the Week in Central Community Section
    const aotw = data.appOfTheWeek || spotlights.developer || spotlights.music || spotlights.creator;
    if (aotw) {
      const titleEl = document.getElementById("aotwTitle");
      const taglineEl = document.getElementById("aotwTagline");
      const descEl = document.getElementById("aotwDescription");
      const authorEl = document.getElementById("aotwAuthor");
      const liveLinkEl = document.getElementById("aotwLiveLink");
      const githubLinkEl = document.getElementById("aotwGithubLink");
      const categoryEl = document.getElementById("aotwCategory");
      const stackEl = document.getElementById("aotwTechStack");

      if (titleEl) titleEl.textContent = aotw.title;
      if (taglineEl) taglineEl.textContent = aotw.tagline;
      if (descEl) descEl.textContent = aotw.description;
      if (authorEl) {
        authorEl.textContent = aotw.authorSocial
          ? `${aotw.authorName} (${aotw.authorSocial})`
          : aotw.authorName;
      }
      if (liveLinkEl) liveLinkEl.href = aotw.appUrl;
      if (githubLinkEl) {
        if (aotw.githubUrl) {
          githubLinkEl.href = aotw.githubUrl;
          githubLinkEl.style.display = "inline-flex";
        } else {
          githubLinkEl.style.display = "none";
        }
      }
      if (categoryEl) categoryEl.textContent = aotw.category;
      if (stackEl && Array.isArray(aotw.techStack)) {
        stackEl.innerHTML = aotw.techStack
          .map((tech) => `<span class="pill-tag pill-tag-cyan">${tech}</span>`)
          .join("");
      }
    }

    // 3. Render Showcase Grid
    const gridEl = document.getElementById("devShowcaseGrid");
    if (!gridEl) return;

    if (!data.projects || data.projects.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🛠️</div>
          <div>Be the first indie creator featured! Click <strong>+ Submit Your App</strong> above.</div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = data.projects
      .map((proj) => {
        const stackBadges = (proj.techStack || [])
          .slice(0, 3)
          .map((t) => `<span class="pill-tag pill-tag-purple" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">${t}</span>`)
          .join(" ");

        return `
          <div class="tech-stack-card" style="border-color: ${proj.isAppOfTheWeek ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'};">
            <div>
              <div class="tech-card-header">
                <span class="tech-card-icon">🚀</span>
                <span class="tech-card-badge" style="color: ${proj.isAppOfTheWeek ? '#fbbf24' : 'var(--neon-cyan)'};">
                  ${proj.isAppOfTheWeek ? '⭐ Active Spotlight' : proj.category}
                </span>
              </div>
              <div style="margin-bottom: 0.4rem; display: flex; gap: 0.3rem; flex-wrap: wrap;">
                ${stackBadges}
              </div>
              <h3 class="tech-card-title">${proj.title}</h3>
              <p style="font-size: 0.78rem; font-weight: 600; color: var(--neon-cyan); margin-bottom: 0.4rem;">
                ${proj.tagline}
              </p>
              <p class="tech-card-desc">${proj.description.slice(0, 140)}${proj.description.length > 140 ? '...' : ''}</p>
            </div>
            <div class="tech-card-footer" style="padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.72rem; color: var(--text-muted);">
                by <strong style="color: #fff;">${proj.authorName}</strong>
              </span>
              <a href="${proj.appUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;">
                Try App ↗
              </a>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load developer showcase:", err);
  }
}

// Modal controls
function openDevSubmissionModal(defaultCategory) {
  const el = document.getElementById("devSubmissionModal");
  if (el) el.style.display = "flex";
  if (defaultCategory) {
    const selectEl = document.getElementById("subCategory");
    if (selectEl) {
      for (let i = 0; i < selectEl.options.length; i++) {
        if (
          selectEl.options[i].value.toLowerCase().includes(defaultCategory.toLowerCase()) ||
          defaultCategory.toLowerCase().includes(selectEl.options[i].value.toLowerCase())
        ) {
          selectEl.selectedIndex = i;
          break;
        }
      }
    }
  }
}

function closeDevSubmissionModal() {
  const el = document.getElementById("devSubmissionModal");
  if (el) el.style.display = "none";
}

async function handleDevSubmission(e) {
  e.preventDefault();
  const alertEl = document.getElementById("submissionAlert");
  const submitBtn = document.getElementById("subSubmitBtn");

  const title = document.getElementById("subAppTitle")?.value;
  const category = document.getElementById("subCategory")?.value;
  const tagline = document.getElementById("subTagline")?.value;
  const description = document.getElementById("subDescription")?.value;
  const appUrl = document.getElementById("subAppUrl")?.value;
  const githubUrl = document.getElementById("subGithubUrl")?.value;
  const authorName = document.getElementById("subAuthorName")?.value;
  const authorSocial = document.getElementById("subAuthorSocial")?.value;
  const techStack = document.getElementById("subTechStack")?.value;

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Submitting...";
    }

    const res = await fetch(`${API_BASE}/showcase/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        tagline,
        description,
        appUrl,
        githubUrl,
        authorName,
        authorSocial,
        techStack,
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to submit project.");

    if (alertEl) {
      alertEl.className = "alert alert-success";
      alertEl.textContent = "🎉 Project submitted successfully! Our team will review and spotlight it.";
      alertEl.style.display = "block";
    }

    document.getElementById("devSubmissionForm")?.reset();
    setTimeout(() => {
      closeDevSubmissionModal();
      if (alertEl) alertEl.style.display = "none";
    }, 2500);
  } catch (err) {
    if (alertEl) {
      alertEl.className = "alert alert-error";
      alertEl.textContent = `❌ ${err.message}`;
      alertEl.style.display = "block";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Submit for Review";
    }
  }
}

// Privacy Policy & Cookie Preferences Controls
function openPrivacyModal() {
  const modal = document.getElementById("privacyModal");
  if (modal) modal.style.display = "flex";
}

function closePrivacyModal() {
  const modal = document.getElementById("privacyModal");
  if (modal) modal.style.display = "none";
}

function closeCookieBanner(preference) {
  try {
    localStorage.setItem("dds_cookie_consent", preference || "accepted");
  } catch (e) {}
  const banner = document.getElementById("cookieConsentBanner");
  if (banner) {
    banner.style.opacity = "0";
    banner.style.transform = "translateY(15px)";
    setTimeout(() => {
      banner.style.display = "none";
    }, 250);
  }
}

function initCookieConsent() {
  try {
    const consent = localStorage.getItem("dds_cookie_consent");
    if (!consent) {
      const banner = document.getElementById("cookieConsentBanner");
      if (banner) {
        setTimeout(() => {
          banner.style.display = "flex";
        }, 800);
      }
    }
  } catch (e) {}
}

// Window bindings
window.openDevSubmissionModal = openDevSubmissionModal;
window.closeDevSubmissionModal = closeDevSubmissionModal;
window.handleDevSubmission = handleDevSubmission;
window.openPrivacyModal = openPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.closeCookieBanner = closeCookieBanner;

// Startup
window.addEventListener("DOMContentLoaded", async () => {
  initDockState();
  initCookieConsent();
  await checkHealth();
  await fetchResources();
  await fetchTechStack();
  await fetchDevShowcase();
});
