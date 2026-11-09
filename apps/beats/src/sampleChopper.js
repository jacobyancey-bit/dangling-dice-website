/**
 * Dangling Beats Studio™ — Workflow & Sample Manipulation Utilities
 * Phase 3: Audio-to-Transient Drum Slicer, Loop Chopper, Sample Pack Metadata Tagger & Key Detector
 */

import { instrumentEngine } from './instrumentEngine.js';

export function getChopperAudioContext() {
  return instrumentEngine.getAudioContext();
}

// -------------------------------------------------------------
// 1. NATIVE 16-BIT PCM WAV ENCODER (Client-Side Binary)
// -------------------------------------------------------------

/**
 * Encodes an AudioBuffer slice into standard 44-byte RIFF/WAVE 16-bit PCM binary
 */
export function audioBufferToWav(audioBuffer, startSec = 0, endSec = null) {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(startSec * sampleRate);
  const endSample = endSec !== null ? Math.min(Math.floor(endSec * sampleRate), audioBuffer.length) : audioBuffer.length;
  const numSamples = Math.max(0, endSample - startSample);

  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII strings
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // ChunkSize
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave and write 16-bit samples
  let offset = 44;
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }

  for (let i = startSample; i < endSample; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      // Clamp between -1.0 and 1.0
      let sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// -------------------------------------------------------------
// 2. NATIVE CLIENT-SIDE ZIP PACKAGER (Zero npm dependencies)
// -------------------------------------------------------------

/**
 * Packs an array of { filename: string, blob: Blob } into a single valid standard ZIP file
 */
export async function createZipArchive(files) {
  const fileEntries = [];
  let currentOffset = 0;

  for (const file of files) {
    const arrayBuffer = await file.blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const filenameBytes = new TextEncoder().encode(file.filename);
    const crc = computeCrc32(data);

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const lView = new DataView(localHeader.buffer);

    lView.setUint32(0, 0x04034b50, true); // Local file header signature
    lView.setUint16(4, 20, true); // Version needed to extract (2.0)
    lView.setUint16(6, 0, true); // General purpose bit flag
    lView.setUint16(8, 0, true); // Compression method (0 = store / uncompressed)
    lView.setUint16(10, 0, true); // File last mod time
    lView.setUint16(12, 0, true); // File last mod date
    lView.setUint32(14, crc, true); // CRC-32
    lView.setUint32(18, data.length, true); // Compressed size
    lView.setUint32(22, data.length, true); // Uncompressed size
    lView.setUint16(26, filenameBytes.length, true); // File name length
    lView.setUint16(28, 0, true); // Extra field length
    localHeader.set(filenameBytes, 30);

    fileEntries.push({
      filenameBytes,
      data,
      crc,
      localHeader,
      offset: currentOffset,
      length: data.length,
    });

    currentOffset += localHeader.length + data.length;
  }

  // Central Directory
  const centralDirEntries = [];
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cd = new Uint8Array(46 + entry.filenameBytes.length);
    const cdView = new DataView(cd.buffer);

    cdView.setUint32(0, 0x02014b50, true); // Central file header signature
    cdView.setUint16(4, 20, true); // Version made by
    cdView.setUint16(6, 20, true); // Version needed to extract
    cdView.setUint16(8, 0, true); // General purpose bit flag
    cdView.setUint16(10, 0, true); // Compression method
    cdView.setUint16(12, 0, true); // Mod time
    cdView.setUint16(14, 0, true); // Mod date
    cdView.setUint32(16, entry.crc, true); // CRC-32
    cdView.setUint32(20, entry.length, true); // Compressed size
    cdView.setUint32(24, entry.length, true); // Uncompressed size
    cdView.setUint16(28, entry.filenameBytes.length, true); // File name length
    cdView.setUint16(30, 0, true); // Extra field length
    cdView.setUint16(32, 0, true); // File comment length
    cdView.setUint16(34, 0, true); // Disk number start
    cdView.setUint16(36, 0, true); // Internal file attributes
    cdView.setUint32(38, 0, true); // External file attributes
    cdView.setUint32(42, entry.offset, true); // Relative offset of local header
    cd.set(entry.filenameBytes, 46);

    centralDirEntries.push(cd);
    centralDirSize += cd.length;
  }

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true); // EOCD signature
  eView.setUint16(4, 0, true); // Disk number
  eView.setUint16(6, 0, true); // Disk where central directory starts
  eView.setUint16(8, fileEntries.length, true); // Number of central directory records on this disk
  eView.setUint16(10, fileEntries.length, true); // Total number of central directory records
  eView.setUint32(12, centralDirSize, true); // Size of central directory
  eView.setUint32(16, currentOffset, true); // Offset of start of central directory
  eView.setUint16(20, 0, true); // Comment length

  // Assemble full archive blob
  const allParts = [];
  for (const entry of fileEntries) {
    allParts.push(entry.localHeader);
    allParts.push(entry.data);
  }
  for (const cd of centralDirEntries) {
    allParts.push(cd);
  }
  allParts.push(eocd);

  return new Blob(allParts, { type: 'application/zip' });
}

// CRC-32 Table & Computation for standard ZIP compliance
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function computeCrc32(bytes) {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// -------------------------------------------------------------
// 3. TRANSIENT DETECTION & ENERGY ANALYSIS
// -------------------------------------------------------------

/**
 * Analyzes audio buffer and detects slice markers at transient energy peaks
 */
export function detectTransients(audioBuffer, thresholdSensitivity = 0.45) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms energy windows
  const hopSize = Math.floor(windowSize / 2);
  const energies = [];

  // Compute short-time energy
  for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const s = channelData[i + j];
      sum += s * s;
    }
    energies.push({
      sampleIndex: i,
      timeSec: i / sampleRate,
      energy: Math.sqrt(sum / windowSize),
    });
  }

  // Energy flux (rate of energy rise)
  const fluxes = [];
  let maxFlux = 0.00001;
  for (let i = 1; i < energies.length; i++) {
    const diff = Math.max(0, energies[i].energy - energies[i - 1].energy);
    fluxes.push({
      timeSec: energies[i].timeSec,
      sampleIndex: energies[i].sampleIndex,
      flux: diff,
    });
    if (diff > maxFlux) maxFlux = diff;
  }

  // Threshold scaled by sensitivity (0.1 to 0.9)
  const normalizedThreshold = maxFlux * (1.05 - thresholdSensitivity * 0.9);
  const minSliceDistanceSec = 0.12; // At least 120ms between transients
  const slices = [0]; // First slice always starts at 0

  let lastSliceTime = 0;
  for (let i = 1; i < fluxes.length - 1; i++) {
    const prev = fluxes[i - 1].flux;
    const curr = fluxes[i].flux;
    const next = fluxes[i + 1].flux;

    // Peak condition + threshold + minimum distance
    if (curr > normalizedThreshold && curr > prev && curr >= next) {
      if (fluxes[i].timeSec - lastSliceTime >= minSliceDistanceSec) {
        slices.push(Math.round(fluxes[i].timeSec * 1000) / 1000);
        lastSliceTime = fluxes[i].timeSec;
      }
    }
  }

  // Ensure total duration is capped
  const totalDuration = audioBuffer.duration;
  return {
    slices,
    totalDuration,
    sliceCount: slices.length,
  };
}

// -------------------------------------------------------------
// 4. BUILT-IN DEMO BREAK GENERATOR
// -------------------------------------------------------------

/**
 * Creates a clean synthesized funk/lofi breakbeat AudioBuffer
 * so users can test slicing even without uploading a file.
 */
export function generateDemoBreakbeat(providedCtx = null) {
  const ctx = providedCtx || getChopperAudioContext();
  const sampleRate = ctx.sampleRate;
  const bpm = 90;
  const secondsPerBeat = 60 / bpm;
  const totalSeconds = secondsPerBeat * 8; // 2 bars (8 beats)
  const buffer = ctx.createBuffer(2, Math.floor(sampleRate * totalSeconds), sampleRate);

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Helper to add synth drum hits
  const addKick = (startSec) => {
    const startSample = Math.floor(startSec * sampleRate);
    const duration = Math.floor(0.3 * sampleRate);
    for (let i = 0; i < duration && startSample + i < buffer.length; i++) {
      const t = i / sampleRate;
      const freq = 120 * Math.exp(-t * 24) + 45;
      const amp = Math.exp(-t * 12);
      const val = Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
      left[startSample + i] += val;
      right[startSample + i] += val;
    }
  };

  const addSnare = (startSec) => {
    const startSample = Math.floor(startSec * sampleRate);
    const duration = Math.floor(0.22 * sampleRate);
    for (let i = 0; i < duration && startSample + i < buffer.length; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 18) * 0.4;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14) * 0.5;
      const val = tone + noise;
      left[startSample + i] += val;
      right[startSample + i] += val;
    }
  };

  const addHiHat = (startSec) => {
    const startSample = Math.floor(startSec * sampleRate);
    const duration = Math.floor(0.08 * sampleRate);
    for (let i = 0; i < duration && startSample + i < buffer.length; i++) {
      const t = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t * 45) * 0.25;
      left[startSample + i] += noise;
      right[startSample + i] += noise;
    }
  };

  // Standard 2-bar hip-hop break pattern:
  // Beats: 1 (Kick), 2 (Snare), 3 (Kick), 4 (Snare)...
  const pattern = [
    { type: 'kick', beat: 0 },
    { type: 'hat', beat: 0.5 },
    { type: 'snare', beat: 1 },
    { type: 'hat', beat: 1.5 },
    { type: 'kick', beat: 2 },
    { type: 'kick', beat: 2.75 },
    { type: 'snare', beat: 3 },
    { type: 'hat', beat: 3.5 },
    { type: 'kick', beat: 4 },
    { type: 'hat', beat: 4.5 },
    { type: 'snare', beat: 5 },
    { type: 'kick', beat: 5.5 },
    { type: 'kick', beat: 6 },
    { type: 'snare', beat: 7 },
    { type: 'hat', beat: 7.5 },
  ];

  pattern.forEach((hit) => {
    const time = hit.beat * secondsPerBeat;
    if (hit.type === 'kick') addKick(time);
    if (hit.type === 'snare') addSnare(time);
    if (hit.type === 'hat') addHiHat(time);
  });

  return buffer;
}

// -------------------------------------------------------------
// 5. SAMPLE PACK METADATA TAGGER & PITCH KEY DETECTOR
// -------------------------------------------------------------

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Autocorrelation algorithm to detect fundamental frequency (Hz)
 */
export function detectPitchAndKey(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Analyze the loudest 1-second segment
  let maxRms = 0;
  let bestStart = 0;
  const chunk = Math.min(channelData.length, Math.floor(sampleRate * 0.5));

  for (let i = 0; i < channelData.length - chunk; i += Math.floor(chunk / 2)) {
    let sum = 0;
    for (let j = 0; j < chunk; j++) {
      sum += channelData[i + j] * channelData[i + j];
    }
    const rms = Math.sqrt(sum / chunk);
    if (rms > maxRms) {
      maxRms = rms;
      bestStart = i;
    }
  }

  // Autocorrelation on best segment
  const minFreq = 40; // 40 Hz (low sub bass)
  const maxFreq = 1000; // 1000 Hz
  const minLag = Math.floor(sampleRate / maxFreq);
  const maxLag = Math.floor(sampleRate / minFreq);

  let bestLag = -1;
  let maxCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < chunk - lag; i++) {
      corr += channelData[bestStart + i] * channelData[bestStart + i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  let detectedHz = bestLag > 0 ? sampleRate / bestLag : 0;
  let noteInfo = { note: 'Unknown', octave: 0, cents: 0, formatted: 'Unpitched Percussion / Noise' };
  let confidence = Math.min(100, Math.round((maxCorr / (maxRms * maxRms * chunk || 1)) * 100));

  if (detectedHz >= 30 && detectedHz <= 2000 && confidence > 35) {
    const midi = 69 + 12 * Math.log2(detectedHz / 440);
    const roundedMidi = Math.round(midi);
    const cents = Math.round((midi - roundedMidi) * 100);
    const noteName = PITCH_NAMES[((roundedMidi % 12) + 12) % 12];
    const octave = Math.floor(roundedMidi / 12) - 1;
    const sign = cents >= 0 ? '+' : '';
    noteInfo = {
      note: noteName,
      octave,
      cents,
      formatted: `${noteName}${octave} (${sign}${cents}¢)`,
      pitchClass: noteName,
    };
  }

  // Peak & RMS dB
  let peak = 0;
  let sumSq = 0;
  for (let i = 0; i < channelData.length; i++) {
    const abs = Math.abs(channelData[i]);
    if (abs > peak) peak = abs;
    sumSq += abs * abs;
  }
  const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak) * 10) / 10 : -99;
  const rmsDb = sumSq > 0 ? Math.round(20 * Math.log10(Math.sqrt(sumSq / channelData.length)) * 10) / 10 : -99;

  return {
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    durationSec: Math.round(audioBuffer.duration * 100) / 100,
    peakDb,
    rmsDb,
    detectedHz: Math.round(detectedHz * 10) / 10,
    noteInfo,
    confidence,
  };
}

