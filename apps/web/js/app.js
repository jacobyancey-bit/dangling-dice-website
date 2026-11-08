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

// YouTube Embed Helper (Supports single videos, playlists, shortlinks)
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const vMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    
    // If it has BOTH video and playlist (best for seamless playback):
    if (vMatch && playlistMatch) {
      return `https://www.youtube.com/embed/${vMatch[1]}?list=${playlistMatch[1]}&autoplay=1`;
    }
    if (playlistMatch) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1`;
    }
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
    }
    if (vMatch) {
      return `https://www.youtube.com/embed/${vMatch[1]}?autoplay=1`;
    }
    if (url.includes("youtube.com/embed/")) {
      return url.includes('autoplay=1') ? url : (url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`);
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
  
  // Guarantee valid embed format (converts watch?v= into /embed/ automatically)
  const embedUrl = (urlOrEmbed && urlOrEmbed.includes("youtube.com/embed/"))
    ? urlOrEmbed
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

// Floating Beats Audio Dock 
let isDockAudioActive = false;

window.toggleDockAudio = function () {
  const dock = document.getElementById("beatsDock");
  const btn = document.getElementById("dockPlayBtn");
  const drawer = document.getElementById("dockVideoDrawer");
  const iframe = document.getElementById("dockIframe");
  isDockAudioActive = !isDockAudioActive;

  if (isDockAudioActive) {
    if (dock) {
      dock.classList.add("playing");
      dock.classList.remove("minimized");
    }
    const minBtn = dock?.querySelector(".beats-dock-min-btn");
    if (minBtn) minBtn.textContent = "—";

    if (btn) btn.textContent = "⏸ Pause";
    if (drawer) drawer.style.display = "block";
    if (iframe) {
      const targetSrc = "https://www.youtube.com/embed/2J-U0EUATHs?list=PLAg2ptU_xF5c&autoplay=1&enablejsapi=1";
      if (!iframe.src || !iframe.src.includes("2J-U0EUATHs")) {
        iframe.src = targetSrc;
      }
    }
    window.showToast("▶ Streaming Lo-Fi Drive in background player", "success");
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
  try {
    localStorage.setItem("beatsDockMinimized", isMin ? "true" : "false");
  } catch (e) {
    // ignore
  }
};

function initDockState() {
  try {
    if (localStorage.getItem("beatsDockMinimized") === "true") {
      const dock = document.getElementById("beatsDock");
      const minBtn = dock?.querySelector(".beats-dock-min-btn");
      if (dock) dock.classList.add("minimized");
      if (minBtn) minBtn.textContent = "+";
    }
  } catch (e) {
    // ignore
  }

  // Explicit event listener to guarantee click triggers even across touch & deferred timing
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

// Startup
window.addEventListener("DOMContentLoaded", async () => {
  initDockState();
  await checkHealth();
  await fetchResources();
  await fetchTechStack();
});
