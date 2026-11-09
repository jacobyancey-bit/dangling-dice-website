/**
 * Dangling Beats Studio™ — Chromatic Audio Sampler Engine
 * Turns any recorded audio, microphone capture, or file into a fully playable,
 * polyphonic musical instrument across keyboards, MPC pads, and Web MIDI.
 */

import { NOTE_NAMES } from './theoryEngine.js';

class SamplerEngine {
  constructor() {
    this.audioCtx = null;
    this.activeBuffer = null;
    this.reversedBuffer = null;
    this.rootMidi = 60; // Default Root: Middle C (C4)
    this.sampleName = 'Grand Piano (C4)';

    // Playback Parameters
    this.startRatio = 0.0; // 0.0 to 1.0
    this.endRatio = 1.0;   // 0.0 to 1.0
    this.isLooping = false;
    this.isReversed = false;

    // Filter Parameters
    this.filterType = 'lowpass';
    this.filterCutoff = 18000; // Hz
    this.filterResonance = 1.0; // Q

    // Amplitude ADSR Envelope
    this.attack = 0.01;  // seconds
    this.decay = 0.3;    // seconds
    this.sustain = 0.7;  // 0.0 to 1.0
    this.release = 0.4;  // seconds

    // Voice tracking (polyphonic note management)
    this.activeVoices = new Map(); // midiNote -> { source, filter, gain, env }

    // Live Mic Recording
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Loads an AudioBuffer into the sampler
   */
  loadBuffer(audioBuffer, name = 'Custom Sample', rootMidi = 60) {
    this.activeBuffer = audioBuffer;
    this.sampleName = name;
    this.rootMidi = rootMidi;
    this.startRatio = 0.0;
    this.endRatio = 1.0;
    this.generateReversedBuffer();
    return this.getSampleMetadata();
  }

  generateReversedBuffer() {
    if (!this.activeBuffer) return;
    const ctx = this.getAudioContext();
    const channels = this.activeBuffer.numberOfChannels;
    const length = this.activeBuffer.length;
    const sampleRate = this.activeBuffer.sampleRate;

    const reversed = ctx.createBuffer(channels, length, sampleRate);
    for (let c = 0; c < channels; c++) {
      const src = this.activeBuffer.getChannelData(c);
      const dest = reversed.getChannelData(c);
      for (let i = 0; i < length; i++) {
        dest[i] = src[length - 1 - i];
      }
    }
    this.reversedBuffer = reversed;
  }

  getSampleMetadata() {
    if (!this.activeBuffer) return null;
    const rootName = NOTE_NAMES[this.rootMidi % 12];
    const octave = Math.floor(this.rootMidi / 12) - 1;

    return {
      name: this.sampleName,
      duration: Math.round(this.activeBuffer.duration * 1000) / 1000,
      sampleRate: this.activeBuffer.sampleRate,
      channels: this.activeBuffer.numberOfChannels,
      rootMidi: this.rootMidi,
      rootNoteName: `${rootName}${octave}`,
      isLooping: this.isLooping,
      isReversed: this.isReversed,
    };
  }

  /**
   * Triggers a polyphonic note on the sampler
   * Computes pitch ratio: 2^((midiNote - rootMidi) / 12)
   */
  noteOn(midiNote, velocity = 0.85) {
    if (!this.activeBuffer) return;
    const ctx = this.getAudioContext();
    const t = ctx.currentTime;

    // Release any existing voice on this pitch
    this.noteOff(midiNote);

    const bufferToUse = this.isReversed && this.reversedBuffer ? this.reversedBuffer : this.activeBuffer;

    // Source Node
    const source = ctx.createBufferSource();
    source.buffer = bufferToUse;

    // Chromatic pitch shifting via playbackRate
    const semitoneDistance = midiNote - this.rootMidi;
    const pitchRatio = Math.pow(2, semitoneDistance / 12);
    source.playbackRate.setValueAtTime(pitchRatio, t);

    // Filter Node
    const filter = ctx.createBiquadFilter();
    filter.type = this.filterType;
    filter.frequency.setValueAtTime(this.filterCutoff, t);
    filter.Q.setValueAtTime(this.filterResonance, t);

    // Amplitude Gain Envelope Node
    const gainNode = ctx.createGain();
    const peakGain = Math.max(0.01, Math.min(1.0, velocity));

    // ADSR Attack -> Decay -> Sustain
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(peakGain, t + this.attack);
    gainNode.gain.linearRampToValueAtTime(peakGain * this.sustain, t + this.attack + this.decay);

    // Loop settings
    const totalDuration = bufferToUse.duration;
    const startSec = totalDuration * this.startRatio;
    const endSec = totalDuration * this.endRatio;
    const duration = Math.max(0.05, endSec - startSec);

    if (this.isLooping) {
      source.loop = true;
      source.loopStart = startSec;
      source.loopEnd = endSec;
    }

    // Connect audio graph: Source -> Filter -> Gain -> Destination
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Start playback from startSec
    source.start(t, startSec);

    // If not looping, schedule auto-stop after duration
    if (!this.isLooping) {
      const scaledDuration = duration / pitchRatio;
      source.stop(t + scaledDuration + this.release + 0.1);
    }

    this.activeVoices.set(midiNote, { source, filter, gainNode, peakGain });
  }

  /**
   * Releases a note with the Release phase of ADSR
   */
  noteOff(midiNote) {
    if (!this.activeVoices.has(midiNote)) return;
    const voice = this.activeVoices.get(midiNote);
    this.activeVoices.delete(midiNote);

    const ctx = this.getAudioContext();
    const t = ctx.currentTime;

    try {
      // ADSR Release
      voice.gainNode.gain.cancelScheduledValues(t);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, t);
      voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, t + this.release);

      setTimeout(() => {
        try {
          voice.source.stop();
          voice.source.disconnect();
          voice.filter.disconnect();
          voice.gainNode.disconnect();
        } catch (_) {}
      }, (this.release + 0.05) * 1000);
    } catch (_) {}
  }

  stopAllVoices() {
    this.activeVoices.forEach((_, note) => this.noteOff(note));
  }

  // -------------------------------------------------------------
  // MICROPHONE RECORDING ENGINE
  // -------------------------------------------------------------

  async startMicRecording() {
    if (this.isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return { success: true };
    } catch (err) {
      console.error('[Sampler Mic Error]', err);
      return { success: false, error: err.message };
    }
  }

  async stopMicRecording(rootMidi = 60) {
    if (!this.isRecording || !this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        const ctx = this.getAudioContext();
        try {
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          const meta = this.loadBuffer(audioBuffer, 'Mic Recording', rootMidi);
          resolve({ success: true, meta });
        } catch (err) {
          resolve({ success: false, error: 'Could not decode recorded microphone audio.' });
        }
      };

      this.mediaRecorder.stop();
      // Stop all mic tracks
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }

  // -------------------------------------------------------------
  // HIGH-QUALITY BUILT-IN INSTRUMENT PRESETS
  // -------------------------------------------------------------

  /**
   * Generates a high-quality starter sample so users can play instantly:
   * 1. 'grand-piano' (Acoustic piano key C4)
   * 2. 'rhodes-bell' (Lush Rhodes electric tine C4)
   * 3. 'vocal-chop' (Breathy formant vocal tone F3)
   * 4. 'kalimba' (Lofi thumb piano C4)
   * 5. '808-sub' (Warm analog sub drop C1)
   */
  generatePresetSample(type = 'grand-piano') {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;

    if (type === 'grand-piano') {
      const dur = 2.5;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Piano harmonics: 1st, 2nd, 3rd, 4th, 5th with natural decay
        const s1 = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 2.2);
        const s2 = Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 3.5) * 0.55;
        const s3 = Math.sin(2 * Math.PI * f0 * 3 * t) * Math.exp(-t * 5.2) * 0.28;
        const s4 = Math.sin(2 * Math.PI * f0 * 4 * t) * Math.exp(-t * 7.5) * 0.15;
        // Hammer knock transient
        const knock = (Math.random() * 2 - 1) * Math.exp(-t * 80) * 0.2;

        const val = (s1 + s2 + s3 + s4 + knock) * 0.75;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Grand Piano (C4)', 60);
    } else if (type === 'rhodes-bell') {
      const dur = 3.0;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const tine = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 1.8);
        const bell = Math.sin(2 * Math.PI * f0 * 4.02 * t) * Math.exp(-t * 12.0) * 0.4;
        const warmth = Math.sin(2 * Math.PI * f0 * 0.5 * t) * Math.exp(-t * 1.5) * 0.15;
        const val = (tine + bell + warmth) * 0.7;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Rhodes Bell (C4)', 60);
    } else if (type === 'vocal-chop') {
      const dur = 2.0;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 174.61; // F3 (Vocal tone)

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Vowel formant synthesis (Ooh/Aah resonance)
        const v1 = Math.sin(2 * Math.PI * f0 * t) * 0.6;
        const v2 = Math.sin(2 * Math.PI * 730 * t) * Math.exp(-t * 1.5) * 0.35; // F1
        const v3 = Math.sin(2 * Math.PI * 1090 * t) * Math.exp(-t * 2.0) * 0.25; // F2
        const vibrato = 1 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t);
        const env = Math.min(1, t * 15) * Math.exp(-t * 1.2);
        const val = (v1 + v2 + v3) * vibrato * env * 0.7;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Vocal Ooh (F3)', 53);
    } else if (type === 'kalimba') {
      const dur = 2.2;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const pluck = (Math.random() * 2 - 1) * Math.exp(-t * 150) * 0.3;
        const tine = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 3.5) * 0.7;
        const overtone = Math.sin(2 * Math.PI * f0 * 3.01 * t) * Math.exp(-t * 8.0) * 0.25;
        const val = (pluck + tine + overtone) * 0.75;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Lofi Kalimba (C4)', 60);
    } else if (type === 'classical-guitar') {
      const dur = 2.4;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 164.81; // E3 (Standard guitar acoustic range)

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const s1 = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 2.0);
        const s2 = Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 3.8) * 0.45;
        const s3 = Math.sin(2 * Math.PI * f0 * 3 * t) * Math.exp(-t * 6.0) * 0.2;
        const nail = (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.25;
        const body = Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 4.0) * 0.15;
        const val = (s1 + s2 + s3 + nail + body) * 0.75;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Classical Guitar Nylon (E3)', 52);
    } else if (type === 'steel-acoustic') {
      const dur = 2.6;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 164.81; // E3

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const s1 = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 1.6);
        const s2 = Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 2.5) * 0.55;
        const s3 = Math.sin(2 * Math.PI * f0 * 3 * t) * Math.exp(-t * 4.0) * 0.35;
        const s4 = Math.sin(2 * Math.PI * f0 * 4 * t) * Math.exp(-t * 6.5) * 0.25;
        const pick = (Math.random() * 2 - 1) * Math.exp(-t * 200) * 0.35;
        const val = (s1 + s2 + s3 + s4 + pick) * 0.7;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Steel Acoustic Guitar (E3)', 52);
    } else if (type === 'rock-overdrive') {
      const dur = 2.2;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 164.81; // E3

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const raw = Math.sin(2 * Math.PI * f0 * t) + 0.6 * Math.sin(2 * Math.PI * f0 * 2 * t) + 0.3 * Math.sin(2 * Math.PI * f0 * 3 * t);
        // Soft clipping distortion tanh
        const clipped = Math.tanh(raw * 3.5) * Math.exp(-t * 1.5);
        l[i] = clipped * 0.7;
        r[i] = clipped * 0.7;
      }
      return this.loadBuffer(buffer, 'Rock Overdrive Guitar (E3)', 52);
    } else if (type === 'mandolin') {
      const dur = 1.8;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 392.0; // G4 Mandolin Open G

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // 2 unison strings with 1.5Hz chorusing beat
        const strA = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 3.5);
        const strB = Math.sin(2 * Math.PI * (f0 + 1.5) * t) * Math.exp(-t * 3.5);
        const pluck = (Math.random() * 2 - 1) * Math.exp(-t * 250) * 0.3;
        const val = (strA * 0.5 + strB * 0.5 + pluck) * 0.8;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Mandolin (G4)', 67);
    } else if (type === 'electric-bass') {
      const dur = 2.2;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 41.2; // E1 (Standard Bass Low E)

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const sub = Math.sin(2 * Math.PI * f0 * t) * Math.exp(-t * 1.2);
        const growl = Math.sin(2 * Math.PI * f0 * 2 * t) * Math.exp(-t * 2.2) * 0.45;
        const snap = (Math.random() * 2 - 1) * Math.exp(-t * 150) * 0.25;
        const val = (sub + growl + snap) * 0.85;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Electric Bass (E1)', 28);
    } else if (type === 'upright-piano') {
      const dur = 2.4;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const s1 = Math.sin(2 * Math.PI * f0 * 0.998 * t) * Math.exp(-t * 2.4) * 0.5;
        const s2 = Math.sin(2 * Math.PI * f0 * 1.002 * t) * Math.exp(-t * 2.4) * 0.5;
        const thud = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 40) * 0.2;
        const val = (s1 + s2 + thud) * 0.75;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Vintage Upright Piano (C4)', 60);
    } else if (type === 'harpsichord') {
      const dur = 1.8;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Buzz rich harmonic series
        let val = 0;
        for (let h = 1; h <= 8; h++) {
          val += (Math.sin(2 * Math.PI * f0 * h * t) / h) * Math.exp(-t * (1.8 + h * 0.5));
        }
        l[i] = val * 0.6;
        r[i] = val * 0.6;
      }
      return this.loadBuffer(buffer, 'Baroque Harpsichord (C4)', 60);
    } else if (type === 'church-organ') {
      const dur = 3.0;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 261.63; // C4

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        // Multi-pipe stops (16', 8', 4', 2')
        const p16 = Math.sin(2 * Math.PI * f0 * 0.5 * t) * 0.35;
        const p8 = Math.sin(2 * Math.PI * f0 * t) * 0.45;
        const p4 = Math.sin(2 * Math.PI * f0 * 2 * t) * 0.25;
        const p2 = Math.sin(2 * Math.PI * f0 * 4 * t) * 0.15;
        const env = Math.min(1, t * 10) * Math.exp(-t * 0.3);
        const val = (p16 + p8 + p4 + p2) * env * 0.7;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, 'Cathedral Pipe Organ (C4)', 60);
    } else if (type === '808-sub') {
      const dur = 2.0;
      const buffer = ctx.createBuffer(2, Math.floor(sampleRate * dur), sampleRate);
      const l = buffer.getChannelData(0);
      const r = buffer.getChannelData(1);
      const f0 = 32.7; // C1 Sub

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const sweep = 80 * Math.exp(-t * 35) + f0;
        const tone = Math.sin(2 * Math.PI * sweep * t) * Math.exp(-t * 1.4);
        const val = tone * 0.85;
        l[i] = val;
        r[i] = val;
      }
      return this.loadBuffer(buffer, '808 Sub Boom (C1)', 24);
    }
  }
}

export const samplerEngine = new SamplerEngine();

