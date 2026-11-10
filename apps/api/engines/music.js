// ============================================================================
// Dangling Dice Studios™ — Music Theory & Acoustic Engine
// High-performance music computation, chord logic, and delay acoustic physics
// ============================================================================

export const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ENHARMONIC_MAP = {
  'Db': 'C#',
  'D#': 'Eb',
  'Gb': 'F#',
  'G#': 'Ab',
  'A#': 'Bb',
  'B#': 'C',
  'Cb': 'B',
  'E#': 'F',
  'Fb': 'E',
};

export const SCALE_MAP = {
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
  blues: {
    name: 'Blues Scale',
    intervals: [0, 3, 5, 6, 7, 10],
    degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],
    mood: 'Soulful grit, blue notes, blues/hip-hop leads',
  },
};

export const TUNINGS = {
  guitar_standard: {
    name: 'Guitar Standard 6-String (E A D G B E)',
    strings: [
      { name: 'E4', openMidi: 64 },
      { name: 'B3', openMidi: 59 },
      { name: 'G3', openMidi: 55 },
      { name: 'D3', openMidi: 50 },
      { name: 'A2', openMidi: 45 },
      { name: 'E2', openMidi: 40 },
    ],
  },
  guitar_drop_d: {
    name: 'Guitar Drop D (D A D G B E)',
    strings: [
      { name: 'E4', openMidi: 64 },
      { name: 'B3', openMidi: 59 },
      { name: 'G3', openMidi: 55 },
      { name: 'D3', openMidi: 50 },
      { name: 'A2', openMidi: 45 },
      { name: 'D2', openMidi: 38 },
    ],
  },
  bass_standard: {
    name: 'Bass Standard 4-String (E A D G)',
    strings: [
      { name: 'G2', openMidi: 43 },
      { name: 'D2', openMidi: 38 },
      { name: 'A1', openMidi: 33 },
      { name: 'E1', openMidi: 28 },
    ],
  },
};

export const CHORD_PRESETS = {
  lofi_chill: {
    genre: 'Lo-Fi Chillhop',
    bpm: 82,
    key: 'Eb',
    scale: 'major',
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
    genre: 'Neo-Soul & Jazz',
    bpm: 88,
    key: 'F',
    scale: 'minor',
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
    genre: 'Synthwave / Retrowave',
    bpm: 118,
    key: 'A',
    scale: 'minor',
    chords: [
      { name: 'Am', numeral: 'i', rootOffset: 9, formula: [0, 3, 7], bass: 9 },
      { name: 'Fmaj7', numeral: 'VI', rootOffset: 5, formula: [0, 4, 7, 11], bass: 5 },
      { name: 'C', numeral: 'III', rootOffset: 0, formula: [0, 4, 7], bass: 0 },
      { name: 'G', numeral: 'VII', rootOffset: 7, formula: [0, 4, 7], bass: 7 },
    ],
  },
  dark_trap: {
    genre: 'Dark Trap & Phonk',
    bpm: 140,
    key: 'C',
    scale: 'minor',
    chords: [
      { name: 'Cm', numeral: 'i', rootOffset: 0, formula: [0, 3, 7], bass: 0 },
      { name: 'Dbmaj7', numeral: 'bII', rootOffset: 1, formula: [0, 4, 7, 11], bass: 1 },
      { name: 'Ab', numeral: 'VI', rootOffset: 8, formula: [0, 4, 7], bass: 8 },
      { name: 'G7', numeral: 'V7', rootOffset: 7, formula: [0, 4, 7, 10], bass: 7 },
    ],
  },
  math_rock: {
    genre: 'Midwest Emo / Math Rock',
    bpm: 104,
    key: 'D',
    scale: 'major',
    chords: [
      { name: 'Dadd9', numeral: 'Iadd9', rootOffset: 2, formula: [0, 4, 7, 14], bass: 2 },
      { name: 'Gmaj7', numeral: 'IVmaj7', rootOffset: 7, formula: [0, 4, 7, 11], bass: 7 },
      { name: 'Bm7', numeral: 'vi7', rootOffset: 11, formula: [0, 3, 7, 10], bass: 11 },
      { name: 'Aadd4', numeral: 'Vadd4', rootOffset: 9, formula: [0, 4, 5, 7], bass: 9 },
    ],
  },
  ambient_dream: {
    genre: 'Ambient Dreamscape',
    bpm: 72,
    key: 'C',
    scale: 'major',
    chords: [
      { name: 'Cmaj7', numeral: 'Imaj7', rootOffset: 0, formula: [0, 4, 7, 11], bass: 0 },
      { name: 'Em7', numeral: 'iii7', rootOffset: 4, formula: [0, 3, 7, 10], bass: 4 },
      { name: 'Fmaj9', numeral: 'IVmaj9', rootOffset: 5, formula: [0, 4, 7, 11, 14], bass: 5 },
      { name: 'Gsus2', numeral: 'Vsus2', rootOffset: 7, formula: [0, 2, 7], bass: 7 },
    ],
  },
};

/**
 * Normalizes any note name to standard 0-11 semitone
 */
export function normalizeNoteToSemitone(rawNote) {
  if (!rawNote || typeof rawNote !== 'string') return 0;
  let clean = rawNote.trim();
  clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  if (ENHARMONIC_MAP[clean]) {
    clean = ENHARMONIC_MAP[clean];
  }
  const idx = NOTE_NAMES.indexOf(clean);
  return idx !== -1 ? idx : 0;
}

/**
 * Frequency in Hz from MIDI note number
 */
export function midiToFrequency(midi) {
  return Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
}

/**
 * Resolves scale notes, degree names, frequencies and fretboard positions
 */
export function resolveScale({ root = 'C', scale = 'minor', tuning = 'guitar_standard', maxFret = 15 }) {
  const rootSemitone = normalizeNoteToSemitone(root);
  const scaleKey = scale.toLowerCase().replace(/[\s-]/g, '_');
  const scaleDef = SCALE_MAP[scaleKey] || SCALE_MAP.minor;

  const notes = scaleDef.intervals.map((interval, i) => {
    const semitone = (rootSemitone + interval) % 12;
    const name = NOTE_NAMES[semitone];
    return {
      degree: scaleDef.degrees[i],
      intervalSemitones: interval,
      name,
      semitone,
      frequencyOctave3: midiToFrequency(48 + semitone),
      frequencyOctave4: midiToFrequency(60 + semitone),
    };
  });

  const scaleSemitoneSet = new Set(notes.map((n) => n.semitone));

  // Calculate fretboard mappings
  const tuningDef = TUNINGS[tuning] || TUNINGS.guitar_standard;
  const fretboard = tuningDef.strings.map((str) => {
    const frets = [];
    for (let f = 0; f <= maxFret; f++) {
      const midi = str.openMidi + f;
      const semitone = midi % 12;
      const inScale = scaleSemitoneSet.has(semitone);
      if (inScale) {
        const matchedNote = notes.find((n) => n.semitone === semitone);
        frets.push({
          fret: f,
          midi,
          note: NOTE_NAMES[semitone],
          degree: matchedNote ? matchedNote.degree : '',
          frequency: midiToFrequency(midi),
          isRoot: semitone === rootSemitone,
        });
      }
    }
    return {
      stringName: str.name,
      openMidi: str.openMidi,
      frets,
    };
  });

  return {
    root: NOTE_NAMES[rootSemitone],
    scaleName: scaleDef.name,
    mood: scaleDef.mood,
    noteCount: notes.length,
    notes,
    tuning: tuningDef.name,
    fretboard,
  };
}

/**
 * Generates structured chord progression with MIDI pitches, bass, frequencies & voicings
 */
export function generateProgression({ preset = 'lofi_chill', key, baseOctave = 3 }) {
  const presetKey = preset.toLowerCase().replace(/[\s-]/g, '_');
  const config = CHORD_PRESETS[presetKey] || CHORD_PRESETS.lofi_chill;

  const targetKey = key || config.key;
  const rootOffsetShift = (normalizeNoteToSemitone(targetKey) - normalizeNoteToSemitone(config.key) + 12) % 12;

  const chords = config.chords.map((chord) => {
    const actualRootOffset = (chord.rootOffset + rootOffsetShift) % 12;
    const rootName = NOTE_NAMES[actualRootOffset];
    const rootMidi = baseOctave * 12 + actualRootOffset;

    const midiNotes = [];
    if (chord.bass !== undefined) {
      const actualBass = (chord.bass + rootOffsetShift) % 12;
      midiNotes.push((baseOctave - 1) * 12 + actualBass);
    }
    chord.formula.forEach((int) => {
      midiNotes.push(rootMidi + int);
    });

    const frequencies = midiNotes.map(midiToFrequency);
    const noteNames = midiNotes.map((m) => NOTE_NAMES[m % 12]);

    return {
      name: chord.name,
      numeral: chord.numeral,
      root: rootName,
      midiNotes,
      frequenciesHz: frequencies,
      noteNames,
      voicing: {
        bassNote: noteNames[0] || rootName,
        leadNote: noteNames[noteNames.length - 1],
        spreadSemitones: midiNotes[midiNotes.length - 1] - midiNotes[0],
      },
    };
  });

  return {
    preset: presetKey,
    genre: config.genre,
    key: targetKey,
    scale: config.scale,
    recommendedBpm: config.bpm,
    chordCount: chords.length,
    chords,
  };
}

/**
 * Calculates audio delay times, reverberation acoustic pre-delays, and sample lengths
 */
export function calculateDelayAcoustics({ bpm = 120, sampleRate = 44100 }) {
  const safeBpm = Math.max(20, Math.min(320, Number(bpm) || 120));
  const msPerBeat = 60000 / safeBpm; // Quarter note (1/4) in ms

  const divisions = [
    { label: '1/1 Whole', factor: 4 },
    { label: '1/2 Half', factor: 2 },
    { label: '1/4 Quarter', factor: 1 },
    { label: '1/8 Eighth', factor: 0.5 },
    { label: '1/16 Sixteenth', factor: 0.25 },
    { label: '1/32 Thirty-second', factor: 0.125 },
    { label: '1/64 Sixty-fourth', factor: 0.0625 },
  ];

  const timings = divisions.map((div) => {
    const straightMs = msPerBeat * div.factor;
    const dottedMs = straightMs * 1.5;
    const tripletMs = (straightMs * 2) / 3;

    return {
      division: div.label,
      straight: {
        ms: Math.round(straightMs * 100) / 100,
        hz: Math.round((1000 / straightMs) * 100) / 100,
        samples: Math.round((straightMs / 1000) * sampleRate),
      },
      dotted: {
        ms: Math.round(dottedMs * 100) / 100,
        hz: Math.round((1000 / dottedMs) * 100) / 100,
        samples: Math.round((dottedMs / 1000) * sampleRate),
      },
      triplet: {
        ms: Math.round(tripletMs * 100) / 100,
        hz: Math.round((1000 / tripletMs) * 100) / 100,
        samples: Math.round((tripletMs / 1000) * sampleRate),
      },
    };
  });

  const reverbPreDelays = {
    intimateRoom: { ms: Math.round((msPerBeat * 0.03125) * 100) / 100, desc: 'Tight reflections, drums & snappy vocals' },
    chamber: { ms: Math.round((msPerBeat * 0.0625) * 100) / 100, desc: 'Lush vocal depth without cluttering transients' },
    grandHall: { ms: Math.round((msPerBeat * 0.125) * 100) / 100, desc: 'Cinematic orchestral atmosphere & wide leads' },
    ambientSpace: { ms: Math.round((msPerBeat * 0.25) * 100) / 100, desc: 'Massive cavernous decay for synth pads' },
  };

  return {
    bpm: safeBpm,
    quarterNoteMs: Math.round(msPerBeat * 100) / 100,
    sampleRateHz: sampleRate,
    timings,
    reverbPreDelays,
  };
}

/**
 * Encodes variable-length quantity for MIDI
 */
function toVarInt(val) {
  let buffer = val & 0x7f;
  const bytes = [];
  while ((val >>= 7)) {
    buffer <<= 8;
    buffer |= (val & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

/**
 * Synthesizes a Standard MIDI File (SMF 0) binary buffer from note pitch arrays
 */
export function buildMidiBuffer({ chordEvents = [], bpm = 120, title = 'Dangling Beats Sequence' }) {
  const ticksPerQuarter = 480;
  const microsecondsPerBeat = Math.round(60000000 / bpm);

  const trackEvents = [];

  // Track Name meta event
  trackEvents.push(0x00, 0xff, 0x03, title.length, ...Array.from(Buffer.from(title, 'utf-8')));

  // Set Tempo meta event (FF 51 03 tt tt tt)
  trackEvents.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (microsecondsPerBeat >> 16) & 0xff,
    (microsecondsPerBeat >> 8) & 0xff,
    microsecondsPerBeat & 0xff
  );

  const durationTicks = ticksPerQuarter * 4; // 1 whole measure per chord

  chordEvents.forEach((ev) => {
    const pitches = ev.pitches || [60];

    // Note Ons at delta-time 0
    pitches.forEach((p, idx) => {
      const delta = idx === 0 ? 0 : 0;
      trackEvents.push(...toVarInt(delta), 0x90, p & 0x7f, 96);
    });

    // Note Offs after durationTicks
    pitches.forEach((p, idx) => {
      const delta = idx === 0 ? durationTicks : 0;
      trackEvents.push(...toVarInt(delta), 0x80, p & 0x7f, 0);
    });
  });

  // End of Track meta event
  trackEvents.push(0x00, 0xff, 0x2f, 0x00);

  // Header chunk (MThd, 6 bytes, format 0, 1 track, ticksPerQuarter)
  const header = Buffer.from([
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (ticksPerQuarter >> 8) & 0xff,
    ticksPerQuarter & 0xff,
  ]);

  // Track chunk (MTrk, length, data)
  const trackData = Buffer.from(trackEvents);
  const trackHeader = Buffer.alloc(8);
  trackHeader.write('MTrk', 0);
  trackHeader.writeUInt32BE(trackData.length, 4);

  return Buffer.concat([header, trackHeader, trackData]);
}
