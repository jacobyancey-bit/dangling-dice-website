/**
 * Dangling Beats Studio™ — Interactive Beatmaking & Idea Starters
 * Phase 4: Euclidean Polyrhythm Sequencer & 808 Sub Synthesizer Designer
 */

import { encodeStandardMidiFile } from './theoryEngine.js';
import { audioBufferToWav } from './sampleChopper.js';
import { instrumentEngine } from './instrumentEngine.js';

function getSynthAudioContext() {
  return instrumentEngine.getAudioContext();
}

// -------------------------------------------------------------
// 1. BJORKLUND EUCLIDEAN ALGORITHM
// -------------------------------------------------------------

/**
 * Computes Bjorklund Euclidean rhythm array of 0s and 1s
 * steps: total steps in cycle (e.g. 16)
 * pulses: number of hits to distribute evenly (e.g. 5)
 */
export function calculateEuclideanPattern(steps = 16, pulses = 5) {
  const safeSteps = Math.max(2, Math.min(64, Math.floor(steps) || 16));
  const safePulses = Math.max(0, Math.min(safeSteps, Math.floor(pulses) || 0));

  if (safePulses === 0) return new Array(safeSteps).fill(0);
  if (safePulses === safeSteps) return new Array(safeSteps).fill(1);

  let pattern = [];
  let counts = [];
  let remainders = [];
  let divisor = safeSteps - safePulses;
  remainders.push(safePulses);
  let level = 0;

  while (true) {
    counts.push(Math.floor(divisor / remainders[level]));
    remainders.push(divisor % remainders[level]);
    divisor = remainders[level];
    level++;
    if (remainders[level] <= 1) break;
  }
  counts.push(divisor);

  const build = (l) => {
    if (l === -1) {
      pattern.push(0);
    } else if (l === -2) {
      pattern.push(1);
    } else {
      for (let i = 0; i < counts[l]; i++) {
        build(l - 1);
      }
      if (remainders[l] !== 0) {
        build(l - 2);
      }
    }
  };

  build(level);
  return pattern.slice(0, safeSteps);
}

// -------------------------------------------------------------
// 2. SYNTHESIZED DRUM INSTRUMENTS
// -------------------------------------------------------------

/**
 * Realtime Drum Synthesis for Euclidean Tracks
 */
export function playSynthesizedDrum(type = 'kick', timeOffset = 0) {
  const ctx = getSynthAudioContext();
  const t = ctx.currentTime + timeOffset;

  if (type === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } else if (type === 'snare') {
    // Noise + tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);

    const bufferSize = ctx.sampleRate * 0.18;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
  } else if (type === 'hat') {
    const bufferSize = ctx.sampleRate * 0.05;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  } else if (type === 'perc') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }
}

/**
 * Generate Standard MIDI File binary for the Euclidean pattern
 */
export function generateEuclideanMidi(tracks, bpm = 120) {
  // General MIDI Drum Pitches: Kick = 36 (C1), Snare = 38 (D1), Closed Hat = 42 (F#1), Perc/Cowbell = 56 (G#2)
  const drumPitchMap = {
    kick: 36,
    snare: 38,
    hat: 42,
    perc: 56,
  };

  const sixteenthDurationTicks = 120; // 480 PPQ / 4 = 16th note
  const midiEvents = [];

  // Group events by time
  const maxSteps = Math.max(...tracks.map((tr) => tr.steps));

  for (let s = 0; s < maxSteps; s++) {
    const notesInStep = [];
    tracks.forEach((tr) => {
      const stepIndex = s % tr.steps;
      if (tr.pattern[stepIndex] === 1) {
        notesInStep.push(drumPitchMap[tr.type] || 36);
      }
    });

    if (notesInStep.length > 0) {
      midiEvents.push({
        pitches: notesInStep,
        durationTicks: sixteenthDurationTicks,
      });
    } else {
      // Rest
      midiEvents.push({
        pitches: [],
        durationTicks: sixteenthDurationTicks,
      });
    }
  }

  return encodeStandardMidiFile(midiEvents, bpm);
}

// -------------------------------------------------------------
// 3. 808 & SUB SYNTHESIZER DESIGNER
// -------------------------------------------------------------

export const ROOT_SUB_NOTES = [
  { note: 'C0', freq: 16.35, midi: 12 },
  { note: 'C#0', freq: 17.32, midi: 13 },
  { note: 'D0', freq: 18.35, midi: 14 },
  { note: 'D#0', freq: 19.45, midi: 15 },
  { note: 'E0', freq: 20.6, midi: 16 },
  { note: 'F0', freq: 21.83, midi: 17 },
  { note: 'F#0', freq: 23.12, midi: 18 },
  { note: 'G0', freq: 24.5, midi: 19 },
  { note: 'G#0', freq: 25.96, midi: 20 },
  { note: 'A0', freq: 27.5, midi: 21 },
  { note: 'A#0', freq: 29.14, midi: 22 },
  { note: 'B0', freq: 30.87, midi: 23 },
  { note: 'C1', freq: 32.7, midi: 24 },
  { note: 'C#1', freq: 34.65, midi: 25 },
  { note: 'D1', freq: 36.71, midi: 26 },
  { note: 'D#1', freq: 38.89, midi: 27 },
  { note: 'E1', freq: 41.2, midi: 28 },
  { note: 'F1', freq: 43.65, midi: 29 },
  { note: 'F#1', freq: 46.25, midi: 30 },
  { note: 'G1', freq: 49.0, midi: 31 },
  { note: 'G#1', freq: 51.91, midi: 32 },
  { note: 'A1', freq: 55.0, midi: 33 },
  { note: 'A#1', freq: 58.27, midi: 34 },
  { note: 'B1', freq: 61.74, midi: 35 },
];

/**
 * Distortion curve for saturation / warmth
 */
function makeDistortionCurve(amount = 20) {
  const k = typeof amount === 'number' ? amount : 20;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Audition 808 in real-time
 */
let active808Nodes = [];

export function play808Sub(params) {
  stop808Sub();
  const ctx = getSynthAudioContext();
  const p = normalize808Params(params);
  const t = ctx.currentTime;

  // Pitch Drop Envelope
  const osc = ctx.createOscillator();
  osc.type = p.waveform;
  const startFreq = p.rootFreq * Math.pow(2, p.glideSemitones / 12);
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(p.rootFreq, t + p.glideMs / 1000);

  // Saturation Waveshaper
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(p.drive * 40);
  shaper.oversample = '4x';

  // Amplitude Envelope
  const ampGain = ctx.createGain();
  ampGain.gain.setValueAtTime(0, t);
  ampGain.gain.linearRampToValueAtTime(0.85, t + p.attackSec);
  ampGain.gain.exponentialRampToValueAtTime(0.0001, t + p.attackSec + p.decaySec);

  // Transient Click
  if (p.clickAmount > 0) {
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1400, t);
    clickGain.gain.setValueAtTime(p.clickAmount * 0.4, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.025);
    active808Nodes.push(clickOsc);
  }

  osc.connect(shaper);
  shaper.connect(ampGain);
  ampGain.connect(ctx.destination);

  osc.start(t);
  const totalDuration = p.attackSec + p.decaySec + 0.05;
  osc.stop(t + totalDuration);

  active808Nodes.push(osc, ampGain);
}

export function stop808Sub() {
  active808Nodes.forEach((node) => {
    try {
      if (node.stop) node.stop();
      if (node.disconnect) node.disconnect();
    } catch (_) {}
  });
  active808Nodes = [];
}

/**
 * Non-realtime high-fidelity rendering of tuned 808 directly to downloadable .wav
 * Using OfflineAudioContext
 */
export async function render808ToWav(params) {
  const p = normalize808Params(params);
  const totalDuration = p.attackSec + p.decaySec + 0.1;
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);

  const t = 0;
  const osc = offlineCtx.createOscillator();
  osc.type = p.waveform;
  const startFreq = p.rootFreq * Math.pow(2, p.glideSemitones / 12);
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(p.rootFreq, t + p.glideMs / 1000);

  // Saturation
  const shaper = offlineCtx.createWaveShaper();
  shaper.curve = makeDistortionCurve(p.drive * 40);
  shaper.oversample = '4x';

  // Amp
  const ampGain = offlineCtx.createGain();
  ampGain.gain.setValueAtTime(0, t);
  ampGain.gain.linearRampToValueAtTime(0.85, t + p.attackSec);
  ampGain.gain.exponentialRampToValueAtTime(0.0001, t + p.attackSec + p.decaySec);

  // Transient Click
  if (p.clickAmount > 0) {
    const clickOsc = offlineCtx.createOscillator();
    const clickGain = offlineCtx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1400, t);
    clickGain.gain.setValueAtTime(p.clickAmount * 0.4, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(offlineCtx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.025);
  }

  osc.connect(shaper);
  shaper.connect(ampGain);
  ampGain.connect(offlineCtx.destination);

  osc.start(t);
  osc.stop(t + totalDuration);

  // Render
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);

  return {
    blob: wavBlob,
    filename: `Dangling_808_${p.rootNote}_Tuned.wav`,
    duration: totalDuration,
  };
}

function normalize808Params(params = {}) {
  const noteObj = ROOT_SUB_NOTES.find((n) => n.note === params.rootNote) || ROOT_SUB_NOTES[17]; // default F1 (43.65 Hz)
  return {
    rootNote: noteObj.note,
    rootFreq: noteObj.freq,
    glideSemitones: Number(params.glideSemitones) || 24, // 2 octaves above
    glideMs: Math.max(5, Math.min(250, Number(params.glideMs) || 45)),
    waveform: params.waveform || 'sine',
    drive: Math.max(0, Math.min(1, Number(params.drive) || 0.35)),
    clickAmount: Math.max(0, Math.min(1, Number(params.clickAmount) || 0.4)),
    attackSec: Math.max(0.001, Math.min(0.1, Number(params.attackSec) || 0.005)),
    decaySec: Math.max(0.2, Math.min(3.5, Number(params.decaySec) || 1.4)),
  };
}

