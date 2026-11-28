/**
 * Dangling Dice Studios™ — Public Catalog & Developer Tools Client Application
 */

import {
  initStaffCommandPalette,
  initPwaServiceWorker,
  initStudioShell,
  initTabKeyboard,
  icon,
  hydrateIcons,
} from '@dangling-dice/shared';

// Swap <span data-icon> placeholders for stroke icons before any handlers run
hydrateIcons();

// Universal PWA Service Worker Registration
initPwaServiceWorker();

const API_BASE =
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  window.location.port !== "5000" &&
  window.location.port !== "3000"
    ? "http://localhost:5000/api"
    : window.location.origin + "/api";

function escapeHtml(str) {
  if (str === null || str === undefined || str === "") return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Only http(s) URLs (or same-site paths/anchors when allowed) may become hrefs or srcs
function safeUrl(raw, { allowRelative = true } = {}) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (allowRelative && (value.startsWith("#") || (value.startsWith("/") && !value.startsWith("//")))) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch (e) {
    return "";
  }
}

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

// ============================================================================
// Dialogs: open/close with focus management; Escape closes the topmost one
// ============================================================================
const openDialogs = [];

function openDialog(id, focusSelector) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  if (overlay.style.display !== "flex") {
    openDialogs.push({ id, returnTo: document.activeElement });
  }
  overlay.style.display = "flex";
  const target = (focusSelector && overlay.querySelector(focusSelector)) || overlay.querySelector('button, [href], input, select, textarea');
  target?.focus();
}

function closeDialog(id) {
  const overlay = document.getElementById(id);
  if (!overlay || overlay.style.display === "none") return;
  overlay.style.display = "none";
  const idx = openDialogs.map((d) => d.id).lastIndexOf(id);
  if (idx !== -1) {
    const [entry] = openDialogs.splice(idx, 1);
    if (entry.returnTo && document.contains(entry.returnTo)) entry.returnTo.focus();
  }
}

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const top = openDialogs[openDialogs.length - 1];
  if (top) {
    if (top.id === "cinemaModal") closeCinemaModal();
    else closeDialog(top.id);
    return;
  }
  const stash = document.getElementById("myStashDrawer");
  if (stash && stash.style.display !== "none") toggleMyStash(false);
});

// Clicking the scrim (outside the dialog box) closes it
document.addEventListener("click", (e) => {
  const top = openDialogs[openDialogs.length - 1];
  if (top && e.target === document.getElementById(top.id)) {
    if (top.id === "cinemaModal") closeCinemaModal();
    else closeDialog(top.id);
  }
});

// Cinema Modal Controls
function openCinemaModal(title, urlOrEmbed) {
  const titleEl = document.getElementById("cinemaTitle");
  const iframeEl = document.getElementById("cinemaIframe");

  // Guarantee valid embed format in Privacy-Enhanced mode
  const embedUrl = (urlOrEmbed && (urlOrEmbed.includes("youtube.com/embed/") || urlOrEmbed.includes("youtube-nocookie.com/embed/")))
    ? urlOrEmbed.replace("www.youtube.com/embed/", "www.youtube-nocookie.com/embed/")
    : (getYouTubeEmbedUrl(urlOrEmbed) || urlOrEmbed);

  if (titleEl) titleEl.textContent = title;
  if (iframeEl) iframeEl.src = safeUrl(embedUrl, { allowRelative: false });
  openDialog("cinemaModal");
}

function closeCinemaModal() {
  const iframeEl = document.getElementById("cinemaIframe");
  if (iframeEl) iframeEl.src = "";
  closeDialog("cinemaModal");
}

// Expose modal functions to window for inline HTML onclick handlers
window.openCinemaModal = openCinemaModal;
window.closeCinemaModal = closeCinemaModal;

// Logging helper (Developer Console)
function logMessage(msg, type = "info") {
  if (type === "error") console.error(`[DanglingDice] ${msg}`);
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

// ============================================================================
// Catalog
// ============================================================================
let allResources = [];
let renderedResources = [];
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
    const active = btn.dataset.cat === cat;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  renderCatalog();
};

window.handleSearch = function (q) {
  searchQuery = (q || "").trim().toLowerCase();
  isCatalogExpanded = false;
  const clearBtn = document.getElementById("searchClearBtn");
  if (clearBtn) clearBtn.style.display = searchQuery ? "inline-flex" : "none";
  renderCatalog();
};

window.clearSearch = function () {
  const input = document.getElementById("catalogSearchInput");
  if (input) {
    input.value = "";
    input.focus();
  }
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
      grid.innerHTML = `<div class="card empty-state"><p class="small">The catalog is temporarily unavailable. Please try again shortly.</p></div>`;
    logMessage(`Fetch error: ${err.message}`, "error");
  }
}

function openCatalogItem(item) {
  if (!item) return;
  const ytEmbed = getYouTubeEmbedUrl(item.mediaUrl);
  const targetUrl = safeUrl(item.liveUrl || item.mediaUrl || "#catalog") || "#catalog";
  if (ytEmbed) {
    openCinemaModal(item.title || "Studio release", ytEmbed);
  } else if (targetUrl.startsWith("#")) {
    document.querySelector(targetUrl)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
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
    // Temporarily hide Coding Tutorials until dedicated Dangling Dice Coding YouTube is connected
    if (item.category === "Coding Tutorials") return false;
    return true;
  });

  // 2. Filter by Category & Search Query
  const filtered = studioOnlyResources.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;

    const titleMatch = (item.title || "").toLowerCase().includes(searchQuery);
    const descMatch = (item.description || "").toLowerCase().includes(searchQuery);
    const catMatch = (item.category || "").toLowerCase().includes(searchQuery);
    const cleanQuery = searchQuery.replace(/^#/, "");
    const tagsMatch = (item.tags || []).some((t) => t.toLowerCase().includes(cleanQuery));

    return titleMatch || descMatch || catMatch || tagsMatch;
  });

  // 3. Sort
  if (sortOption === "alpha") {
    filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortOption === "price-low") {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sortOption === "price-high") {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // 4. Count Badge
  if (countBadge) {
    if (searchQuery || selectedCategory !== "All") {
      countBadge.textContent = `${filtered.length} of ${studioOnlyResources.length} releases`;
    } else {
      countBadge.textContent = `${filtered.length} studio ${filtered.length === 1 ? "release" : "releases"}`;
    }
  }

  // 5. Empty State
  if (filtered.length === 0) {
    if (expandWrapper) expandWrapper.style.display = "none";
    const filterNotice = searchQuery
      ? `No items match "<strong class="ink">${escapeHtml(searchQuery)}</strong>"${selectedCategory !== "All" ? ` in ${escapeHtml(selectedCategory)}` : ""}.`
      : `No items found in <strong class="ink">${escapeHtml(selectedCategory)}</strong>.`;

    grid.innerHTML = `
      <div class="card empty-state">
        <h3 class="tool-title">No matching releases</h3>
        <p class="muted small">${filterNotice}</p>
        <button type="button" class="btn btn-sm" onclick="clearSearch(); filterCategory('All');">Reset all filters</button>
      </div>
    `;
    renderedResources = [];
    return;
  }

  // 6. Expand Button Visibility & Label
  const totalMatches = filtered.length;
  if (expandWrapper && toggleBtn) {
    if (totalMatches > RECENT_ROW_LIMIT) {
      expandWrapper.style.display = "flex";
      toggleBtn.innerHTML = isCatalogExpanded
        ? `Show recent uploads only${icon("chevron-down", { className: "is-flipped" })}`
        : `View the entire catalog (${totalMatches} items)${icon("chevron-down")}`;
      toggleBtn.setAttribute("aria-expanded", String(isCatalogExpanded));
    } else {
      expandWrapper.style.display = "none";
    }
  }

  // 7. Slice to Recent Row unless Expanded
  renderedResources = isCatalogExpanded ? filtered : filtered.slice(0, RECENT_ROW_LIMIT);

  // 8. Cards: the title button opens the item (stretched over the card); data attributes, never inline JS
  grid.innerHTML = renderedResources
    .map((item, index) => {
      const thumb = safeUrl(item.imageUrl) || "/images/banner.jpg";
      const ytEmbed = getYouTubeEmbedUrl(item.mediaUrl);
      const targetUrl = safeUrl(item.liveUrl || item.mediaUrl || "#catalog") || "#catalog";
      const isInternalAnchor = targetUrl.startsWith("#");
      const mediaUrl = safeUrl(item.mediaUrl, { allowRelative: false });

      let actionButton = "";
      if (item.isTool) {
        const isGithub = targetUrl.includes("github.com");
        const label = isInternalAnchor ? "Explore sandboxes" : isGithub ? "View on GitHub" : "Launch web app";
        actionButton = `<a href="${escapeHtml(targetUrl)}" ${isInternalAnchor ? "" : 'target="_blank" rel="noopener noreferrer"'} class="btn ${isGithub ? "" : "btn-primary"} btn-sm">${label}${isInternalAnchor ? "" : '<span class="sr-only"> (opens in a new tab)</span>'}</a>`;
      } else if (ytEmbed) {
        actionButton = `<button type="button" class="btn btn-sm" data-action="open" data-index="${index}">${icon("play")}Stream on site</button>`;
      } else if (mediaUrl && mediaUrl.includes("play.google.com")) {
        actionButton = `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">Google Play<span class="sr-only"> (opens in a new tab)</span></a>`;
      } else if (mediaUrl) {
        actionButton = `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm">Open channel<span class="sr-only"> (opens in a new tab)</span></a>`;
      }

      return `
      <article class="card resource-card">
        <div class="resource-thumb">
          <img src="${escapeHtml(thumb)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/images/banner.jpg'" />
          ${ytEmbed ? `<span class="resource-play">${icon("play")}</span>` : ""}
        </div>
        <div class="resource-body">
          <h3 class="resource-title"><button type="button" class="resource-open" data-action="open" data-index="${index}">${escapeHtml(item.title)}</button></h3>
          <p class="muted small">${escapeHtml(item.description)}</p>
          <div class="resource-foot">
            <span class="tag">${escapeHtml(item.category || "Official release")}</span>
            ${actionButton}
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

document.getElementById("resourcesGrid")?.addEventListener("click", (e) => {
  const trigger = e.target.closest('[data-action="open"]');
  if (!trigger) return;
  openCatalogItem(renderedResources[Number(trigger.dataset.index)]);
});

/**
 * ============================================================================
 * MongoDB Connection URI & Query Inspector (100% Client-Side)
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
  const warnings = [];

  try {
    if (cleanUri.startsWith("mongodb+srv://")) {
      protocol = "mongodb+srv (DNS Seedlist / Atlas)";
    } else if (cleanUri.startsWith("mongodb://")) {
      protocol = "mongodb (Standard Connection)";
    } else {
      warnings.push("URI must start with either <code>mongodb://</code> or <code>mongodb+srv://</code>");
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
              `Your password contains an unescaped <code>${escapeHtml(char)}</code> symbol. MongoDB requires this to be percent-encoded as <code>${code}</code> to prevent connection parser failures.`,
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
      if (resHealth) {
        resHealth.textContent = "Syntax issues detected";
        resHealth.className = "is-error";
      }
      if (warningBox) {
        warningBox.style.display = "block";
        warningBox.innerHTML = `<strong>Configuration alert:</strong><ul class="tips-list">${warnings.map((w) => `<li>${w}</li>`).join("")}</ul>`;
      }
    } else {
      if (resHealth) {
        resHealth.textContent = "Valid connection string";
        resHealth.className = "is-ok";
      }
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
    "mongodb+srv://demo_user:SamplePassword123!@cluster0.abcde.mongodb.net/sample_database?retryWrites=true&w=majority";
  const input = document.getElementById("uriInput");
  if (input) {
    input.value = sample;
    window.inspectMongoUri(sample);
  }
};

// Toasts (shared .toast-stack); messages are always plain text
window.showToast = function (message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast${type === "success" ? " toast-success" : type === "error" ? " toast-error" : ""}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

window.copyEnvSnippet = function () {
  const snippet = document.getElementById("envOutputSnippet")?.textContent;
  if (snippet) {
    navigator.clipboard.writeText(snippet);
    window.showToast("Sanitized .env snippet copied (remember to substitute your real password)", "success");
  }
};

// ============================================================================
// Studio tech stack directory (verified partners)
// ============================================================================
const FALLBACK_PARTNERS = [
  {
    slug: "atlas",
    name: "MongoDB Atlas Cloud",
    category: "Cloud Hosting & Databases",
    description: "Fully managed cloud document database with auto-scaling, global clusters, and vector search.",
    perkBadge: "Free 512MB M0 Cluster",
    redirectUrl: "/go/atlas",
  },
  {
    slug: "digitalocean",
    name: "DigitalOcean Droplets",
    category: "Cloud Hosting & Databases",
    description: "Simple, scalable cloud computing and virtual machines built for developers and startups.",
    perkBadge: "$200 Free 60-Day Credit",
    redirectUrl: "/go/digitalocean",
  },
  {
    slug: "vpn",
    name: "Dangling Dice WireGuard VPN",
    category: "Developer Tools",
    description: "Ultra-fast in-kernel WireGuard encrypted tunnel with zero activity logs and leak protection.",
    perkBadge: "100% Free Developer Tool",
    redirectUrl: "/go/vpn",
  },
  {
    slug: "calculator",
    name: "AI Calculator on Google Play",
    category: "Mobile Apps",
    description: "Smart Android homework solver with step-by-step arithmetic, scientific calculation, and AI OCR scanning.",
    perkBadge: "Official Google Play App",
    redirectUrl: "/go/calculator",
  },
  {
    slug: "youtube",
    name: "Dangling Beats Official Channel",
    category: "Official Channels",
    description: "Original lofi, dark trap, and synthwave instrumentals crafted for code sessions and content creators.",
    perkBadge: "24/7 Focus Beats & Masterclasses",
    redirectUrl: "/go/youtube",
  },
];

async function fetchTechStack() {
  const grid = document.getElementById("techStackGrid");
  if (!grid) return;

  let partners = [];
  try {
    const res = await fetch(`${API_BASE}/affiliates`);
    if (res.ok) {
      const json = await res.json();
      partners = json.data || [];
    }
  } catch (err) {
    logMessage(`Failed to load tech stack: ${err.message}`, "error");
  }
  if (!partners || partners.length === 0) partners = FALLBACK_PARTNERS;

  grid.innerHTML = partners
    .map((p) => {
      const href = safeUrl(p.redirectUrl);
      return `
      <article class="card tool-card">
        <p class="eyebrow mono">${escapeHtml(p.category || "Tech stack")}</p>
        <h3 class="tool-title">${escapeHtml(p.name)}</h3>
        <p class="muted small">${escapeHtml(p.description)}</p>
        <div class="tool-foot">
          <span class="tag">${escapeHtml(p.perkBadge || "Verified partner")}</span>
          ${href ? `<a href="${escapeHtml(href)}?src=tech_stack" target="_blank" rel="noopener noreferrer sponsored" class="btn btn-sm push-right">Access deal<span class="sr-only"> for ${escapeHtml(p.name)} (opens in a new tab)</span></a>` : ""}
        </div>
      </article>`;
    })
    .join("");
}

// =========================================================================
// Live Cloud Sandbox Runner (Executes 24/7 against Render /v1/* Endpoints)
// =========================================================================
const SANDBOX_PRESETS = {
  schema: {
    title: "JSON & SQL schema converter",
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
    title: "Land acreage & GPS calculator",
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
    title: "Sensitive data & log redactor",
    endpoint: "/v1/privacy/redact",
    payload: {
      mode: "mask",
      text: "Customer email is jacob@dangling-dice-studios.com, phone (615) 555-0199, SSN 123-45-6789.",
    },
  },
  finance: {
    title: "Loan payoff & ROI calculator",
    endpoint: "/v1/finance/amortization",
    payload: {
      principal: 250000,
      annualRatePercent: 6.25,
      termMonths: 360,
    },
  },
};

let activeSandboxKey = "schema";
let sandboxOpener = null;

window.openCloudSandbox = async function (key) {
  const preset = SANDBOX_PRESETS[key] || SANDBOX_PRESETS.schema;
  activeSandboxKey = key in SANDBOX_PRESETS ? key : "schema";
  sandboxOpener = document.activeElement;
  const drawer = document.getElementById("cloudSandboxDrawer");
  const titleEl = document.getElementById("sandboxTitle");
  const badgeEl = document.getElementById("sandboxBadge");
  const inputEl = document.getElementById("sandboxInput");

  if (titleEl) titleEl.textContent = preset.title;
  if (badgeEl) badgeEl.textContent = `Live cloud sandbox · POST ${preset.endpoint}`;
  if (inputEl) inputEl.value = JSON.stringify(preset.payload, null, 2);
  if (drawer) {
    drawer.style.display = "grid";
    drawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    inputEl?.focus({ preventScroll: true });
  }
  await window.runCloudSandbox();
};

window.closeCloudSandbox = function () {
  const drawer = document.getElementById("cloudSandboxDrawer");
  if (drawer) drawer.style.display = "none";
  if (sandboxOpener && document.contains(sandboxOpener)) sandboxOpener.focus();
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
      labelEl.textContent = `Live engine output (${json.latencyMs ?? 1}ms · HTTP ${res.status})`;
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
const tagListHtml = (items = []) => items.map((tech) => `<li class="tag">${escapeHtml(tech)}</li>`).join("");

function setLink(el, url) {
  if (!el) return;
  const href = safeUrl(url, { allowRelative: false });
  if (href) {
    el.href = href;
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

function populateSpotlight(ids, app, defaultCategory) {
  if (!app) return;
  const el = (key) => document.getElementById(ids[key]);
  if (el("title")) el("title").textContent = app.title;
  if (el("tagline")) el("tagline").textContent = app.tagline;
  if (el("desc")) el("desc").textContent = app.description;
  if (el("author")) el("author").textContent = app.authorSocial ? `${app.authorName} (${app.authorSocial})` : app.authorName;
  setLink(el("live"), app.appUrl);
  setLink(el("github"), app.githubUrl);
  if (el("category")) el("category").textContent = app.category || defaultCategory;
  if (el("stack") && Array.isArray(app.techStack)) el("stack").innerHTML = tagListHtml(app.techStack);
}

const spotlightIds = (prefix) => ({
  title: `${prefix}SpotlightTitle`,
  tagline: `${prefix}SpotlightTagline`,
  desc: `${prefix}SpotlightDesc`,
  author: `${prefix}SpotlightAuthor`,
  live: `${prefix}SpotlightLive`,
  github: `${prefix}SpotlightGithub`,
  category: `${prefix}SpotlightCatBadge`,
  stack: `${prefix}SpotlightStack`,
});

async function fetchDevShowcase() {
  try {
    const res = await fetch(`${API_BASE}/showcase`);
    if (!res.ok) return;
    const json = await res.json();
    const data = json.data || {};

    // 1. Category spotlights across all suites
    const spotlights = data.spotlights || {};
    populateSpotlight(spotlightIds("creator"), spotlights.creator, "Social & Video");
    populateSpotlight(spotlightIds("music"), spotlights.music, "Audio & Music");
    populateSpotlight(spotlightIds("developer"), spotlights.developer, "Developer Tools");

    // 2. App of the week
    const aotw = data.appOfTheWeek || spotlights.developer || spotlights.music || spotlights.creator;
    populateSpotlight(
      {
        title: "aotwTitle",
        tagline: "aotwTagline",
        desc: "aotwDescription",
        author: "aotwAuthor",
        live: "aotwLiveLink",
        github: "aotwGithubLink",
        category: "aotwCategory",
        stack: "aotwTechStack",
      },
      aotw,
      "Developer Tool",
    );

    // 3. Showcase grid
    const gridEl = document.getElementById("devShowcaseGrid");
    if (!gridEl) return;

    if (!data.projects || data.projects.length === 0) {
      gridEl.innerHTML = `
        <div class="card empty-state">
          <p class="small muted">Be the first indie creator featured: use <strong class="ink">Submit your app</strong> above.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = data.projects
      .map((proj) => {
        const appUrl = safeUrl(proj.appUrl, { allowRelative: false });
        const description = String(proj.description || "");
        return `
          <article class="card tool-card${proj.isAppOfTheWeek ? " is-inhouse" : ""}">
            <p class="eyebrow mono">${proj.isAppOfTheWeek ? "Active spotlight" : escapeHtml(proj.category)}</p>
            <h3 class="tool-title">${escapeHtml(proj.title)}</h3>
            <p class="tool-tagline">${escapeHtml(proj.tagline)}</p>
            <p class="muted small">${escapeHtml(description.slice(0, 140))}${description.length > 140 ? "..." : ""}</p>
            <ul class="tag-list" aria-label="Tech stack">${tagListHtml((proj.techStack || []).slice(0, 3))}</ul>
            <div class="tool-foot">
              <span class="small muted">by <strong class="ink">${escapeHtml(proj.authorName)}</strong></span>
              ${appUrl ? `<a href="${escapeHtml(appUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm push-right">Try app<span class="sr-only"> ${escapeHtml(proj.title)} (opens in a new tab)</span></a>` : ""}
            </div>
          </article>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load developer showcase:", err);
  }
}

// Submission dialog
function openDevSubmissionModal(defaultCategory) {
  openDialog("devSubmissionModal", "#subAppTitle");
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
  closeDialog("devSubmissionModal");
}

async function handleDevSubmission(e) {
  e.preventDefault();
  const alertEl = document.getElementById("submissionAlert");
  const submitBtn = document.getElementById("subSubmitBtn");
  const value = (id) => document.getElementById(id)?.value;

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    const res = await fetch(`${API_BASE}/showcase/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: value("subAppTitle"),
        category: value("subCategory"),
        tagline: value("subTagline"),
        description: value("subDescription"),
        appUrl: value("subAppUrl"),
        githubUrl: value("subGithubUrl"),
        authorName: value("subAuthorName"),
        authorSocial: value("subAuthorSocial"),
        techStack: value("subTechStack"),
        "cf-turnstile-response": document.querySelector('#devSubmissionForm [name="cf-turnstile-response"]')?.value || '',
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to submit project.");

    if (alertEl) {
      alertEl.className = "callout is-ok";
      alertEl.textContent = "Project submitted. Our team will review it for the spotlight.";
      alertEl.style.display = "block";
    }

    document.getElementById("devSubmissionForm")?.reset();
    setTimeout(() => {
      closeDevSubmissionModal();
      if (alertEl) alertEl.style.display = "none";
    }, 2500);
  } catch (err) {
    if (alertEl) {
      alertEl.className = "callout is-error";
      alertEl.textContent = err.message;
      alertEl.style.display = "block";
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for review";
    }
  }
}

// Privacy Policy & Cookie Preferences Controls
function openPrivacyModal() {
  openDialog("privacyModal");
}

function closePrivacyModal() {
  closeDialog("privacyModal");
}

function closeCookieBanner(preference) {
  try {
    localStorage.setItem("dds_cookie_consent", preference || "accepted");
  } catch (e) {}
  const banner = document.getElementById("cookieConsentBanner");
  if (banner) {
    banner.classList.add("is-leaving");
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
          banner.style.display = "grid";
        }, 800);
      }
    }
  } catch (e) {}
}

// ============================================================================
// Hero: persona switch, live playground & My Stash
// ============================================================================
let selectedHeroFormat = "mp3-320";
let miniSynthCtx = null;

function getMiniSynthContext() {
  if (!miniSynthCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      miniSynthCtx = new AudioCtx();
    }
  }
  if (miniSynthCtx && miniSynthCtx.state === "suspended") {
    miniSynthCtx.resume();
  }
  return miniSynthCtx;
}

function setTabState(btn, panel, active) {
  if (btn) {
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
    btn.tabIndex = active ? 0 : -1;
  }
  if (panel) panel.hidden = !active;
}

// 1. Persona switch (creators / developers)
function setStudioPersona(persona) {
  const isCreator = persona !== "developer";
  try {
    localStorage.setItem("dds_persona", isCreator ? "creator" : "developer");
  } catch (e) {}

  setTabState(document.getElementById("personaCreatorTab"), document.getElementById("creatorHeroView"), isCreator);
  setTabState(document.getElementById("personaDevTab"), document.getElementById("developerHeroView"), !isCreator);
  switchPlaygroundTab(isCreator ? "mp3" : "compute");
}

// 2. Hero playground tabs
function switchPlaygroundTab(tab) {
  ["mp3", "sampler", "compute"].forEach((t) => {
    const name = t.charAt(0).toUpperCase() + t.slice(1);
    setTabState(document.getElementById(`tab${name}Btn`), document.getElementById(`panel${name}`), t === tab);
  });
}

function selectHeroFormat(btnEl, format) {
  selectedHeroFormat = format;
  document.querySelectorAll(".hero-format-pill").forEach((pill) => {
    const active = pill === btnEl;
    pill.classList.toggle("active", active);
    pill.setAttribute("aria-pressed", String(active));
  });
}

async function pasteToHeroInput() {
  const input = document.getElementById("heroMediaInput");
  if (!input) return;
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      input.value = text.trim();
      window.showToast("URL pasted from clipboard", "success");
      input.focus();
    }
  } catch (e) {
    input.focus();
    window.showToast("Press Ctrl+V to paste your URL", "info");
  }
}

async function executeHeroMediaExtract() {
  const input = document.getElementById("heroMediaInput");
  const rawUrl = input?.value?.trim();
  const progressBox = document.getElementById("heroExtractProgress");
  const progressBar = document.getElementById("heroProgressBarFill");
  const progressStatus = document.getElementById("heroProgressStatus");
  const resultBox = document.getElementById("heroExtractResult");
  const btn = document.getElementById("heroExtractBtn");
  const btnLabel = `${icon("download")}Extract &amp; save track`;

  if (!rawUrl) {
    window.showToast("Please enter a YouTube or audio URL", "error");
    input?.focus();
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `${icon("loader-circle")}Resolving media stream...`;
  }
  if (progressBox) progressBox.style.display = "grid";
  if (resultBox) resultBox.style.display = "none";
  if (progressBar) {
    progressBar.classList.remove("is-done", "is-error");
    progressBar.style.width = "40%";
  }
  if (progressStatus) progressStatus.textContent = "Resolving high-speed media stream...";

  try {
    const res = await fetch(`${API_BASE}/media/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: rawUrl, format: selectedHeroFormat }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to resolve media URL");
    }

    if (progressBar) {
      progressBar.classList.add("is-done");
      progressBar.style.width = "100%";
    }
    if (progressStatus) progressStatus.textContent = "Ready: direct download link generated";

    const media = data.data || {};
    const downloadUrl =
      safeUrl(media.downloadUrl) || `${API_BASE}/media/download?token=${encodeURIComponent(media.streamToken || "")}`;
    const thumb = safeUrl(media.thumbnail) || "/images/banner.jpg";
    const title = media.title || media.cleanTitle || "Extracted track";

    addToStash({
      id: Date.now(),
      type: "Audio track",
      title,
      format: selectedHeroFormat.toUpperCase(),
      url: downloadUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    if (resultBox) {
      resultBox.innerHTML = `
        <div class="extract-track">
          <img src="${escapeHtml(thumb)}" alt="" />
          <div style="min-width: 0;">
            <div class="extract-track-title">${escapeHtml(title)}</div>
            <div class="extract-track-meta">Audio ready · saved in My Stash</div>
          </div>
        </div>
        <div class="button-row">
          <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(media.cleanTitle || "Track")}" class="btn btn-primary btn-sm">${icon("download")}Download now</a>
          <button type="button" class="btn btn-sm" onclick="resetHeroExtractor()">New track</button>
        </div>
      `;
      resultBox.style.display = "grid";
    }

    window.showToast("Track resolved and saved to My Stash", "success");
  } catch (err) {
    if (progressBar) {
      progressBar.classList.add("is-error");
      progressBar.style.width = "100%";
    }
    if (progressStatus) progressStatus.textContent = `Error: ${err.message}`;
    window.showToast(err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btnLabel;
    }
  }
}

function resetHeroExtractor() {
  const input = document.getElementById("heroMediaInput");
  const progressBox = document.getElementById("heroExtractProgress");
  const resultBox = document.getElementById("heroExtractResult");
  if (input) {
    input.value = "";
    input.focus();
  }
  if (progressBox) progressBox.style.display = "none";
  if (resultBox) resultBox.style.display = "none";
}

// 3. WebAudio 4-Pad Sampler Synthesis
function triggerSamplerPad(padName) {
  const ctx = getMiniSynthContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const padBtn = document.querySelector(`.pad-${padName}`);
  if (padBtn) {
    padBtn.classList.add("pad-active");
    setTimeout(() => padBtn.classList.remove("pad-active"), 120);
  }

  if (padName === "kick") {
    // 808 Sub Kick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  } else if (padName === "snare") {
    // Crisp Lo-Fi Snare (Noise + Tone burst)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    const tone = ctx.createOscillator();
    const toneGain = ctx.createGain();
    tone.type = "triangle";
    tone.frequency.setValueAtTime(180, now);
    tone.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    toneGain.gain.setValueAtTime(0.6, now);
    toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
    tone.connect(toneGain);
    toneGain.connect(ctx.destination);
    tone.start(now);
    tone.stop(now + 0.1);
  } else if (padName === "hihat") {
    // Tape Sizzle Hi-Hat (Bandpassed short noise burst)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(7500, now);
    filter.Q.setValueAtTime(2.5, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } else if (padName === "chord") {
    // Chill Dm9 Chord (D3, F3, A3, C4, E4)
    const freqs = [146.83, 174.61, 220.0, 261.63, 329.63];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    });
  }
}

let grooveTimer = null;
function playSamplerGrooveDemo() {
  if (grooveTimer) return;
  const ctx = getMiniSynthContext();
  if (!ctx) return;

  window.showToast("Playing a 4-bar lo-fi groove", "info");
  const stepMs = 240; // ~125 BPM 8th notes
  const pattern = [
    ["kick", "chord"],
    ["hihat"],
    ["snare", "hihat"],
    ["hihat"],
    ["kick", "hihat"],
    ["kick"],
    ["snare", "hihat", "chord"],
    ["hihat"],
  ];

  let currentStep = 0;
  const totalReps = 2;
  let rep = 0;

  grooveTimer = setInterval(() => {
    const hits = pattern[currentStep];
    hits.forEach((pad) => triggerSamplerPad(pad));
    currentStep++;
    if (currentStep >= pattern.length) {
      currentStep = 0;
      rep++;
      if (rep >= totalReps) {
        clearInterval(grooveTimer);
        grooveTimer = null;
      }
    }
  }, stepMs);
}

// 4. Instant 1-Click Free Studio Sample Kit (.WAV)
function downloadFreeSampleKit() {
  // Routed through the R2 zero-egress redirect (falls back to the bundled copy if not yet uploaded)
  const wavUrl = "/api/storage/download/dangling-dice-studio-sound-kit.wav";
  const tempLink = document.createElement("a");
  tempLink.href = wavUrl;
  tempLink.download = "Dangling_Dice_Studio_LoFi_Kit_85BPM.wav";
  document.body.appendChild(tempLink);
  tempLink.click();
  setTimeout(() => tempLink.remove(), 2000);

  addToStash({
    id: Date.now(),
    type: "Sound kit",
    title: "Dangling Dice Studio 8-Bar Lo-Fi Kit (85 BPM .WAV)",
    format: "16-bit 44.1kHz PCM master",
    url: wavUrl,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  window.showToast("8-bar studio sound kit (.WAV) downloading and saved to My Stash", "success");
}

// 5. Quick Compute Test
async function runQuickComputeTest(testType) {
  const codeEl = document.getElementById("computeOutputCode");
  const latencyTag = document.getElementById("computeLatencyTag");
  const labelEl = document.getElementById("computeEndpointLabel");
  const buttonIds = { schema: "btnTestSchema", luhn: "btnTestLuhn", loan: "btnTestLoan" };

  Object.entries(buttonIds).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle("active", key === testType);
    btn.setAttribute("aria-pressed", String(key === testType));
  });

  const t0 = performance.now();
  const endpointLabel =
    testType === "schema" ? "POST /v1/schema/infer" : testType === "luhn" ? "POST /v1/privacy/redact-pii" : "POST /v1/finance/amortize";
  if (labelEl) labelEl.textContent = endpointLabel;

  try {
    let payload = {};
    let endpoint = "/v1/schema/infer";

    if (testType === "schema") {
      endpoint = "/v1/schema/infer";
      payload = { sample: { userId: "550e8400-e29b-41d4-a716-446655440000", email: "producer@danglingdice.com", tier: "pro", active: true } };
    } else if (testType === "luhn") {
      endpoint = "/v1/privacy/redact-pii";
      payload = { text: "Card: 4532-0150-1234-5678, SSN: 000-12-3456" };
    } else {
      endpoint = "/v1/finance/amortize";
      payload = { principal: 250000, annualRatePct: 6.5, termYears: 30 };
    }

    const res = await fetch(`${API_BASE.replace('/api', '')}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsed = Math.round(performance.now() - t0);
    const data = await res.json();

    if (latencyTag) latencyTag.textContent = `${elapsed}ms`;
    if (codeEl) codeEl.querySelector("code").textContent = JSON.stringify(data, null, 2);

    addToStash({
      id: Date.now(),
      type: "API benchmark",
      title: `${endpointLabel} (${elapsed}ms)`,
      format: "JSON REST",
      url: "#computeApiSuite",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (err) {
    const elapsed = Math.round(performance.now() - t0);
    if (latencyTag) latencyTag.textContent = `${elapsed}ms`;
    if (codeEl) codeEl.querySelector("code").textContent = JSON.stringify({ error: err.message, status: 500 }, null, 2);
  }
}

// 6. "My Studio Stash" (Persistence Engine)
function getStash() {
  try {
    const raw = localStorage.getItem("dds_stash");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStash(items) {
  try {
    localStorage.setItem("dds_stash", JSON.stringify(items.slice(0, 15)));
  } catch (e) {}
}

function addToStash(item) {
  const items = getStash();
  items.unshift(item);
  saveStash(items);
  updateStashBadge();
  renderStash();
}

function updateStashBadge() {
  const count = getStash().length;
  const badge = document.getElementById("stashCountBadge");
  if (badge) badge.textContent = count;
}

let stashOpener = null;
function toggleMyStash(forceOpen) {
  const drawer = document.getElementById("myStashDrawer");
  if (!drawer) return;
  const isOpen = drawer.style.display !== "none";
  const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;
  if (shouldOpen === isOpen) return;
  drawer.style.display = shouldOpen ? "grid" : "none";
  if (shouldOpen) {
    stashOpener = document.activeElement;
    renderStash();
    drawer.querySelector("button")?.focus();
  } else if (stashOpener && document.contains(stashOpener)) {
    stashOpener.focus();
  }
}

function renderStash() {
  const list = document.getElementById("stashItemsList");
  if (!list) return;
  const items = getStash();

  if (items.length === 0) {
    list.innerHTML = `
      <li class="stash-empty">
        <p class="small ink">Your stash is empty.</p>
        <p class="small muted">Extract an audio track, run an API speed test, or download the free sound kit to save items here.</p>
      </li>
    `;
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const href = safeUrl(item.url) || "#";
      const isAnchor = href.startsWith("#");
      return `
    <li class="stash-item">
      <div class="stash-item-meta">
        <div class="stash-item-title">${escapeHtml(item.title)}</div>
        <div class="small muted">${escapeHtml(item.type)} · ${escapeHtml(item.format || "")} · ${escapeHtml(item.timestamp || "")}</div>
      </div>
      ${
        isAnchor
          ? `<a href="${escapeHtml(href)}" class="btn btn-ghost btn-sm" onclick="toggleMyStash(false)">View</a>`
          : `<a href="${escapeHtml(href)}" download="${escapeHtml(item.title)}" class="btn btn-ghost btn-sm">Download</a>`
      }
    </li>
  `;
    })
    .join("");
}

function clearMyStash() {
  saveStash([]);
  updateStashBadge();
  renderStash();
  window.showToast("Studio Stash cleared", "info");
}

// Keyboard shortcuts for sampler pads (1-4, Q/W/E/R) while the sampler tab is open
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
  if (document.getElementById("panelSampler")?.hidden !== false) return;

  const key = e.key.toLowerCase();
  if (key === "1" || key === "q") triggerSamplerPad("kick");
  if (key === "2" || key === "w") triggerSamplerPad("snare");
  if (key === "3" || key === "e") triggerSamplerPad("hihat");
  if (key === "4" || key === "r") triggerSamplerPad("chord");
});

// Window bindings
window.openDevSubmissionModal = openDevSubmissionModal;
window.closeDevSubmissionModal = closeDevSubmissionModal;
window.handleDevSubmission = handleDevSubmission;
window.openPrivacyModal = openPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.closeCookieBanner = closeCookieBanner;
window.setStudioPersona = setStudioPersona;
window.switchPlaygroundTab = switchPlaygroundTab;
window.selectHeroFormat = selectHeroFormat;
window.pasteToHeroInput = pasteToHeroInput;
window.executeHeroMediaExtract = executeHeroMediaExtract;
window.resetHeroExtractor = resetHeroExtractor;
window.triggerSamplerPad = triggerSamplerPad;
window.playSamplerGrooveDemo = playSamplerGrooveDemo;
window.downloadFreeSampleKit = downloadFreeSampleKit;
window.runQuickComputeTest = runQuickComputeTest;
window.toggleMyStash = toggleMyStash;
window.clearMyStash = clearMyStash;

// WAI-ARIA tabs: arrow keys / Home / End for the persona switch and playground
initTabKeyboard(document.querySelector(".persona-switch"));
initTabKeyboard(document.getElementById("playgroundTabs"));

// Startup
window.addEventListener("DOMContentLoaded", async () => {
  initCookieConsent();
  updateStashBadge();
  try {
    const savedPersona = localStorage.getItem("dds_persona") || "creator";
    setStudioPersona(savedPersona);
  } catch (e) {}

  // Initialize shared shell + hidden staff command palette (Ctrl+K) before the network calls
  initStudioShell();
  initStaffCommandPalette();

  await checkHealth();
  await Promise.all([fetchResources(), fetchTechStack(), fetchDevShowcase()]);

  // Smooth-scroll on hash or click
  if (window.location.hash) {
    const targetEl = document.querySelector(window.location.hash);
    if (targetEl) {
      setTimeout(() => targetEl.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href.length > 1) {
        const el = document.querySelector(href);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          try { history.pushState(null, null, href); } catch (err) {}
        }
      }
    });
  });
});
