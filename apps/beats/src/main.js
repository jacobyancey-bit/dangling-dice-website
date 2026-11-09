// ============================================================================
// Dangling Beats Studio™ — Specialized Music & Producer Radio Application
// ============================================================================

import {
  NOTE_NAMES,
  SCALE_DEFINITIONS,
  GUITAR_TUNINGS,
  CHORD_PRESETS,
  noteToSemitone,
  resolveChordMidiNotes,
  studioAudio,
  buildMidiFile,
  downloadMidiFile,
} from './theoryEngine.js';

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

// ============================================================================
// Phase 1: Music Theory, Chord Progression & Scale Visualizer Logic
// ============================================================================

let currentTheoryTab = 'progression';
let currentPresetKey = 'lofi_chill';
let currentRootKey = 'Eb';
let currentBpm = 82;
let progressionSequence = [];
let isProgressionPlaying = false;
let progressionPlayTimer = null;
let currentPlayheadIndex = -1;

// Scale Visualizer State
let currentScaleRoot = 'C';
let currentScaleMode = 'dorian';
let currentInstrumentView = 'keyboard';
let currentGuitarTuning = 'standard';

function getTransposedChords() {
  const preset = CHORD_PRESETS[currentPresetKey];
  if (!preset) return [];

  const baseRoot = noteToSemitone(preset.defaultKey);
  const targetRoot = noteToSemitone(currentRootKey);
  const delta = (targetRoot - baseRoot + 12) % 12;

  return preset.chords.map((chord) => {
    const newRootOffset = (chord.rootOffset + delta) % 12;
    const newRootName = NOTE_NAMES[newRootOffset];
    const quality = chord.name.replace(/^[A-G][b#]?/, '');
    const newBass = chord.bass !== undefined ? (chord.bass + delta) % 12 : undefined;
    const newNotes = chord.formula.map((int) => NOTE_NAMES[(newRootOffset + int) % 12]);

    return {
      ...chord,
      name: `${newRootName}${quality}`,
      rootOffset: newRootOffset,
      bass: newBass,
      notesStr: newNotes.join(' - '),
    };
  });
}

function initTheoryTools() {
  renderPresetPills();
  const transposed = getTransposedChords();
  progressionSequence = transposed.slice(0, 4); // Default to first 4 chords of preset
  renderChordPads();
  renderProgressionTimeline();
  renderScaleVisualizer();
}

function switchTheoryTab(tab) {
  currentTheoryTab = tab;
  const progressionView = document.getElementById('progressionView');
  const visualizerView = document.getElementById('visualizerView');
  const tabProgressionBtn = document.getElementById('tabProgressionBtn');
  const tabVisualizerBtn = document.getElementById('tabVisualizerBtn');

  if (tab === 'progression') {
    if (progressionView) progressionView.style.display = 'block';
    if (visualizerView) visualizerView.style.display = 'none';
    if (tabProgressionBtn) tabProgressionBtn.classList.add('active');
    if (tabVisualizerBtn) tabVisualizerBtn.classList.remove('active');
  } else {
    if (progressionView) progressionView.style.display = 'none';
    if (visualizerView) visualizerView.style.display = 'block';
    if (tabProgressionBtn) tabProgressionBtn.classList.remove('active');
    if (tabVisualizerBtn) tabVisualizerBtn.classList.add('active');
    renderScaleVisualizer();
  }
}

function renderPresetPills() {
  const strip = document.getElementById('presetPillsStrip');
  if (!strip) return;

  strip.innerHTML = Object.entries(CHORD_PRESETS)
    .map(([key, data]) => `
      <button 
        type="button" 
        class="preset-pill ${key === currentPresetKey ? 'active' : ''}" 
        onclick="window.selectPreset('${key}')"
      >
        ${data.name}
      </button>
    `)
    .join('');
}

function selectPreset(presetKey) {
  const preset = CHORD_PRESETS[presetKey];
  if (!preset) return;
  currentPresetKey = presetKey;
  currentRootKey = preset.defaultKey;
  currentBpm = preset.bpm;

  const keySelect = document.getElementById('progressionKeySelect');
  if (keySelect) keySelect.value = currentRootKey;

  const bpmInput = document.getElementById('progressionBpmInput');
  if (bpmInput) bpmInput.value = currentBpm;

  const moodDesc = document.getElementById('presetMoodDesc');
  if (moodDesc) moodDesc.textContent = preset.desc;

  renderPresetPills();
  const transposed = getTransposedChords();
  progressionSequence = transposed.slice(0, 4);
  renderChordPads();
  renderProgressionTimeline();

  showToast(`Loaded ${preset.name} in ${currentRootKey} (${currentBpm} BPM)`, 'info');
}

function handleKeyChange(newKey) {
  currentRootKey = newKey;
  const transposed = getTransposedChords();
  progressionSequence = transposed.slice(0, 4);
  renderChordPads();
  renderProgressionTimeline();
  showToast(`Transposed progression to ${newKey}`, 'info');
}

function handleBpmChange(newBpm) {
  const val = parseInt(newBpm, 10);
  if (!isNaN(val) && val >= 50 && val <= 240) {
    currentBpm = val;
  }
}

function renderChordPads() {
  const grid = document.getElementById('chordPadsGrid');
  if (!grid) return;

  const chords = getTransposedChords();
  grid.innerHTML = chords
    .map((chord, idx) => `
      <div class="chord-pad-card" onclick="window.auditionChord(${idx})">
        <div class="chord-pad-top">
          <span class="chord-numeral">${chord.numeral}</span>
          <span class="chord-listen-icon">🔊</span>
        </div>
        <div>
          <div class="chord-name">${chord.name}</div>
          <div class="chord-notes">${chord.notesStr}</div>
        </div>
        <button 
          type="button" 
          class="chord-add-btn" 
          onclick="event.stopPropagation(); window.addChordToProgression(${idx})"
        >
          + Add to Progression
        </button>
      </div>
    `)
    .join('');
}

function auditionChord(index) {
  const chords = getTransposedChords();
  const chord = chords[index];
  if (!chord) return;

  const midiNotes = resolveChordMidiNotes(chord);
  studioAudio.playChord(midiNotes, 1.8);

  // Visual active pad flash
  const pads = document.querySelectorAll('.chord-pad-card');
  if (pads[index]) {
    pads[index].classList.add('playing');
    setTimeout(() => pads[index].classList.remove('playing'), 300);
  }
}

function addChordToProgression(index) {
  const chords = getTransposedChords();
  const chord = chords[index];
  if (!chord) return;

  if (progressionSequence.length >= 12) {
    showToast('Maximum 12 chords in a single progression', 'info');
    return;
  }

  progressionSequence.push(chord);
  renderProgressionTimeline();
  auditionChord(index);
}

function removeChordFromProgression(index) {
  progressionSequence.splice(index, 1);
  renderProgressionTimeline();
}

function renderProgressionTimeline() {
  const track = document.getElementById('progressionTrack');
  if (!track) return;

  if (progressionSequence.length === 0) {
    track.innerHTML = `
      <div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">
        No chords in progression. Click any chord pad above or "+" to add chords.
      </div>
    `;
    return;
  }

  track.innerHTML = progressionSequence
    .map((chord, idx) => `
      <div 
        class="progression-chord-chip ${currentPlayheadIndex === idx ? 'active-step' : ''}" 
        onclick="window.auditionProgressionChord(${idx})"
        title="Audition or remove"
      >
        <span>${chord.name}</span>
        <button 
          type="button" 
          class="chip-remove-btn" 
          onclick="event.stopPropagation(); window.removeChordFromProgression(${idx})"
          title="Remove chord"
        >&times;</button>
      </div>
    `)
    .join('');
}

function auditionProgressionChord(index) {
  const chord = progressionSequence[index];
  if (!chord) return;
  const midiNotes = resolveChordMidiNotes(chord);
  studioAudio.playChord(midiNotes, 1.8);
}

function auditionCurrentPreset() {
  const chords = getTransposedChords();
  chords.forEach((chord, i) => {
    setTimeout(() => {
      const midiNotes = resolveChordMidiNotes(chord);
      studioAudio.playChord(midiNotes, 1.2);
    }, i * 650);
  });
}

function toggleProgressionPlayback() {
  if (isProgressionPlaying) {
    stopProgressionPlayback();
  } else {
    startProgressionPlayback();
  }
}

function startProgressionPlayback() {
  if (progressionSequence.length === 0) {
    showToast('Add chords to your progression before playing', 'error');
    return;
  }

  isProgressionPlaying = true;
  const playBtn = document.getElementById('playProgressionBtn');
  if (playBtn) playBtn.textContent = '⏸ Pause Loop';

  const msPerBeat = 60000 / currentBpm;
  const chordDurationMs = msPerBeat * 4; // 4 beats per chord
  currentPlayheadIndex = 0;

  function step() {
    if (!isProgressionPlaying) return;
    const chord = progressionSequence[currentPlayheadIndex];
    if (chord) {
      const midiNotes = resolveChordMidiNotes(chord);
      studioAudio.playChord(midiNotes, (chordDurationMs / 1000) * 0.95);
      renderProgressionTimeline();
    }

    currentPlayheadIndex = (currentPlayheadIndex + 1) % progressionSequence.length;
    progressionPlayTimer = setTimeout(step, chordDurationMs);
  }

  step();
}

function stopProgressionPlayback() {
  isProgressionPlaying = false;
  currentPlayheadIndex = -1;
  if (progressionPlayTimer) clearTimeout(progressionPlayTimer);
  const playBtn = document.getElementById('playProgressionBtn');
  if (playBtn) playBtn.textContent = '▶ Play Progression Loop';
  renderProgressionTimeline();
}

function randomizeProgression() {
  const chords = getTransposedChords();
  const shuffled = [...chords].sort(() => 0.5 - Math.random()).slice(0, 4);
  progressionSequence = shuffled;
  renderProgressionTimeline();
  showToast('Shuffled progression chords', 'info');
  auditionCurrentPreset();
}

function clearProgression() {
  stopProgressionPlayback();
  progressionSequence = [];
  renderProgressionTimeline();
}

function downloadProgressionMidi() {
  if (progressionSequence.length === 0) {
    showToast('Add chords to progression before downloading MIDI', 'error');
    return;
  }

  const midiBytes = buildMidiFile({
    chords: progressionSequence,
    bpm: currentBpm,
    beatsPerChord: 4,
  });

  const filename = `DanglingBeats_${currentRootKey}_${currentPresetKey}_Progression.mid`;
  downloadMidiFile(midiBytes, filename);
  showToast(`✅ Downloaded ${filename}! Drag straight into your DAW.`, 'success');
}

// ============================================================================
// Modal & Scale Visualizer Logic (Piano & Fretboard)
// ============================================================================

function handleScaleRootChange(root) {
  currentScaleRoot = root;
  renderScaleVisualizer();
}

function handleScaleModeChange(mode) {
  currentScaleMode = mode;
  renderScaleVisualizer();
}

function handleInstrumentViewChange(view) {
  currentInstrumentView = view;
  const tuningGroup = document.getElementById('tuningGroup');
  if (tuningGroup) {
    tuningGroup.style.display = view === 'fretboard' ? 'flex' : 'none';
  }
  renderScaleVisualizer();
}

function handleTuningChange(tuning) {
  currentGuitarTuning = tuning;
  renderScaleVisualizer();
}

function renderScaleVisualizer() {
  const scaleDef = SCALE_DEFINITIONS[currentScaleMode] || SCALE_DEFINITIONS.minor;
  const rootSemi = noteToSemitone(currentScaleRoot);

  // Update Personality Header
  const titleEl = document.getElementById('scaleCharTitle');
  const degEl = document.getElementById('scaleCharDegrees');
  const descEl = document.getElementById('scaleCharDesc');

  const notesInScale = scaleDef.intervals.map((int) => NOTE_NAMES[(rootSemi + int) % 12]);
  if (titleEl) titleEl.innerHTML = `<span>✨</span> ${currentScaleRoot} ${scaleDef.name}`;
  if (degEl) degEl.textContent = `${scaleDef.degrees.join(' - ')} (${notesInScale.join(' - ')})`;
  if (descEl) descEl.textContent = scaleDef.mood;

  const surface = document.getElementById('visualizerSurface');
  if (!surface) return;

  if (currentInstrumentView === 'keyboard') {
    renderPianoKeyboard(surface, rootSemi, scaleDef);
  } else {
    renderGuitarFretboard(surface, rootSemi, scaleDef);
  }
}

function renderPianoKeyboard(container, rootSemi, scaleDef) {
  // 2 Octaves of keys from C3 (MIDI 48) to C5 (MIDI 72)
  const START_MIDI = 48; // C3
  const TOTAL_KEYS = 25; // 2 octaves + top C

  const whiteKeyPitches = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
  const scaleIntervals = scaleDef.intervals;

  let keysHtml = '<div class="piano-wrapper"><div class="piano-keyboard">';

  for (let i = 0; i < TOTAL_KEYS; i++) {
    const midi = START_MIDI + i;
    const semi = midi % 12;
    const isWhite = whiteKeyPitches.includes(semi);
    const intervalFromRoot = ((semi - rootSemi) % 12 + 12) % 12;
    const inScale = scaleIntervals.includes(intervalFromRoot);
    const isRoot = intervalFromRoot === 0;

    let degreeBadge = '';
    if (inScale) {
      const degIndex = scaleIntervals.indexOf(intervalFromRoot);
      const degName = scaleDef.degrees[degIndex];
      degreeBadge = `<span class="key-degree-pill ${isRoot ? 'key-degree-root' : 'key-degree-note'}">${degName}</span>`;
    }

    const noteName = NOTE_NAMES[semi];
    const keyClass = isWhite
      ? `white-key ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''}`
      : `black-key ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''}`;

    keysHtml += `
      <div 
        class="piano-key ${keyClass}" 
        onclick="window.playSingleNote(${midi})"
        title="${noteName} (${midi})"
      >
        ${degreeBadge}
        <span style="opacity: ${inScale ? 1 : 0.4}; margin-top: 2px;">${noteName}</span>
      </div>
    `;
  }

  keysHtml += '</div></div>';
  container.innerHTML = keysHtml;
}

function renderGuitarFretboard(container, rootSemi, scaleDef) {
  const tuning = GUITAR_TUNINGS[currentGuitarTuning] || GUITAR_TUNINGS.standard;
  const stringOpenMidis = tuning.notes; // e.g. [64, 59, 55, 50, 45, 40]
  const TOTAL_FRETS = 24;
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

  let fretboardHtml = '<div class="fretboard-wrapper"><div class="fretboard">';

  // Render String Rows
  stringOpenMidis.forEach((openMidi, strIdx) => {
    fretboardHtml += '<div class="fret-string-row">';
    fretboardHtml += '<div class="fret-string-wire" style="height: ' + (1 + strIdx * 0.5) + 'px;"></div>';

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const midi = openMidi + fret;
      const semi = midi % 12;
      const intervalFromRoot = ((semi - rootSemi) % 12 + 12) % 12;
      const inScale = scaleDef.intervals.includes(intervalFromRoot);
      const isRoot = intervalFromRoot === 0;
      const isThird = intervalFromRoot === 3 || intervalFromRoot === 4;
      const isFifth = intervalFromRoot === 7;

      let markerHtml = '';
      if (inScale) {
        const degIndex = scaleDef.intervals.indexOf(intervalFromRoot);
        const degName = scaleDef.degrees[degIndex];

        let markerClass = 'marker-degree';
        if (isRoot) markerClass = 'marker-root';
        else if (isThird) markerClass = 'marker-third';
        else if (isFifth) markerClass = 'marker-fifth';

        markerHtml = `<div class="fret-note-marker ${markerClass}">${degName}</div>`;
      }

      fretboardHtml += `
        <div 
          class="fret-cell ${fret === 0 ? 'fret-nut' : ''}" 
          onclick="window.playSingleNote(${midi})"
          title="${NOTE_NAMES[semi]} (Fret ${fret})"
        >
          ${markerHtml}
        </div>
      `;
    }
    fretboardHtml += '</div>';
  });

  // Fret Numbers Row
  fretboardHtml += '<div class="fret-numbers-row">';
  for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
    const hasInlay = inlayFrets.includes(fret);
    const inlaySymbol = fret === 12 || fret === 24 ? '••' : hasInlay ? '•' : '';
    fretboardHtml += `
      <div class="fret-num-cell ${fret === 0 ? 'fret-nut' : ''}">
        ${fret === 0 ? 'Nut' : fret} ${inlaySymbol ? `<span style="color: #ec4899;">${inlaySymbol}</span>` : ''}
      </div>
    `;
  }
  fretboardHtml += '</div>';

  fretboardHtml += '</div></div>';
  container.innerHTML = fretboardHtml;
}

function playSingleNote(midi) {
  studioAudio.playSingleNote(midi, 0.95);
}

// Expose globals for HTML onclicks
window.switchTheoryTab = switchTheoryTab;
window.selectPreset = selectPreset;
window.handleKeyChange = handleKeyChange;
window.handleBpmChange = handleBpmChange;
window.auditionChord = auditionChord;
window.addChordToProgression = addChordToProgression;
window.removeChordFromProgression = removeChordFromProgression;
window.auditionProgressionChord = auditionProgressionChord;
window.auditionCurrentPreset = auditionCurrentPreset;
window.toggleProgressionPlayback = toggleProgressionPlayback;
window.downloadProgressionMidi = downloadProgressionMidi;
window.randomizeProgression = randomizeProgression;
window.clearProgression = clearProgression;
window.handleScaleRootChange = handleScaleRootChange;
window.handleScaleModeChange = handleScaleModeChange;
window.handleInstrumentViewChange = handleInstrumentViewChange;
window.handleTuningChange = handleTuningChange;
window.playSingleNote = playSingleNote;

// Expose radio player globals
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
  initTheoryTools();
});

