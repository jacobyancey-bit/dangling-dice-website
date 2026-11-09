// ============================================================================
// Dangling Beats Studio™ — Music Theory & Audio Synthesis Engine
// Zero-dependency Web Audio polyphonic synthesizer, scale math, & MIDI writer
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const SCALE_DEFINITIONS = {
  minor: {
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
    mood: 'Emotional, Dark, Melancholic (Lofi & Trap staple)',
  },
  major: {
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    degrees: ['1', '2', '3', '4', '5', '6', '7'],
    mood: 'Bright, Uplifting, Soulful',
  },
  dorian: {
    name: 'Dorian Mode',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'],
    mood: 'Smooth, Jazzy, Sophisticated (Neo-Soul & Chillhop)',
  },
  phrygian: {
    name: 'Phrygian Mode',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
    mood: 'Tense, Ominous, Aggressive (Dark Trap & Phonk)',
  },
  lydian: {
    name: 'Lydian Mode',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    degrees: ['1', '2', '3', '#4', '5', '6', '7'],
    mood: 'Dreamy, Floating, Ethereal (Dreamcore & Ambient)',
  },
  mixolydian: {
    name: 'Mixolydian Mode',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    degrees: ['1', '2', '3', '4', '5', '6', 'b7'],
    mood: 'Funky, Bluesy, Driving Grooves',
  },
  harmonic_minor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'],
    mood: 'Dramatic, Classical, Drill & Dark Trap',
  },
  phrygian_dominant: {
    name: 'Phrygian Dominant (Spanish / Trap)',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    degrees: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
    mood: 'Middle-Eastern, Flamenco, Heavy Bass Trap',
  },
  lydian_dominant: {
    name: 'Lydian Dominant (#4 b7)',
    intervals: [0, 2, 4, 6, 7, 9, 10],
    degrees: ['1', '2', '3', '#4', '5', '6', 'b7'],
    mood: 'Fusion, Futuristic, Cyberpunk',
  },
  double_harmonic: {
    name: 'Double Harmonic (Byzantine)',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    degrees: ['1', 'b2', '3', '4', '5', 'b6', '7'],
    mood: 'Exotic, Cinematic, Psychedelic',
  },
  minor_pentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
    degrees: ['1', 'b3', '4', '5', 'b7'],
    mood: 'Classic Blues, Hip-Hop Soloing, Rock',
  },
  major_pentatonic: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    degrees: ['1', '2', '3', '5', '6'],
    mood: 'Pure, Organic, RnB Toplines',
  },
};

export const GUITAR_TUNINGS = {
  standard: {
    name: 'Standard (E A D G B E)',
    notes: [64, 59, 55, 50, 45, 40], // String 1 (High E) to String 6 (Low E)
  },
  drop_d: {
    name: 'Drop D (D A D G B E)',
    notes: [64, 59, 55, 50, 45, 38],
  },
  dadgad: {
    name: 'DADGAD (Celtic / Ambient)',
    notes: [62, 57, 55, 50, 45, 38],
  },
  open_d: {
    name: 'Open D (D A D F# A D)',
    notes: [62, 57, 54, 50, 45, 38],
  },
  bass_standard: {
    name: 'Standard Bass 4-String (E A D G)',
    notes: [43, 38, 33, 28],
  },
};

export const CHORD_PRESETS = {
  lofi_chill: {
    name: '☕ Lofi Chillhop & Rhodes',
    desc: 'Lush 9ths and 11ths with smooth chromatic voice leading.',
    defaultKey: 'Eb',
    defaultScale: 'major',
    bpm: 82,
    chords: [
      { name: 'Abmaj9', numeral: 'IVmaj9', rootOffset: 8, formula: [0, 4, 7, 11, 14], bass: 8 },
      { name: 'Gm7', numeral: 'iii7', rootOffset: 7, formula: [0, 3, 7, 10], bass: 7 },
      { name: 'Fm9', numeral: 'ii9', rootOffset: 5, formula: [0, 3, 7, 10, 14], bass: 5 },
      { name: 'Bb13', numeral: 'V13', rootOffset: 10, formula: [0, 4, 7, 10, 14, 21], bass: 10 },
      { name: 'Ebmaj9', numeral: 'Imaj9', rootOffset: 3, formula: [0, 4, 7, 11, 14], bass: 3 },
      { name: 'Cm11', numeral: 'vi11', rootOffset: 0, formula: [0, 3, 7, 10, 14, 17], bass: 0 },
    ],
  },
  neo_soul: {
    name: '🎷 Neo-Soul & Jazzy Warmth',
    desc: 'Secondary dominants, altered tensions, and deep soul substitutions.',
    defaultKey: 'F',
    defaultScale: 'minor',
    bpm: 88,
    chords: [
      { name: 'Bbm9', numeral: 'iv9', rootOffset: 10, formula: [0, 3, 7, 10, 14], bass: 10 },
      { name: 'Eb9', numeral: 'VII9', rootOffset: 3, formula: [0, 4, 7, 10, 14], bass: 3 },
      { name: 'Abmaj9', numeral: 'IIImaj9', rootOffset: 8, formula: [0, 4, 7, 11, 14], bass: 8 },
      { name: 'Dbmaj9', numeral: 'VImaj9', rootOffset: 1, formula: [0, 4, 7, 11, 14], bass: 1 },
      { name: 'G7#9', numeral: 'V/V', rootOffset: 7, formula: [0, 4, 7, 10, 15], bass: 7 },
      { name: 'C7b13', numeral: 'V7alt', rootOffset: 0, formula: [0, 4, 8, 10, 14], bass: 0 },
    ],
  },
  synthwave: {
    name: '🌆 Synthwave & Retrowave',
    desc: 'Nostalgic 80s minor progressions with open fifths and driving energy.',
    defaultKey: 'A',
    defaultScale: 'minor',
    bpm: 118,
    chords: [
      { name: 'Am', numeral: 'i', rootOffset: 9, formula: [0, 3, 7], bass: 9 },
      { name: 'Fmaj7', numeral: 'VI', rootOffset: 5, formula: [0, 4, 7, 11], bass: 5 },
      { name: 'C', numeral: 'III', rootOffset: 0, formula: [0, 4, 7], bass: 0 },
      { name: 'G', numeral: 'VII', rootOffset: 7, formula: [0, 4, 7], bass: 7 },
    ],
  },
  dark_trap: {
    name: '🦇 Dark Trap & 808 Drill',
    desc: 'Phrygian half-step tension and ominous harmonic minor voicings.',
    defaultKey: 'C',
    defaultScale: 'minor',
    bpm: 140,
    chords: [
      { name: 'Cm', numeral: 'i', rootOffset: 0, formula: [0, 3, 7], bass: 0 },
      { name: 'Dbmaj7', numeral: 'bII', rootOffset: 1, formula: [0, 4, 7, 11], bass: 1 },
      { name: 'Ab', numeral: 'VI', rootOffset: 8, formula: [0, 4, 7], bass: 8 },
      { name: 'G7', numeral: 'V7', rootOffset: 7, formula: [0, 4, 7, 10], bass: 7 },
    ],
  },
  math_rock: {
    name: '🎸 Midwest Emo & Math Rock',
    desc: 'Open tunings, sparkle add9 voicings, and clean nostalgic guitars.',
    defaultKey: 'D',
    defaultScale: 'major',
    bpm: 104,
    chords: [
      { name: 'Dadd9', numeral: 'Iadd9', rootOffset: 2, formula: [0, 4, 7, 14], bass: 2 },
      { name: 'Gmaj7', numeral: 'IVmaj7', rootOffset: 7, formula: [0, 4, 7, 11], bass: 7 },
      { name: 'Bm7', numeral: 'vi7', rootOffset: 11, formula: [0, 3, 7, 10], bass: 11 },
      { name: 'Aadd4', numeral: 'Vadd4', rootOffset: 9, formula: [0, 4, 5, 7], bass: 9 },
    ],
  },
  ambient_dream: {
    name: '🌌 Ambient Dreamscape',
    desc: 'Spacious suspended chords with gentle harmonic dissonance.',
    defaultKey: 'C',
    defaultScale: 'major',
    bpm: 72,
    chords: [
      { name: 'Cmaj7', numeral: 'Imaj7', rootOffset: 0, formula: [0, 4, 7, 11], bass: 0 },
      { name: 'Em7', numeral: 'iii7', rootOffset: 4, formula: [0, 3, 7, 10], bass: 4 },
      { name: 'Fmaj9', numeral: 'IVmaj9', rootOffset: 5, formula: [0, 4, 7, 11, 14], bass: 5 },
      { name: 'Gsus2', numeral: 'Vsus2', rootOffset: 7, formula: [0, 2, 7], bass: 7 },
    ],
  },
};

/**
 * Converts note name (e.g. "Eb", "C#") to base semitone offset (0-11)
 */
export function noteToSemitone(noteName) {
  const norm = noteName.trim();
  const idx = NOTE_NAMES.indexOf(norm);
  if (idx !== -1) return idx;
  // Handle enharmonics
  const map = { Db: 1, 'D#': 3, Gb: 6, 'A#': 10, 'G#': 8 };
  return map[norm] !== undefined ? map[norm] : 0;
}

/**
 * Returns MIDI note number to Frequency in Hz
 */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Generates an array of pitch frequencies for a chord given a root key and chord definition
 */
export function resolveChordMidiNotes(chordDef, baseOctave = 3) {
  const rootMidi = baseOctave * 12 + chordDef.rootOffset;
  const notes = [];
  
  // Add bass note an octave below
  if (chordDef.bass !== undefined) {
    notes.push((baseOctave - 1) * 12 + chordDef.bass);
  }

  // Add upper structure voicings
  chordDef.formula.forEach((interval) => {
    notes.push(rootMidi + interval);
  });

  return notes;
}

/**
 * ============================================================================
 * Web Audio Polyphonic Electric Piano / Rhodes Synthesizer
 * ============================================================================
 */
class StudioAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    // Master bus chain: filter -> gain -> compressor -> destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(4500, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-14, this.ctx.currentTime);
    comp.knee.setValueAtTime(8, this.ctx.currentTime);
    comp.ratio.setValueAtTime(3, this.ctx.currentTime);
    comp.attack.setValueAtTime(0.003, this.ctx.currentTime);
    comp.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.filter.connect(this.masterGain);
    this.masterGain.connect(comp);
    comp.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays a polyphonic chord via Web Audio API with a warm Rhodes electric piano envelope
   */
  playChord(midiNotes, durationSec = 1.6) {
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    midiNotes.forEach((midi, i) => {
      const freq = midiToFreq(midi);
      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      // Rhodes-style warmth: triangle main tone with subtle detuned sub harmonic
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 0.998, now); // micro-chorus detune

      // Individual velocity / staggered strum (15ms delay per note)
      const strumOffset = i * 0.015;
      const noteStart = now + strumOffset;

      // ADSR Envelope
      gainNode.gain.setValueAtTime(0.0001, noteStart);
      gainNode.gain.exponentialRampToValueAtTime(0.4 / Math.sqrt(midiNotes.length), noteStart + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.18 / Math.sqrt(midiNotes.length), noteStart + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteStart + durationSec);

      osc.connect(gainNode);
      subOsc.connect(gainNode);
      gainNode.connect(this.filter);

      osc.start(noteStart);
      subOsc.start(noteStart);
      osc.stop(noteStart + durationSec + 0.05);
      subOsc.stop(noteStart + durationSec + 0.05);
    });
  }

  /**
   * Auditions a single note (used by Fretboard & Keyboard visualizer)
   */
  playSingleNote(midi, durationSec = 0.9) {
    this.playChord([midi], durationSec);
  }
}

export const studioAudio = new StudioAudioEngine();

/**
 * ============================================================================
 * Standard MIDI File (Format 0) Binary Generator
 * Pure client-side ArrayBuffer encoder — zero npm dependencies
 * ============================================================================
 */
/**
 * Generic Standard MIDI File (SMF 0) Encoder
 */
export function encodeStandardMidiFile(events, bpm = 120, trackName = 'Dangling Beats MIDI') {
  const TICKS_PER_BEAT = 480;
  const trackBytes = [];

  function writeVarInt(value) {
    let buffer = value & 0x7f;
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      trackBytes.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
  }

  // 1. Meta Event: Set Tempo
  const usPerBeat = Math.round(60000000 / bpm);
  trackBytes.push(0x00, 0xff, 0x51, 0x03);
  trackBytes.push((usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff);

  // 2. Meta Event: Track Name
  const safeName = String(trackName);
  trackBytes.push(0x00, 0xff, 0x03, safeName.length);
  for (let i = 0; i < safeName.length; i++) {
    trackBytes.push(safeName.charCodeAt(i));
  }

  // 3. Encode Note Events
  let pendingDelta = 0;
  events.forEach((ev) => {
    const dur = ev.durationTicks || 120;
    if (ev.pitches && ev.pitches.length > 0) {
      // Note On for all pitches
      ev.pitches.forEach((midi, idx) => {
        writeVarInt(idx === 0 ? pendingDelta : 0);
        trackBytes.push(0x90, midi, 0x5a); // 0x90 = Note On, Vel 90
      });
      pendingDelta = 0;

      // Note Off for all pitches
      ev.pitches.forEach((midi, idx) => {
        writeVarInt(idx === 0 ? dur : 0);
        trackBytes.push(0x80, midi, 0x00); // 0x80 = Note Off
      });
    } else {
      // Rest
      pendingDelta += dur;
    }
  });

  // 4. Meta Event: End of Track
  writeVarInt(pendingDelta);
  trackBytes.push(0xff, 0x2f, 0x00);

  // 5. Construct MThd (Header Chunk)
  const headerBytes = [
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x00, // Format 0
    0x00, 0x01, // 1 track
    (TICKS_PER_BEAT >> 8) & 0xff,
    TICKS_PER_BEAT & 0xff,
  ];

  // 6. Construct MTrk (Track Chunk)
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b,
    (trackBytes.length >> 24) & 0xff,
    (trackBytes.length >> 16) & 0xff,
    (trackBytes.length >> 8) & 0xff,
    trackBytes.length & 0xff,
  ];

  const fullFile = new Uint8Array(headerBytes.length + trackHeader.length + trackBytes.length);
  fullFile.set(headerBytes, 0);
  fullFile.set(trackHeader, headerBytes.length);
  fullFile.set(trackBytes, headerBytes.length + trackHeader.length);

  return fullFile;
}

/**
 * Encodes an array of chord progression objects into SMF 0
 */
export function buildMidiFile({ chords, bpm = 85, beatsPerChord = 4 }) {
  const TICKS_PER_BEAT = 480;
  const chordDurationTicks = beatsPerChord * TICKS_PER_BEAT;

  const events = chords.map((chord) => ({
    pitches: resolveChordMidiNotes(chord),
    durationTicks: chordDurationTicks,
  }));

  return encodeStandardMidiFile(events, bpm, 'Dangling Beats Progression');
}

/**
 * Triggers a client-side file download of the generated MIDI sequence
 */
export function downloadMidiFile(midiUint8Array, filename = 'chord-progression.mid') {
  const blob = new Blob([midiUint8Array], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

