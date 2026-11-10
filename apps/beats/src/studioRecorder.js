/**
 * ============================================================================
 * Dangling Beats Studio™ — Real-Time Studio Stem & Take Recorder
 * Captures all audio produced across instruments, drum kits, slices, and synthesizers
 * and renders high-definition 16-bit 44.1kHz Broadcast WAV files ready for download
 * or immediate routing into the Sampler and Slice Chopper.
 * ============================================================================
 */

import { instrumentEngine } from './instrumentEngine.js';
import { audioBufferToWav } from './sampleChopper.js';

class StudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.startTime = 0;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.lastTake = null;
    this.previewSource = null;
    this.isPlayingPreview = false;
    this.listeners = new Set();
  }

  onStateChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(event, data) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, data);
      } catch (e) {
        console.error(e);
      }
    });
  }

  getRecordDestination() {
    const ctx = instrumentEngine.getAudioContext();
    if (!instrumentEngine.recordDestination) {
      instrumentEngine.recordDestination = ctx.createMediaStreamDestination();
      if (instrumentEngine.compressor) {
        instrumentEngine.compressor.connect(instrumentEngine.recordDestination);
      } else if (instrumentEngine.masterGain) {
        instrumentEngine.masterGain.connect(instrumentEngine.recordDestination);
      }
    }
    return instrumentEngine.recordDestination;
  }

  startRecording() {
    if (this.isRecording) return;
    const ctx = instrumentEngine.getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const dest = this.getRecordDestination();
    this.recordedChunks = [];
    this.elapsedSeconds = 0;

    let mimeType = 'audio/webm;codecs=opus';
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }
    } else {
      mimeType = '';
    }

    try {
      this.mediaRecorder = mimeType
        ? new MediaRecorder(dest.stream, { mimeType })
        : new MediaRecorder(dest.stream);
    } catch (err) {
      this.mediaRecorder = new MediaRecorder(dest.stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      await this.processRecordedTake();
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
    this.startTime = performance.now();

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = (performance.now() - this.startTime) / 1000;
      this.notify('timer', { elapsed: this.elapsedSeconds });
    }, 100);

    this.notify('start', { timestamp: this.startTime });
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  async processRecordedTake() {
    if (this.recordedChunks.length === 0) return;
    const mime = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
    const blob = new Blob(this.recordedChunks, { type: mime });
    const arrayBuffer = await blob.arrayBuffer();

    const ctx = instrumentEngine.getAudioContext();
    let audioBuffer = null;
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.warn('[StudioRecorder] Could not decode raw take arrayBuffer:', err);
      return;
    }

    // Convert decoded audio into studio 16-bit broadcast WAV
    const wavBlob = audioBufferToWav(audioBuffer);
    const inst = instrumentEngine.getInstrument();
    const cleanInstName = inst.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const now = new Date();
    const timeStr = `${now.getHours()}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `DanglingBeats_Take_${cleanInstName}_${timeStr}.wav`;

    this.lastTake = {
      audioBuffer,
      wavBlob,
      duration: Math.round(audioBuffer.duration * 100) / 100,
      filename,
      instName: inst.name,
      createdAt: now,
    };

    this.notify('take_ready', this.lastTake);
  }

  playTakePreview() {
    if (!this.lastTake || !this.lastTake.audioBuffer) return;
    this.stopTakePreview();

    const ctx = instrumentEngine.getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = this.lastTake.audioBuffer;
    source.connect(instrumentEngine.masterGain || ctx.destination);
    source.onended = () => {
      this.isPlayingPreview = false;
      this.notify('preview_ended', null);
    };

    source.start(0);
    this.previewSource = source;
    this.isPlayingPreview = true;
    this.notify('preview_started', null);
  }

  stopTakePreview() {
    if (this.previewSource) {
      try {
        this.previewSource.stop();
        this.previewSource.disconnect();
      } catch (_) {}
      this.previewSource = null;
    }
    this.isPlayingPreview = false;
    this.notify('preview_ended', null);
  }

  downloadTake(customFilename = null) {
    if (!this.lastTake || !this.lastTake.wavBlob) return;
    const name = customFilename || this.lastTake.filename;
    const url = URL.createObjectURL(this.lastTake.wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

export const studioRecorder = new StudioRecorder();

