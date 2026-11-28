// ============================================================================
// Dangling Beats Studio™ — Specialized Music & Producer Radio Application
// ============================================================================

import { initStaffCommandPalette, initPwaServiceWorker, initStudioShell, initTabKeyboard, icon, hydrateIcons } from '@dangling-dice/shared';

// Swap <span data-icon> placeholders for stroke icons before any handlers run
hydrateIcons();

// Data-viz exception (DESIGN_SYSTEM.md): canvases and DAW lanes read --dds-viz-* / surface tokens
const cssToken = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Toggle a two-state button's pressed state (class + aria-pressed)
function setPressed(el, on) {
  if (!el) return;
  el.classList.toggle('active', on);
  el.setAttribute('aria-pressed', String(on));
}

// Universal PWA Service Worker Registration
initPwaServiceWorker();

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

import { midiEngine, MPC_PADS_CONFIG } from './midiEngine.js';
import { samplerEngine } from './samplerEngine.js';
import { sampleEngine } from './sampleEngine.js';
import { instrumentEngine, INSTRUMENT_CATALOG, DRUM_KITS } from './instrumentEngine.js';
import { studioRecorder } from './studioRecorder.js';
import { 
  touchController, 
  PIANO_CHORDS_CATALOG, 
  GUITAR_CHORDS_CATALOG, 
  DRUM_CHORDS_CATALOG, 
  GENRE_SLICES,
  PIANO_FULL_KEY_MAP,
  GUITAR_FULL_KEY_MAP
} from './touchController.js';

import { projectTransport } from './projectTransport.js';

window.touchController = touchController;
window.projectTransport = projectTransport;
window.setControllerInstrument = (id) => touchController.setInstrument(id);
window.navControllerInstrument = (dir) => touchController.navInstrument(dir);
window.setControllerMode = (id) => touchController.setMode(id);
window.setControllerGenre = (id) => touchController.setGenre(id);

const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "https://dangling-dice-studios.com/api";

function showToast(msg, type = "info") {
  const stack = document.getElementById("toastContainer");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = `toast${type === "success" ? " toast-success" : type === "error" ? " toast-error" : ""}`;
  toast.textContent = msg;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// Web MIDI API & Hardware Integration
// ============================================================================

async function requestMidiAccess() {
  const result = await midiEngine.init();
  updateMidiStatusUI(result);

  if (result.connected) {
    showToast(`Connected: ${result.deviceName}`, "success");
  } else if (result.supported) {
    showToast("Web MIDI active: Plug in any USB/Bluetooth MIDI keyboard", "info");
  } else {
    showToast(result.error || "Web MIDI not supported in this browser", "error");
  }
}

function updateMidiStatusUI(status) {
  const btn = document.getElementById("midiConnectBtn");
  const text = document.getElementById("midiStatusText");
  const deviceText = document.getElementById("activeMidiDeviceText");

  if (!btn || !text) return;

  if (status.connected && status.deviceName) {
    btn.classList.add("connected");
    text.textContent = `${status.deviceName}`;
    if (deviceText) deviceText.textContent = status.deviceName;
  } else if (status.supported) {
    btn.classList.remove("connected");
    text.textContent = "Web MIDI Ready (Plug In)";
    if (deviceText) deviceText.textContent = "Listening for USB...";
  } else {
    btn.classList.remove("connected");
    text.textContent = "Web MIDI Not Supported";
    if (deviceText) deviceText.textContent = "Unsupported Browser";
  }
}

// Wire hardware MIDI note events to active studio instruments
midiEngine.onNote(({ type, note, velocity }) => {
  if (type === 'noteon') {
    if (currentTheoryTab === 'sampler' || mpcBankMode === 'sampler') {
      samplerEngine.noteOn(note, velocity);
      highlightSamplerKey(note);
    } else {
      instrumentNoteOn(note, velocity);
    }

    // Trigger 16-Pad MPC if within note range (36 to 51)
    const padObj = MPC_PADS_CONFIG.find((p) => p.note === note);
    if (padObj && mpcBankMode === 'drums') {
      handleMpcPadHit(padObj.pad, velocity);
    }
  } else if (type === 'noteoff') {
    if (currentTheoryTab === 'sampler' || mpcBankMode === 'sampler') {
      samplerEngine.noteOff(note);
      unhighlightSamplerKey(note);
    } else {
      instrumentNoteOff(note);
    }
  }
});

// Wire hardware MIDI Control Change (CC) messages (e.g. Sustain Pedal CC 64)
midiEngine.onControl(({ controller, value }) => {
  if (controller === 64) {
    const isDown = value >= 64;
    instrumentEngine.setSustainPedal(isDown);
    updateSustainPedalUI(isDown);
  }
});

midiEngine.onStatusChange((status) => {
  updateMidiStatusUI(status);
});

// ============================================================================
// Master Studio Clock & Tap Tempo
// ============================================================================

let tapTimes = [];

function handleMasterBpmChange(val) {
  const bpm = Math.max(40, Math.min(280, parseInt(val) || 90));
  progressionBpm = bpm;
  if (projectTransport && projectTransport.bpm !== bpm) {
    projectTransport.bpm = bpm;
  }

  const progInput = document.getElementById('progressionBpmInput');
  const calcInput = document.getElementById('calcBpmInput');
  const masterInput = document.getElementById('masterBpmInput');

  if (progInput) progInput.value = bpm;
  if (calcInput) calcInput.value = bpm;
  if (masterInput) masterInput.value = bpm;

  updateDelayCalculations(bpm);
  runPitchShiftCalc();
}

function tapTempo() {
  const now = performance.now();
  tapTimes.push(now);

  if (tapTimes.length > 4) {
    tapTimes.shift();
  }

  if (tapTimes.length >= 2) {
    const diffs = [];
    for (let i = 1; i < tapTimes.length; i++) {
      diffs.push(tapTimes[i] - tapTimes[i - 1]);
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const computedBpm = Math.round(60000 / avgDiff);
    handleMasterBpmChange(computedBpm);
  }
}

// ============================================================================
// Global Instrument & Drum Kit Management
// ============================================================================

function handleGlobalInstrumentChange(instId) {
  instrumentEngine.setInstrument(instId);
  const inst = instrumentEngine.getInstrument();

  // Synchronize both Master Console & Music Theory dropdowns
  const masterSelect = document.getElementById('masterInstrumentSelect');
  const theorySelect = document.getElementById('theoryInstrumentSelect');
  if (masterSelect && masterSelect.value !== instId) masterSelect.value = instId;
  if (theorySelect && theorySelect.value !== instId) theorySelect.value = instId;

  // Auto-adapt visualizer tuning if electric bass is selected
  if (instId === 'electric_bass') {
    handleTuningChange('bass_standard');
    const tuningSelect = document.getElementById('guitarTuningSelect');
    if (tuningSelect) tuningSelect.value = 'bass_standard';
  }

  // Update instrument settings rack controls (guitars vs pianos)
  renderInstrumentSettingsRack();

  showToast(`Active Instrument: ${inst.name}`, 'success');
}

function handleDrumKitChange(kitId) {
  instrumentEngine.setDrumKit(kitId);
  const kit = instrumentEngine.getDrumKit();
  const select = document.getElementById('mpcDrumKitSelect');
  if (select && select.value !== kitId) select.value = kitId;
  renderMpcPads();
  showToast(`Drum Kit: ${kit.name}`, 'success');
}

// ============================================================================
// Virtual 16-Pad MPC / Launchpad Controller
// ============================================================================

let mpcBankMode = 'drums';

function renderMpcPads() {
  if (touchController) {
    touchController.render();
    return;
  }
  const grid = document.getElementById('mpcPadGrid');
  if (!grid) return;

  grid.innerHTML = MPC_PADS_CONFIG.map((p) => {
    let padName = p.name;
    if (mpcBankMode === 'drums') {
      const kit = instrumentEngine.getDrumKit();
      if (kit && kit.pads[p.pad]) {
        padName = kit.pads[p.pad].name;
      }
    } else if (mpcBankMode === 'slices') {
      const sliceIdx = p.pad - 1;
      padName = chopperSlices && sliceIdx < chopperSlices.length ? `Slice ${sliceIdx + 1}` : `Slice ${p.pad}`;
    } else if (mpcBankMode === 'chords') {
      const chordIdx = (p.pad - 1) % (progressionSequence.length || 1);
      const chord = progressionSequence[chordIdx];
      padName = chord ? chord.name : `Chord ${p.pad}`;
    } else if (mpcBankMode === 'sampler') {
      const semitone = p.pad - 1;
      const targetMidi = samplerEngine.rootMidi + semitone;
      const noteName = NOTE_NAMES[targetMidi % 12];
      const oct = Math.floor(targetMidi / 12) - 1;
      padName = `${noteName}${oct} (+${semitone}st)`;
    }

    return `
      <div 
        class="mpc-pad" 
        id="mpcPad_${p.pad}" 
        onmousedown="window.handleMpcPadHit(${p.pad}, 0.95)"
        title="Pad ${p.pad} • Key [${p.key}] • MIDI ${p.note}"
      >
        <div class="mpc-pad-key">[ ${p.key} ]</div>
        <div class="mpc-pad-name" id="mpcPadName_${p.pad}">${padName}</div>
        <div class="mpc-pad-note">Pad ${p.pad}</div>
      </div>
    `;
  }).join('');
}

function handleMpcBankChange(val) {
  mpcBankMode = val;
  if (val === 'slices' && !chopperAudioBuffer) {
    loadDemoBreakbeat();
  }
  const drumGroup = document.getElementById('mpcDrumKitGroup');
  if (drumGroup) {
    drumGroup.style.display = val === 'drums' ? 'flex' : 'none';
  }
  renderMpcPads();
}

function handleMpcPadHit(padNum, velocity = 0.9) {
  const padEl = document.getElementById(`ctrlMpcPad_${padNum}`) || 
                document.getElementById(`slicePad_${padNum - 1}`) || 
                document.getElementById(`mpcPad_${padNum}`);
  if (padEl) {
    padEl.classList.add('active');
    setTimeout(() => padEl.classList.remove('active'), 120);
  }

  if (touchController) {
    if (touchController.activeMode === 'slices') {
      const slice = touchController.getSlice(padNum - 1);
      if (slice) {
        touchController.playGenreSlice(slice);
        return;
      }
    } else if (touchController.activeMode === 'chords') {
      if (touchController.activeInstrument === 'piano') {
        const chord = PIANO_CHORDS_CATALOG[(padNum - 1) % PIANO_CHORDS_CATALOG.length];
        if (chord) {
          touchController.playChordVoicing(chord.notes, false);
          return;
        }
      } else if (touchController.activeInstrument === 'guitar') {
        const chord = GUITAR_CHORDS_CATALOG[(padNum - 1) % GUITAR_CHORDS_CATALOG.length];
        if (chord) {
          touchController.playChordVoicing(chord.notes, true);
          return;
        }
      } else {
        const chord = touchController.getDrumChord((padNum - 1) % 16);
        if (chord) {
          touchController.playDrumChord(chord);
          return;
        }
      }
    }
  }

  if (mpcBankMode === 'drums') {
    // Trigger authentic multi-piece kit drum sound
    instrumentEngine.playDrumPad(padNum, velocity);
    if (projectTransport && projectTransport.isRecording) {
      const kit = instrumentEngine.getDrumKit();
      const padConfig = kit?.pads ? kit.pads[padNum] : null;
      const soundKey = padConfig?.sound || 'kick_punchy';
      projectTransport.recordLiveEvent('drums', { type: soundKey, velocity });
    }
  } else if (mpcBankMode === 'slices') {
    if (!chopperAudioBuffer) {
      loadDemoBreakbeat();
    }
    const sliceIdx = padNum - 1;
    if (chopperAudioBuffer && sliceIdx < chopperSlices.length) {
      playSlice(sliceIdx);
    } else {
      playFullLoop();
    }
  } else if (mpcBankMode === 'chords') {
    if (progressionSequence.length > 0) {
      const chordIdx = (padNum - 1) % progressionSequence.length;
      auditionProgressionChord(chordIdx);
    }
  } else if (mpcBankMode === 'sampler') {
    const semitone = padNum - 1;
    const targetMidi = samplerEngine.rootMidi + semitone;
    samplerEngine.noteOn(targetMidi, velocity);
    setTimeout(() => samplerEngine.noteOff(targetMidi), 400);
  }
}

// ============================================================================
// Multi-Instrument QWERTY Mapping & Dispatcher
// Allows simultaneous live performance across Drums, Piano, and Guitar
// Automatically yields to native typing whenever any input field is focused
// ============================================================================

const PIANO_KEY_MAP = {
  'T': 60, // C4
  '5': 61, // C#4
  'Y': 62, // D4
  '6': 63, // D#4
  'U': 64, // E4
  'I': 65, // F4
  '8': 66, // F#4
  'O': 67, // G4
  '9': 68, // G#4
  'P': 69, // A4
  '0': 70, // A#4
  '[': 71, // B4
  ']': 72, // C5
};

const MIDI_TO_PIANO_KEY = {
  60: 'T',
  61: '5',
  62: 'Y',
  63: '6',
  64: 'U',
  65: 'I',
  66: '8',
  67: 'O',
  68: '9',
  69: 'P',
  70: '0',
  71: '[',
  72: ']',
};

const GUITAR_KEY_MAP = {
  // Open strings (String 6 Low E to String 1 High E + High G)
  'G': { type: 'string', midi: 40, name: 'String 6 (Low E)' },
  'H': { type: 'string', midi: 45, name: 'String 5 (A)' },
  'J': { type: 'string', midi: 50, name: 'String 4 (D)' },
  'K': { type: 'string', midi: 55, name: 'String 3 (G)' },
  'L': { type: 'string', midi: 59, name: 'String 2 (B)' },
  ';': { type: 'string', midi: 64, name: 'String 1 (High E)' },
  "'": { type: 'string', midi: 67, name: 'High G' },

  // Bottom row: Strum Progression Chords
  'B': { type: 'chord', idx: 0 },
  'N': { type: 'chord', idx: 1 },
  'M': { type: 'chord', idx: 2 },
  ',': { type: 'chord', idx: 3 },
  '.': { type: 'chord', idx: 4 },
  '/': { type: 'chord', idx: 5 },
};

function isTypingInField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || el.isContentEditable;
}

// Active held keys for true press-to-sustain polyphony
const activeHeldKeys = new Map();
const heldDrumKeys = new Set();

function instrumentNoteOn(midi, velocity = 0.95) {
  instrumentEngine.noteOn(midi, velocity);

  if (projectTransport && projectTransport.isRecording && projectTransport.armedTrack === 'piano') {
    projectTransport.recordLiveEvent('piano', { note: midi, velocity });
  }

  // Visual highlight on 25-key piano
  const keyEl = document.querySelector(`.piano-key[data-midi="${midi}"]`);
  if (keyEl) keyEl.classList.add('playing');

  // Visual highlight on fretboard
  const fretEl = document.querySelector(`.fret-cell[data-midi="${midi}"]`);
  if (fretEl) fretEl.classList.add('playing');
}

function instrumentNoteOff(midi) {
  instrumentEngine.noteOff(midi);

  // Remove visual highlight from 25-key piano
  const keyEl = document.querySelector(`.piano-key[data-midi="${midi}"]`);
  if (keyEl) keyEl.classList.remove('playing');

  // Remove visual highlight from fretboard
  const fretEl = document.querySelector(`.fret-cell[data-midi="${midi}"]`);
  if (fretEl) fretEl.classList.remove('playing');
}

function toggleSustainPedal() {
  const newState = !instrumentEngine.settings.sustainPedal;
  instrumentEngine.setSustainPedal(newState);
  updateSustainPedalUI(newState);
  showToast(newState ? 'Sustain Pedal: ON (Holding notes)' : 'Sustain Pedal: OFF', 'info');
}

function updateSustainPedalUI(isDown) {
  const masterBtn = document.getElementById('masterSustainBtn');
  if (masterBtn) {
    masterBtn.classList.toggle('active', isDown);
    masterBtn.innerHTML = `<span class="sustain-pedal-led ${isDown ? 'led-on' : ''}"></span> PEDAL: ${isDown ? 'ON' : 'OFF'}`;
  }
  const rackPedalBtn = document.getElementById('rackSustainBtn');
  if (rackPedalBtn) {
    rackPedalBtn.classList.toggle('active-pedal', isDown);
    rackPedalBtn.innerHTML = `<span class="sustain-pedal-led ${isDown ? 'led-on' : ''}"></span> ${isDown ? 'SUSTAIN PEDAL: ON' : 'SUSTAIN PEDAL: OFF'}`;
  }
}

function toggleLegatoMode() {
  const newMode = instrumentEngine.settings.playMode === 'legato' ? 'poly' : 'legato';
  instrumentEngine.setPlayMode(newMode);
  updateLegatoUI(newMode);
  showToast(newMode === 'legato' ? 'Mono Legato Mode (Smooth note glide)' : 'Polyphonic Mode (Full chords)', 'info');
}

function updateLegatoUI(mode) {
  const badge = document.getElementById('masterLegatoBadge');
  if (badge) {
    badge.textContent = mode === 'legato' ? 'LEGATO' : 'POLY';
  }
  renderInstrumentSettingsRack();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// Real-Time Studio Stem & Take Recorder Logic
// ============================================================================
let activeTake = null;

function toggleStudioRecording() {
  if (studioRecorder.isRecording) {
    studioRecorder.stopRecording();
  } else {
    studioRecorder.startRecording();
  }
}

function renderRecordedTakeShelf(take) {
  const shelf = document.getElementById('recordedTakeShelf');
  if (!shelf) return;
  if (!take) {
    shelf.style.display = 'none';
    shelf.innerHTML = '';
    return;
  }

  activeTake = take;
  const isPlaying = studioRecorder.isPlayingPreview;

  shelf.style.display = 'flex';
  shelf.innerHTML = `
    <div class="take-info-side">
      <div class="take-header-row">
        <span class="take-pill">Audio Take Ready</span>
        <span class="take-filename">${escapeHtml(take.filename)}</span>
      </div>
      <div class="take-meta-sub">
        <span>Instrument: <strong class="take-meta-highlight">${escapeHtml(take.instName)}</strong></span>
        <span>Duration: <strong class="take-meta-highlight">${take.duration.toFixed(2)}s</strong></span>
        <span>Format: <strong class="take-meta-highlight">16-bit 44.1kHz Stereo Broadcast WAV</strong></span>
      </div>
    </div>

    <div class="take-actions-side">
      <button 
        type="button" 
        id="takePreviewBtn" 
        class="take-action-btn btn-preview ${isPlaying ? 'playing' : ''}" 
        onclick="window.toggleTakePreview()" 
        title="Audition recorded audio snippet"
      >
        ${isPlaying ? 'Stop' : 'Audition'}
      </button>

      <button 
        type="button" 
        class="take-action-btn btn-download" 
        onclick="window.downloadRecordedTake()" 
        title="Download high-definition WAV file directly to your system"
      >
        Download WAV
      </button>

      <button 
        type="button" 
        class="take-action-btn" 
        onclick="window.sendTakeToSampler()" 
        title="Send snippet directly into the Chromatic Sampler"
      >
        To Sampler
      </button>

      <button 
        type="button" 
        class="take-action-btn" 
        onclick="window.sendTakeToSlicer()" 
        title="Send snippet directly into the Drum Break Transient Slicer"
      >
        To Slicer
      </button>

      <button 
        type="button" 
        class="take-action-btn btn-dismiss" 
        onclick="window.dismissRecordedTake()" 
        title="Dismiss take"
        aria-label="Dismiss take"
      >
        &times;
      </button>
    </div>
  `;
}

function toggleTakePreview() {
  if (studioRecorder.isPlayingPreview) {
    studioRecorder.stopTakePreview();
  } else {
    studioRecorder.playTakePreview();
  }
}

function downloadRecordedTake() {
  if (activeTake) {
    studioRecorder.downloadTake(activeTake.filename);
    showToast(`Saved ${activeTake.filename} to downloads!`, 'success');
  }
}

function sendTakeToSampler() {
  if (!activeTake || !activeTake.audioBuffer) return;
  samplerEngine.loadBuffer(activeTake.audioBuffer, activeTake.filename);
  switchTheoryTab('sampler');
  initSamplerUI();
  drawSamplerWaveform();
  showToast('Loaded recorded take into Chromatic Sampler!', 'success');
}

function sendTakeToSlicer() {
  if (!activeTake || !activeTake.audioBuffer) return;
  chopperAudioBuffer = activeTake.audioBuffer;
  runTransientDetection();
  drawWaveform();
  renderSlicePads();
  renderMpcPads();
  switchTheoryTab('chopper');
  showToast('Loaded recorded take into Drum Break Slicer!', 'success');
}

function dismissRecordedTake() {
  studioRecorder.stopTakePreview();
  activeTake = null;
  const shelf = document.getElementById('recordedTakeShelf');
  if (shelf) {
    shelf.style.display = 'none';
    shelf.innerHTML = '';
  }
}

// Studio Recorder State Subscription
studioRecorder.onStateChange((event, data) => {
  const recBtn = document.getElementById('masterRecBtn');
  const recDot = document.getElementById('recDot');
  const recLabel = document.getElementById('recBtnLabel');

  if (event === 'start') {
    if (recBtn) recBtn.classList.add('recording');
    if (recDot) recDot.classList.add('pulsing');
    if (recLabel) recLabel.textContent = 'STOP (0.0s)';
    showToast('Recording master audio take... Play your instrument or drums!', 'info');
  } else if (event === 'timer') {
    if (recLabel) recLabel.textContent = `STOP (${data.elapsed.toFixed(1)}s)`;
  } else if (event === 'take_ready') {
    if (recBtn) recBtn.classList.remove('recording');
    if (recDot) recDot.classList.remove('pulsing');
    if (recLabel) recLabel.textContent = '● REC TAKE';
    renderRecordedTakeShelf(data);
    showToast(`Studio Take Captured (${data.duration}s)! Ready to audition or download.`, 'success');
  } else if (event === 'preview_started' || event === 'preview_ended') {
    const previewBtn = document.getElementById('takePreviewBtn');
    if (previewBtn) {
      const isPlaying = studioRecorder.isPlayingPreview;
      previewBtn.classList.toggle('playing', isPlaying);
      previewBtn.textContent = isPlaying ? 'Stop' : 'Audition';
    }
  }
});

function updateEngineSetting(key, val, unit = '') {
  const num = parseFloat(val);
  instrumentEngine.setSetting(key, num);

  const displayEl = document.getElementById(`val_${key}`);
  if (displayEl) {
    if (unit === 's') {
      displayEl.textContent = `${num.toFixed(1)}s`;
    } else if (unit === 'ms_sec') {
      displayEl.textContent = `${Math.round(num * 1000)}ms`;
    } else if (unit === '%') {
      displayEl.textContent = `${Math.round(num * 100)}%`;
    } else if (unit === 'Hz') {
      displayEl.textContent = `${Math.round(num)}Hz`;
    } else {
      displayEl.textContent = `${num}`;
    }
  }
}

function toggleRealSamples() {
  sampleEngine.setUseRealSamples(!sampleEngine.useRealSamples);
  renderInstrumentSettingsRack();
  showToast(
    sampleEngine.useRealSamples
      ? 'Real Studio Multi-Samples Active'
      : 'Mathematical Synthesis Mode Active',
    'info'
  );
}

function renderInstrumentSettingsRack() {
  const container = document.getElementById('instrumentSettingsRack');
  if (!container) return;

  const inst = instrumentEngine.getInstrument();
  const settings = instrumentEngine.settings;
  const isGuitar = inst.category === 'guitar';
  const isPiano = inst.category === 'piano';
  const sampleStatus = sampleEngine.getInstrumentStatus(inst.id);

  let html = `
    <div class="settings-rack-card">
      <div class="settings-rack-header">
        <div class="settings-rack-title">
          <span style="font-size: 1.15rem;"></span>
          <span><strong>${inst.name}</strong> Articulation &amp; Performance Controls</span>
          <span class="sample-status-pill ${sampleEngine.useRealSamples ? 'pill-sampled' : 'pill-synth'}">
            ${sampleEngine.useRealSamples ? (sampleStatus === 'loading' ? 'Loading Studio Samples...' : 'Multi-Sample Bank Ready') : 'Analog Synthesis Mode'}
          </span>
        </div>
        <div class="settings-rack-actions">
          <button 
            type="button" 
            class="rack-btn ${sampleEngine.useRealSamples ? 'active-sampled' : ''}" 
            onclick="window.toggleRealSamples()"
            title="Switch between Real Studio Multi-Samples (Recordings) and Mathematical Synthesis"
          >
            <span class="sample-engine-dot ${sampleEngine.useRealSamples ? 'dot-ready' : 'dot-off'}"></span>
            ${sampleEngine.useRealSamples ? 'REAL SAMPLES' : 'SYNTHESIS'}
          </button>

          <button 
            type="button" 
            id="rackSustainBtn"
            class="rack-btn ${settings.sustainPedal ? 'active-pedal' : ''}" 
            onclick="window.toggleSustainPedal()"
            title="Damper / Sustain Pedal (Keyboard shortcut: Shift key)"
          >
            <span class="sustain-pedal-led ${settings.sustainPedal ? 'led-on' : ''}"></span>
            ${settings.sustainPedal ? 'SUSTAIN PEDAL: ON' : 'SUSTAIN PEDAL: OFF'}
          </button>

          <button 
            type="button" 
            class="rack-btn ${settings.playMode === 'legato' ? 'active-legato' : ''}" 
            onclick="window.toggleLegatoMode()"
            title="Switch between Polyphonic chords and Monophonic smooth legato slides"
          >
            ${settings.playMode === 'legato' ? 'MONO LEGATO' : 'POLYPHONIC'}
          </button>
        </div>
      </div>

      <div class="settings-rack-body">
        <!-- Universal Envelope & Articulation Controls -->
        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Sustain Hold Decay</span>
            <span class="rack-slider-val" id="val_sustainDecay">${Number(settings.sustainDecay).toFixed(1)}s</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0.5" 
            max="8.0" 
            step="0.1" 
            value="${settings.sustainDecay}"
            oninput="window.updateEngineSetting('sustainDecay', this.value, 's')"
          />
        </div>

        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Key Release Damping</span>
            <span class="rack-slider-val" id="val_releaseTime">${Math.round(settings.releaseTime * 1000)}ms</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0.04" 
            max="1.2" 
            step="0.02" 
            value="${settings.releaseTime}"
            oninput="window.updateEngineSetting('releaseTime', this.value, 'ms_sec')"
          />
        </div>

        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Legato Portamento Glide</span>
            <span class="rack-slider-val" id="val_glideTime">${Math.round(settings.glideTime * 1000)}ms</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0" 
            max="0.25" 
            step="0.005" 
            value="${settings.glideTime}"
            oninput="window.updateEngineSetting('glideTime', this.value, 'ms_sec')"
          />
        </div>
  `;

  if (isGuitar) {
    html += `
        <!-- Guitar Specific Controls -->
        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Palm Mute / String Damp</span>
            <span class="rack-slider-val" id="val_guitarDamp">${Math.round(settings.guitarDamp * 100)}%</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0" 
            max="0.9" 
            step="0.05" 
            value="${settings.guitarDamp}"
            oninput="window.updateEngineSetting('guitarDamp', this.value, '%')"
          />
        </div>

        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Overdrive / Drive Gain</span>
            <span class="rack-slider-val" id="val_driveGain">${settings.driveGain}</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0" 
            max="100" 
            step="1" 
            value="${settings.driveGain}"
            oninput="window.updateEngineSetting('driveGain', this.value, '')"
          />
        </div>

        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Guitar Tone (Presence)</span>
            <span class="rack-slider-val" id="val_guitarTone">${settings.guitarTone}Hz</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="1000" 
            max="9000" 
            step="100" 
            value="${settings.guitarTone}"
            oninput="window.updateEngineSetting('guitarTone', this.value, 'Hz')"
          />
        </div>
    `;
  } else if (isPiano) {
    html += `
        <!-- Piano / Keyboard Specific Controls -->
        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Hammer Felt Attack</span>
            <span class="rack-slider-val" id="val_hammerHardness">${Math.round(settings.hammerHardness * 100)}%</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0.1" 
            max="1.0" 
            step="0.05" 
            value="${settings.hammerHardness}"
            oninput="window.updateEngineSetting('hammerHardness', this.value, '%')"
          />
        </div>

        <div class="rack-slider-group">
          <div class="rack-slider-header">
            <span class="rack-slider-label">Stereo Chorus / Detune</span>
            <span class="rack-slider-val" id="val_chorusDepth">${Math.round(settings.chorusDepth * 100)}%</span>
          </div>
          <input 
            type="range" 
            class="rack-range" 
            min="0" 
            max="1.0" 
            step="0.05" 
            value="${settings.chorusDepth}"
            oninput="window.updateEngineSetting('chorusDepth', this.value, '%')"
          />
        </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function playPianoKey(midi) {
  instrumentNoteOn(midi, 0.95);
}

function playGuitarKey(action) {
  if (action.type === 'string') {
    instrumentNoteOn(action.midi, 0.95);
  } else if (action.type === 'chord') {
    if (progressionSequence && progressionSequence.length > action.idx) {
      const chord = progressionSequence[action.idx];
      const midis = resolveChordMidiNotes(chord, 3);
      instrumentEngine.playChord(midis, 1.8, 0.95);
    } else {
      // Default acoustic guitar open chord voicings
      const defaultVoicings = [
        [40, 47, 52, 55, 60, 64], // Em
        [45, 52, 57, 60, 64],     // Am
        [41, 48, 53, 57, 60],     // F
        [43, 47, 50, 55, 59, 67], // G
        [48, 52, 55, 60, 64],     // C
        [50, 57, 62, 65],         // Dm
      ];
      const voicing = defaultVoicings[action.idx % defaultVoicings.length];
      instrumentEngine.playChord(voicing, 1.8, 0.95);
    }

    // Highlight progression card if visible
    const cardEl = document.getElementById(`progressionCard_${action.idx}`);
    if (cardEl) {
      cardEl.classList.add('playing');
      setTimeout(() => cardEl.classList.remove('playing'), 250);
    }
  }
}

// Master Single-Instrument Exclusive QWERTY Keyboard Listener
window.addEventListener('keydown', (e) => {
  // CRITICAL: Immediately yield to native browser typing if user is in an input, textarea, or dropdown!
  if (isTypingInField() || e.ctrlKey || e.metaKey || e.altKey) return;

  const keyUpper = e.key.toUpperCase();
  const rawKey = e.key;

  // Sustain Pedal Momentary Hold via Shift key
  if (e.key === 'Shift') {
    if (!instrumentEngine.settings.sustainPedal) {
      instrumentEngine.setSustainPedal(true);
      updateSustainPedalUI(true);
    }
    return;
  }

  // Prevent browser auto-repeat from stuttering note attacks while key is held down!
  if (e.repeat) return;

  // STRICT SINGLE-INSTRUMENT SELECTION: Whichever instrument is active completely owns the keyboard!
  const activeInst = window.touchController ? window.touchController.activeInstrument : 'drums';

  // =========================================================================
  // 1. ACTIVE INSTRUMENT: DRUMS (MPC 16-Pad Layout: 1-4, Q-R, A-F, Z-V)
  // =========================================================================
  if (activeInst === 'drums') {
    const padObj = MPC_PADS_CONFIG.find((p) => p.key.toUpperCase() === keyUpper);
    if (padObj) {
      e.preventDefault();
      if (heldDrumKeys.has(keyUpper)) return;
      heldDrumKeys.add(keyUpper);
      
      const tc = window.touchController;
      if (tc && tc.activeMode === 'chords') {
        tc.playDrumGroove(tc.getDrumGroove(padObj.pad - 1));
      } else if (tc && tc.activeMode === 'slices') {
        tc.playGenreSlice(tc.getSlice(padObj.pad - 1));
      } else {
        handleMpcPadHit(padObj.pad, 0.95);
      }
      
      const padEl = document.getElementById(`ctrlMpcPad_${padObj.pad}`) || 
                    document.getElementById(`drumGroovePad_${padObj.pad - 1}`) || 
                    document.getElementById(`slicePad_${padObj.pad - 1}`);
      if (padEl) {
        padEl.classList.add('active');
        setTimeout(() => padEl.classList.remove('active'), 200);
      }
      return;
    }
    return; // Don't trigger piano or guitar when drums is active
  }

  // =========================================================================
  // 2. ACTIVE INSTRUMENT: PIANO (Full QWERTY Chromatic Layout - 2+ Octaves)
  // =========================================================================
  if (activeInst === 'piano') {
    // Quick Octave Transpose shortcuts: 1 (Octave Down), - or = (Octave Up)
    if (keyUpper === '1') {
      e.preventDefault();
      if (window.touchController) window.touchController.shiftOctave(-1);
      return;
    }
    if (keyUpper === '-' || rawKey === '-' || rawKey === '_' || keyUpper === '=') {
      e.preventDefault();
      if (window.touchController) window.touchController.shiftOctave(1);
      return;
    }

    const mapItem = PIANO_FULL_KEY_MAP[keyUpper] || PIANO_FULL_KEY_MAP[rawKey];
    if (mapItem) {
      e.preventDefault();
      const currentOctave = window.touchController ? window.touchController.pianoOctave : 3;
      const midi = currentOctave * 12 + 12 + mapItem.offset;
      activeHeldKeys.set(keyUpper, { type: 'piano', midi });
      instrumentNoteOn(midi, 0.95);

      // Visual highlight on on-screen piano key
      const pianoKeyEl = document.querySelector(`.piano-key[data-midi="${midi}"]`);
      if (pianoKeyEl) pianoKeyEl.classList.add('playing');
      return;
    }
    return; // Don't trigger drums or guitar when piano is active
  }

  // =========================================================================
  // 3. ACTIVE INSTRUMENT: GUITAR (Full 4-Row Fretboard, Open Strings & Chords)
  // =========================================================================
  if (activeInst === 'guitar') {
    const guitarAction = GUITAR_FULL_KEY_MAP[keyUpper] || GUITAR_FULL_KEY_MAP[rawKey];
    if (guitarAction) {
      e.preventDefault();
      if (guitarAction.type === 'string' || guitarAction.type === 'note') {
        activeHeldKeys.set(keyUpper, { type: 'guitar', midi: guitarAction.midi });
        instrumentNoteOn(guitarAction.midi, 0.95);

        // Highlight matching fret on interactive fretboard
        const fretEl = document.querySelector(`.fret-cell[data-midi="${guitarAction.midi}"]`);
        if (fretEl) fretEl.classList.add('active');
      } else if (guitarAction.type === 'chord') {
        const chordItem = GUITAR_CHORDS_CATALOG[guitarAction.idx];
        if (window.touchController) {
          window.touchController.playChordVoicing(chordItem?.notes || [40, 47, 52, 55, 59, 64], true);
        } else {
          playGuitarKey(guitarAction);
        }
      }
      return;
    }
    return; // Don't trigger drums or piano when guitar is active
  }
});

window.addEventListener('keyup', (e) => {
  if (isTypingInField()) return;

  const keyUpper = e.key.toUpperCase();

  // Release held drum key so it can be triggered on the next stroke
  if (heldDrumKeys.has(keyUpper)) {
    heldDrumKeys.delete(keyUpper);
    const padObj = MPC_PADS_CONFIG.find((p) => p.key.toUpperCase() === keyUpper);
    if (padObj) {
      const padEl = document.getElementById(`ctrlMpcPad_${padObj.pad}`);
      if (padEl) padEl.classList.remove('active');
    }
  }

  // Sustain pedal release via Shift key
  if (e.key === 'Shift') {
    instrumentEngine.setSustainPedal(false);
    updateSustainPedalUI(false);
    return;
  }

  const held = activeHeldKeys.get(keyUpper);
  if (held) {
    activeHeldKeys.delete(keyUpper);
    if (held.midi !== undefined) {
      instrumentNoteOff(held.midi);

      // Remove visual highlights
      const pianoKeyEl = document.querySelector(`.piano-key[data-midi="${held.midi}"]`);
      if (pianoKeyEl) pianoKeyEl.classList.remove('playing');

      const fretEl = document.querySelector(`.fret-cell[data-midi="${held.midi}"]`);
      if (fretEl) fretEl.classList.remove('active');
    }
  }
});

// Fetch Studio Beat Releases Catalog
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
        <div style="grid-column: 1 / -1; text-align: center; color: var(--dds-ink-muted); padding: 2rem;">
          Studio instrumentals and sound packs are loaded in the workstation above.
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
            <a href="https://media.dangling-dice-studios.com/" target="_blank" rel="noopener noreferrer" style="color: var(--dds-ink); text-decoration: none; font-weight: 600;">
              Download Stems &amp; Audio 
            </a>
          </div>
        </div>
      `)
      .join("");
  } catch (err) {
    console.warn("Could not fetch beat catalog:", err);
  }
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
    sampler: document.getElementById('samplerView'),
  };

  const buttons = {
    progression: document.getElementById('tabProgressionBtn'),
    visualizer: document.getElementById('tabVisualizerBtn'),
    calculators: document.getElementById('tabCalculatorsBtn'),
    chopper: document.getElementById('tabChopperBtn'),
    beatmaker: document.getElementById('tabBeatmakerBtn'),
    sampler: document.getElementById('tabSamplerBtn'),
  };

  Object.entries(views).forEach(([key, el]) => {
    if (el) el.style.display = key === tab ? 'block' : 'none';
  });

  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    btn.classList.toggle('active', key === tab);
    btn.setAttribute('aria-selected', String(key === tab));
    btn.tabIndex = key === tab ? 0 : -1;
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
  } else if (tab === 'sampler') {
    initSamplerUI();
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
          <span class="chord-listen-icon"></span>
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
      <div style="color: var(--dds-ink-muted); font-size: 0.85rem; padding: 1rem;">
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
  if (playBtn) playBtn.textContent = 'Pause Loop';

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
  if (playBtn) playBtn.textContent = 'Play Progression Loop';
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
  showToast(`Downloaded ${filename}! Drag straight into your DAW.`, 'success');
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
  if (titleEl) titleEl.innerHTML = `${currentScaleRoot} ${scaleDef.name}`;
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

    const kbdChar = MIDI_TO_PIANO_KEY[midi];
    const kbdBadge = kbdChar ? `<span class="piano-kbd-pill" title="Press '${kbdChar}' on computer keyboard">[${kbdChar}]</span>` : '';

    const noteName = NOTE_NAMES[semi];
    const keyClass = isWhite
      ? `white-key ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''}`
      : `black-key ${inScale ? 'in-scale' : ''} ${isRoot ? 'is-root' : ''}`;

    keysHtml += `
      <div 
        class="piano-key ${keyClass}" 
        data-midi="${midi}"
        onmousedown="window.instrumentNoteOn(${midi}); event.preventDefault();"
        onmouseup="window.instrumentNoteOff(${midi}); event.preventDefault();"
        onmouseleave="window.instrumentNoteOff(${midi})"
        ontouchstart="window.instrumentNoteOn(${midi}); event.preventDefault();"
        ontouchend="window.instrumentNoteOff(${midi}); event.preventDefault();"
        title="${noteName} (${midi})${kbdChar ? ` • Key [${kbdChar}]` : ''}"
      >
        ${degreeBadge}
        ${kbdBadge}
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
  const GUITAR_STRING_KBD_MAP = [';', 'L', 'K', 'J', 'H', 'G'];

  let fretboardHtml = '<div class="fretboard-wrapper"><div class="fretboard">';

  // Render String Rows
  stringOpenMidis.forEach((openMidi, strIdx) => {
    fretboardHtml += '<div class="fret-string-row">';
    fretboardHtml += '<div class="fret-string-wire" style="height: ' + (1 + strIdx * 0.5) + 'px;"></div>';

    const stringKeyChar = GUITAR_STRING_KBD_MAP[strIdx] || '';

    for (let fret = 0; fret <= TOTAL_FRETS; fret++) {
      const midi = openMidi + fret;
      const semi = midi % 12;
      const intervalFromRoot = ((semi - rootSemi) % 12 + 12) % 12;
      const inScale = scaleIntervals.includes(intervalFromRoot);
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
      } else if (fret === 0 && stringKeyChar) {
        markerHtml = `<div class="fret-nut-kbd">[${stringKeyChar}]</div>`;
      }

      fretboardHtml += `
        <div 
          class="fret-cell ${fret === 0 ? 'fret-nut' : ''}" 
          data-midi="${midi}"
          onmousedown="window.instrumentNoteOn(${midi}); event.preventDefault();"
          onmouseup="window.instrumentNoteOff(${midi}); event.preventDefault();"
          onmouseleave="window.instrumentNoteOff(${midi})"
          ontouchstart="window.instrumentNoteOn(${midi}); event.preventDefault();"
          ontouchend="window.instrumentNoteOff(${midi}); event.preventDefault();"
          title="${NOTE_NAMES[semi]} (Fret ${fret})${fret === 0 && stringKeyChar ? ` • Key [${stringKeyChar}]` : ''}"
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
        ${fret === 0 ? 'Nut' : fret} ${inlaySymbol ? `<span style="color: var(--dds-ink);">${inlaySymbol}</span>` : ''}
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
          <td style="font-weight: 600; color: var(--dds-ink);">${d.name}</td>
          <td><span style="color: var(--dds-ink);">${d.standard.ms}</span> ms</td>
          <td><span style="color: var(--dds-ink);">${d.dotted.ms}</span> ms</td>
          <td><span style="color: var(--dds-ink);">${d.triplet.ms}</span> ms</td>
          <td><span style="color: var(--dds-ink);">${d.standard.hz}</span> Hz</td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.auditionDelayTick(${d.standard.ms})">
              Click
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
          <div class="space-timings">Pre-Delay: <span style="color: var(--dds-ink);">${s.preDelayMs}ms</span> | Decay: <span style="color: var(--dds-ink);">${s.decayMs}ms</span></div>
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
        <span style="font-size: 0.75rem; color: var(--dds-ink-muted); text-transform: uppercase;">Required Semitone Shift</span>
        <span style="font-size: 1.4rem; font-family: var(--dds-font-mono); font-weight: 600; color: var(--dds-ink);">
          ${res.semitones >= 0 ? '+' : ''}${res.semitones} st
        </span>
      </div>
      <div style="font-size: 0.8rem; color: var(--dds-ink); margin-bottom: 0.35rem;">
        Cents Detune: <span style="color: var(--dds-ink); font-family: var(--dds-font-mono);">${res.cents >= 0 ? '+' : ''}${res.cents}¢</span> | Speed Ratio: <span style="color: var(--dds-ink); font-family: var(--dds-font-mono);">${res.playbackPercent}%</span>
      </div>
      <p style="font-size: 0.74rem; color: var(--dds-ink-muted); line-height: 1.3;">
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
    if (res.dangerZones.length > 0 || res.warning) {
      banner.style.display = 'block';
      banner.className = 'callout is-warn';
      banner.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--dds-ink); margin-bottom: 0.25rem;">
          ${res.assessment}
        </div>
        ${res.dangerZones
          .map(
            (dz) => `
          <div style="font-size: 0.74rem; color: var(--dds-ink); margin-top: 0.2rem;">
            • ${dz.message} (${dz.source})
          </div>
        `
          )
          .join('')}
      `;
    } else {
      banner.style.display = 'block';
      banner.className = 'callout is-ok';
      banner.innerHTML = `
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--dds-ink);">
          ${res.assessment} (Volume: ~${res.volumeCuFt} cu. ft)
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
  const ctx = instrumentEngine.getAudioContext();
  chopperAudioBuffer = generateDemoBreakbeat(ctx);
  runTransientDetection();
  drawWaveform();
  renderSlicePads();
  renderMpcPads();
}

async function handleChopperFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const ctx = instrumentEngine.getAudioContext();
    chopperAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    runTransientDetection();
    drawWaveform();
    renderSlicePads();
    renderMpcPads();
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
  ctx.strokeStyle = cssToken('--dds-border-color');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();

  // Draw waveform (flat accent fill)
  ctx.fillStyle = cssToken('--dds-accent');
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
  ctx.strokeStyle = cssToken('--dds-ink');
  ctx.lineWidth = 2;
  const totalDuration = chopperAudioBuffer.duration;

  chopperSlices.forEach((sec, idx) => {
    const x = Math.floor((sec / totalDuration) * width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Marker badge
    ctx.fillStyle = cssToken('--dds-ink');
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
        <div style="font-size: 0.65rem; color: var(--dds-ink-muted);">${durationMs}ms</div>
      </div>
    `;
    })
    .join('');
}

function playSlice(index) {
  if (!chopperAudioBuffer) {
    loadDemoBreakbeat();
  }
  if (!chopperAudioBuffer || index < 0 || index >= chopperSlices.length) return;

  const ctx = instrumentEngine.getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  try {
    if (activeSliceSource) {
      activeSliceSource.stop();
      activeSliceSource.disconnect();
    }
  } catch (_) {}

  const startSec = chopperSlices[index];
  const endSec = index < chopperSlices.length - 1 ? chopperSlices[index + 1] : chopperAudioBuffer.duration;
  const duration = Math.max(0.01, endSec - startSec);

  const source = ctx.createBufferSource();
  source.buffer = chopperAudioBuffer;
  source.connect(instrumentEngine.masterGain || ctx.destination);
  source.start(0, startSec, duration);
  activeSliceSource = source;

  // Visual pad pulse in Chopper Tab
  const pad = document.getElementById(`slicePad_${index}`);
  if (pad) {
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 140);
  }

  // Visual pulse on MPC Deck pad if in Slices mode
  const mpcPad = document.getElementById(`mpcPad_${index + 1}`);
  if (mpcPad) {
    mpcPad.classList.add('active');
    setTimeout(() => mpcPad.classList.remove('active'), 140);
  }
}

function playFullLoop() {
  if (!chopperAudioBuffer) {
    loadDemoBreakbeat();
  }
  if (!chopperAudioBuffer) return;

  const ctx = instrumentEngine.getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  try {
    if (activeSliceSource) {
      activeSliceSource.stop();
      activeSliceSource.disconnect();
    }
  } catch (_) {}

  const source = ctx.createBufferSource();
  source.buffer = chopperAudioBuffer;
  source.connect(instrumentEngine.masterGain || ctx.destination);
  source.start();
  activeSliceSource = source;
}

// Global Keyboard Trigger for Slices
window.addEventListener('keydown', (e) => {
  if (currentTheoryTab !== 'chopper') return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (e.repeat) return; // Prevent repeated triggers on sustained key press

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
  { id: 'kick', name: 'Kick Drum', type: 'kick', steps: 16, pulses: 4, color: 'var(--dds-viz-2)', pattern: [] },
  { id: 'snare', name: 'Snare Drum', type: 'snare', steps: 16, pulses: 2, color: 'var(--dds-viz-1)', pattern: [] },
  { id: 'hat', name: 'Closed Hat', type: 'hat', steps: 16, pulses: 7, color: 'var(--dds-viz-6)', pattern: [] },
  { id: 'perc', name: 'Perc / Rim', type: 'perc', steps: 12, pulses: 5, color: 'var(--dds-viz-5)', pattern: [] },
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
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--dds-ink);">${tr.name}</div>
        <div class="lane-meta"><span class="lane-dot" style="background: ${tr.color};"></span>
          E(${tr.pulses}, ${tr.steps}) • ${Math.round((tr.pulses / tr.steps) * 100)}% density
        </div>
      </div>

      <div class="euclidean-steps-strip" id="euclideanStrip_${tr.id}">
        ${tr.pattern
          .map(
            (p, idx) => `
          <div 
            class="euclidean-step ${p === 1 ? 'pulse' : ''}" 
            id="eStep_${tr.id}_${idx}" 
            onclick="window.toggleEuclideanStepBlock('${tr.id}', ${idx})"
            title="Step ${idx + 1}: Click to toggle hit"
            style="cursor: pointer; ${p === 1 ? `background: ${tr.color}; border-color: ${tr.color};` : ''}"
          ></div>
        `
          )
          .join('')}
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <div style="flex: 1;">
          <label style="font-size: 0.65rem; color: var(--dds-ink-muted); display: block;">Steps</label>
          <input type="number" class="theory-select" value="${tr.steps}" min="4" max="32" style="width: 50px; padding: 2px 4px; font-size: 0.75rem;" onchange="window.updateEuclideanTrack('${tr.id}', this.value, null)" />
        </div>
        <div style="flex: 1;">
          <label style="font-size: 0.65rem; color: var(--dds-ink-muted); display: block;">Pulses</label>
          <input type="number" class="theory-select" value="${tr.pulses}" min="0" max="${tr.steps}" style="width: 50px; padding: 2px 4px; font-size: 0.75rem;" onchange="window.updateEuclideanTrack('${tr.id}', null, this.value)" />
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function toggleEuclideanStepBlock(trackId, stepIdx) {
  const tr = euclideanTracks.find((t) => t.id === trackId);
  if (!tr) return;
  if (!tr.pattern || tr.pattern.length !== tr.steps) {
    tr.pattern = calculateEuclideanPattern(tr.steps, tr.pulses);
  }
  tr.pattern[stepIdx] = tr.pattern[stepIdx] === 1 ? 0 : 1;
  tr.pulses = tr.pattern.filter((p) => p === 1).length;

  // Audition toggled hit if activated
  if (tr.pattern[stepIdx] === 1) {
    playSynthesizedDrum(tr.type);
  }

  renderEuclideanTracks();
}
window.toggleEuclideanStepBlock = toggleEuclideanStepBlock;

function updateEuclideanTrack(trackId, steps, pulses) {
  const tr = euclideanTracks.find((t) => t.id === trackId);
  if (!tr) return;
  if (steps !== null) tr.steps = Math.max(4, Math.min(32, parseInt(steps) || 16));
  if (pulses !== null) tr.pulses = Math.max(0, Math.min(tr.steps, parseInt(pulses) || 0));
  renderEuclideanTracks();
}

function toggleEuclideanPlayback() {
  const ctx = instrumentEngine.getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const btn = document.getElementById('euclideanPlayBtn');
  if (euclideanPlaying) {
    euclideanPlaying = false;
    if (euclideanStepTimer) clearInterval(euclideanStepTimer);
    euclideanStepTimer = null;
    if (btn) btn.innerHTML = 'Play Polyrhythm Loop';
    document.querySelectorAll('.euclidean-step.current').forEach((el) => el.classList.remove('current'));
    return;
  }

  euclideanPlaying = true;
  if (btn) btn.innerHTML = 'Stop Loop';

  const bpm = projectTransport ? projectTransport.bpm : (progressionBpm || 90);
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

// ============================================================================
// Phase 5: Chromatic Audio Sampler & Instrument Engine
// ============================================================================

let samplerInitialized = false;

function initSamplerUI() {
  if (!samplerInitialized) {
    renderSamplerRootOptions();
    renderSamplerKeyboard();
    samplerEngine.generatePresetSample('grand-piano');
    samplerInitialized = true;
  }
  drawSamplerWaveform();
}

function renderSamplerRootOptions() {
  const select = document.getElementById('samplerRootSelect');
  if (!select) return;

  const options = [];
  for (let octave = 1; octave <= 5; octave++) {
    NOTE_NAMES.forEach((name, idx) => {
      const midi = (octave + 1) * 12 + idx;
      options.push({ midi, label: `${name}${octave} (MIDI ${midi})` });
    });
  }

  select.innerHTML = options
    .map((opt) => `<option value="${opt.midi}" ${opt.midi === 60 ? 'selected' : ''}>${opt.label}</option>`)
    .join('');
}

function renderSamplerKeyboard() {
  const container = document.getElementById('samplerKeyboardSurface');
  if (!container) return;

  // 25-key chromatic keyboard from C3 (MIDI 48) to C5 (MIDI 72)
  const START_MIDI = 48; // C3
  const TOTAL_KEYS = 25;
  let html = '';

  for (let i = 0; i < TOTAL_KEYS; i++) {
    const midi = START_MIDI + i;
    const semi = midi % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(semi);
    const noteName = NOTE_NAMES[semi];
    const octave = Math.floor(midi / 12) - 1;

    html += `
      <div 
        class="piano-key ${isBlack ? 'black-key' : 'white-key'}" 
        id="samplerKey_${midi}"
        data-midi="${midi}"
        onmousedown="window.samplerNoteOn(${midi})"
        onmouseup="window.samplerNoteOff(${midi})"
        onmouseleave="window.samplerNoteOff(${midi})"
        ontouchstart="window.samplerNoteOn(${midi}); event.preventDefault();"
        ontouchend="window.samplerNoteOff(${midi}); event.preventDefault();"
        title="${noteName}${octave} (MIDI ${midi})"
      >
        <span class="piano-key-label" style="font-size: 0.62rem;">${noteName}${octave}</span>
      </div>
    `;
  }

  container.innerHTML = html;
}

function samplerNoteOn(midi) {
  samplerEngine.noteOn(midi, 0.9);
  highlightSamplerKey(midi);
}

function samplerNoteOff(midi) {
  samplerEngine.noteOff(midi);
  unhighlightSamplerKey(midi);
}

function highlightSamplerKey(midi) {
  const key = document.getElementById(`samplerKey_${midi}`);
  if (key) key.classList.add('playing');
}

function unhighlightSamplerKey(midi) {
  const key = document.getElementById(`samplerKey_${midi}`);
  if (key) key.classList.remove('playing');
}

function loadSamplerPreset(type) {
  samplerEngine.generatePresetSample(type);
  const rootSelect = document.getElementById('samplerRootSelect');
  if (rootSelect) rootSelect.value = samplerEngine.rootMidi;

  const presetSelect = document.getElementById('samplerPresetSelect');
  if (presetSelect && presetSelect.value !== type) {
    presetSelect.value = type;
  }

  document.querySelectorAll('#samplerView .preset-pill').forEach((pill) => {
    const text = pill.textContent.toLowerCase();
    pill.classList.toggle('active', text.includes(type.replace('-', ' ')));
  });

  drawSamplerWaveform();
  showToast(`Loaded ${samplerEngine.sampleName} into Sampler!`, 'success');
}

function handleSamplerRootChange(val) {
  samplerEngine.rootMidi = parseInt(val) || 60;
  showToast(`Sampler Root mapped to MIDI ${samplerEngine.rootMidi}`, 'info');
}

async function toggleSamplerMicRecording() {
  const btn = document.getElementById('samplerMicBtn');
  if (!btn) return;

  if (!samplerEngine.isRecording) {
    const res = await samplerEngine.startMicRecording();
    if (res.success) {
      btn.innerHTML = `${icon('square')}Stop recording`;
      btn.classList.add('is-recording');
      showToast('Recording live microphone audio...', 'info');
    } else {
      showToast(res.error || 'Microphone access denied', 'error');
    }
  } else {
    btn.textContent = 'Processing Mic...';
    const rootSelect = document.getElementById('samplerRootSelect');
    const rootMidi = parseInt(rootSelect?.value || 60);
    const res = await samplerEngine.stopMicRecording(rootMidi);

    btn.innerHTML = `${icon('mic')}Record mic`;
    btn.classList.remove('is-recording');

    if (res && res.success) {
      drawSamplerWaveform();
      showToast('Microphone recording mapped across keyboard!', 'success');
    } else {
      showToast(res?.error || 'Failed to capture recording', 'error');
    }
  }
}

async function handleSamplerFileUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioCtx();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    tempCtx.close();

    const rootSelect = document.getElementById('samplerRootSelect');
    const rootMidi = parseInt(rootSelect?.value || 60);

    samplerEngine.loadBuffer(audioBuffer, file.name, rootMidi);
    drawSamplerWaveform();
    showToast(`Loaded ${file.name} across keyboard!`, 'success');
  } catch (err) {
    console.error('[Sampler File Error]', err);
    showToast('Could not decode audio file', 'error');
  }
}

function drawSamplerWaveform() {
  const canvas = document.getElementById('samplerWaveformCanvas');
  if (!canvas || !samplerEngine.activeBuffer) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const buf = samplerEngine.isReversed && samplerEngine.reversedBuffer ? samplerEngine.reversedBuffer : samplerEngine.activeBuffer;
  const channelData = buf.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  const amp = height / 2;

  // Center zero line
  ctx.strokeStyle = cssToken('--dds-border-color');
  ctx.beginPath();
  ctx.moveTo(0, amp);
  ctx.lineTo(width, amp);
  ctx.stroke();

  // Waveform (flat accent fill)
  ctx.fillStyle = cssToken('--dds-accent');
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

  // Draw Trim Boundary overlays (Dimmed outside trim region)
  const startX = Math.floor(samplerEngine.startRatio * width);
  const endX = Math.floor(samplerEngine.endRatio * width);

  ctx.globalAlpha = 0.65;
  ctx.fillStyle = cssToken('--dds-canvas');
  if (startX > 0) ctx.fillRect(0, 0, startX, height);
  if (endX < width) ctx.fillRect(endX, 0, width - endX, height);
  ctx.globalAlpha = 1;

  // Start Line
  ctx.strokeStyle = cssToken('--dds-ink');
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(startX, height);
  ctx.stroke();

  // End Line
  ctx.strokeStyle = cssToken('--dds-ink');
  ctx.beginPath();
  ctx.moveTo(endX, 0);
  ctx.lineTo(endX, height);
  ctx.stroke();
}

function updateSamplerTrim() {
  const startVal = parseFloat(document.getElementById('samplerStartTrim')?.value || 0);
  const endVal = parseFloat(document.getElementById('samplerEndTrim')?.value || 1);

  samplerEngine.startRatio = Math.min(startVal, endVal - 0.05);
  samplerEngine.endRatio = Math.max(endVal, startVal + 0.05);

  const startLabel = document.getElementById('samplerStartVal');
  const endLabel = document.getElementById('samplerEndVal');
  if (startLabel) startLabel.textContent = `${Math.round(samplerEngine.startRatio * 100)}%`;
  if (endLabel) endLabel.textContent = `${Math.round(samplerEngine.endRatio * 100)}%`;

  drawSamplerWaveform();
}

function toggleSamplerLoop() {
  samplerEngine.isLooping = !samplerEngine.isLooping;
  const btn = document.getElementById('samplerLoopBtn');
  if (btn) {
    btn.textContent = samplerEngine.isLooping ? 'Loop: on' : 'Loop: off';
    setPressed(btn, samplerEngine.isLooping);
  }
}

function toggleSamplerReverse() {
  samplerEngine.isReversed = !samplerEngine.isReversed;
  const btn = document.getElementById('samplerReverseBtn');
  if (btn) {
    btn.textContent = samplerEngine.isReversed ? 'Reverse: on' : 'Reverse: off';
    setPressed(btn, samplerEngine.isReversed);
  }
  drawSamplerWaveform();
}

function updateSamplerAdsr() {
  samplerEngine.attack = parseFloat(document.getElementById('samplerAttack')?.value || 0.01);
  samplerEngine.decay = parseFloat(document.getElementById('samplerDecay')?.value || 0.3);
  samplerEngine.sustain = parseFloat(document.getElementById('samplerSustain')?.value || 0.7);
  samplerEngine.release = parseFloat(document.getElementById('samplerRelease')?.value || 0.4);

  const aVal = document.getElementById('samplerAttackVal');
  const dVal = document.getElementById('samplerDecayVal');
  const sVal = document.getElementById('samplerSustainVal');
  const rVal = document.getElementById('samplerReleaseVal');

  if (aVal) aVal.textContent = `${Math.round(samplerEngine.attack * 1000)}ms`;
  if (dVal) dVal.textContent = `${samplerEngine.decay.toFixed(2)}s`;
  if (sVal) sVal.textContent = `${Math.round(samplerEngine.sustain * 100)}%`;
  if (rVal) rVal.textContent = `${samplerEngine.release.toFixed(2)}s`;
}

function updateSamplerFilter() {
  samplerEngine.filterCutoff = parseFloat(document.getElementById('samplerFilterCutoff')?.value || 18000);
  samplerEngine.filterResonance = parseFloat(document.getElementById('samplerFilterQ')?.value || 1.0);

  const cVal = document.getElementById('samplerCutoffVal');
  const qVal = document.getElementById('samplerQVal');
  if (cVal) cVal.textContent = `${Math.round(samplerEngine.filterCutoff)} Hz`;
  if (qVal) qVal.textContent = `Q: ${samplerEngine.filterResonance.toFixed(1)}`;
}

// Expose globals for HTML onclicks
window.switchTheoryTab = switchTheoryTab;
initTabKeyboard(document.getElementById('theoryTabBar'));
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

// Phase 5: Chromatic Audio Sampler
window.initSamplerUI = initSamplerUI;
window.loadSamplerPreset = loadSamplerPreset;
window.handleSamplerRootChange = handleSamplerRootChange;
window.toggleSamplerMicRecording = toggleSamplerMicRecording;
window.handleSamplerFileUpload = handleSamplerFileUpload;
window.updateSamplerTrim = updateSamplerTrim;
window.toggleSamplerLoop = toggleSamplerLoop;
window.toggleSamplerReverse = toggleSamplerReverse;
window.updateSamplerAdsr = updateSamplerAdsr;
window.updateSamplerFilter = updateSamplerFilter;
window.samplerNoteOn = samplerNoteOn;
window.samplerNoteOff = samplerNoteOff;

// Web MIDI & MPC Surface Globals
window.requestMidiAccess = requestMidiAccess;
window.handleMasterBpmChange = handleMasterBpmChange;
window.tapTempo = tapTempo;
window.handleGlobalInstrumentChange = handleGlobalInstrumentChange;
window.handleDrumKitChange = handleDrumKitChange;
window.renderMpcPads = renderMpcPads;
window.handleMpcBankChange = handleMpcBankChange;
window.handleMpcPadHit = handleMpcPadHit;
window.instrumentNoteOn = instrumentNoteOn;
window.instrumentNoteOff = instrumentNoteOff;
window.toggleSustainPedal = toggleSustainPedal;
window.toggleLegatoMode = toggleLegatoMode;
window.updateEngineSetting = updateEngineSetting;
window.renderInstrumentSettingsRack = renderInstrumentSettingsRack;
window.toggleRealSamples = toggleRealSamples;
window.toggleStudioRecording = toggleStudioRecording;
window.toggleTakePreview = toggleTakePreview;
window.downloadRecordedTake = downloadRecordedTake;
window.sendTakeToSampler = sendTakeToSampler;
window.sendTakeToSlicer = sendTakeToSlicer;
window.dismissRecordedTake = dismissRecordedTake;

// ============================================================================
// Multitrack Project Sequencer & MIDI Piano Roll Architecture
// ============================================================================

let editorActiveBar = 0; // 0, 1, 2, ... up to projectTransport.loopBars - 1
let editorCurrentView = 'drums'; // 'drums' | 'piano'

const DRUM_GRID_ROWS = [
  { key: 'kick_punchy', name: 'Kick Drum (Z)', color: 'var(--dds-viz-2)' },
  { key: 'snare_acoustic', name: 'Snare (C)', color: 'var(--dds-viz-1)' },
  { key: 'hat_closed', name: 'Closed Hat (D)', color: 'var(--dds-viz-6)' },
  { key: 'clap', name: 'Clap / Perc (V)', color: 'var(--dds-viz-5)' },
];

const PIANO_ROLL_NOTES = [
  { midi: 72, name: 'C5', isBlack: false },
  { midi: 71, name: 'B4', isBlack: false },
  { midi: 70, name: 'A#4', isBlack: true },
  { midi: 69, name: 'A4', isBlack: false },
  { midi: 68, name: 'G#4', isBlack: true },
  { midi: 67, name: 'G4', isBlack: false },
  { midi: 66, name: 'F#4', isBlack: true },
  { midi: 65, name: 'F4', isBlack: false },
  { midi: 64, name: 'E4', isBlack: false },
  { midi: 63, name: 'D#4', isBlack: true },
  { midi: 62, name: 'D4', isBlack: false },
  { midi: 61, name: 'C#4', isBlack: true },
  { midi: 60, name: 'C4', isBlack: false },
];

function renderDrumGrid() {
  const container = document.getElementById('drumGridRows');
  if (!container) return;

  const barStartStep = editorActiveBar * 16;
  let html = '';

  DRUM_GRID_ROWS.forEach((row) => {
    html += `<div class="drum-grid-row">
      <div class="drum-grid-label">
        <span class="lane-dot" style="background: ${row.color};"></span>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 4px; flex: 1;">${row.name}</span>
      </div>
      <div class="drum-grid-steps">`;

    for (let i = 0; i < 16; i++) {
      const stepIdx = barStartStep + i;
      const isHit = projectTransport.hasDrumStep(row.key, stepIdx);
      const isBeatStart = i % 4 === 0;
      const hitStyle = isHit 
        ? `background: ${row.color}; border-color: ${row.color}; color: var(--dds-ink-on-accent);` 
        : '';

      html += `<div 
        class="drum-grid-step ${isBeatStart ? 'beat-start' : ''} ${isHit ? 'active-hit' : ''}" 
        data-step="${stepIdx}" 
        data-channel="${row.key}"
        onclick="window.toggleDrumGridStep('${row.key}', ${stepIdx})"
        style="${hitStyle}"
        title="${row.name} - Step ${i + 1} (Absolute: ${stepIdx + 1})"
      >${i + 1}</div>`;
    }

    html += `</div></div>`;
  });

  container.innerHTML = html;
  updateActiveTrackEventCount();
}

function toggleDrumGridStep(soundKey, stepIdx) {
  projectTransport.toggleDrumStep(soundKey, stepIdx);
  if (projectTransport.hasDrumStep(soundKey, stepIdx)) {
    instrumentEngine.playDrumSound(soundKey);
  }
  renderDrumGrid();
}
window.toggleDrumGridStep = toggleDrumGridStep;

function renderPianoRoll() {
  const container = document.getElementById('pianoRollRows');
  if (!container) return;

  const barStartStep = editorActiveBar * 16;
  let html = '';

  PIANO_ROLL_NOTES.forEach((p) => {
    html += `<div class="piano-roll-row">
      <div class="piano-roll-key-label ${p.isBlack ? 'black-key' : 'white-key'}">
        <span>${p.name}</span>
        <span style="font-size: 0.6rem; opacity: 0.6;">${p.midi}</span>
      </div>
      <div class="piano-roll-steps">`;

    for (let i = 0; i < 16; i++) {
      const stepIdx = barStartStep + i;
      const isNote = projectTransport.hasPianoNote(stepIdx, p.midi);
      const isBeatStart = i % 4 === 0;

      html += `<div 
        class="piano-roll-cell ${isBeatStart ? 'beat-start' : ''} ${isNote ? 'active-note' : ''}" 
        data-step="${stepIdx}" 
        data-midi="${p.midi}"
        onclick="window.togglePianoRollNote(${stepIdx}, ${p.midi})"
        title="${p.name} (MIDI ${p.midi}) - Step ${i + 1}"
      ></div>`;
    }

    html += `</div></div>`;
  });

  container.innerHTML = html;
  updateActiveTrackEventCount();
}

function togglePianoRollNote(stepIdx, midi) {
  projectTransport.togglePianoNote(stepIdx, midi);
  renderPianoRoll();
}
window.togglePianoRollNote = togglePianoRollNote;

function switchEditorView(view) {
  editorCurrentView = view;
  const drumSec = document.getElementById('drumGridSection');
  const pianoSec = document.getElementById('pianoRollSection');
  const drumBtn = document.getElementById('editorViewDrumsBtn');
  const pianoBtn = document.getElementById('editorViewPianoBtn');

  if (view === 'drums') {
    if (drumSec) drumSec.style.display = 'block';
    if (pianoSec) pianoSec.style.display = 'none';
    setPressed(drumBtn, true);
    setPressed(pianoBtn, false);
    renderDrumGrid();
  } else {
    if (drumSec) drumSec.style.display = 'none';
    if (pianoSec) pianoSec.style.display = 'block';
    setPressed(pianoBtn, true);
    setPressed(drumBtn, false);
    renderPianoRoll();
  }
  updateActiveTrackEventCount();
}
window.switchEditorView = switchEditorView;

function setEditorActiveBar(barIdx) {
  editorActiveBar = Math.max(0, Math.min(projectTransport.loopBars - 1, Number(barIdx) || 0));
  document.querySelectorAll('.bar-select-btn').forEach((btn) => {
    setPressed(btn, Number(btn.getAttribute('data-bar')) === editorActiveBar);
  });

  if (editorCurrentView === 'drums') {
    renderDrumGrid();
  } else {
    renderPianoRoll();
  }
}
window.setEditorActiveBar = setEditorActiveBar;

function updateBarSelectorButtons() {
  const wrap = document.getElementById('editorBarSelectorWrap');
  if (!wrap) return;
  const bars = projectTransport.loopBars;
  let html = `<span class="field-label">Bar page</span>`;
  for (let b = 0; b < bars; b++) {
    const isActive = b === editorActiveBar;
    html += `<button type="button" class="btn btn-sm bar-select-btn${isActive ? ' active' : ''}" aria-pressed="${isActive}" data-bar="${b}" onclick="window.setEditorActiveBar(${b})">Bar ${b + 1}</button>`;
  }
  wrap.innerHTML = html;
}

function updateActiveTrackEventCount() {
  const countEl = document.getElementById('activeTrackEventCount');
  if (!countEl) return;
  const pianoEvents = projectTransport.tracks.piano ? projectTransport.tracks.piano.length : 0;
  const drumEvents = projectTransport.tracks.drums ? projectTransport.tracks.drums.length : 0;
  countEl.textContent = `Piano: ${pianoEvents} notes • Drums: ${drumEvents} hits (${projectTransport.totalSteps} steps total)`;
}

function toggleTrackMute(trackId) {
  const isMuted = projectTransport.toggleTrackMute(trackId);
  const labelEl = document.getElementById(`${trackId}MuteLabel`);
  if (labelEl) {
    labelEl.textContent = isMuted ? 'muted' : 'on';
    labelEl.className = isMuted ? 'state-off' : 'state-on';
  }
}
window.toggleTrackMute = toggleTrackMute;

function quantizeCurrentTrack() {
  projectTransport.quantizeTrack(projectTransport.armedTrack);
  if (editorCurrentView === 'drums') renderDrumGrid();
  else renderPianoRoll();
  showToast(`Quantized ${projectTransport.armedTrack} track to 1/16th grid`, 'success');
}
window.quantizeCurrentTrack = quantizeCurrentTrack;

function clearCurrentTrack() {
  projectTransport.clearTrack(projectTransport.armedTrack);
  if (editorCurrentView === 'drums') renderDrumGrid();
  else renderPianoRoll();
  showToast(`Cleared ${projectTransport.armedTrack} track`, 'info');
}
window.clearCurrentTrack = clearCurrentTrack;

function openCalculatorsDirectly(e) {
  if (e && e.preventDefault) e.preventDefault();
  window.switchTheoryTab('calculators');
  const calcEl = document.getElementById('calculatorsView');
  if (calcEl) {
    calcEl.scrollIntoView({ behavior: 'smooth' });
  }
}
window.openCalculatorsDirectly = openCalculatorsDirectly;

function initProjectTransportWireup() {
  projectTransport.subscribe((event, data) => {
    if (event === 'step') {
      const barEl = document.getElementById('playheadBarDisplay');
      const beatEl = document.getElementById('playheadBeatDisplay');
      const stepEl = document.getElementById('playheadStepDisplay');
      if (barEl) barEl.textContent = data.bar;
      if (beatEl) beatEl.textContent = data.beat;
      if (stepEl) stepEl.textContent = String((data.step % 16) + 1).padStart(2, '0');

      // Grid active step column sweep
      const stepIdx = data.step;
      const stepBar = Math.floor(stepIdx / 16);
      if (stepBar === editorActiveBar) {
        document.querySelectorAll('.drum-grid-step.current').forEach((el) => el.classList.remove('current'));
        document.querySelectorAll(`.drum-grid-step[data-step="${stepIdx}"]`).forEach((el) => el.classList.add('current'));

        document.querySelectorAll('.piano-roll-cell.current').forEach((el) => el.classList.remove('current'));
        document.querySelectorAll(`.piano-roll-cell[data-step="${stepIdx}"]`).forEach((el) => el.classList.add('current'));
      }
    } else if (event === 'playState') {
      const playBtn = document.getElementById('projectPlayBtn');
      const recBtn = document.getElementById('projectRecBtn');
      if (playBtn) {
        playBtn.classList.toggle('is-playing', data.isPlaying);
        playBtn.setAttribute('aria-pressed', String(data.isPlaying));
        if (data.isPlaying) {
          playBtn.innerHTML = `${icon('pause')}Pause`;
        } else {
          playBtn.innerHTML = `${icon('play')}Play`;
          document.querySelectorAll('.drum-grid-step.current, .piano-roll-cell.current').forEach((el) => el.classList.remove('current'));
        }
      }
      if (recBtn && !data.isRecording) setPressed(recBtn, false);
    } else if (event === 'recordState') {
      const recBtn = document.getElementById('projectRecBtn');
      if (recBtn) {
        setPressed(recBtn, data.isRecording);
      }
    } else if (event === 'bpm') {
      handleMasterBpmChange(data.bpm);
    } else if (event === 'loopBars') {
      updateBarSelectorButtons();
      renderDrumGrid();
      renderPianoRoll();
    } else if (event === 'armedTrack') {
      const pianoBtn = document.getElementById('armPianoTrackBtn');
      const drumsBtn = document.getElementById('armDrumsTrackBtn');
      setPressed(pianoBtn, data.armedTrack === 'piano');
      setPressed(drumsBtn, data.armedTrack !== 'piano');
    } else if (event === 'metronome') {
      const metroLabel = document.getElementById('projectMetroLabel');
      const metroBtn = document.getElementById('projectMetroBtn');
      if (metroLabel) {
        metroLabel.textContent = data.enabled ? 'on' : 'off';
        metroLabel.className = data.enabled ? 'state-on' : 'state-off';
      }
      setPressed(metroBtn, data.enabled);
    } else if (event === 'countInTick') {
      const countEl = document.getElementById('projectCountInBadge');
      if (countEl) {
        countEl.textContent = `Count-in: beat ${data.beat} / ${data.total}`;
        countEl.classList.add('is-counting');
      }
    } else if (event === 'countInFinished') {
      const countEl = document.getElementById('projectCountInBadge');
      if (countEl) {
        countEl.textContent = '1-bar count-in';
        countEl.classList.remove('is-counting');
      }
    } else if (event === 'trackUpdated') {
      if (editorCurrentView === 'drums') renderDrumGrid();
      else renderPianoRoll();
      updateActiveTrackEventCount();
    }
  });

  renderDrumGrid();
  renderPianoRoll();
  updateBarSelectorButtons();
  updateActiveTrackEventCount();
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  renderMpcPads();
  fetchBeatCatalog();
  initTheoryTools();
  renderInstrumentSettingsRack();
  loadDemoBreakbeat(); // Pre-slice demo breakbeat for immediate Bank B slice auditioning
  initProjectTransportWireup();

  // Instant Audio Unlock on first user gesture
  const unlockAudio = () => {
    const ctx = instrumentEngine.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    sampleEngine.preloadInstrument('grand_piano');
    sampleEngine.preloadInstrument('steel_acoustic');
    sampleEngine.preloadAcousticDrums();
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  // Preload real studio multi-samples for piano, guitar & acoustic drum kit
  sampleEngine.preloadInstrument('grand_piano');
  sampleEngine.preloadInstrument('steel_acoustic');
  sampleEngine.preloadAcousticDrums();
  sampleEngine.onStatusChange(() => {
    renderInstrumentSettingsRack();
  });

  updateDelayCalculations(120);
  runPitchShiftCalc();
  runRoomModesCalc();
  init808Designer();
  initSamplerUI();
  initStudioShell();
  initStaffCommandPalette();

  // Route to calculators if hash matches #calculators
  if (window.location.hash === '#calculators') {
    setTimeout(() => openCalculatorsDirectly(), 150);
  }

  // Auto-listen if Web MIDI was previously granted
  if (navigator.requestMIDIAccess) {
    navigator.permissions?.query({ name: 'midi', sysex: false }).then((perm) => {
      if (perm.state === 'granted') {
        requestMidiAccess();
      }
    }).catch(() => {});
  }
});

