/**
 * Studio Sound Kit Generator
 * Generates an authentic 8-bar Lo-Fi Chillhop beat loop (85 BPM, ~22.6s, 44.1kHz 16-bit PCM WAV)
 * plus individual drum one-shots and packages them into ZIP and WAV downloads.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_RATE = 44100;
const BPM = 85;
const BEAT_SEC = 60 / BPM; // ~0.70588s
const NUM_BARS = 8;
const TOTAL_BEATS = NUM_BARS * 4;
const TOTAL_DURATION_SEC = TOTAL_BEATS * BEAT_SEC; // ~22.588s
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * TOTAL_DURATION_SEC);

console.log(`🎵 Generating Dangling Dice Studio Sound Kit (${NUM_BARS} bars @ ${BPM} BPM, ${TOTAL_DURATION_SEC.toFixed(2)}s)...`);

// Helper: Create 16-bit mono WAV buffer
function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(byteRate, 28);   // ByteRate
  buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? Math.floor(s * 0x8000) : Math.floor(s * 0x7FFF);
    buffer.writeInt16LE(val, offset);
    offset += 2;
  }

  return buffer;
}

// 1. Kick Drum One-Shot (0.6s)
function generateKick() {
  const dur = 0.6;
  const len = Math.floor(SAMPLE_RATE * dur);
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 150 * Math.exp(-t * 26) + 42;
    const env = Math.exp(-t * 9);
    const click = t < 0.005 ? (Math.random() * 2 - 1) * 0.3 * (1 - t / 0.005) : 0;
    arr[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.85 + click;
  }
  return arr;
}

// 2. Snare One-Shot (0.5s)
function generateSnare() {
  const dur = 0.5;
  const len = Math.floor(SAMPLE_RATE * dur);
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const toneFreq = 180 * Math.exp(-t * 22) + 120;
    const toneEnv = Math.exp(-t * 18);
    const tone = Math.sin(2 * Math.PI * toneFreq * t) * toneEnv * 0.45;
    const noiseEnv = Math.exp(-t * 12);
    const noise = (Math.random() * 2 - 1) * noiseEnv * 0.5;
    arr[i] = tone + noise;
  }
  return arr;
}

// 3. Hi-Hat One-Shot (0.2s)
function generateHiHat() {
  const dur = 0.2;
  const len = Math.floor(SAMPLE_RATE * dur);
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const noise = (Math.random() * 2 - 1);
    const metallic = Math.sin(2 * Math.PI * 7200 * t) * 0.4 + Math.sin(2 * Math.PI * 9600 * t) * 0.3;
    const env = Math.exp(-t * 45);
    arr[i] = (noise * 0.6 + metallic * 0.4) * env * 0.5;
  }
  return arr;
}

// 4. 808 Sub Bass One-Shot (1.5s, root D1 ~ 36.7Hz)
function generate808(freq = 36.71, dur = 1.5) {
  const len = Math.floor(SAMPLE_RATE * dur);
  const arr = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const pitchDrop = freq * (1 + 0.5 * Math.exp(-t * 30));
    const env = Math.exp(-t * 2.2);
    const sat = Math.tanh(Math.sin(2 * Math.PI * pitchDrop * t) * 1.4);
    arr[i] = sat * env * 0.75;
  }
  return arr;
}

// 5. Full 8-Bar Lo-Fi Chillhop Beat Loop
function generateMasterBeatLoop() {
  const master = new Float32Array(TOTAL_SAMPLES);
  const kick = generateKick();
  const snare = generateSnare();
  const hihat = generateHiHat();

  // Chords progression (Dm9 -> G13 -> Cmaj9 -> Am9) repeated twice
  const chords = [
    // Bars 1-2: Dm9 (D3=146.83, F3=174.61, A3=220.00, C4=261.63, E4=329.63, Bass D1=36.71)
    { freqs: [146.83, 174.61, 220.00, 261.63, 329.63], bassFreq: 36.71 },
    // Bars 3-4: G13 (G2=98.00, B2=123.47, F3=174.61, A3=220.00, E4=329.63, Bass G1=49.00)
    { freqs: [98.00, 123.47, 174.61, 220.00, 329.63], bassFreq: 49.00 },
    // Bars 5-6: Cmaj9 (C3=130.81, E3=164.81, G3=196.00, B3=246.94, D4=293.66, Bass C1=32.70)
    { freqs: [130.81, 164.81, 196.00, 246.94, 293.66], bassFreq: 32.70 },
    // Bars 7-8: Am9 (A2=110.00, C3=130.81, E3=164.81, G3=196.00, B3=246.94, Bass A1=55.00)
    { freqs: [110.00, 130.81, 164.81, 196.00, 246.94], bassFreq: 55.00 },
  ];

  // Helper: overlay sound into master
  function addSound(soundArr, startSample, volume = 1.0) {
    for (let i = 0; i < soundArr.length; i++) {
      const idx = startSample + i;
      if (idx < master.length) {
        master[idx] += soundArr[i] * volume;
      }
    }
  }

  // 1. Synthesize Chord Progression & 808 Basslines
  for (let bar = 0; bar < NUM_BARS; bar++) {
    const chordIdx = Math.floor(bar / 2);
    const chord = chords[chordIdx];
    const barStartSample = Math.floor(bar * 4 * BEAT_SEC * SAMPLE_RATE);

    // Chords hit on beat 1 and beat 3 of each bar
    for (const beatInBar of [0, 2.5]) {
      const hitSample = barStartSample + Math.floor(beatInBar * BEAT_SEC * SAMPLE_RATE);
      const chordDur = 2.2 * BEAT_SEC;
      const chordSamples = Math.floor(SAMPLE_RATE * chordDur);

      for (let s = 0; s < chordSamples; s++) {
        const t = s / SAMPLE_RATE;
        const env = Math.exp(-t * 1.5) * Math.min(1, t / 0.02); // attack + decay
        let chordVal = 0;
        for (const f of chord.freqs) {
          // Warm Rhodes electric piano sound with subtle vibrato
          const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
          const tone = Math.sin(2 * Math.PI * f * vibrato * t) * 0.5
                     + Math.sin(4 * Math.PI * f * vibrato * t) * 0.2
                     + Math.sin(6 * Math.PI * f * vibrato * t) * 0.08;
          chordVal += tone;
        }
        const masterIdx = hitSample + s;
        if (masterIdx < master.length) {
          master[masterIdx] += chordVal * env * 0.06;
        }
      }
    }

    // 808 Bass notes
    const bass = generate808(chord.bassFreq, 2.0);
    addSound(bass, barStartSample, 0.7);
    if (bar % 2 === 1) {
      // Little syncopated bass hit on beat 2.5 of second bar
      const subHit = generate808(chord.bassFreq * 1.3348, 1.2);
      addSound(subHit, barStartSample + Math.floor(2.5 * BEAT_SEC * SAMPLE_RATE), 0.5);
    }
  }

  // 2. Synthesize Drum Groove Pattern (85 BPM Lo-Fi Boom-Bap)
  for (let beat = 0; beat < TOTAL_BEATS; beat++) {
    const beatStart = Math.floor(beat * BEAT_SEC * SAMPLE_RATE);
    const beatInBar = beat % 4;

    // Kicks: beat 0 (1), beat 1.5 (2-and), beat 2.5 (3-and) on alternate bars
    if (beatInBar === 0) {
      addSound(kick, beatStart, 0.85);
    } else if (beatInBar === 1 && beat % 2 === 1) {
      addSound(kick, beatStart + Math.floor(0.5 * BEAT_SEC * SAMPLE_RATE), 0.7);
    } else if (beatInBar === 2) {
      addSound(kick, beatStart, 0.65);
    }

    // Snares: beat 1 (beat 2) and beat 3 (beat 4)
    if (beatInBar === 1 || beatInBar === 3) {
      addSound(snare, beatStart, 0.8);
    }

    // Hi-hats: straight 8th notes with humanized swing velocity
    addSound(hihat, beatStart, 0.45);
    const swingOffset = Math.floor((0.54) * BEAT_SEC * SAMPLE_RATE); // subtle swing
    addSound(hihat, beatStart + swingOffset, 0.28);
  }

  // 3. Subtle Lo-Fi Vinyl Warmth (soft pink noise bed)
  for (let i = 0; i < master.length; i++) {
    const noise = (Math.random() * 2 - 1) * 0.008;
    master[i] += noise;
    // Master soft-clipping limiter
    master[i] = Math.tanh(master[i] * 1.15) * 0.92;
  }

  return master;
}

// Ensure output directories exist
const publicDownloadsDir = path.resolve(__dirname, '../apps/web/public/downloads');
const distDownloadsDir = path.resolve(__dirname, '../apps/web/dist/downloads');
const soundKitFolder = path.join(publicDownloadsDir, 'Dangling_Dice_Studio_Kit');

fs.mkdirSync(publicDownloadsDir, { recursive: true });
fs.mkdirSync(distDownloadsDir, { recursive: true });
fs.mkdirSync(soundKitFolder, { recursive: true });

// 1. Generate One-Shots
console.log('🥁 Generating one-shots for Sound Kit folder...');
const kickBuf = createWavBuffer(generateKick());
const snareBuf = createWavBuffer(generateSnare());
const hihatBuf = createWavBuffer(generateHiHat());
const sub808Buf = createWavBuffer(generate808());

fs.writeFileSync(path.join(soundKitFolder, '01_Dangling_Punch_Kick.wav'), kickBuf);
fs.writeFileSync(path.join(soundKitFolder, '02_Dangling_Crisp_Snare.wav'), snareBuf);
fs.writeFileSync(path.join(soundKitFolder, '03_Dangling_Tight_HiHat.wav'), hihatBuf);
fs.writeFileSync(path.join(soundKitFolder, '04_Dangling_Deep_808_Sub.wav'), sub808Buf);

// Copy existing clap.wav from beats if present
const clapSrc = path.resolve(__dirname, '../apps/beats/public/samples/drums/clap.wav');
if (fs.existsSync(clapSrc)) {
  fs.copyFileSync(clapSrc, path.join(soundKitFolder, '05_Dangling_Stereo_Clap.wav'));
  console.log('  ✅ Copied stereo clap one-shot');
}

// 2. Generate Full Master Beat Loop
console.log('🎹 Generating 8-bar Lo-Fi Chillhop Beat Loop...');
const masterLoopSamples = generateMasterBeatLoop();
const masterLoopBuf = createWavBuffer(masterLoopSamples);

const masterLoopPath = path.join(publicDownloadsDir, 'dangling-dice-studio-sound-kit.wav');
fs.writeFileSync(masterLoopPath, masterLoopBuf);
fs.writeFileSync(path.join(soundKitFolder, '06_Dangling_LoFi_Beat_Loop_85BPM.wav'), masterLoopBuf);

// Copy to dist/downloads for production Vite static serving
fs.copyFileSync(masterLoopPath, path.join(distDownloadsDir, 'dangling-dice-studio-sound-kit.wav'));
console.log(`  ✅ Master Loop Saved: ${masterLoopPath} (${(masterLoopBuf.length / (1024 * 1024)).toFixed(2)} MB, ~22.6s)`);

// 3. Write Commercial License File
const licenseText = `====================================================================
DANGLING DICE STUDIOS™ — 100% ROYALTY-FREE STUDIO SOUND KIT LICENSE
====================================================================

Congratulations on downloading the Dangling Dice Studios Sound Kit!

TERMS & RIGHTS:
- 100% Royalty-Free for Commercial and Personal Music Production.
- You are free to use these WAV one-shots, 808 sub basslines, and 
  melodic loops in your beats, songs, YouTube videos, streams, and Spotify releases.
- No royalties or credit owed.
- You may not resell or redistribute this sound pack as a standalone sample kit.

Included in this pack:
- 01_Dangling_Punch_Kick.wav
- 02_Dangling_Crisp_Snare.wav
- 03_Dangling_Tight_HiHat.wav
- 04_Dangling_Deep_808_Sub.wav
- 05_Dangling_Stereo_Clap.wav
- 06_Dangling_LoFi_Beat_Loop_85BPM.wav (Full 8-Bar Beat Loop @ 85 BPM)

Produced with love by Dangling Dice Studios™
Visit us: https://dangling-dice-studios.com
Beats Studio: https://beats.dangling-dice-studios.com
`;

fs.writeFileSync(path.join(soundKitFolder, 'LICENSE_Royalty_Free.txt'), licenseText);

// 4. Create ZIP Archive
const zipPath = path.join(publicDownloadsDir, 'dangling-dice-studio-sound-kit.zip');
try {
  console.log('📦 Compressing Sound Kit into ZIP archive...');
  const psCmd = `Compress-Archive -Path '${soundKitFolder}\\*' -DestinationPath '${zipPath}' -Force`;
  execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
  fs.copyFileSync(zipPath, path.join(distDownloadsDir, 'dangling-dice-studio-sound-kit.zip'));
  console.log(`  ✅ ZIP Kit Created: ${zipPath} (${(fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2)} MB)`);
} catch (err) {
  console.warn('⚠️ Could not create ZIP via powershell, WAV remains 100% available:', err.message);
}

console.log('🎉 Studio Sound Kit Generation Complete!');
