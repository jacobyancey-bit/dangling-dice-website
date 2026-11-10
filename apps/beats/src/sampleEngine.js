/**
 * ============================================================================
 * Dangling Beats Studio™ — Real Instrument Multi-Sample Engine
 * High-fidelity acoustic & electric instrument multi-sampling via Web Audio.
 * 
 * Provides studio-recorded sample playback for acoustic pianos, guitars,
 * bass, strings, and acoustic drums, while keeping 808 & 909 kits on
 * organic analog oscillator synthesis.
 * ============================================================================
 */

const SOUNDFONT_BASE_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM';
const DRUMS_BASE_URL = 'https://tonejs.github.io/audio/drum-samples/acoustic-kit';
const WESBOS_BASE_URL = 'https://raw.githubusercontent.com/wesbos/JavaScript30/master/01%20-%20JavaScript%20Drum%20Kit/sounds';

export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function midiToNoteNameFlat(midi) {
  const semi = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES_FLAT[semi]}${octave}`;
}

export function noteNameToMidiFlat(name) {
  const match = name.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return 60;
  let [, note, oct] = match;
  if (note === 'C#' || note === 'Db') note = 'Db';
  else if (note === 'D#' || note === 'Eb') note = 'Eb';
  else if (note === 'F#' || note === 'Gb') note = 'Gb';
  else if (note === 'G#' || note === 'Ab') note = 'Ab';
  else if (note === 'A#' || note === 'Bb') note = 'Bb';
  const semi = NOTE_NAMES_FLAT.indexOf(note);
  return (parseInt(oct, 10) + 1) * 12 + semi;
}

export const INSTRUMENT_SOUNDFONT_MAP = {
  // Pianos & Keyboards
  grand_piano: 'acoustic_grand_piano-mp3',
  acoustic_grand: 'acoustic_grand_piano-mp3',
  piano: 'acoustic_grand_piano-mp3',
  upright_piano: 'honkytonk_piano-mp3',
  rhodes_mark1: 'electric_piano_1-mp3',
  wurlitzer_200a: 'electric_piano_2-mp3',
  harpsichord: 'harpsichord-mp3',
  toy_piano: 'music_box-mp3',
  church_organ: 'church_organ-mp3',

  // Guitars & Plucked Strings
  steel_acoustic: 'acoustic_guitar_steel-mp3',
  acoustic_guitar: 'acoustic_guitar_steel-mp3',
  guitar: 'acoustic_guitar_steel-mp3',
  classical_guitar: 'acoustic_guitar_nylon-mp3',
  nylon_guitar: 'acoustic_guitar_nylon-mp3',
  electric_clean: 'electric_guitar_clean-mp3',
  rock_overdrive: 'overdriven_guitar-mp3',
  palm_mute: 'electric_guitar_muted-mp3',
  mandolin: 'banjo-mp3',
  electric_bass: 'electric_bass_finger-mp3',
  bass: 'electric_bass_finger-mp3',
};

export const ACOUSTIC_DRUM_SAMPLE_MAP = {
  // Kicks
  kick_acoustic: `${DRUMS_BASE_URL}/kick.mp3`,
  acoustic_kick: `${DRUMS_BASE_URL}/kick.mp3`,
  kick: `${DRUMS_BASE_URL}/kick.mp3`,

  // Snares & Claps
  snare_acoustic: `${DRUMS_BASE_URL}/snare.mp3`,
  acoustic_snare: `${DRUMS_BASE_URL}/snare.mp3`,
  snare: `${DRUMS_BASE_URL}/snare.mp3`,
  snare_rim: `${WESBOS_BASE_URL}/snare.wav`,
  sidestick: `${SOUNDFONT_BASE_URL}/woodblock-mp3/C5.mp3`,
  clap_acoustic: `${WESBOS_BASE_URL}/clap.wav`,

  // Hi-Hats
  hat_closed: `${DRUMS_BASE_URL}/hihat.mp3`,
  hat_pedal: `${WESBOS_BASE_URL}/hihat.wav`,
  hat_open: `${WESBOS_BASE_URL}/openhat.wav`,

  // Toms
  tom_high: `${DRUMS_BASE_URL}/tom1.mp3`,
  tom_mid: `${DRUMS_BASE_URL}/tom2.mp3`,
  tom_floor: `${DRUMS_BASE_URL}/tom3.mp3`,

  // Cymbals
  crash_acoustic: `${WESBOS_BASE_URL}/ride.wav`,
  ride_acoustic: `${WESBOS_BASE_URL}/ride.wav`,
  ride_bell: `${WESBOS_BASE_URL}/tink.wav`,
  china_acoustic: `${SOUNDFONT_BASE_URL}/reverse_cymbal-mp3/C4.mp3`,
  splash_acoustic: `${WESBOS_BASE_URL}/ride.wav`,

  // Percussion
  cowbell_real: `${SOUNDFONT_BASE_URL}/tinkle_bell-mp3/C5.mp3`,
  tambourine: `${SOUNDFONT_BASE_URL}/tinkle_bell-mp3/G5.mp3`,
};

class MultiSampleEngine {
  constructor() {
    this.ctx = null;
    this.sampleCache = new Map(); // key -> AudioBuffer
    this.loadingPromises = new Map(); // key -> Promise
    this.useRealSamples = true; // User preference toggle
    this.instrumentStatus = new Map(); // instId -> 'idle' | 'loading' | 'ready'
    this.statusListeners = new Set();
  }

  setAudioContext(ctx) {
    this.ctx = ctx;
  }

  getAudioContext() {
    if (!this.ctx) {
      if (typeof window !== 'undefined' && window.__SHARED_AUDIO_CTX__) {
        this.ctx = window.__SHARED_AUDIO_CTX__;
      } else {
        const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          if (typeof window !== 'undefined') window.__SHARED_AUDIO_CTX__ = this.ctx;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  onStatusChange(fn) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  notifyStatus(instId, status) {
    this.instrumentStatus.set(instId, status);
    this.statusListeners.forEach((fn) => {
      try {
        fn(instId, status);
      } catch (e) {
        console.error(e);
      }
    });
  }

  getInstrumentStatus(instId) {
    return this.instrumentStatus.get(instId) || 'idle';
  }

  setUseRealSamples(enabled) {
    this.useRealSamples = !!enabled;
  }

  /**
   * Preloads key notes around middle C for instant responsiveness
   */
  async preloadInstrument(instId) {
    const soundfont = INSTRUMENT_SOUNDFONT_MAP[instId];
    if (!soundfont) return; // 808/909 stay on organic synthesis

    if (this.instrumentStatus.get(instId) === 'ready') return;
    this.notifyStatus(instId, 'loading');

    // Key multi-sample anchor notes: C2 to C6
    const anchorNotes = [
      'C2', 'E2', 'G2', 'B2',
      'C3', 'E3', 'G3', 'B3',
      'C4', 'E4', 'G4', 'B4',
      'C5', 'E5', 'G5', 'B5',
      'C6',
    ];

    try {
      await Promise.allSettled(
        anchorNotes.map((note) => this.fetchAndDecodeNote(soundfont, note))
      );
      this.notifyStatus(instId, 'ready');
    } catch (err) {
      console.warn(`[MultiSampleEngine] Preload notice for ${instId}:`, err);
      this.notifyStatus(instId, 'ready');
    }
  }

  /**
   * Preloads acoustic drum one-shots
   */
  async preloadAcousticDrums() {
    const keys = Object.keys(ACOUSTIC_DRUM_SAMPLE_MAP);
    await Promise.allSettled(
      keys.map((k) => this.fetchAndDecodeDrum(k, ACOUSTIC_DRUM_SAMPLE_MAP[k]))
    );
  }

  async fetchAndDecodeDrum(soundKey, url) {
    const cacheKey = `drum:${soundKey}`;
    if (this.sampleCache.has(cacheKey)) return this.sampleCache.get(cacheKey);
    if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey);

    const promise = (async () => {
      try {
        const ctx = this.getAudioContext();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        this.sampleCache.set(cacheKey, audioBuf);
        return audioBuf;
      } catch (err) {
        console.warn(`[MultiSampleEngine] Drum sample fetch fallback for ${soundKey}:`, err.message);
        return null;
      } finally {
        this.loadingPromises.delete(cacheKey);
      }
    })();

    this.loadingPromises.set(cacheKey, promise);
    return promise;
  }

  async fetchAndDecodeNote(soundfont, noteName) {
    const cacheKey = `${soundfont}/${noteName}`;
    if (this.sampleCache.has(cacheKey)) return this.sampleCache.get(cacheKey);
    if (this.loadingPromises.has(cacheKey)) return this.loadingPromises.get(cacheKey);

    const promise = (async () => {
      try {
        const ctx = this.getAudioContext();
        const url = `${SOUNDFONT_BASE_URL}/${soundfont}/${noteName}.mp3`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(arrayBuf);
        audioBuf.rootMidi = noteNameToMidiFlat(noteName);
        audioBuf.noteName = noteName;
        this.sampleCache.set(cacheKey, audioBuf);
        return audioBuf;
      } catch (err) {
        // Individual note fetch error - non-critical, nearest neighbor pitch shifting will cover it
        return null;
      } finally {
        this.loadingPromises.delete(cacheKey);
      }
    })();

    this.loadingPromises.set(cacheKey, promise);
    return promise;
  }

  /**
   * Retrieves the best real multi-sample for a given instrument & MIDI pitch
   * Returns: { buffer, playbackRate, isExact } or null
   */
  getSampleForNote(instId, midiNote) {
    if (!this.useRealSamples) return null;

    const soundfont = INSTRUMENT_SOUNDFONT_MAP[instId];
    if (!soundfont) return null; // 808/909 stay on organic synthesis

    const exactName = midiToNoteNameFlat(midiNote);
    const exactKey = `${soundfont}/${exactName}`;

    // 1. Exact match cached
    if (this.sampleCache.has(exactKey)) {
      return {
        buffer: this.sampleCache.get(exactKey),
        playbackRate: 1.0,
        isExact: true,
        rootMidi: midiNote,
      };
    }

    // 2. Fetch exact note in background for subsequent notes
    this.fetchAndDecodeNote(soundfont, exactName).then((buf) => {
      if (buf) this.notifyStatus(instId, 'ready');
    });

    // 3. Find closest loaded root pitch in this soundfont
    let closestBuffer = null;
    let minDistance = Infinity;

    for (const [key, buffer] of this.sampleCache.entries()) {
      if (key.startsWith(`${soundfont}/`) && buffer.rootMidi !== undefined) {
        const dist = Math.abs(buffer.rootMidi - midiNote);
        if (dist < minDistance) {
          minDistance = dist;
          closestBuffer = buffer;
        }
      }
    }

    // If a nearby sample is loaded (within 12 semitones / 1 octave)
    if (closestBuffer && minDistance <= 12) {
      const semitoneDiff = midiNote - closestBuffer.rootMidi;
      const playbackRate = Math.pow(2, semitoneDiff / 12);
      return {
        buffer: closestBuffer,
        playbackRate,
        isExact: false,
        rootMidi: closestBuffer.rootMidi,
      };
    }

    // 4. If nothing cached yet, trigger preload and return null for instant synth fallback
    this.preloadInstrument(instId);
    return null;
  }

  /**
   * Retrieves an acoustic drum one-shot buffer if loaded, with alias matching & lazy preloading
   */
  getAcousticDrumSample(soundKey) {
    if (!this.useRealSamples) return null;
    const key = (soundKey || '').toLowerCase();
    const cacheKey = `drum:${key}`;
    if (this.sampleCache.has(cacheKey)) return this.sampleCache.get(cacheKey);

    // If alias or direct key exists in ACOUSTIC_DRUM_SAMPLE_MAP
    if (ACOUSTIC_DRUM_SAMPLE_MAP[key]) {
      const targetUrl = ACOUSTIC_DRUM_SAMPLE_MAP[key];
      // Search if this URL was already cached under another key
      for (const [k, buf] of this.sampleCache.entries()) {
        if (k.startsWith('drum:')) {
          const mapKey = k.replace('drum:', '');
          if (ACOUSTIC_DRUM_SAMPLE_MAP[mapKey] === targetUrl) {
            this.sampleCache.set(cacheKey, buf);
            return buf;
          }
        }
      }
      // If not yet cached, fetch in background for future hits
      this.fetchAndDecodeDrum(key, targetUrl);
    }
    return null;
  }
}

export const sampleEngine = new MultiSampleEngine();

