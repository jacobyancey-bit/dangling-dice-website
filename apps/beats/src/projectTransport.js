/**
 * ============================================================================
 * Dangling Beats Studio™ — Unified Project Transport & Web Audio Clock
 * Single source of truth for Project Tempo (BPM), 4/4 Timing, Loop Bounds,
 * Metronome Click, Count-in, Multitrack Sequencer, and Event Scheduling.
 * ============================================================================
 */

import { instrumentEngine } from './instrumentEngine.js';
import { encodeStandardMidiFile, downloadMidiFile } from './theoryEngine.js';

class ProjectTransport {
  constructor() {
    this.bpm = 90;
    this.timeSignature = [4, 4];
    this.loopBars = 4; // 1, 2, 4, 8, 16 bars
    this.isPlaying = false;
    this.isRecording = false;
    this.isCountIn = false;
    this.countInBars = 1; // 1-bar count-in before recording
    this.metronomeEnabled = false;
    this.metronomeVolume = 0.6;

    // Track Mute States
    this.mutedTracks = {
      piano: false,
      drums: false,
      chords: false,
    };

    // High-precision Web Audio Lookahead Scheduling state
    this.lookaheadMs = 25.0; // Interval for check timer (ms)
    this.scheduleAheadTime = 0.1; // Window to schedule events into future (seconds)
    this.schedulerTimer = null;
    this.next16thNoteTime = 0.0;
    this.current16thStep = 0; // 0 to (loopBars * 16 - 1)
    this.countInStep = 0;

    // Multitrack MIDI / Performance Events
    // Each track contains an array of musical events: { step: number, note: number, durationSteps: number, velocity: number, type?: string }
    this.tracks = {
      piano: [],
      drums: [],
      chords: [],
    };

    // Active real-time armed track for recording
    this.armedTrack = 'piano'; // 'piano' | 'drums'

    // Subscribed UI listeners
    this.listeners = new Set();
  }

  get totalSteps() {
    return this.loopBars * 16;
  }

  get secondsPer16th() {
    return 60.0 / this.bpm / 4.0;
  }

  get secondsPerBeat() {
    return 60.0 / this.bpm;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.listeners.forEach((fn) => {
      try {
        fn(event, payload);
      } catch (e) {
        console.error('[ProjectTransport listener error]', e);
      }
    });
  }

  setBpm(newBpm) {
    const safe = Math.max(40, Math.min(260, Math.round(Number(newBpm) || 90)));
    this.bpm = safe;
    this.notify('bpm', { bpm: safe });
  }

  setLoopBars(bars) {
    const valid = [1, 2, 4, 8, 16].includes(Number(bars)) ? Number(bars) : 4;
    this.loopBars = valid;
    // Constrain steps within new loop boundary
    if (this.current16thStep >= this.totalSteps) {
      this.current16thStep = 0;
    }
    this.notify('loopBars', { loopBars: valid, totalSteps: this.totalSteps });
  }

  setArmedTrack(trackId) {
    if (['piano', 'drums'].includes(trackId)) {
      this.armedTrack = trackId;
      this.notify('armedTrack', { armedTrack: trackId });
    }
  }

  toggleMetronome() {
    this.metronomeEnabled = !this.metronomeEnabled;
    this.notify('metronome', { enabled: this.metronomeEnabled });
    return this.metronomeEnabled;
  }

  start(record = false) {
    const ctx = instrumentEngine.getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (this.isPlaying) {
      if (record && !this.isRecording) {
        this.isRecording = true;
        this.notify('recordState', { isRecording: true });
      }
      return;
    }

    this.isPlaying = true;
    this.isRecording = record;

    if (record && this.countInBars > 0) {
      this.isCountIn = true;
      this.countInStep = 0;
    } else {
      this.isCountIn = false;
    }

    this.current16thStep = 0;
    this.next16thNoteTime = ctx.currentTime + 0.05;

    this.schedulerTimer = setInterval(() => this.schedulerLoop(), this.lookaheadMs);
    this.notify('playState', {
      isPlaying: true,
      isRecording: this.isRecording,
      isCountIn: this.isCountIn,
    });
  }

  stop() {
    this.isPlaying = false;
    this.isRecording = false;
    this.isCountIn = false;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.current16thStep = 0;
    this.countInStep = 0;
    this.notify('playState', { isPlaying: false, isRecording: false, isCountIn: false, currentStep: 0 });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start(false);
    }
  }

  toggleRecord() {
    if (this.isRecording) {
      this.isRecording = false;
      this.notify('recordState', { isRecording: false });
    } else {
      if (!this.isPlaying) {
        this.start(true);
      } else {
        this.isRecording = true;
        this.notify('recordState', { isRecording: true });
      }
    }
  }

  schedulerLoop() {
    const ctx = instrumentEngine.getAudioContext();
    while (this.next16thNoteTime < ctx.currentTime + this.scheduleAheadTime) {
      if (this.isCountIn) {
        this.scheduleCountInStep(this.next16thNoteTime, this.countInStep);
        this.advanceCountIn();
      } else {
        this.schedule16thStep(this.next16thNoteTime, this.current16thStep);
        this.advance16th();
      }
    }
  }

  advanceCountIn() {
    this.next16thNoteTime += this.secondsPer16th;
    this.countInStep++;
    // 1 bar count-in = 16 sixteenths
    if (this.countInStep >= this.countInBars * 16) {
      this.isCountIn = false;
      this.current16thStep = 0;
      this.notify('countInFinished', {});
    }
  }

  advance16th() {
    this.next16thNoteTime += this.secondsPer16th;
    this.current16thStep = (this.current16thStep + 1) % this.totalSteps;
  }

  scheduleCountInStep(time, stepIdx) {
    // Click only on quarter note beats (every 4 sixteenths)
    if (stepIdx % 4 === 0) {
      const beatNum = Math.floor(stepIdx / 4) + 1;
      this.playMetronomeClick(time, beatNum === 1);
      setTimeout(() => {
        this.notify('countInTick', { beat: beatNum, total: this.countInBars * 4 });
      }, Math.max(0, (time - instrumentEngine.getAudioContext().currentTime) * 1000));
    }
  }

  schedule16thStep(time, stepIdx) {
    // 1. Metronome click on beat if enabled or recording
    const isQuarterBeat = stepIdx % 4 === 0;
    if (isQuarterBeat && (this.metronomeEnabled || this.isRecording)) {
      const isDownbeat = stepIdx % 16 === 0;
      this.playMetronomeClick(time, isDownbeat);
    }

    // 2. Schedule sequenced Drum events
    if (!this.mutedTracks.drums && Array.isArray(this.tracks.drums)) {
      this.tracks.drums.forEach((hit) => {
        if (hit.step === stepIdx) {
          this.triggerDrumSoundAtTime(hit.type || hit.note, time, hit.velocity || 0.85);
        }
      });
    }

    // 3. Schedule sequenced Piano / Melodic events
    if (!this.mutedTracks.piano && Array.isArray(this.tracks.piano)) {
      this.tracks.piano.forEach((ev) => {
        if (ev.step === stepIdx) {
          const durSec = (ev.durationSteps || 2) * this.secondsPer16th * 0.95;
          this.triggerPianoSoundAtTime(ev.note, time, durSec, ev.velocity || 0.85);
        }
      });
    }

    // 4. Notify UI of current playhead position
    const delayMs = Math.max(0, (time - instrumentEngine.getAudioContext().currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying && !this.isCountIn) {
        this.notify('step', {
          step: stepIdx,
          bar: Math.floor(stepIdx / 16) + 1,
          beat: Math.floor((stepIdx % 16) / 4) + 1,
          totalSteps: this.totalSteps,
        });
      }
    }, delayMs);
  }

  playMetronomeClick(time, isAccent = false) {
    const ctx = instrumentEngine.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1600 : 800, time);

    const baseVol = this.metronomeVolume;
    gain.gain.setValueAtTime(isAccent ? baseVol : baseVol * 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  triggerDrumSoundAtTime(drumIdOrNote, time, velocity = 0.85) {
    // Direct audio engine trigger scheduled precisely in Web Audio timeline
    instrumentEngine.playDrumSoundScheduled(drumIdOrNote, time, velocity);
  }

  triggerPianoSoundAtTime(midiNote, time, duration = 0.4, velocity = 0.85) {
    instrumentEngine.playNoteScheduled(midiNote, time, duration, velocity);
  }

  // Real-time Event Recording methods
  recordLiveEvent(trackId, data) {
    if (!this.isRecording || this.isCountIn || !this.isPlaying) return;
    const targetTrack = trackId || this.armedTrack;
    if (!this.tracks[targetTrack]) this.tracks[targetTrack] = [];

    // Quantize to nearest sixteenth step
    const currentStep = this.current16thStep;

    if (targetTrack === 'drums') {
      const type = data.type || data.padId || 'kick';
      // Overdub without creating duplicates on the exact same step
      const existingIdx = this.tracks.drums.findIndex((d) => d.step === currentStep && d.type === type);
      if (existingIdx === -1) {
        this.tracks.drums.push({
          step: currentStep,
          type: type,
          note: data.note || 36,
          velocity: data.velocity || 0.85,
        });
        this.notify('trackUpdated', { track: 'drums', items: this.tracks.drums });
      }
    } else if (targetTrack === 'piano') {
      const note = data.note;
      if (!note) return;
      this.tracks.piano.push({
        step: currentStep,
        note: note,
        durationSteps: data.durationSteps || 2,
        velocity: data.velocity || 0.85,
      });
      this.notify('trackUpdated', { track: 'piano', items: this.tracks.piano });
    }
  }

  // Manual Step Sequencer Grid toggling
  toggleDrumStep(drumType, stepIdx) {
    if (!this.tracks.drums) this.tracks.drums = [];
    const idx = this.tracks.drums.findIndex((d) => d.step === stepIdx && d.type === drumType);
    if (idx !== -1) {
      this.tracks.drums.splice(idx, 1);
    } else {
      this.tracks.drums.push({
        step: stepIdx,
        type: drumType,
        note: 36,
        velocity: 0.85,
      });
    }
    this.notify('trackUpdated', { track: 'drums', items: this.tracks.drums });
  }

  hasDrumStep(drumType, stepIdx) {
    if (!this.tracks.drums) return false;
    return this.tracks.drums.some((d) => d.step === stepIdx && d.type === drumType);
  }

  toggleTrackMute(trackId) {
    if (this.mutedTracks[trackId] !== undefined) {
      this.mutedTracks[trackId] = !this.mutedTracks[trackId];
      this.notify('muteState', { track: trackId, isMuted: this.mutedTracks[trackId] });
      return this.mutedTracks[trackId];
    }
    return false;
  }

  // Toggle Piano Note on step grid
  togglePianoNote(stepIdx, note, durationSteps = 2, velocity = 0.85) {
    if (!this.tracks.piano) this.tracks.piano = [];
    const idx = this.tracks.piano.findIndex((n) => n.step === stepIdx && n.note === note);
    if (idx !== -1) {
      this.tracks.piano.splice(idx, 1);
    } else {
      this.tracks.piano.push({
        step: stepIdx,
        note: note,
        durationSteps: durationSteps,
        velocity: velocity,
      });
      // Audition note immediately
      instrumentEngine.playNote(note, 0.25, velocity);
    }
    this.notify('trackUpdated', { track: 'piano', items: this.tracks.piano });
  }

  hasPianoNote(stepIdx, note) {
    if (!this.tracks.piano) return false;
    return this.tracks.piano.some((n) => n.step === stepIdx && n.note === note);
  }

  quantizeTrack(trackId) {
    if (!this.tracks[trackId]) return;
    // Quantize step index to integers within loop bounds and deduplicate
    if (trackId === 'piano') {
      const seen = new Set();
      this.tracks.piano = this.tracks.piano.filter((n) => {
        n.step = Math.max(0, Math.min(this.totalSteps - 1, Math.round(n.step)));
        const key = `${n.step}_${n.note}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else if (trackId === 'drums') {
      const seen = new Set();
      this.tracks.drums = this.tracks.drums.filter((d) => {
        d.step = Math.max(0, Math.min(this.totalSteps - 1, Math.round(d.step)));
        const key = `${d.step}_${d.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    this.notify('trackUpdated', { track: trackId, items: this.tracks[trackId] });
  }

  exportProjectMidi(filename = `Dangling_Beats_Project_${this.bpm}BPM.mid`) {
    // Convert 16th steps to 120 MIDI ticks (where TICKS_PER_BEAT = 480)
    const TICKS_PER_16TH = 120;
    const midiEvents = [];

    // Map drum sound types to Standard GM Drum Map
    const DRUM_NOTE_MAP = {
      kick: 36,
      kick_punchy: 36,
      kick_acoustic: 36,
      '808': 36,
      snare: 38,
      snare_acoustic: 38,
      hat: 42,
      hihat: 42,
      hat_closed: 42,
      clap: 39,
      woodblock: 76,
      perc: 76,
    };

    for (let s = 0; s < this.totalSteps; s++) {
      const pitches = [];

      // Add piano notes on this step
      if (Array.isArray(this.tracks.piano)) {
        this.tracks.piano.forEach((n) => {
          if (n.step === s && n.note) pitches.push(n.note);
        });
      }

      // Add drum notes on this step
      if (Array.isArray(this.tracks.drums)) {
        this.tracks.drums.forEach((d) => {
          if (d.step === s) {
            const gmNote = DRUM_NOTE_MAP[d.type] || d.note || 36;
            pitches.push(gmNote);
          }
        });
      }

      midiEvents.push({
        durationTicks: TICKS_PER_16TH,
        pitches: pitches,
      });
    }

    const midiBytes = encodeStandardMidiFile(midiEvents, this.bpm, 'Dangling Beats Studio Loop');
    downloadMidiFile(midiBytes, filename);
  }

  clearTrack(trackId) {
    if (this.tracks[trackId]) {
      this.tracks[trackId] = [];
      this.notify('trackUpdated', { track: trackId, items: [] });
    }
  }

  clearAll() {
    this.tracks.piano = [];
    this.tracks.drums = [];
    this.tracks.chords = [];
    this.notify('trackUpdated', { track: 'all', items: [] });
  }
}

export const projectTransport = new ProjectTransport();
