// ============================================================================
// Dangling Beats Studio™ — Specialized Music & Producer Radio Application
// ============================================================================

const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "https://dangling-dice-studios.com/api";

const officialStations = [
  {
    id: "lofi-drive",
    title: "Dangling Beats • Lo-Fi Drive",
    subtitle: "Official Lo-Fi & Cyberpunk Focus Radio",
    badge: "Lo-Fi",
    emoji: "🌙",
    videoId: "2J-U0EUATHs",
    url: "https://www.youtube-nocookie.com/embed/2J-U0EUATHs?list=PLAg2ptU_xF5c&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Late-night chillhop, dusty Rhodes piano, and mellow drum loops crafted for deep coding focus and flow state."
  },
  {
    id: "dreamcore",
    title: "Dangling Beats • Dreamcore",
    subtitle: "Ethereal Ambient Soundscapes",
    badge: "Dreamcore",
    emoji: "☁️",
    videoId: "BGW1y-9bVJc",
    url: "https://www.youtube-nocookie.com/embed/BGW1y-9bVJc?list=PLByFVPrF7p0s&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Floating reverb pads, lush textures, and nostalgic frequencies designed for immersive daydreaming and relaxed productivity."
  },
  {
    id: "relaxing-jazz",
    title: "Dangling Beats • Relaxing Jazz",
    subtitle: "Smooth Rhodes & Jazzy Vibes",
    badge: "Jazz",
    emoji: "🎷",
    videoId: "0YknzKYiDXo",
    url: "https://www.youtube-nocookie.com/embed/0YknzKYiDXo?list=PLZzyR4Y8j_gA&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Warm upright bass, gentle brushes, and vintage jazz chords recorded in our studio sound lab."
  },
  {
    id: "jk-pop",
    title: "Dangling Beats • J/K Pop Background",
    subtitle: "Upbeat Coding & Creative Rhythm",
    badge: "Pop",
    emoji: "⚡",
    videoId: "8Z0e3VIb-4U",
    url: "https://www.youtube-nocookie.com/embed/8Z0e3VIb-4U?list=PLUOqd5Jfm3gw&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Bouncy synths, syncopated melodies, and clean creative grooves for daytime designing and rapid engineering."
  },
  {
    id: "yacht-rock",
    title: "Dangling Beats • Yacht Rock",
    subtitle: "Classic Sunset Grooves",
    badge: "Groove",
    emoji: "⛵",
    videoId: "2Onu8sRtlk8",
    url: "https://www.youtube-nocookie.com/embed/2Onu8sRtlk8?list=PLOQPFjHz5Vs4&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Smooth 70s/80s California sunset grooves, warm brass, and harmonic rhythms."
  },
  {
    id: "sleep-music",
    title: "Dangling Beats • Sleep Music",
    subtitle: "Deep Relaxation & Binaural Waves",
    badge: "Sleep",
    emoji: "😴",
    videoId: "fdBVmykxMqE",
    url: "https://www.youtube-nocookie.com/embed/fdBVmykxMqE?list=PLJL6dnrrRw-k&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Sub-bass binaural drones, delta-wave ambient harmonics, and peaceful meditative textures."
  },
  {
    id: "music-albums",
    title: "Dangling Beats • Music Albums",
    subtitle: "Full Studio Album Catalog",
    badge: "Albums",
    emoji: "💿",
    videoId: "YIaOzPji1Kk",
    url: "https://www.youtube-nocookie.com/embed/YIaOzPji1Kk?list=PLR6uUDnIO7P0&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Complete conceptual instrumental albums released by Dangling Beats Studio."
  },
  {
    id: "live-videos",
    title: "Dangling Beats • Live Sessions",
    subtitle: "Live Studio Broadcasts",
    badge: "Live",
    emoji: "🔴",
    videoId: "YY8mKBKGM5o",
    url: "https://www.youtube-nocookie.com/embed/YY8mKBKGM5o?list=PLFLqzwDKWUyQ&autoplay=1&enablejsapi=1&playsinline=1",
    desc: "Multi-camera studio jam sessions, beat tape premieres, and live hardware sequencing."
  }
];

let customStations = [];
try {
  customStations = JSON.parse(localStorage.getItem("customBeatsStations") || "[]");
} catch (e) {
  customStations = [];
}

let indieStations = [];
let activeStationId = localStorage.getItem("activeBeatsStation") || "lofi-drive";
let isPlaying = false;

function getAllStations() {
  return [...officialStations, ...customStations, ...indieStations];
}

function getActiveStation() {
  const all = getAllStations();
  return all.find((s) => s.id === activeStationId) || officialStations[0];
}

function showToast(msg, type = "info") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${type === "error" ? "⚠️" : type === "success" ? "🎵" : "ℹ️"}</span> <span>${msg}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function parseYouTubeEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  const str = rawUrl.trim();
  const listMatch = str.match(/[?&]list=([^#&?]+)/);
  if (listMatch) {
    const listId = listMatch[1];
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(listId)}`;
  }
  let videoId = null;
  if (str.includes("youtu.be/")) {
    const parts = str.split("youtu.be/")[1];
    videoId = parts ? parts.split(/[?#&]/)[0] : null;
  } else if (str.includes("watch?v=")) {
    const match = str.match(/[?&]v=([^#&]+)/);
    videoId = match ? match[1] : null;
  } else if (str.includes("/embed/")) {
    const parts = str.split("/embed/")[1];
    videoId = parts ? parts.split(/[?#&]/)[0] : null;
  }
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
  }
  return null;
}

function updateConsoleUI() {
  const station = getActiveStation();
  const titleEl = document.getElementById("consoleTrackTitle");
  const subEl = document.getElementById("consoleTrackSub");
  const badgeEl = document.getElementById("consoleBadge");
  const playBtn = document.getElementById("consolePlayBtn");
  const consoleEl = document.getElementById("playerConsole");

  if (titleEl) titleEl.textContent = station.title;
  if (subEl) subEl.textContent = station.subtitle;
  if (badgeEl) badgeEl.textContent = station.badge || "Station";

  if (consoleEl) {
    if (isPlaying) {
      consoleEl.classList.add("playing");
    } else {
      consoleEl.classList.remove("playing");
    }
  }

  if (playBtn) {
    playBtn.textContent = isPlaying ? "⏸ Pause Radio" : "▶ Start Radio";
  }

  // Update active state in stations grid
  document.querySelectorAll(".station-card").forEach((card) => {
    if (card.dataset.id === station.id) {
      card.classList.add("active");
    } else {
      card.classList.remove("active");
    }
  });
}

function playStation(stationId) {
  activeStationId = stationId;
  try {
    localStorage.setItem("activeBeatsStation", stationId);
  } catch (e) {}

  const station = getActiveStation();
  const iframe = document.getElementById("beatsIframe");

  if (iframe) {
    const origin = window.location.origin;
    let url = station.url;
    if (!url.includes("origin=")) {
      url += (url.includes("?") ? "&" : "?") + `origin=${encodeURIComponent(origin)}`;
    }
    iframe.src = url;
  }

  isPlaying = true;
  updateConsoleUI();
  showToast(`▶ Now Playing: ${station.title}`, "success");
}

function togglePlay() {
  const iframe = document.getElementById("beatsIframe");
  const station = getActiveStation();

  if (isPlaying) {
    if (iframe) iframe.src = "";
    isPlaying = false;
    updateConsoleUI();
    showToast("Radio Paused", "info");
  } else {
    playStation(station.id);
  }
}

function nextStation() {
  const all = getAllStations();
  const currentIndex = all.findIndex((s) => s.id === activeStationId);
  const nextIndex = (currentIndex + 1) % all.length;
  playStation(all[nextIndex].id);
}

function prevStation() {
  const all = getAllStations();
  const currentIndex = all.findIndex((s) => s.id === activeStationId);
  const prevIndex = (currentIndex - 1 + all.length) % all.length;
  playStation(all[prevIndex].id);
}

function renderStations() {
  const grid = document.getElementById("stationsGrid");
  if (!grid) return;

  const all = getAllStations();
  grid.innerHTML = all
    .map((s) => {
      const isActive = s.id === activeStationId;
      return `
        <div class="station-card ${isActive ? "active" : ""}" data-id="${s.id}" onclick="window.playStation('${s.id}')">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="station-card-badge">${s.badge || "Radio"}</span>
              <span style="font-size: 1.25rem;">${s.emoji || "🎵"}</span>
            </div>
            <h3 class="station-card-title">${s.title}</h3>
            <p class="station-card-sub">${s.desc || s.subtitle}</p>
          </div>
          <div class="station-card-action">
            <span>${isActive && isPlaying ? "🟢 Streaming Now" : "Stream Station"}</span>
            <span style="font-size: 1.1rem;">${isActive && isPlaying ? "⏸" : "▶"}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

// Fetch Catalog Releases
async function fetchBeatCatalog() {
  const container = document.getElementById("beatCatalogGrid");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/items?category=Beats%20%26%20Audio`);
    if (!res.ok) return;
    const json = await res.json();
    const items = json.data || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
          Studio instrumentals are streaming live in the player above.
        </div>
      `;
      return;
    }

    container.innerHTML = items
      .map((item) => `
        <div class="station-card">
          <div>
            <span class="station-card-badge">Studio Release</span>
            <h3 class="station-card-title">${item.title}</h3>
            <p class="station-card-sub">${item.description || "Original release from Dangling Beats Studio"}</p>
          </div>
          <div class="station-card-action">
            <a href="${item.mediaUrl || 'https://www.youtube.com/@danglingdicestudios'}" target="_blank" rel="noopener noreferrer" style="color: #f472b6; text-decoration: none;">
              Listen on YouTube ↗
            </a>
            <a href="https://media.dangling-dice-studios.com/" target="_blank" rel="noopener noreferrer" style="color: var(--neon-cyan); text-decoration: none;">
              Download MP3 ⚡
            </a>
          </div>
        </div>
      `)
      .join("");
  } catch (err) {
    console.warn("Could not fetch beat catalog:", err);
  }
}

// Custom Station Modal
function openAddStationModal() {
  const modal = document.getElementById("addStationModal");
  if (modal) modal.style.display = "flex";
}

function closeAddStationModal() {
  const modal = document.getElementById("addStationModal");
  if (modal) modal.style.display = "none";
}

function handleAddCustomStation(e) {
  e.preventDefault();
  const titleInput = document.getElementById("customStationTitle");
  const urlInput = document.getElementById("customStationUrl");
  const title = titleInput?.value?.trim() || "";
  const url = urlInput?.value?.trim() || "";

  if (!url) {
    showToast("Please enter a YouTube video or playlist link", "error");
    return;
  }

  const embed = parseYouTubeEmbedUrl(url);
  if (!embed) {
    showToast("Invalid YouTube link format", "error");
    return;
  }

  const newStation = {
    id: "custom-" + Date.now(),
    title: title || "Custom Beats Radio",
    subtitle: "Custom YouTube Station",
    badge: "Custom",
    emoji: "📻",
    url: `${embed}${embed.includes("?") ? "&" : "?"}autoplay=1&enablejsapi=1`,
    desc: "Your personal YouTube stream running ad-free in Dangling Beats."
  };

  customStations.unshift(newStation);
  try {
    localStorage.setItem("customBeatsStations", JSON.stringify(customStations));
  } catch (e) {}

  if (titleInput) titleInput.value = "";
  if (urlInput) urlInput.value = "";
  closeAddStationModal();
  renderStations();
  playStation(newStation.id);
  showToast(`✅ Added & streaming: ${newStation.title}`, "success");
}

// Expose globals for HTML onclicks
window.playStation = playStation;
window.togglePlay = togglePlay;
window.nextStation = nextStation;
window.prevStation = prevStation;
window.openAddStationModal = openAddStationModal;
window.closeAddStationModal = closeAddStationModal;
window.handleAddCustomStation = handleAddCustomStation;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderStations();
  updateConsoleUI();
  fetchBeatCatalog();
});
