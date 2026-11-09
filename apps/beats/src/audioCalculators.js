/**
 * Dangling Beats Studio™ — Audio Engineering & Mixing Calculators Engine
 * Phase 2: Delay/Reverb Timing, Sample Pitch/Tempo Shift, and Room Acoustic Modes.
 */

// Global AudioContext for calculator audition ticks and tones
let calcAudioCtx = null;

function getCalcAudioContext() {
  if (!calcAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    calcAudioCtx = new AudioCtx();
  }
  if (calcAudioCtx.state === 'suspended') {
    calcAudioCtx.resume();
  }
  return calcAudioCtx;
}

// -------------------------------------------------------------
// 1. DELAY & REVERB TIMING CALCULATOR
// -------------------------------------------------------------

export const NOTE_DIVISIONS = [
  { name: '1/1 Whole Note', factor: 4 },
  { name: '1/2 Half Note', factor: 2 },
  { name: '1/4 Quarter Note', factor: 1 },
  { name: '1/8 Eighth Note', factor: 0.5 },
  { name: '1/16 Sixteenth Note', factor: 0.25 },
  { name: '1/32 Thirty-Second Note', factor: 0.125 },
  { name: '1/64 Sixty-Fourth Note', factor: 0.0625 },
];

/**
 * Calculates standard, dotted (1.5x), and triplet (0.6667x) delay times
 * in milliseconds and equivalent LFO rates in Hertz.
 * Base quarter-note ms = 60,000 / BPM
 */
export function calculateDelayTimes(bpm = 120) {
  const safeBpm = Math.max(20, Math.min(400, Number(bpm) || 120));
  const quarterMs = 60000 / safeBpm;

  return NOTE_DIVISIONS.map((div) => {
    const standardMs = quarterMs * div.factor;
    const dottedMs = standardMs * 1.5;
    const tripletMs = standardMs * (2 / 3);

    return {
      name: div.name,
      standard: {
        ms: Math.round(standardMs * 100) / 100,
        hz: Math.round((1000 / standardMs) * 100) / 100,
      },
      dotted: {
        ms: Math.round(dottedMs * 100) / 100,
        hz: Math.round((1000 / dottedMs) * 100) / 100,
      },
      triplet: {
        ms: Math.round(tripletMs * 100) / 100,
        hz: Math.round((1000 / tripletMs) * 100) / 100,
      },
    };
  });
}

/**
 * Calculates recommended reverb pre-delays and decay decay times
 * mapped to tempo and room style.
 */
export function calculateReverbTimings(bpm = 120) {
  const safeBpm = Math.max(20, Math.min(400, Number(bpm) || 120));
  const quarterMs = 60000 / safeBpm;

  return [
    {
      type: 'Tight Drum Room / Ambience',
      preDelayMs: Math.round((quarterMs / 16) * 100) / 100, // 1/64
      decayMs: Math.round(quarterMs * 0.5), // 1/8 note decay
      desc: 'Adds upfront air without washing out fast transients.',
    },
    {
      type: 'Vocal Plate',
      preDelayMs: Math.round((quarterMs / 8) * 100) / 100, // 1/32
      decayMs: Math.round(quarterMs * 2), // 1/2 note decay
      desc: 'Allows clean vocal consonants before lush diffusion kicks in.',
    },
    {
      type: 'Lead Synth / Snare Hall',
      preDelayMs: Math.round((quarterMs / 4) * 100) / 100, // 1/16
      decayMs: Math.round(quarterMs * 4), // 1 bar decay
      desc: 'Creates cinematic depth and dramatic tail in breakdowns.',
    },
    {
      type: 'Cathedral / Ethereal Ambient',
      preDelayMs: Math.round((quarterMs / 2) * 100) / 100, // 1/8
      decayMs: Math.round(quarterMs * 8), // 2 bars decay
      desc: 'Huge expansive wash for pads, cinematic strings, and drone textures.',
    },
  ];
}

/**
 * Audition a delay rhythm using Web Audio oscillator click ping
 */
let delayPreviewInterval = null;
export function auditionDelayTick(ms, repetitions = 4) {
  stopAuditionDelay();
  const ctx = getCalcAudioContext();
  let count = 0;

  const playClick = (isFirst) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isFirst ? 880 : 440, ctx.currentTime);

    gain.gain.setValueAtTime(isFirst ? 0.25 : 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  };

  playClick(true);
  count++;

  delayPreviewInterval = setInterval(() => {
    if (count >= repetitions) {
      stopAuditionDelay();
      return;
    }
    playClick(false);
    count++;
  }, ms);
}

export function stopAuditionDelay() {
  if (delayPreviewInterval) {
    clearInterval(delayPreviewInterval);
    delayPreviewInterval = null;
  }
}

// -------------------------------------------------------------
// 2. SAMPLE PITCH-TO-TEMPO / KEY-SHIFT CALCULATOR
// -------------------------------------------------------------

/**
 * Given Source BPM and Target BPM, calculates semitones and cents required
 * Semitones = 12 * log2(Target / Source)
 */
export function calculatePitchShiftByBpm(sourceBpm, targetBpm) {
  const s = Math.max(1, Number(sourceBpm) || 120);
  const t = Math.max(1, Number(targetBpm) || 120);

  const ratio = t / s;
  const semitones = 12 * Math.log2(ratio);
  const cents = Math.round((semitones % 1) * 100);
  const wholeSemitones = Math.trunc(semitones);
  const playbackPercent = Math.round(ratio * 10000) / 100;

  return {
    sourceBpm: s,
    targetBpm: t,
    ratio: Math.round(ratio * 10000) / 10000,
    playbackPercent,
    semitones: Math.round(semitones * 100) / 100,
    wholeSemitones,
    cents,
    isSpeedUp: t > s,
    summary:
      t === s
        ? 'Identical tempos — no pitch shift or time-stretch needed.'
        : `${t > s ? 'Pitch UP' : 'Pitch DOWN'} by ${Math.abs(Math.round(semitones * 100) / 100)} semitones (${Math.abs(Math.round(semitones * 100))} cents) to match ${t} BPM.`,
  };
}

/**
 * Given a semitone shift, calculates the new resulting tempo from a base BPM
 * Target BPM = Source BPM * 2^(semitones / 12)
 */
export function calculateBpmBySemitones(sourceBpm, semitones) {
  const s = Math.max(1, Number(sourceBpm) || 120);
  const semi = Number(semitones) || 0;
  const ratio = Math.pow(2, semi / 12);
  const targetBpm = Math.round(s * ratio * 100) / 100;
  return {
    sourceBpm: s,
    semitones: semi,
    ratio: Math.round(ratio * 10000) / 10000,
    targetBpm,
  };
}

/**
 * Calculate length change for a sample of known duration
 */
export function calculateSampleLength(originalSeconds, sourceBpm, targetBpm) {
  const orig = Math.max(0.1, Number(originalSeconds) || 4);
  const s = Math.max(1, Number(sourceBpm) || 120);
  const t = Math.max(1, Number(targetBpm) || 120);
  const newSeconds = orig * (s / t);
  return Math.round(newSeconds * 1000) / 1000;
}

/**
 * Play a synthesized demonstration tone shifted by N semitones
 */
export function auditionPitchShift(semitones = 0) {
  const ctx = getCalcAudioContext();
  const baseFreq = 261.63; // Middle C (C4)
  const shiftedFreq = baseFreq * Math.pow(2, semitones / 12);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(shiftedFreq, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.85);
}

// -------------------------------------------------------------
// 3. SUB-BASS & ROOM ACOUSTIC STANDING WAVE ESTIMATOR
// -------------------------------------------------------------

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Maps frequency in Hz to closest musical note name, octave, and detuning cents
 */
export function hzToMusicalNote(hz) {
  if (hz <= 0) return { note: 'N/A', octave: 0, cents: 0, formatted: 'N/A' };
  const midi = 69 + 12 * Math.log2(hz / 440);
  const roundedMidi = Math.round(midi);
  const cents = Math.round((midi - roundedMidi) * 100);
  const noteName = NOTE_NAMES[((roundedMidi % 12) + 12) % 12];
  const octave = Math.floor(roundedMidi / 12) - 1;
  const sign = cents >= 0 ? '+' : '';

  return {
    note: noteName,
    octave,
    cents,
    formatted: `${noteName}${octave} (${sign}${cents}¢)`,
  };
}

/**
 * Calculates axial room modes for Length, Width, Height up to 4th harmonic
 * Formula: f = (c / 2) * (n / Dimension)
 * Speed of sound c = 343 m/s (1125.33 ft/s)
 */
export function calculateRoomModes(length, width, height, unit = 'feet') {
  const c = unit === 'meters' ? 343 : 1125.33; // speed of sound
  const l = Math.max(1, Number(length) || 14);
  const w = Math.max(1, Number(width) || 11);
  const h = Math.max(1, Number(height) || 8);

  // Fundamental Axial Modes (1st to 4th harmonics)
  const dimensions = [
    { name: 'Length (Axial)', dim: l, key: 'length' },
    { name: 'Width (Axial)', dim: w, key: 'width' },
    { name: 'Height (Axial)', dim: h, key: 'height' },
  ];

  const modes = [];

  dimensions.forEach((d) => {
    for (let harmonic = 1; harmonic <= 4; harmonic++) {
      const hz = (c / 2) * (harmonic / d.dim);
      if (hz <= 300) {
        // Bass critical range is 20Hz - 300Hz
        const note = hzToMusicalNote(hz);
        modes.push({
          dimension: d.name,
          harmonic: `${harmonic}${getOrdinal(harmonic)}`,
          dimensionValue: d.dim,
          unit,
          hz: Math.round(hz * 10) / 10,
          note: note.formatted,
          rawHz: hz,
        });
      }
    }
  });

  // Sort by frequency ascending
  modes.sort((a, b) => a.rawHz - b.rawHz);

  // Check for severe modal stacking / danger zones (frequencies within 2Hz of each other)
  const dangerZones = [];
  for (let i = 0; i < modes.length - 1; i++) {
    const diff = Math.abs(modes[i].rawHz - modes[i + 1].rawHz);
    if (diff < 2.5) {
      dangerZones.push({
        freqA: modes[i].hz,
        freqB: modes[i + 1].hz,
        source: `${modes[i].dimension} & ${modes[i + 1].dimension}`,
        note: modes[i].note,
        message: `Severe resonance buildup around ${Math.round((modes[i].hz + modes[i + 1].hz) / 2)} Hz. Place bass traps in corners.`,
      });
    }
  }

  // Room Proportions Assessment (Bolt Area heuristic)
  const lwRatio = Math.round((l / w) * 100) / 100;
  const lhRatio = Math.round((l / h) * 100) / 100;
  const isSquare = Math.abs(l - w) < 0.2 || Math.abs(w - h) < 0.2 || Math.abs(l - h) < 0.2;
  const isMultiple = Math.abs((l % w) - 0) < 0.2 || Math.abs((l % h) - 0) < 0.2;

  let assessment = 'Good acoustic dimension distribution.';
  if (isSquare) {
    assessment = '⚠️ Square or Cube dimensions detected! High risk of extreme acoustic standing waves and cancellation nulls.';
  } else if (isMultiple) {
    assessment = '⚠️ Harmonic ratio alert: One dimension is a direct multiple of another. Expect modal stacking in low sub-bass.';
  }

  return {
    modes,
    dangerZones,
    assessment,
    lwRatio,
    lhRatio,
    volumeCuFt: unit === 'feet' ? Math.round(l * w * h) : Math.round(l * w * h * 35.3147),
  };
}

function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Audition a sub-bass sine tone at target room frequency
 */
export function auditionSubTone(hz = 60) {
  const ctx = getCalcAudioContext();
  const safeHz = Math.max(20, Math.min(300, Number(hz) || 60));

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(safeHz, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 1.25);
}

