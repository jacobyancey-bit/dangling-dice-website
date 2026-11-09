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

import {
  calculateDelayTimes,
  calculateReverbTimings,
  auditionDelayTick,
  calculatePitchShiftByBpm,
  calculateSampleLength,
  auditionPitchShift,
  calculateRoomModes,
  auditionSubTone,
} from './audioCalculators.js';

import {
  audioBufferToWav,
  createZipArchive,
  detectTransients,
  generateDemoBreakbeat,
  detectPitchAndKey,
} from './sampleChopper.js';

import {
  calculateEuclideanPattern,
  playSynthesizedDrum,
  generateEuclideanMidi,
  ROOT_SUB_NOTES,
  play808Sub,
  render808ToWav,
} from './beatmaker808.js';

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
  const views = {
    progression: document.getElementById('progressionView'),
    visualizer: document.getElementById('visualizerView'),
    calculators: document.getElementById('calculatorsView'),
    chopper: document.getElementById('chopperView'),
    beatmaker: document.getElementById('beatmakerView'),
  };

  const buttons = {
    progression: document.getElementById('tabProgressionBtn'),
    visualizer: document.getElementById('tabVisualizerBtn'),
    calculators: document.getElementById('tabCalculatorsBtn'),
    chopper: document.getElementById('tabChopperBtn'),
    beatmaker: document.getElementById('tabBeatmakerBtn'),
  };

  Object.entries(views).forEach(([key, el]) => {
    if (el) el.style.display = key === tab ? 'block' : 'none';
  });

  Object.entries(buttons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle('active', key === tab);
  });

  if (tab === 'visualizer') {
    renderScaleVisualizer();
  } else if (tab === 'calculators') {
    updateDelayCalculations(document.getElementById('calcBpmInput')?.value || 120);
    runPitchShiftCalc();
    runRoomModesCalc();
  } else if (tab === 'chopper') {
    if (!chopperAudioBuffer) {
      loadDemoBreakbeat();
    }
  } else if (tab === 'beatmaker') {
    renderEuclideanTracks();
    init808Designer();
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

// ============================================================================
// Phase 2: Audio Engineering & Mixing Calculators
// ============================================================================

function updateDelayCalculations(bpm) {
  const safeBpm = Math.max(20, Math.min(300, Number(bpm) || 120));
  const divisions = calculateDelayTimes(safeBpm);
  const tbody = document.getElementById('delayTableBody');

  if (tbody) {
    tbody.innerHTML = divisions
      .map(
        (d) => `
        <tr>
          <td style="font-weight: 700; color: #fff;">${d.name}</td>
          <td><span style="color: #67e8f9;">${d.standard.ms}</span> ms</td>
          <td><span style="color: #f472b6;">${d.dotted.ms}</span> ms</td>
          <td><span style="color: #fbbf24;">${d.triplet.ms}</span> ms</td>
          <td><span style="color: #10b981;">${d.standard.hz}</span> Hz</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.auditionDelayTick(${d.standard.ms})" style="padding: 2px 8px; font-size: 0.72rem;">
              🔊 Click
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  // Reverb pre-delay and decay spaces
  const reverbSpaces = calculateReverbTimings(safeBpm);
  const spacesContainer = document.getElementById('reverbSpacesGrid');
  if (spacesContainer) {
    spacesContainer.innerHTML = reverbSpaces
      .map(
        (s) => `
        <div class="reverb-space-card">
          <div class="space-title">${s.type}</div>
          <div class="space-timings">Pre-Delay: <span style="color: #67e8f9;">${s.preDelayMs}ms</span> | Decay: <span style="color: #f472b6;">${s.decayMs}ms</span></div>
          <div class="space-desc">${s.desc}</div>
        </div>
      `
      )
      .join('');
  }
}

function syncBpmFromProgression() {
  const input = document.getElementById('calcBpmInput');
  if (input) {
    input.value = progressionBpm;
    updateDelayCalculations(progressionBpm);
  }
}

let currentPitchShiftData = null;

function runPitchShiftCalc() {
  const sBpm = document.getElementById('pitchSourceBpm')?.value || 90;
  const tBpm = document.getElementById('pitchTargetBpm')?.value || 120;
  const res = calculatePitchShiftByBpm(sBpm, tBpm);
  currentPitchShiftData = res;

  const resultBox = document.getElementById('pitchShiftResultBox');
  if (resultBox) {
    resultBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Required Semitone Shift</span>
        <span style="font-size: 1.4rem; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: ${res.semitones >= 0 ? '#10b981' : '#ef4444'};">
          ${res.semitones >= 0 ? '+' : ''}${res.semitones} st
        </span>
      </div>
      <div style="font-size: 0.8rem; color: #fff; margin-bottom: 0.35rem;">
        Cents Detune: <span style="color: #67e8f9; font-family: monospace;">${res.cents >= 0 ? '+' : ''}${res.cents}¢</span> | Speed Ratio: <span style="color: #fbbf24; font-family: monospace;">${res.playbackPercent}%</span>
      </div>
      <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.3;">
        ${res.summary}
      </p>
    `;
  }

  const origLen = document.getElementById('sampleOrigDuration')?.value || 8.0;
  const repitchedLen = calculateSampleLength(origLen, sBpm, tBpm);
  const repitchedText = document.getElementById('repitchedDurationText');
  if (repitchedText) {
    repitchedText.textContent = `${repitchedLen.toFixed(3)} sec`;
  }
}

function auditionCurrentPitchShift() {
  const semi = currentPitchShiftData ? currentPitchShiftData.semitones : 0;
  auditionPitchShift(semi);
}

function runRoomModesCalc() {
  const l = document.getElementById('roomLength')?.value || 14.5;
  const w = document.getElementById('roomWidth')?.value || 11.0;
  const h = document.getElementById('roomHeight')?.value || 8.0;
  const unit = document.getElementById('roomUnit')?.value || 'feet';

  const res = calculateRoomModes(l, w, h, unit);
  const banner = document.getElementById('roomAlertBanner');

  if (banner) {
    if (res.dangerZones.length > 0 || res.assessment.startsWith('⚠️')) {
      banner.style.display = 'block';
      banner.className = 'calc-result-box';
      banner.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      banner.style.background = 'rgba(239, 68, 68, 0.08)';
      banner.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 700; color: #ef4444; margin-bottom: 0.25rem;">
          ${res.assessment}
        </div>
        ${res.dangerZones
          .map(
            (dz) => `
          <div style="font-size: 0.74rem; color: #fca5a5; margin-top: 0.2rem;">
            • ${dz.message} (${dz.source})
          </div>
        `
          )
          .join('')}
      `;
    } else {
      banner.style.display = 'block';
      banner.className = 'calc-result-box';
      banner.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      banner.style.background = 'rgba(16, 185, 129, 0.08)';
      banner.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 700; color: #10b981;">
          ✅ ${res.assessment} (Volume: ~${res.volumeCuFt} cu. ft)
        </div>
      `;
    }
  }

  const pillsContainer = document.getElementById('roomModesPills');
  if (pillsContainer) {
    pillsContainer.innerHTML = res.modes
      .map(
        (m) => `
        <div class="room-mode-pill" onclick="window.auditionRoomMode(${m.hz})" title="Click to hear ${m.hz}Hz sub-bass tone">
          <div class="room-mode-hz">${m.hz} Hz</div>
          <div class="room-mode-note">${m.note}</div>
          <div class="room-mode-dim">${m.dimension} • ${m.harmonic}</div>
        </div>
      `
      )
      .join('');
  }
}

function auditionRoomMode(hz) {
  auditionSubTone(hz);
}

// ============================================================================
// Phase 3: Sample Chopper & Pitch Key Detector
// ============================================================================

let chopperAudioBuffer = null;
let chopperSlices = [0];
const SLICE_KEY_MAP = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U'];
let activeSliceSource = null;

function loadDemoBreakbeat() {
  chopperAudioBuffer = generateDemoBreakbeat();
  runTransientDetection();
  drawWaveform();
}

async function handleChopperFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioCtx();
    chopperAudioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();
    runTransientDetection();
    drawWaveform();
  } catch (err) {
    console.error('[Chopper Decode Error]', err);
    alert('Failed to decode audio file. Please ensure it is a valid WAV, MP3, or OGG file.');
  }
}

function handleSensitivityChange(val) {
  const label = document.getElementById('sensitivityValue');
  if (label) label.textContent = `${Math.round(val * 100)}%`;
  if (chopperAudioBuffer) {
    runTransientDetection();
    drawWaveform();
  }
}

function runTransientDetection() {
  if (!chopperAudioBuffer) return;
  const sens = parseFloat(document.getElementById('transientSensitivity')?.value || 0.5);
  const result = detectTransients(chopperAudioBuffer, sens);
  chopperSlices = result.slices;
  renderSlicePads();
}

function drawWaveform() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas || !chopperAudioBuffer) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const channelData = chopperAudioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  const amp = height / 2;

  // Draw background grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();

  // Draw waveform
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, '#ec4899');
  gradient.addColorStop(0.5, '#06b6d4');
  gradient.addColorStop(1, '#10b981');

  ctx.fillStyle = gradient;
  ctx.beginPath();

  for (let i = 0; i < width; i++) {
    let min = 1.0;
    let max = -1.0;
    for (let j = 0; j < step; j++) {
      const datum = channelData[i * step + j];
      if (datum < min) min = datum;
      if (datum > max) max = datum;
    }
    const y1 = (1 + min) * amp;
    const y2 = Math.max(1, (max - min) * amp);
    ctx.fillRect(i, y1, 1, y2);
  }

  // Draw vertical slice markers
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  const totalDuration = chopperAudioBuffer.duration;

  chopperSlices.forEach((sec, idx) => {
    const x = Math.floor((sec / totalDuration) * width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Marker badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${idx + 1}`, x + 3, 14);
  });
}

function renderSlicePads() {
  const grid = document.getElementById('slicePadsGrid');
  if (!grid || !chopperAudioBuffer) return;

  const total = chopperSlices.length;
  grid.innerHTML = chopperSlices
    .map((sec, i) => {
      const key = SLICE_KEY_MAP[i] || `${i + 1}`;
      const nextSec = i < total - 1 ? chopperSlices[i + 1] : chopperAudioBuffer.duration;
      const durationMs = Math.round((nextSec - sec) * 1000);

      return `
      <div 
        class="slice-pad" 
        id="slicePad_${i}" 
        onmousedown="window.playSlice(${i})"
        title="Slice ${i + 1} (${durationMs}ms)"
      >
        <span class="slice-pad-key">[ ${key} ]</span>
        <div class="slice-pad-label">Slice ${i + 1}</div>
        <div style="font-size: 0.65rem; color: var(--text-muted);">${durationMs}ms</div>
      </div>
    `;
    })
    .join('');
}

function playSlice(index) {
  if (!chopperAudioBuffer || index < 0 || index >= chopperSlices.length) return;

  try {
    if (activeSliceSource) {
      activeSliceSource.stop();
      activeSliceSource.disconnect();
    }
  } catch (_) {}

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!chopperAudioCtx) chopperAudioCtx = new AudioCtx();
  if (chopperAudioCtx.state === 'suspended') chopperAudioCtx.resume();

  const startSec = chopperSlices[index];
  const endSec = index < chopperSlices.length - 1 ? chopperSlices[index + 1] : chopperAudioBuffer.duration;
  const duration = Math.max(0.01, endSec - startSec);

  const source = chopperAudioCtx.createBufferSource();
  source.buffer = chopperAudioBuffer;
  source.connect(chopperAudioCtx.destination);
  source.start(0, startSec, duration);
  activeSliceSource = source;

  // Visual pad pulse
  const pad = document.getElementById(`slicePad_${index}`);
  if (pad) {
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 140);
  }
}

function playFullLoop() {
  if (!chopperAudioBuffer) return;
  try {
    if (activeSliceSource) {
      activeSliceSource.stop();
      activeSliceSource.disconnect();
    }
  } catch (_) {}

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!chopperAudioCtx) chopperAudioCtx = new AudioCtx();
  if (chopperAudioCtx.state === 'suspended') chopperAudioCtx.resume();

  const source = chopperAudioCtx.createBufferSource();
  source.buffer = chopperAudioBuffer;
  source.connect(chopperAudioCtx.destination);
  source.start();
  activeSliceSource = source;
}

// Global Keyboard Trigger for Slices
window.addEventListener('keydown', (e) => {
  if (currentTheoryTab !== 'chopper') return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

  const keyUpper = e.key.toUpperCase();
  const sliceIndex = SLICE_KEY_MAP.indexOf(keyUpper);
  if (sliceIndex !== -1 && sliceIndex < chopperSlices.length) {
    e.preventDefault();
    playSlice(sliceIndex);
  }
});

async function downloadChoppedWavsZip() {
  if (!chopperAudioBuffer || chopperSlices.length === 0) return;

  const files = [];
  const total = chopperSlices.length;

  for (let i = 0; i < total; i++) {
    const startSec = chopperSlices[i];
    const endSec = i < total - 1 ? chopperSlices[i + 1] : chopperAudioBuffer.duration;
    const wavBlob = audioBufferToWav(chopperAudioBuffer, startSec, endSec);
    const padNum = String(i + 1).padStart(2, '0');
    files.push({
      filename: `Slice_${padNum}.wav`,
      blob: wavBlob,
    });
  }

  const zipBlob = await createZipArchive(files);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Dangling_Beats_Chopped_Slices_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Sample Pack Metadata Tagger
let taggerAudioBuffer = null;
let taggerOriginalFilename = '';

async function handleTaggerFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  taggerOriginalFilename = file.name;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioCtx();
    taggerAudioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    const analysis = detectPitchAndKey(taggerAudioBuffer);

    const emptyBox = document.getElementById('taggerEmptyPlaceholder');
    const resultBox = document.getElementById('taggerResultContainer');
    if (emptyBox) emptyBox.style.display = 'none';
    if (resultBox) resultBox.style.display = 'block';

    const keyText = document.getElementById('taggerKeyText');
    const hzText = document.getElementById('taggerHzText');
    const durText = document.getElementById('taggerDurationText');
    const lvlText = document.getElementById('taggerLevelsText');
    const renameInput = document.getElementById('taggerRenameInput');

    if (keyText) keyText.textContent = analysis.noteInfo.formatted;
    if (hzText) hzText.textContent = analysis.detectedHz > 0 ? `${analysis.detectedHz} Hz` : 'Transient Burst';
    if (durText) durText.textContent = `${analysis.durationSec}s (${analysis.sampleRate}Hz)`;
    if (lvlText) lvlText.textContent = `${analysis.peakDb} dB / ${analysis.rmsDb} dB`;

    if (renameInput) {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const pitchTag = analysis.noteInfo.note !== 'Unknown' ? `_${analysis.noteInfo.note}${analysis.noteInfo.octave}` : '';
      renameInput.value = `${baseName}${pitchTag}_Tuned.wav`;
    }
  } catch (err) {
    console.error('[Tagger Error]', err);
    alert('Could not decode sample file.');
  }
}

function downloadRenamedSample() {
  if (!taggerAudioBuffer) return;
  const name = document.getElementById('taggerRenameInput')?.value || 'Renamed_Sample.wav';
  const wavBlob = audioBufferToWav(taggerAudioBuffer);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.endsWith('.wav') ? name : `${name}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ============================================================================
// Phase 4: Euclidean Polyrhythm Sequencer & 808 Sub Synthesizer
// ============================================================================

let euclideanTracks = [
  { id: 'kick', name: 'Kick Drum', type: 'kick', steps: 16, pulses: 4, color: '#ec4899', pattern: [] },
  { id: 'snare', name: 'Snare Drum', type: 'snare', steps: 16, pulses: 2, color: '#06b6d4', pattern: [] },
  { id: 'hat', name: 'Closed Hat', type: 'hat', steps: 16, pulses: 7, color: '#f59e0b', pattern: [] },
  { id: 'perc', name: 'Perc / Rim', type: 'perc', steps: 12, pulses: 5, color: '#10b981', pattern: [] },
];

let euclideanPlaying = false;
let euclideanStepTimer = null;
let euclideanCurrentStep = 0;

function renderEuclideanTracks() {
  const container = document.getElementById('euclideanTracksContainer');
  if (!container) return;

  euclideanTracks.forEach((tr) => {
    tr.pattern = calculateEuclideanPattern(tr.steps, tr.pulses);
  });

  container.innerHTML = euclideanTracks
    .map(
      (tr) => `
    <div class="euclidean-track-card">
      <div>
        <div style="font-size: 0.85rem; font-weight: 800; color: #fff;">${tr.name}</div>
        <div style="font-size: 0.72rem; color: ${tr.color}; font-family: monospace;">
          E(${tr.pulses}, ${tr.steps}) • ${Math.round((tr.pulses / tr.steps) * 100)}% density
        </div>
      </div>

      <div class="euclidean-steps-strip" id="euclideanStrip_${tr.id}">
        ${tr.pattern
          .map(
            (p, idx) => `
          <div class="euclidean-step ${p === 1 ? 'pulse' : ''}" id="eStep_${tr.id}_${idx}" style="${p === 1 ? `background: ${tr.color}; border-color: ${tr.color};` : ''}"></div>
        `
          )
          .join('')}
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <div style="flex: 1;">
          <label style="font-size: 0.65rem; color: var(--text-muted); display: block;">Steps</label>
          <input type="number" class="theory-select" value="${tr.steps}" min="4" max="32" style="width: 50px; padding: 2px 4px; font-size: 0.75rem;" onchange="window.updateEuclideanTrack('${tr.id}', this.value, null)" />
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.65rem; color: var(--text-muted); display: block;">Pulses</label>
          <input type="number" class="theory-select" value="${tr.pulses}" min="0" max="${tr.steps}" style="width: 50px; padding: 2px 4px; font-size: 0.75rem;" onchange="window.updateEuclideanTrack('${tr.id}', null, this.value)" />
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function updateEuclideanTrack(trackId, steps, pulses) {
  const tr = euclideanTracks.find((t) => t.id === trackId);
  if (!tr) return;
  if (steps !== null) tr.steps = Math.max(4, Math.min(32, parseInt(steps) || 16));
  if (pulses !== null) tr.pulses = Math.max(0, Math.min(tr.steps, parseInt(pulses) || 0));
  renderEuclideanTracks();
}

function toggleEuclideanPlayback() {
  const btn = document.getElementById('euclideanPlayBtn');
  if (euclideanPlaying) {
    euclideanPlaying = false;
    if (euclideanStepTimer) clearInterval(euclideanStepTimer);
    euclideanStepTimer = null;
    if (btn) btn.innerHTML = '▶ Play Polyrhythm Loop';
    document.querySelectorAll('.euclidean-step.current').forEach((el) => el.classList.remove('current'));
    return;
  }

  euclideanPlaying = true;
  if (btn) btn.innerHTML = '⏹ Stop Loop';

  const bpm = progressionBpm || 120;
  const sixteenthMs = (60000 / bpm) / 4;
  euclideanCurrentStep = 0;

  euclideanStepTimer = setInterval(() => {
    // Fire sounds for matching pulses
    euclideanTracks.forEach((tr) => {
      const stepIdx = euclideanCurrentStep % tr.steps;
      const isHit = tr.pattern[stepIdx] === 1;

      // Update UI active step highlight
      document.querySelectorAll(`[id^="eStep_${tr.id}_"]`).forEach((el) => el.classList.remove('current'));
      const activeEl = document.getElementById(`eStep_${tr.id}_${stepIdx}`);
      if (activeEl) activeEl.classList.add('current');

      if (isHit) {
        playSynthesizedDrum(tr.type);
      }
    });

    euclideanCurrentStep++;
  }, sixteenthMs);
}

function randomizeEuclidean() {
  const randomOptions = [
    [16, 4],
    [16, 5],
    [16, 7],
    [16, 9],
    [12, 5],
    [12, 7],
    [8, 3],
    [8, 5],
  ];

  euclideanTracks.forEach((tr) => {
    const choice = randomOptions[Math.floor(Math.random() * randomOptions.length)];
    tr.steps = choice[0];
    tr.pulses = choice[1];
  });
  renderEuclideanTracks();
}

function downloadEuclideanMidi() {
  const bpm = progressionBpm || 120;
  const midiBytes = generateEuclideanMidi(euclideanTracks, bpm);
  downloadMidiFile(midiBytes, `Dangling_Euclidean_Polyrhythm_${bpm}BPM.mid`);
}

// 808 Sub Synthesizer Designer
function init808Designer() {
  const select = document.getElementById('subRootSelect');
  if (!select || select.children.length > 0) return;

  select.innerHTML = ROOT_SUB_NOTES.map(
    (n) => `
    <option value="${n.note}" ${n.note === 'F1' ? 'selected' : ''}>
      ${n.note} (${n.freq} Hz) - MIDI ${n.midi}
    </option>
  `
  ).join('');

  update808Params();
}

function get808ParamsFromUI() {
  return {
    rootNote: document.getElementById('subRootSelect')?.value || 'F1',
    waveform: document.getElementById('subWaveformSelect')?.value || 'sine',
    glideSemitones: document.getElementById('subGlideSemitones')?.value || 24,
    glideMs: document.getElementById('subGlideMs')?.value || 45,
    drive: document.getElementById('subDrive')?.value || 0.35,
    clickAmount: document.getElementById('subClick')?.value || 0.4,
    attackSec: 0.005,
    decaySec: document.getElementById('subDecay')?.value || 1.4,
  };
}

function update808Params() {
  const glideVal = document.getElementById('subGlideVal');
  const glideMsVal = document.getElementById('subGlideMsVal');
  const driveVal = document.getElementById('subDriveVal');
  const clickVal = document.getElementById('subClickVal');
  const decayVal = document.getElementById('subDecayVal');

  if (glideVal) glideVal.textContent = `+${document.getElementById('subGlideSemitones')?.value || 24}`;
  if (glideMsVal) glideMsVal.textContent = `${document.getElementById('subGlideMs')?.value || 45}ms`;
  if (driveVal) driveVal.textContent = `${Math.round((document.getElementById('subDrive')?.value || 0.35) * 100)}%`;
  if (clickVal) clickVal.textContent = `${Math.round((document.getElementById('subClick')?.value || 0.4) * 100)}%`;
  if (decayVal) decayVal.textContent = `${document.getElementById('subDecay')?.value || 1.4}s`;
}

function audition808Sub() {
  const params = get808ParamsFromUI();
  play808Sub(params);
}

async function downloadRendered808() {
  const params = get808ParamsFromUI();
  const res = await render808ToWav(params);
  const url = URL.createObjectURL(res.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = res.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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

// Phase 2: Audio Engineering Calculators
window.updateDelayCalculations = updateDelayCalculations;
window.syncBpmFromProgression = syncBpmFromProgression;
window.auditionDelayTick = auditionDelayTick;
window.runPitchShiftCalc = runPitchShiftCalc;
window.auditionCurrentPitchShift = auditionCurrentPitchShift;
window.runRoomModesCalc = runRoomModesCalc;
window.auditionRoomMode = auditionRoomMode;

// Phase 3: Slicer & Tagger
window.loadDemoBreakbeat = loadDemoBreakbeat;
window.handleChopperFileUpload = handleChopperFileUpload;
window.handleSensitivityChange = handleSensitivityChange;
window.playSlice = playSlice;
window.playFullLoop = playFullLoop;
window.downloadChoppedWavsZip = downloadChoppedWavsZip;
window.handleTaggerFileUpload = handleTaggerFileUpload;
window.downloadRenamedSample = downloadRenamedSample;

// Phase 4: Euclidean & 808
window.renderEuclideanTracks = renderEuclideanTracks;
window.updateEuclideanTrack = updateEuclideanTrack;
window.toggleEuclideanPlayback = toggleEuclideanPlayback;
window.randomizeEuclidean = randomizeEuclidean;
window.downloadEuclideanMidi = downloadEuclideanMidi;
window.init808Designer = init808Designer;
window.update808Params = update808Params;
window.audition808Sub = audition808Sub;
window.downloadRendered808 = downloadRendered808;

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
  updateDelayCalculations(120);
  runPitchShiftCalc();
  runRoomModesCalc();
  init808Designer();
});

