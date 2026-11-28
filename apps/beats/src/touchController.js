/**
 * Dangling Beats Studio™ — Multi-Instrument Hardware & Touch Controller Engine
 * 
 * Provides interactive performance surfaces:
 * - Left: Piano Keyboard
 * - Middle: Drum Pad
 * - Right: Guitar Fretboard
 * 
 * Supported Edit / Performance Modes across all instruments:
 * 1. Single Notes (Chromatic piano keys, drum one-shots, guitar frets)
 * 2. Chords (Harmonic piano voicings, layered drum stacks, strummable guitar shapes)
 * 3. Slices (Genre-based slice chops: Funk, Jazz, Metal, Lofi, Trap, Blues)
 */

import { instrumentEngine, DRUM_KITS } from './instrumentEngine.js';
import { midiEngine } from './midiEngine.js';
import { sampleEngine } from './sampleEngine.js';

// ============================================================================
// CONSTANTS & CATALOGS
// ============================================================================

export const CONTROLLER_INSTRUMENTS = [
  { id: 'piano', name: 'Piano Keyboard', icon: '', shortcut: 'Left' },
  { id: 'drums', name: 'Drum Pad', icon: '', shortcut: 'Middle' },
  { id: 'guitar', name: 'Guitar Fretboard', icon: '', shortcut: 'Right' },
];

export const CONTROLLER_MODES = [
  { id: 'notes', name: 'Single Notes', icon: '', desc: 'Individual notes, frets, and drum one-shots' },
  { id: 'chords', name: 'Chords', icon: '', desc: 'Harmonic voicings, layered drum chords, and guitar strums' },
  { id: 'slices', name: 'Slices (Genre-Based)', icon: '', desc: 'Live musical chops & loops categorized by genre' },
];

export const GENRES_CATALOG = [
  { id: 'funk', name: 'Funk', icon: '', desc: 'Syncopated 16th clavs, breakbeat chops, muted scratches' },
  { id: 'jazz', name: 'Jazz & Neo-Soul', icon: '', desc: 'Lush 9th/11th chords, swing ride chops, bebop runs' },
  { id: 'metal', name: 'Metal & Rock', icon: '', desc: 'Palm-muted chugs, double-bass blasts, high-gain riffs' },
  { id: 'lofi', name: 'Lofi & Chillhop', icon: '', desc: 'Dusty vinyl Rhodes, boom-bap chops, mellow nylon plucks' },
  { id: 'trap', name: 'Trap & Drill', icon: '', desc: '808 slides, fast hi-hat rolls, dark acoustic stabs' },
  { id: 'blues', name: 'Blues & Soul', icon: '', desc: '12-bar turnarounds, shuffle swing chops, pentatonic bends' },
];

// Piano Chord Presets
export const PIANO_CHORDS_CATALOG = [
  { id: 'c_maj7', name: 'C Maj7', notes: [48, 55, 59, 64], desc: 'Lush open Major 7th' },
  { id: 'd_min9', name: 'D Min9', notes: [50, 53, 57, 60, 64], desc: 'Smooth Neo-Soul Minor 9th' },
  { id: 'e_min7', name: 'E Min7', notes: [52, 55, 59, 62], desc: 'Warm 7th voicing' },
  { id: 'f_maj9', name: 'F Maj9', notes: [53, 57, 60, 64, 67], desc: 'Dreamy Major 9th' },
  { id: 'g_dom13', name: 'G 13', notes: [55, 65, 71, 76], desc: 'Funky Dominant 13th' },
  { id: 'a_min11', name: 'A Min11', notes: [45, 52, 55, 60, 62], desc: 'Deep atmospheric 11th' },
  { id: 'b_m7b5', name: 'B m7b5', notes: [47, 53, 57, 62], desc: 'Tense Half-Diminished' },
  { id: 'c_add9', name: 'C Add9', notes: [48, 52, 55, 62], desc: 'Bright Pop Shimmer' },
  { id: 'bb_maj7', name: 'Bb Maj7', notes: [46, 53, 57, 62], desc: 'Gospel / R&B lift' },
  { id: 'eb_maj9', name: 'Eb Maj9', notes: [51, 55, 58, 62, 65], desc: 'Rich jazz tonic' },
  { id: 'ab_maj7', name: 'Ab Maj7', notes: [44, 51, 55, 60], desc: 'Romantic ballad chord' },
  { id: 'd7_alt', name: 'D7 Alt', notes: [50, 54, 60, 63, 68], desc: 'Jazz altered turnaround' },
  { id: 'g7_sus4', name: 'G7 Sus4', notes: [55, 60, 62, 65], desc: 'Suspended tension' },
  { id: 'c_min_maj7', name: 'C m(Maj7)', notes: [48, 51, 55, 59], desc: 'Cinematic spy minor' },
  { id: 'f_min9', name: 'F Min9', notes: [53, 56, 60, 63, 67], desc: 'Moody trap minor' },
  { id: 'neo_quartal', name: 'C Quartal', notes: [48, 53, 58, 63, 68], desc: 'Modern 4th stack' },
];

// ============================================================================
// FULL QWERTY KEYBOARD MAPS (EXCLUSIVE PER INSTRUMENT)
// ============================================================================

// Piano: 2+ Chromatic Octaves across entire keyboard
export const PIANO_FULL_KEY_MAP = {
  // Lower Octave (Base octave: C to E+1)
  'Z': { offset: 0, note: 'C' },
  'S': { offset: 1, note: 'C#' },
  'X': { offset: 2, note: 'D' },
  'D': { offset: 3, note: 'D#' },
  'C': { offset: 4, note: 'E' },
  'V': { offset: 5, note: 'F' },
  'G': { offset: 6, note: 'F#' },
  'B': { offset: 7, note: 'G' },
  'H': { offset: 8, note: 'G#' },
  'N': { offset: 9, note: 'A' },
  'J': { offset: 10, note: 'A#' },
  'M': { offset: 11, note: 'B' },
  ',': { offset: 12, note: 'C' },
  'L': { offset: 13, note: 'C#' },
  '.': { offset: 14, note: 'D' },
  ';': { offset: 15, note: 'D#' },
  '/': { offset: 16, note: 'E' },

  // Upper Octave (Base octave + 12: C+1 to G+2)
  'Q': { offset: 12, note: 'C' },
  '2': { offset: 13, note: 'C#' },
  'W': { offset: 14, note: 'D' },
  '3': { offset: 15, note: 'D#' },
  'E': { offset: 16, note: 'E' },
  'R': { offset: 17, note: 'F' },
  '5': { offset: 18, note: 'F#' },
  'T': { offset: 19, note: 'G' },
  '6': { offset: 20, note: 'G#' },
  'Y': { offset: 21, note: 'A' },
  '7': { offset: 22, note: 'A#' },
  'U': { offset: 23, note: 'B' },
  'I': { offset: 24, note: 'C' },
  '9': { offset: 25, note: 'C#' },
  'O': { offset: 26, note: 'D' },
  '0': { offset: 27, note: 'D#' },
  'P': { offset: 28, note: 'E' },
  '[': { offset: 29, note: 'F' },
  '=': { offset: 30, note: 'F#' },
  ']': { offset: 31, note: 'G' },
};

// Guitar: 4-Row Mapping (Open Strings, Melody Frets, Mid Riffs, Bass & Strum Chords)
export const GUITAR_FULL_KEY_MAP = {
  // Row 1: Open Strings plucks (1-6) + high notes
  '1': { type: 'string', midi: 64, name: 'String 1 (High E)' },
  '2': { type: 'string', midi: 59, name: 'String 2 (B)' },
  '3': { type: 'string', midi: 55, name: 'String 3 (G)' },
  '4': { type: 'string', midi: 50, name: 'String 4 (D)' },
  '5': { type: 'string', midi: 45, name: 'String 5 (A)' },
  '6': { type: 'string', midi: 40, name: 'String 6 (Low E)' },
  '7': { type: 'note', midi: 65, name: 'F4' },
  '8': { type: 'note', midi: 67, name: 'G4' },
  '9': { type: 'note', midi: 69, name: 'A4' },
  '0': { type: 'note', midi: 71, name: 'B4' },

  // Row 2: Solo Lead Frets (Q - ])
  'Q': { type: 'note', midi: 64, name: 'E4 (Fret 0)' },
  'W': { type: 'note', midi: 65, name: 'F4 (Fret 1)' },
  'E': { type: 'note', midi: 66, name: 'F#4 (Fret 2)' },
  'R': { type: 'note', midi: 67, name: 'G4 (Fret 3)' },
  'T': { type: 'note', midi: 68, name: 'G#4 (Fret 4)' },
  'Y': { type: 'note', midi: 69, name: 'A4 (Fret 5)' },
  'U': { type: 'note', midi: 70, name: 'A#4 (Fret 6)' },
  'I': { type: 'note', midi: 71, name: 'B4 (Fret 7)' },
  'O': { type: 'note', midi: 72, name: 'C5 (Fret 8)' },
  'P': { type: 'note', midi: 73, name: 'C#5 (Fret 9)' },
  '[': { type: 'note', midi: 74, name: 'D5 (Fret 10)' },
  ']': { type: 'note', midi: 76, name: 'E5 (Fret 12)' },

  // Row 3: Mid Riffing Frets (A - ')
  'A': { type: 'note', midi: 50, name: 'D3' },
  'S': { type: 'note', midi: 52, name: 'E3' },
  'D': { type: 'note', midi: 53, name: 'F3' },
  'F': { type: 'note', midi: 55, name: 'G3' },
  'G': { type: 'note', midi: 57, name: 'A3' },
  'H': { type: 'note', midi: 59, name: 'B3' },
  'J': { type: 'note', midi: 60, name: 'C4' },
  'K': { type: 'note', midi: 62, name: 'D4' },
  'L': { type: 'note', midi: 64, name: 'E4' },
  ';': { type: 'note', midi: 65, name: 'F4' },
  "'": { type: 'note', midi: 67, name: 'G4' },

  // Row 4: Bass plucks + 6 Classic Guitar Chords
  'Z': { type: 'note', midi: 40, name: 'Low E2' },
  'X': { type: 'note', midi: 43, name: 'G2' },
  'C': { type: 'note', midi: 45, name: 'A2' },
  'V': { type: 'note', midi: 47, name: 'B2' },
  'B': { type: 'chord', idx: 0, name: 'Open Em' },
  'N': { type: 'chord', idx: 1, name: 'Open C' },
  'M': { type: 'chord', idx: 2, name: 'Open G' },
  ',': { type: 'chord', idx: 3, name: 'Open D' },
  '.': { type: 'chord', idx: 4, name: 'Open Am' },
  '/': { type: 'chord', idx: 5, name: 'F Barre' },
};

// Helper function to build 16th-step sequenced drum beat events
export function beatEvents(bpm, stepList) {
  const secPer16th = (60 / bpm) / 4;
  return stepList.map(([step, sound, vel]) => ({
    time: Number((step * secPer16th).toFixed(4)),
    sound,
    vel: vel !== undefined ? vel : 0.95
  }));
}

// ============================================================================
// DRUM SECTIONS: MAIN PARTS, 1-MEASURE FILLS, AND 4-MEASURE BUILDUPS
// ============================================================================

// 1. Foundational Main Parts (16 Core Grooves for Verses, Choruses, and Main Pockets)
export const DRUM_MAIN_PARTS_CATALOG = [
  {
    id: 'mp_1',
    name: 'Heavy Downbeat Pocket',
    desc: 'Driving kick on 1 & 3, solid backbeat snare, 8th hi-hats',
    category: 'main',
    measures: 1,
    bpm: 110,
    events: beatEvents(110, [
      [0, 'kick_acoustic', 1.0], [0, 'ride_bell', 0.8], [2, 'hat_closed', 0.65],
      [4, 'snare_rim', 1.0], [6, 'hat_closed', 0.65],
      [8, 'kick_acoustic', 0.95], [10, 'hat_open', 0.75],
      [12, 'snare_rim', 1.0], [14, 'hat_closed', 0.65]
    ])
  },
  {
    id: 'mp_2',
    name: 'Driving 8th Rock Pocket',
    desc: 'Steady 8th-note hat drive with punchy kick-snare backbeat',
    category: 'main',
    measures: 1,
    bpm: 124,
    events: beatEvents(124, [
      [0, 'kick_acoustic', 1.0], [0, 'hat_closed', 0.7], [2, 'hat_closed', 0.7],
      [4, 'snare_acoustic', 1.0], [4, 'hat_closed', 0.7], [6, 'kick_acoustic', 0.85], [6, 'hat_closed', 0.7],
      [8, 'kick_acoustic', 0.95], [8, 'hat_closed', 0.7], [10, 'hat_closed', 0.7],
      [12, 'snare_acoustic', 1.0], [12, 'hat_closed', 0.7], [14, 'hat_open', 0.8]
    ])
  },
  {
    id: 'mp_3',
    name: 'Syncopated Funk Pocket',
    desc: 'Syncopated ghost snares, tight kicks, and 16th hat groove',
    category: 'main',
    measures: 1,
    bpm: 105,
    events: beatEvents(105, [
      [0, 'kick_acoustic', 1.0], [1, 'hat_closed', 0.5], [2, 'hat_closed', 0.7], [3, 'snare_acoustic', 0.3],
      [4, 'snare_rim', 1.0], [5, 'hat_closed', 0.5], [6, 'hat_closed', 0.7], [7, 'kick_acoustic', 0.9],
      [8, 'hat_closed', 0.7], [9, 'snare_acoustic', 0.35], [10, 'kick_acoustic', 0.9], [11, 'hat_open', 0.75],
      [12, 'snare_rim', 1.0], [13, 'hat_closed', 0.5], [14, 'hat_closed', 0.7], [15, 'snare_acoustic', 0.4]
    ])
  },
  {
    id: 'mp_4',
    name: 'Trap 808 Main Drop',
    desc: 'Deep 808 sub bass, rapid 16th hats, and snappy center clap',
    category: 'main',
    measures: 1,
    bpm: 140,
    events: beatEvents(140, [
      [0, '808_sub', 1.0], [0, '808_hat_closed', 0.8], [1, '808_hat_closed', 0.6], [2, '808_hat_closed', 0.75], [3, '808_hat_closed', 0.6],
      [4, '808_clap', 1.0], [4, '808_hat_closed', 0.8], [5, '808_hat_closed', 0.6], [6, '808_sub', 0.9], [6, '808_hat_closed', 0.75], [7, '808_hat_closed', 0.6],
      [8, '808_hat_closed', 0.8], [9, '808_hat_closed', 0.6], [10, '808_sub', 0.95], [10, '808_hat_closed', 0.75], [11, '808_hat_closed', 0.6],
      [12, '808_clap', 1.0], [12, '808_hat_closed', 0.8], [13, '808_hat_closed', 0.6], [14, '808_hat_open', 0.9], [15, '808_hat_closed', 0.6]
    ])
  },
  {
    id: 'mp_5',
    name: 'Boom-Bap Golden Era',
    desc: 'Behind-the-grid swung kick and lazy acoustic snare pocket',
    category: 'main',
    measures: 1,
    bpm: 88,
    events: beatEvents(88, [
      [0, 'kick_acoustic', 1.0], [2.2, 'hat_closed', 0.65],
      [4.2, 'snare_acoustic', 1.0], [6.2, 'hat_closed', 0.65],
      [7.2, 'kick_acoustic', 0.85], [8, 'kick_acoustic', 0.9], [10.2, 'hat_closed', 0.65],
      [12.2, 'snare_acoustic', 1.0], [14.2, 'hat_open', 0.75]
    ])
  },
  {
    id: 'mp_6',
    name: 'Four-on-the-Floor Disco Funk',
    desc: 'Constant 4-beat kick pulse with open hi-hat upbeats',
    category: 'main',
    measures: 1,
    bpm: 122,
    events: beatEvents(122, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_open', 0.85],
      [4, 'kick_acoustic', 1.0], [4, 'snare_rim', 0.95], [4, 'clap_acoustic', 0.8], [6, 'hat_open', 0.85],
      [8, 'kick_acoustic', 1.0], [10, 'hat_open', 0.85],
      [12, 'kick_acoustic', 1.0], [12, 'snare_rim', 0.95], [12, 'clap_acoustic', 0.8], [14, 'hat_open', 0.85]
    ])
  },
  {
    id: 'mp_7',
    name: '909 House / Techno Drive',
    desc: 'Heavy 909 kick punch, snappy club clap, and open hat groove',
    category: 'main',
    measures: 1,
    bpm: 128,
    events: beatEvents(128, [
      [0, '909_kick', 1.0], [0, '909_hat_closed', 0.6], [2, '909_hat_open', 0.9],
      [4, '909_kick', 1.0], [4, '909_clap', 1.0], [6, '909_hat_open', 0.9],
      [8, '909_kick', 1.0], [10, '909_hat_open', 0.9],
      [12, '909_kick', 1.0], [12, '909_clap', 1.0], [14, '909_hat_open', 0.9]
    ])
  },
  {
    id: 'mp_8',
    name: 'Motown R&B Soul Stomp',
    desc: 'Warm acoustic kick, rimshot on 2 & 4, and tambourine accents',
    category: 'main',
    measures: 1,
    bpm: 116,
    events: beatEvents(116, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.7],
      [4, 'snare_rim', 1.0], [4, 'tambourine', 0.9], [6, 'kick_acoustic', 0.85],
      [8, 'kick_acoustic', 0.95], [10, 'hat_closed', 0.7],
      [12, 'snare_rim', 1.0], [12, 'tambourine', 0.9], [14, 'hat_open', 0.75]
    ])
  },
  {
    id: 'mp_9',
    name: 'Afrobeat Polyrhythm Main',
    desc: 'Syncopated cross-stick pattern, conga thumps, and shaker drive',
    category: 'main',
    measures: 1,
    bpm: 118,
    events: beatEvents(118, [
      [0, 'kick_acoustic', 1.0], [1, 'tambourine', 0.5], [2, 'sidestick', 0.85], [3, 'tambourine', 0.5],
      [4, 'tom_mid', 0.8], [5, 'tambourine', 0.5], [6, 'kick_acoustic', 0.9], [7, 'sidestick', 0.9],
      [8, 'tom_high', 0.8], [9, 'tambourine', 0.5], [10, 'kick_acoustic', 0.85], [11, 'tambourine', 0.5],
      [12, 'sidestick', 0.95], [13, 'tambourine', 0.5], [14, 'tom_floor', 0.85], [15, 'tambourine', 0.5]
    ])
  },
  {
    id: 'mp_10',
    name: 'Bebop Jazz Ride Swing',
    desc: 'Classic spang-a-lang ride swing with feathered kick & pedal hat',
    category: 'main',
    measures: 1,
    bpm: 132,
    events: beatEvents(132, [
      [0, 'ride_acoustic', 0.9], [0, 'kick_acoustic', 0.35],
      [2.6, 'ride_acoustic', 0.7],
      [4, 'ride_bell', 0.95], [4, 'hat_pedal', 0.9], [4, 'kick_acoustic', 0.3],
      [6.6, 'ride_acoustic', 0.7], [7, 'snare_acoustic', 0.4],
      [8, 'ride_acoustic', 0.9], [8, 'kick_acoustic', 0.35],
      [10.6, 'ride_acoustic', 0.7],
      [12, 'ride_bell', 0.95], [12, 'hat_pedal', 0.9], [12, 'kick_acoustic', 0.3],
      [14.6, 'ride_acoustic', 0.7]
    ])
  },
  {
    id: 'mp_11',
    name: 'Double-Bass Metal Drive',
    desc: 'Galloping 16th double-bass kick wall with aggressive snare cracks',
    category: 'main',
    measures: 1,
    bpm: 150,
    events: beatEvents(150, [
      [0, 'kick_acoustic', 1.0], [0, 'china_acoustic', 0.9], [1, 'kick_acoustic', 0.9],
      [2, 'kick_acoustic', 0.9], [3, 'kick_acoustic', 0.9],
      [4, 'snare_rim', 1.0], [5, 'kick_acoustic', 0.9],
      [6, 'kick_acoustic', 0.9], [7, 'kick_acoustic', 0.9],
      [8, 'kick_acoustic', 1.0], [8, 'crash_acoustic', 0.85], [9, 'kick_acoustic', 0.9],
      [10, 'kick_acoustic', 0.9], [11, 'kick_acoustic', 0.9],
      [12, 'snare_rim', 1.0], [13, 'kick_acoustic', 0.9],
      [14, 'kick_acoustic', 0.9], [15, 'kick_acoustic', 0.9]
    ])
  },
  {
    id: 'mp_12',
    name: 'Latin Bossa Nova Main',
    desc: 'Soft clave cross-stick with syncopated bass drum heartbeat',
    category: 'main',
    measures: 1,
    bpm: 112,
    events: beatEvents(112, [
      [0, 'kick_acoustic', 0.8], [0, 'sidestick', 0.9], [2, 'hat_closed', 0.6],
      [3, 'sidestick', 0.85], [4, 'hat_closed', 0.6],
      [6, 'kick_acoustic', 0.75], [6, 'sidestick', 0.9],
      [8, 'kick_acoustic', 0.8], [10, 'sidestick', 0.9],
      [11, 'kick_acoustic', 0.75], [12, 'hat_closed', 0.6],
      [14, 'kick_acoustic', 0.75], [14, 'hat_open', 0.7]
    ])
  },
  {
    id: 'mp_13',
    name: 'Reggae One-Drop Pocket',
    desc: 'Zero kick on 1, explosive kick and snare dropped together on 3',
    category: 'main',
    measures: 1,
    bpm: 78,
    events: beatEvents(78, [
      [0, 'sidestick', 0.7], [2, 'hat_open', 0.8],
      [4, 'hat_closed', 0.6], [6, 'hat_open', 0.8],
      [8, 'kick_acoustic', 1.0], [8, 'snare_rim', 1.0], [10, 'hat_open', 0.8],
      [12, 'hat_closed', 0.6], [14, 'hat_open', 0.85]
    ])
  },
  {
    id: 'mp_14',
    name: 'Neo-Soul Slag Pocket',
    desc: 'Unquantized lazy pocket, dragging rimshots, and loose hats',
    category: 'main',
    measures: 1,
    bpm: 82,
    events: beatEvents(82, [
      [0, 'kick_acoustic', 0.95], [2.1, 'hat_closed', 0.6],
      [4.3, 'snare_rim', 0.95], [6.2, 'hat_closed', 0.6],
      [7.1, 'kick_acoustic', 0.85], [8.1, 'hat_closed', 0.6],
      [10.2, 'kick_acoustic', 0.9], [11.2, 'hat_open', 0.7],
      [12.3, 'snare_rim', 0.95], [14.2, 'hat_closed', 0.6]
    ])
  },
  {
    id: 'mp_15',
    name: 'UK Garage 2-Step Drive',
    desc: 'Skippy syncopated kicks with crisp 16th shuffles and snap snares',
    category: 'main',
    measures: 1,
    bpm: 134,
    events: beatEvents(134, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.7], [3, 'hat_closed', 0.5],
      [4, 'snare_acoustic', 1.0], [6, 'hat_closed', 0.7], [7, 'kick_acoustic', 0.9],
      [8, 'hat_closed', 0.7], [10, 'kick_acoustic', 0.95], [11, 'hat_open', 0.8],
      [12, 'snare_acoustic', 1.0], [14, 'hat_closed', 0.7], [15, 'hat_closed', 0.5]
    ])
  },
  {
    id: 'mp_16',
    name: 'Hard Rock Chorus Wall',
    desc: 'Massive crash cymbal downbeats with thunderous acoustic shells',
    category: 'main',
    measures: 1,
    bpm: 120,
    events: beatEvents(120, [
      [0, 'kick_acoustic', 1.0], [0, 'crash_acoustic', 1.0], [2, 'hat_closed', 0.7],
      [4, 'snare_rim', 1.0], [6, 'kick_acoustic', 0.9], [6, 'hat_closed', 0.7],
      [8, 'kick_acoustic', 1.0], [8, 'crash_acoustic', 0.9], [10, 'kick_acoustic', 0.85],
      [12, 'snare_rim', 1.0], [14, 'hat_open', 0.85]
    ])
  }
];

// 2. Single-Measure Fills (16 Dynamic 1-Measure / 1-Bar Drum Fills)
export const DRUM_SINGLE_MEASURE_FILLS = [
  {
    id: 'f1m_1',
    name: 'Tom Waterfall 1-Bar Fill',
    desc: 'Pocket on beats 1-2, rolling High-Mid-Floor tom descent on 3-4',
    category: 'fill_1m',
    measures: 1,
    bpm: 120,
    events: beatEvents(120, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.6], [4, 'snare_rim', 1.0], [6, 'kick_acoustic', 0.8],
      [8, 'tom_high', 0.9], [9, 'tom_high', 0.95], [10, 'tom_mid', 0.9], [11, 'tom_mid', 0.95],
      [12, 'tom_floor', 0.95], [13, 'tom_floor', 1.0], [14, 'snare_rim', 1.0], [15, 'tom_floor', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_2',
    name: '16th Snare Crescendo 1-Bar',
    desc: 'Dynamic ghost-snare volume swell accelerating into explosive crack',
    category: 'fill_1m',
    measures: 1,
    bpm: 120,
    events: beatEvents(120, [
      [0, 'kick_acoustic', 1.0], [4, 'snare_rim', 0.8],
      [8, 'snare_acoustic', 0.35], [9, 'snare_acoustic', 0.45], [10, 'snare_acoustic', 0.55], [11, 'snare_acoustic', 0.65],
      [12, 'snare_acoustic', 0.75], [13, 'snare_acoustic', 0.85], [14, 'snare_rim', 0.95], [15, 'snare_rim', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_3',
    name: 'Double-Kick Stutter 1-Bar',
    desc: 'Rapid 16th double-bass bursts with alternating snare rimshots',
    category: 'fill_1m',
    measures: 1,
    bpm: 128,
    events: beatEvents(128, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.6], [4, 'snare_rim', 1.0],
      [6, 'kick_acoustic', 0.85], [7, 'kick_acoustic', 0.9],
      [8, 'kick_acoustic', 0.95], [9, 'kick_acoustic', 0.95], [10, 'snare_rim', 0.95],
      [11, 'kick_acoustic', 0.95], [12, 'kick_acoustic', 1.0], [13, 'snare_rim', 1.0],
      [14, 'kick_acoustic', 1.0], [15, 'snare_rim', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_4',
    name: 'Ghost Snare Rush 1-Bar',
    desc: 'Subtle syncopated ghost notes rolling across beats 3 & 4',
    category: 'fill_1m',
    measures: 1,
    bpm: 110,
    events: beatEvents(110, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.6], [4, 'snare_rim', 1.0],
      [6, 'snare_acoustic', 0.35], [7, 'snare_acoustic', 0.4], [8, 'kick_acoustic', 0.9],
      [9, 'snare_acoustic', 0.45], [10, 'snare_acoustic', 0.55], [11, 'snare_acoustic', 0.65],
      [12, 'tom_mid', 0.9], [13, 'tom_floor', 0.95], [14, 'snare_rim', 1.0], [15, 'tom_floor', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_5',
    name: 'Hi-Hat Sizzle Choke 1-Bar',
    desc: 'Rapid open-hat sizzle roll choked abruptly on the downbeat',
    category: 'fill_1m',
    measures: 1,
    bpm: 115,
    events: beatEvents(115, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_open', 0.85], [3, 'hat_pedal', 0.9],
      [4, 'snare_rim', 1.0], [6, 'hat_open', 0.85], [7, 'hat_pedal', 0.9],
      [8, 'hat_open', 0.7], [9, 'hat_open', 0.75], [10, 'hat_open', 0.8], [11, 'hat_open', 0.85],
      [12, 'hat_open', 0.9], [13, 'hat_open', 0.95], [14, 'snare_rim', 1.0], [15, 'hat_pedal', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_6',
    name: 'Flam Accent Cascade 1-Bar',
    desc: 'Alternating hand flams across snare, high tom, and floor tom',
    category: 'fill_1m',
    measures: 1,
    bpm: 112,
    events: beatEvents(112, [
      [0, 'kick_acoustic', 1.0], [2, 'snare_acoustic', 0.3], [2.2, 'snare_rim', 0.9],
      [4, 'snare_rim', 1.0],
      [6, 'tom_high', 0.3], [6.2, 'tom_high', 0.9],
      [8, 'tom_mid', 0.35], [8.2, 'tom_mid', 0.95],
      [10, 'tom_floor', 0.4], [10.2, 'tom_floor', 0.95],
      [12, 'snare_rim', 1.0], [13, 'tom_floor', 0.9], [14, 'snare_rim', 1.0], [15, 'tom_floor', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_7',
    name: 'Trap 808 Triplet Stutter 1-Bar',
    desc: '1/32nd triplet snare roll stutter into thunderous 808 sub dive',
    category: 'fill_1m',
    measures: 1,
    bpm: 140,
    events: beatEvents(140, [
      [0, '808_sub', 1.0], [2, '808_hat_closed', 0.7], [4, '808_clap', 1.0],
      [6, '808_snare', 0.4], [6.5, '808_snare', 0.5], [7, '808_snare', 0.6], [7.5, '808_snare', 0.7],
      [8, '808_snare', 0.75], [8.5, '808_snare', 0.8], [9, '808_snare', 0.85], [9.5, '808_snare', 0.9],
      [10, '808_snare', 0.95], [11, '808_clap', 1.0],
      [12, '808_tom_low', 0.9], [13, '808_tom_low', 0.95], [14, '808_snare', 1.0], [15, '808_snare', 1.0],
      [16, '808_crash', 1.0], [16, '808_sub', 1.0]
    ])
  },
  {
    id: 'f1m_8',
    name: 'Linear Funk Chops 1-Bar',
    desc: 'No overlapping hits: kick-snare-tom-hat precise linear phrase',
    category: 'fill_1m',
    measures: 1,
    bpm: 106,
    events: beatEvents(106, [
      [0, 'kick_acoustic', 1.0], [1, 'hat_closed', 0.7], [2, 'snare_acoustic', 0.8], [3, 'tom_high', 0.85],
      [4, 'kick_acoustic', 0.9], [5, 'hat_closed', 0.75], [6, 'snare_rim', 0.95], [7, 'tom_mid', 0.85],
      [8, 'kick_acoustic', 0.95], [9, 'hat_open', 0.8], [10, 'tom_floor', 0.9], [11, 'snare_acoustic', 0.85],
      [12, 'kick_acoustic', 1.0], [13, 'tom_floor', 0.95], [14, 'snare_rim', 1.0], [15, 'hat_pedal', 0.9],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_9',
    name: 'Rimshot Crack & Roll 1-Bar',
    desc: 'Rapid machine-gun rimshots rolling into deep floor tom thump',
    category: 'fill_1m',
    measures: 1,
    bpm: 118,
    events: beatEvents(118, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.6], [4, 'sidestick', 0.9],
      [8, 'sidestick', 0.7], [9, 'sidestick', 0.75], [10, 'sidestick', 0.8], [11, 'sidestick', 0.85],
      [12, 'snare_rim', 0.95], [13, 'tom_mid', 0.95], [14, 'tom_floor', 1.0], [15, 'tom_floor', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_10',
    name: 'Bebop Triplet Turnaround 1-Bar',
    desc: 'Swung jazz triplet roll across snare rim and ride bell',
    category: 'fill_1m',
    measures: 1,
    bpm: 130,
    events: beatEvents(130, [
      [0, 'ride_bell', 0.9], [0, 'kick_acoustic', 0.4],
      [4, 'hat_pedal', 0.9],
      [6, 'snare_acoustic', 0.6], [7.3, 'snare_acoustic', 0.7],
      [8.6, 'snare_acoustic', 0.8], [10, 'tom_high', 0.85],
      [11.3, 'tom_mid', 0.9], [12.6, 'tom_floor', 0.95],
      [14, 'snare_rim', 1.0], [15, 'snare_rim', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 0.8]
    ])
  },
  {
    id: 'f1m_11',
    name: 'Breakbeat Ghost Churn 1-Bar',
    desc: 'Classic amen-style syncopated ghost snare rolls & kicks',
    category: 'fill_1m',
    measures: 1,
    bpm: 136,
    events: beatEvents(136, [
      [0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.7], [4, 'snare_rim', 1.0],
      [6, 'snare_acoustic', 0.4], [7, 'snare_acoustic', 0.45],
      [8, 'kick_acoustic', 0.9], [10, 'kick_acoustic', 0.95], [11, 'snare_acoustic', 0.5],
      [12, 'snare_rim', 1.0], [14, 'snare_acoustic', 0.5], [15, 'snare_rim', 0.95],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_12',
    name: 'Floor Tom Thunder Stomp 1-Bar',
    desc: 'Heavy floor tom and kick syncopation creating deep rumble',
    category: 'fill_1m',
    measures: 1,
    bpm: 114,
    events: beatEvents(114, [
      [0, 'kick_acoustic', 1.0], [4, 'snare_rim', 0.9],
      [8, 'tom_floor', 0.9], [8, 'kick_acoustic', 0.9],
      [10, 'tom_floor', 0.95], [10, 'kick_acoustic', 0.95],
      [12, 'tom_floor', 1.0], [12, 'snare_rim', 1.0],
      [14, 'tom_floor', 1.0], [15, 'tom_floor', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_13',
    name: 'Afrobeat Shaker & Cross-Stick 1-Bar',
    desc: '16th shaker syncopation with rapid cross-stick turnaround',
    category: 'fill_1m',
    measures: 1,
    bpm: 116,
    events: beatEvents(116, [
      [0, 'tambourine', 0.8], [2, 'sidestick', 0.9], [4, 'tambourine', 0.8],
      [6, 'sidestick', 0.8], [7, 'sidestick', 0.85],
      [8, 'tom_high', 0.9], [10, 'tom_mid', 0.95],
      [12, 'sidestick', 0.95], [13, 'sidestick', 1.0], [14, 'tom_floor', 1.0], [15, 'sidestick', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_14',
    name: 'Metal Blast Stutter 1-Bar',
    desc: 'High-speed alternating kick and snare blast with china accents',
    category: 'fill_1m',
    measures: 1,
    bpm: 155,
    events: beatEvents(155, [
      [0, 'kick_acoustic', 1.0], [0, 'china_acoustic', 0.9],
      [4, 'snare_rim', 1.0],
      [8, 'kick_acoustic', 1.0], [9, 'snare_rim', 1.0],
      [10, 'kick_acoustic', 1.0], [11, 'snare_rim', 1.0],
      [12, 'kick_acoustic', 1.0], [13, 'snare_rim', 1.0],
      [14, 'kick_acoustic', 1.0], [15, 'snare_rim', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  },
  {
    id: 'f1m_15',
    name: 'Lofi SP-404 Glitch Repeat 1-Bar',
    desc: 'Stuttering tape-delayed snare chop with filtered boom kick',
    category: 'fill_1m',
    measures: 1,
    bpm: 86,
    events: beatEvents(86, [
      [0, 'lofi_kick', 1.0], [4, 'lofi_snare', 0.9],
      [8, 'lofi_snare', 0.6], [9, 'lofi_snare', 0.7], [10, 'lofi_snare', 0.8],
      [11, 'lofi_rim', 0.85], [12, 'lofi_snare', 0.9], [13, 'lofi_snare', 0.95],
      [14, 'lofi_snare', 1.0], [15, 'lofi_snare', 1.0],
      [16, 'crash_acoustic', 0.9], [16, 'lofi_kick', 1.0]
    ])
  },
  {
    id: 'f1m_16',
    name: 'Tutti All-In Power Stop 1-Bar',
    desc: 'Unison ensemble punches on beats 1-3 then rapid snare burst',
    category: 'fill_1m',
    measures: 1,
    bpm: 110,
    events: beatEvents(110, [
      [0, 'kick_acoustic', 1.0], [0, 'snare_rim', 1.0], [0, 'crash_acoustic', 0.9],
      [4, 'kick_acoustic', 1.0], [4, 'snare_rim', 1.0],
      [8, 'kick_acoustic', 1.0], [8, 'snare_rim', 1.0],
      [12, 'snare_acoustic', 0.7], [13, 'snare_acoustic', 0.8], [14, 'snare_rim', 0.95], [15, 'snare_rim', 1.0],
      [16, 'crash_acoustic', 1.0], [16, 'kick_acoustic', 1.0]
    ])
  }
];

// Helper to construct structured 4-measure buildup fills
export function make4MeasureFill(id, name, desc, bpm, bar1, bar2, bar3, bar4) {
  const allSteps = [
    ...bar1.map(([s, snd, v]) => [s, snd, v]),
    ...bar2.map(([s, snd, v]) => [s + 16, snd, v]),
    ...bar3.map(([s, snd, v]) => [s + 32, snd, v]),
    ...bar4.map(([s, snd, v]) => [s + 48, snd, v]),
    [64, 'crash_acoustic', 1.0],
    [64, 'kick_acoustic', 1.0]
  ];
  return {
    id,
    name,
    desc,
    category: 'fill_4m',
    measures: 4,
    bpm,
    events: beatEvents(bpm, allSteps)
  };
}

// 3. Four-Measure Extended Buildup Fills (16 Multi-Bar Progressive Fills with Drop Resolution)
export const DRUM_FOUR_MEASURE_FILLS = [
  make4MeasureFill(
    'b4m_1',
    'Epic 4-Bar Tom & Snare Buildup',
    'Bar 1 groove strip -> Bar 2 floor tom pulse -> Bar 3 snare swell -> Bar 4 tom cascade drop',
    120,
    [[0, 'kick_acoustic', 0.9], [0, 'ride_bell', 0.8], [2, 'hat_closed', 0.6], [4, 'snare_rim', 0.85], [6, 'hat_closed', 0.6], [8, 'kick_acoustic', 0.85], [10, 'hat_open', 0.7], [12, 'snare_rim', 0.85], [14, 'snare_acoustic', 0.4]],
    [[0, 'kick_acoustic', 0.95], [0, 'tom_floor', 0.8], [2, 'tom_floor', 0.8], [4, 'snare_rim', 0.9], [4, 'tom_floor', 0.85], [6, 'kick_acoustic', 0.9], [6, 'tom_floor', 0.85], [8, 'tom_floor', 0.9], [10, 'tom_floor', 0.9], [12, 'snare_rim', 0.95], [12, 'tom_floor', 0.95], [14, 'tom_floor', 1.0]],
    [[0, 'snare_acoustic', 0.35], [1, 'snare_acoustic', 0.4], [2, 'snare_acoustic', 0.45], [3, 'snare_acoustic', 0.5], [4, 'snare_acoustic', 0.55], [5, 'snare_acoustic', 0.6], [6, 'snare_acoustic', 0.65], [7, 'snare_acoustic', 0.7], [8, 'tom_high', 0.85], [9, 'tom_high', 0.9], [10, 'tom_mid', 0.9], [11, 'tom_mid', 0.95], [12, 'tom_floor', 0.95], [13, 'snare_acoustic', 0.85], [14, 'snare_rim', 0.95], [15, 'kick_acoustic', 1.0]],
    [[0, 'kick_acoustic', 1.0], [0, 'tom_high', 0.95], [1, 'tom_high', 0.95], [2, 'tom_mid', 0.95], [3, 'tom_mid', 1.0], [4, 'tom_floor', 1.0], [5, 'tom_floor', 1.0], [6, 'kick_acoustic', 1.0], [7, 'snare_acoustic', 0.7], [8, 'snare_acoustic', 0.8], [9, 'snare_acoustic', 0.9], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'snare_rim', 1.0], [13, 'snare_rim', 1.0], [14, 'tom_floor', 1.0], [15, 'tom_floor', 1.0]]
  ),
  make4MeasureFill(
    'b4m_2',
    '4-Bar Trap Riser & 808 Sub Drop',
    'Bar 1 offbeat clap -> Bar 2 8th snare rise -> Bar 3 16th roll -> Bar 4 1/32 stutter drop',
    140,
    [[0, '808_sub', 1.0], [4, '808_clap', 0.9], [8, '808_hat_open', 0.8], [12, '808_clap', 0.95]],
    [[0, '808_snare', 0.4], [2, '808_snare', 0.5], [4, '808_snare', 0.6], [6, '808_snare', 0.65], [8, '808_snare', 0.7], [10, '808_snare', 0.75], [12, '808_snare', 0.8], [14, '808_snare', 0.85]],
    [[0, '808_snare', 0.7], [1, '808_snare', 0.75], [2, '808_snare', 0.8], [3, '808_snare', 0.8], [4, '808_snare', 0.85], [5, '808_snare', 0.85], [6, '808_snare', 0.9], [7, '808_snare', 0.9], [8, '808_tom_low', 0.9], [10, '808_tom_mid', 0.95], [12, '808_tom_hi', 1.0], [14, '808_clap', 1.0]],
    [[0, '808_snare', 0.8], [0.5, '808_snare', 0.85], [1, '808_snare', 0.9], [1.5, '808_snare', 0.9], [2, '808_snare', 0.95], [2.5, '808_snare', 0.95], [3, '808_snare', 1.0], [4, '808_clap', 1.0], [6, '808_clap', 1.0], [8, '808_snare', 1.0], [9, '808_snare', 1.0], [10, '808_snare', 1.0], [11, '808_snare', 1.0]]
  ),
  make4MeasureFill(
    'b4m_3',
    '4-Bar Rock Stadium Crescendo',
    'Bar 1 crash accents -> Bar 2 8th floor tom -> Bar 3 16th rolling surge -> Bar 4 flam barrage',
    124,
    [[0, 'kick_acoustic', 1.0], [0, 'crash_acoustic', 0.9], [4, 'snare_rim', 1.0], [8, 'kick_acoustic', 0.95], [8, 'crash_acoustic', 0.85], [12, 'snare_rim', 1.0]],
    [[0, 'kick_acoustic', 1.0], [0, 'tom_floor', 0.85], [2, 'tom_floor', 0.85], [4, 'snare_rim', 0.95], [4, 'tom_floor', 0.9], [6, 'tom_floor', 0.9], [8, 'kick_acoustic', 1.0], [8, 'tom_floor', 0.95], [10, 'tom_floor', 0.95], [12, 'snare_rim', 1.0], [14, 'tom_floor', 1.0]],
    [[0, 'kick_acoustic', 1.0], [1, 'kick_acoustic', 0.9], [2, 'tom_high', 0.85], [3, 'tom_high', 0.9], [4, 'tom_mid', 0.9], [5, 'tom_mid', 0.95], [6, 'tom_floor', 0.95], [7, 'tom_floor', 1.0], [8, 'snare_acoustic', 0.8], [9, 'snare_acoustic', 0.85], [10, 'snare_acoustic', 0.9], [11, 'snare_acoustic', 0.95], [12, 'snare_rim', 1.0], [13, 'snare_rim', 1.0], [14, 'kick_acoustic', 1.0], [15, 'kick_acoustic', 1.0]],
    [[0, 'kick_acoustic', 1.0], [1, 'kick_acoustic', 0.9], [2, 'tom_high', 0.95], [3, 'tom_high', 0.95], [4, 'tom_mid', 1.0], [5, 'tom_mid', 1.0], [6, 'tom_floor', 1.0], [7, 'tom_floor', 1.0], [8, 'snare_rim', 1.0], [9, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'tom_floor', 1.0], [13, 'tom_floor', 1.0], [14, 'kick_acoustic', 1.0], [15, 'snare_rim', 1.0]]
  ),
  make4MeasureFill(
    'b4m_4',
    '4-Bar Funk Breakdown & Turnaround',
    'Bar 1 stripped pocket -> Bar 2 ghost weave -> Bar 3 linear chop shift -> Bar 4 3-tom turnaround',
    106,
    [[0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.7], [4, 'snare_rim', 0.95], [6, 'hat_closed', 0.7], [8, 'kick_acoustic', 0.9], [11, 'hat_open', 0.75], [12, 'snare_rim', 0.95]],
    [[0, 'kick_acoustic', 1.0], [2, 'snare_acoustic', 0.35], [3, 'hat_closed', 0.6], [4, 'snare_rim', 0.95], [6, 'snare_acoustic', 0.4], [7, 'kick_acoustic', 0.85], [8, 'hat_open', 0.7], [9, 'snare_acoustic', 0.45], [10, 'kick_acoustic', 0.9], [12, 'snare_rim', 1.0], [14, 'snare_acoustic', 0.5]],
    [[0, 'kick_acoustic', 1.0], [1, 'hat_closed', 0.7], [2, 'snare_acoustic', 0.7], [3, 'tom_high', 0.8], [4, 'kick_acoustic', 0.9], [5, 'hat_closed', 0.7], [6, 'snare_rim', 0.9], [7, 'tom_mid', 0.85], [8, 'kick_acoustic', 0.95], [9, 'hat_open', 0.8], [10, 'tom_floor', 0.9], [11, 'snare_acoustic', 0.8], [12, 'kick_acoustic', 1.0], [13, 'snare_rim', 0.95], [14, 'tom_floor', 0.95], [15, 'hat_pedal', 0.9]],
    [[0, 'tom_high', 0.9], [1, 'tom_high', 0.95], [2, 'tom_mid', 0.9], [3, 'tom_mid', 0.95], [4, 'tom_floor', 0.95], [5, 'tom_floor', 1.0], [6, 'snare_acoustic', 0.8], [7, 'snare_acoustic', 0.85], [8, 'snare_rim', 0.95], [9, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'kick_acoustic', 1.0], [13, 'kick_acoustic', 1.0], [14, 'hat_open', 0.9], [15, 'hat_pedal', 1.0]]
  ),
  make4MeasureFill(
    'b4m_5',
    '4-Bar Electronic 909 Build & Drop',
    'Bar 1 4-on-floor pulse -> Bar 2 8th snare -> Bar 3 16th roll -> Bar 4 1/32nd club drop',
    128,
    [[0, '909_kick', 1.0], [2, '909_hat_open', 0.8], [4, '909_kick', 1.0], [4, '909_rim', 0.9], [6, '909_hat_open', 0.8], [8, '909_kick', 1.0], [10, '909_hat_open', 0.8], [12, '909_kick', 1.0], [12, '909_rim', 0.9], [14, '909_hat_open', 0.8]],
    [[0, '909_kick', 1.0], [0, '909_snare', 0.4], [2, '909_snare', 0.5], [4, '909_kick', 1.0], [4, '909_snare', 0.6], [6, '909_snare', 0.65], [8, '909_kick', 1.0], [8, '909_snare', 0.7], [10, '909_snare', 0.75], [12, '909_kick', 1.0], [12, '909_snare', 0.8], [14, '909_snare', 0.85]],
    [[0, '909_snare', 0.7], [1, '909_snare', 0.75], [2, '909_snare', 0.75], [3, '909_snare', 0.8], [4, '909_snare', 0.8], [5, '909_snare', 0.85], [6, '909_snare', 0.85], [7, '909_snare', 0.9], [8, '909_snare', 0.9], [9, '909_snare', 0.9], [10, '909_snare', 0.95], [11, '909_snare', 0.95], [12, '909_snare', 1.0], [13, '909_snare', 1.0], [14, '909_clap', 1.0], [15, '909_clap', 1.0]],
    [[0, '909_snare', 0.85], [0.5, '909_snare', 0.9], [1, '909_snare', 0.9], [1.5, '909_snare', 0.95], [2, '909_snare', 0.95], [2.5, '909_snare', 0.95], [3, '909_snare', 1.0], [4, '909_clap', 1.0], [5, '909_clap', 1.0], [6, '909_snare', 1.0], [7, '909_snare', 1.0], [8, '909_snare', 1.0], [9, '909_snare', 1.0], [10, '909_snare', 1.0], [11, '909_snare', 1.0], [12, '909_snare', 1.0], [13, '909_snare', 1.0], [14, '909_crash', 0.8], [15, '909_hat_open', 1.0]]
  ),
  make4MeasureFill(
    'b4m_6',
    '4-Bar Metal Double-Bass Blast Surge',
    'Bar 1 breakdown stomps -> Bar 2 double-bass ramp -> Bar 3 blast beat -> Bar 4 tom carnage',
    150,
    [[0, 'kick_acoustic', 1.0], [0, 'china_acoustic', 0.9], [4, 'snare_rim', 1.0], [8, 'kick_acoustic', 1.0], [10, 'kick_acoustic', 0.9], [12, 'snare_rim', 1.0]],
    [[0, 'kick_acoustic', 1.0], [1, 'kick_acoustic', 0.9], [2, 'kick_acoustic', 0.9], [3, 'kick_acoustic', 0.9], [4, 'snare_rim', 1.0], [5, 'kick_acoustic', 0.9], [6, 'kick_acoustic', 0.9], [7, 'kick_acoustic', 0.9], [8, 'kick_acoustic', 1.0], [9, 'kick_acoustic', 0.9], [10, 'kick_acoustic', 0.9], [11, 'kick_acoustic', 0.9], [12, 'snare_rim', 1.0], [13, 'kick_acoustic', 0.9], [14, 'kick_acoustic', 0.9], [15, 'kick_acoustic', 0.9]],
    [[0, 'kick_acoustic', 1.0], [1, 'snare_rim', 1.0], [2, 'kick_acoustic', 1.0], [3, 'snare_rim', 1.0], [4, 'kick_acoustic', 1.0], [5, 'snare_rim', 1.0], [6, 'kick_acoustic', 1.0], [7, 'snare_rim', 1.0], [8, 'kick_acoustic', 1.0], [9, 'snare_rim', 1.0], [10, 'kick_acoustic', 1.0], [11, 'snare_rim', 1.0], [12, 'kick_acoustic', 1.0], [13, 'snare_rim', 1.0], [14, 'kick_acoustic', 1.0], [15, 'snare_rim', 1.0]],
    [[0, 'tom_high', 1.0], [1, 'tom_high', 1.0], [2, 'tom_mid', 1.0], [3, 'tom_mid', 1.0], [4, 'tom_floor', 1.0], [5, 'tom_floor', 1.0], [6, 'kick_acoustic', 1.0], [7, 'kick_acoustic', 1.0], [8, 'snare_rim', 1.0], [9, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'tom_floor', 1.0], [13, 'tom_floor', 1.0], [14, 'china_acoustic', 1.0], [15, 'kick_acoustic', 1.0]]
  ),
  make4MeasureFill(
    'b4m_7',
    '4-Bar Jazz Bebop Solo Transition',
    'Bar 1 spang-a-lang -> Bar 2 3-against-4 polyrhythm -> Bar 3 tom dialog -> Bar 4 press roll',
    130,
    [[0, 'ride_acoustic', 0.9], [0, 'kick_acoustic', 0.35], [2.6, 'ride_acoustic', 0.7], [4, 'ride_bell', 0.9], [4, 'hat_pedal', 0.9], [6.6, 'ride_acoustic', 0.7], [8, 'ride_acoustic', 0.9], [10.6, 'ride_acoustic', 0.7], [12, 'ride_bell', 0.95], [12, 'hat_pedal', 0.9], [14.6, 'ride_acoustic', 0.7]],
    [[0, 'snare_acoustic', 0.6], [3, 'sidestick', 0.85], [6, 'snare_acoustic', 0.7], [9, 'sidestick', 0.9], [12, 'snare_acoustic', 0.75], [15, 'sidestick', 0.9]],
    [[0, 'tom_high', 0.85], [2.6, 'tom_high', 0.9], [4, 'tom_mid', 0.9], [6.6, 'tom_mid', 0.95], [8, 'tom_floor', 0.95], [10.6, 'tom_floor', 1.0], [12, 'snare_acoustic', 0.85], [14, 'tom_floor', 1.0]],
    [[0, 'snare_acoustic', 0.5], [1, 'snare_acoustic', 0.6], [2, 'snare_acoustic', 0.7], [3, 'snare_acoustic', 0.75], [4, 'snare_acoustic', 0.8], [5, 'snare_acoustic', 0.85], [6, 'snare_acoustic', 0.9], [7, 'snare_acoustic', 0.95], [8, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [12, 'tom_floor', 1.0], [14, 'hat_pedal', 1.0], [15, 'ride_bell', 1.0]]
  ),
  make4MeasureFill(
    'b4m_8',
    '4-Bar Lofi Chillhop Tape Slowdown & Rise',
    'Bar 1 dusty vinyl pocket -> Bar 2 delayed rim -> Bar 3 filtered toms -> Bar 4 tape stop drop',
    88,
    [[0, 'lofi_kick', 1.0], [2.2, 'lofi_hat_closed', 0.6], [4.2, 'lofi_snare', 0.95], [6.2, 'lofi_hat_closed', 0.6], [8, 'lofi_kick', 0.9], [10.2, 'lofi_hat_closed', 0.6], [12.2, 'lofi_snare', 0.95], [14.2, 'lofi_hat_open', 0.7]],
    [[0, 'lofi_kick', 1.0], [3, 'lofi_rim', 0.7], [4.2, 'lofi_snare', 0.9], [7, 'lofi_rim', 0.75], [8, 'lofi_kick', 0.95], [11, 'lofi_rim', 0.85], [12.2, 'lofi_snare', 0.95], [14, 'lofi_shaker', 0.8]],
    [[0, 'lofi_tom_low', 0.8], [2, 'lofi_tom_low', 0.85], [4, 'lofi_tom_hi', 0.85], [6, 'lofi_tom_hi', 0.9], [8, 'lofi_snare', 0.7], [10, 'lofi_snare', 0.8], [12, 'lofi_tom_low', 0.95], [14, 'lofi_rim', 0.9]],
    [[0, 'lofi_snare', 0.6], [2, 'lofi_snare', 0.7], [4, 'lofi_snare', 0.8], [6, 'lofi_snare', 0.85], [8, 'lofi_snare', 0.9], [10, 'lofi_snare', 0.95], [12, 'lofi_snare', 1.0], [13, 'lofi_snare', 1.0], [14, 'tape_stop', 1.0]]
  ),
  make4MeasureFill(
    'b4m_9',
    '4-Bar Latin Carnival Percussion Build',
    'Bar 1 conga clave -> Bar 2 timbale cascara -> Bar 3 timbale roll -> Bar 4 carnival tutti',
    114,
    [[0, 'conga_low', 0.9], [2, 'conga_high', 0.85], [4, 'conga_slap', 0.95], [6, 'conga_low', 0.9], [8, 'conga_high', 0.9], [10, 'conga_slap', 0.95], [12, 'conga_low', 0.9], [14, 'conga_high', 0.9]],
    [[0, 'timbale_low', 0.85], [2, 'timbale_high', 0.85], [4, 'club_cowbell', 0.9], [6, 'timbale_high', 0.9], [8, 'timbale_low', 0.9], [10, 'timbale_high', 0.95], [12, 'club_cowbell', 1.0], [14, 'timbale_low', 0.95]],
    [[0, 'timbale_low', 0.9], [1, 'timbale_low', 0.9], [2, 'timbale_high', 0.9], [3, 'timbale_high', 0.9], [4, 'timbale_low', 0.95], [5, 'timbale_low', 0.95], [6, 'timbale_high', 0.95], [7, 'timbale_high', 0.95], [8, 'club_cowbell', 1.0], [10, 'club_cowbell', 1.0], [12, 'timbale_high', 1.0], [13, 'timbale_high', 1.0], [14, 'timbale_low', 1.0], [15, 'timbale_low', 1.0]],
    [[0, 'timbale_high', 0.95], [1, 'timbale_high', 0.95], [2, 'timbale_low', 1.0], [3, 'timbale_low', 1.0], [4, 'conga_slap', 1.0], [6, 'conga_slap', 1.0], [8, 'timbale_high', 1.0], [9, 'timbale_high', 1.0], [10, 'timbale_high', 1.0], [11, 'timbale_high', 1.0], [12, 'timbale_low', 1.0], [13, 'timbale_low', 1.0], [14, 'club_cowbell', 1.0], [15, 'club_cowbell', 1.0]]
  ),
  make4MeasureFill(
    'b4m_10',
    '4-Bar Afrobeat Polyrhythmic Expansion',
    'Bar 1 shaker pocket -> Bar 2 stick polyrhythm -> Bar 3 floor tom drive -> Bar 4 tutti lock',
    118,
    [[0, 'kick_acoustic', 1.0], [2, 'sidestick', 0.85], [4, 'tambourine', 0.8], [6, 'kick_acoustic', 0.9], [8, 'tom_mid', 0.8], [10, 'sidestick', 0.9], [12, 'tambourine', 0.8], [14, 'tom_floor', 0.85]],
    [[0, 'kick_acoustic', 1.0], [1, 'sidestick', 0.8], [3, 'sidestick', 0.85], [5, 'sidestick', 0.9], [7, 'sidestick', 0.95], [8, 'tom_high', 0.9], [10, 'tom_mid', 0.95], [12, 'sidestick', 1.0], [14, 'tom_floor', 1.0]],
    [[0, 'tom_floor', 0.9], [1, 'tom_floor', 0.9], [2, 'tom_mid', 0.9], [3, 'tom_mid', 0.9], [4, 'tom_high', 0.95], [5, 'tom_high', 0.95], [6, 'snare_rim', 0.95], [7, 'snare_rim', 0.95], [8, 'kick_acoustic', 1.0], [10, 'kick_acoustic', 1.0], [12, 'tom_floor', 1.0], [14, 'tom_floor', 1.0]],
    [[0, 'sidestick', 1.0], [2, 'sidestick', 1.0], [4, 'tom_high', 1.0], [5, 'tom_high', 1.0], [6, 'tom_mid', 1.0], [7, 'tom_mid', 1.0], [8, 'tom_floor', 1.0], [9, 'tom_floor', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'snare_rim', 1.0], [13, 'snare_rim', 1.0], [14, 'kick_acoustic', 1.0], [15, 'kick_acoustic', 1.0]]
  ),
  make4MeasureFill(
    'b4m_11',
    '4-Bar Blues 12/8 Slow Burn Turnaround',
    'Bar 1 12/8 ride -> Bar 2 swung floor tom -> Bar 3 snare triplet swell -> Bar 4 crash drag',
    76,
    [[0, 'ride_acoustic', 0.9], [0, 'kick_acoustic', 0.8], [2.6, 'ride_acoustic', 0.7], [4, 'snare_acoustic', 0.7], [6.6, 'ride_acoustic', 0.7], [8, 'kick_acoustic', 0.8], [10.6, 'ride_acoustic', 0.7], [12, 'snare_acoustic', 0.75], [14.6, 'ride_acoustic', 0.7]],
    [[0, 'tom_floor', 0.8], [2.6, 'tom_floor', 0.85], [4, 'snare_rim', 0.85], [5.3, 'tom_floor', 0.9], [8, 'tom_mid', 0.9], [10.6, 'tom_floor', 0.95], [12, 'snare_rim', 0.95]],
    [[0, 'snare_acoustic', 0.5], [1.3, 'snare_acoustic', 0.6], [2.6, 'snare_acoustic', 0.7], [4, 'tom_high', 0.8], [5.3, 'tom_mid', 0.85], [6.6, 'tom_floor', 0.9], [8, 'snare_acoustic', 0.85], [9.3, 'snare_acoustic', 0.9], [10.6, 'snare_acoustic', 0.95], [12, 'snare_rim', 1.0], [14, 'tom_floor', 1.0]],
    [[0, 'tom_high', 0.95], [1.3, 'tom_high', 0.95], [2.6, 'tom_mid', 1.0], [4, 'tom_mid', 1.0], [5.3, 'tom_floor', 1.0], [6.6, 'tom_floor', 1.0], [8, 'snare_rim', 1.0], [9.3, 'snare_rim', 1.0], [10.6, 'snare_rim', 1.0], [12, 'snare_rim', 1.0], [13.3, 'kick_acoustic', 1.0], [14.6, 'kick_acoustic', 1.0]]
  ),
  make4MeasureFill(
    'b4m_12',
    '4-Bar Industrial Glitch & Stutter Ascent',
    'Bar 1 cold rim & kick -> Bar 2 16th stutter -> Bar 3 hat rush -> Bar 4 wall of sound drop',
    132,
    [[0, '808_sub', 1.0], [4, '808_clap', 0.9], [8, '808_sub', 0.95], [12, '808_clap', 0.95]],
    [[0, '808_sub', 1.0], [2, '808_snare', 0.6], [3, '808_snare', 0.7], [4, '808_clap', 0.9], [6, '808_snare', 0.7], [8, '808_sub', 1.0], [10, '808_snare', 0.8], [11, '808_snare', 0.85], [12, '808_clap', 1.0]],
    [[0, '808_snare', 0.75], [1, '808_snare', 0.8], [2, '808_snare', 0.8], [3, '808_snare', 0.85], [4, '808_snare', 0.85], [5, '808_snare', 0.9], [6, '808_snare', 0.9], [7, '808_snare', 0.95], [8, '808_hat_open', 0.9], [10, '808_hat_open', 0.95], [12, '808_snare', 1.0], [14, '808_clap', 1.0]],
    [[0, '808_snare', 0.9], [1, '808_snare', 0.9], [2, '808_snare', 0.95], [3, '808_snare', 0.95], [4, '808_snare', 1.0], [5, '808_snare', 1.0], [6, '808_snare', 1.0], [7, '808_snare', 1.0], [8, '808_sub', 1.0], [10, '808_sub', 1.0], [12, '808_snare', 1.0], [13, '808_snare', 1.0], [14, '808_snare', 1.0], [15, '808_snare', 1.0]]
  ),
  make4MeasureFill(
    'b4m_13',
    '4-Bar Disco High-Tension Riser',
    'Bar 1 4-on-floor -> Bar 2 claps & tambourine -> Bar 3 8th snare rise -> Bar 4 16th disco peak',
    122,
    [[0, 'kick_acoustic', 1.0], [2, 'hat_open', 0.8], [4, 'kick_acoustic', 1.0], [6, 'hat_open', 0.8], [8, 'kick_acoustic', 1.0], [10, 'hat_open', 0.8], [12, 'kick_acoustic', 1.0], [14, 'hat_open', 0.8]],
    [[0, 'kick_acoustic', 1.0], [2, 'tambourine', 0.8], [4, 'kick_acoustic', 1.0], [4, 'clap_acoustic', 0.9], [6, 'tambourine', 0.85], [8, 'kick_acoustic', 1.0], [10, 'tambourine', 0.9], [12, 'kick_acoustic', 1.0], [12, 'clap_acoustic', 0.95], [14, 'tambourine', 0.95]],
    [[0, 'snare_rim', 0.6], [2, 'snare_rim', 0.65], [4, 'snare_rim', 0.7], [6, 'snare_rim', 0.75], [8, 'snare_rim', 0.8], [10, 'snare_rim', 0.85], [12, 'snare_rim', 0.9], [14, 'snare_rim', 0.95]],
    [[0, 'snare_rim', 0.85], [1, 'snare_rim', 0.85], [2, 'snare_rim', 0.9], [3, 'snare_rim', 0.9], [4, 'snare_rim', 0.95], [5, 'snare_rim', 0.95], [6, 'snare_rim', 1.0], [7, 'snare_rim', 1.0], [8, 'clap_acoustic', 1.0], [9, 'clap_acoustic', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'snare_rim', 1.0], [13, 'snare_rim', 1.0], [14, 'hat_open', 1.0], [15, 'hat_pedal', 1.0]]
  ),
  make4MeasureFill(
    'b4m_14',
    '4-Bar Ambient Cymbal & Tom Swell',
    'Bar 1 ride washes -> Bar 2 floor tom pulse -> Bar 3 mid & high toms -> Bar 4 full swell drop',
    96,
    [[0, 'ride_acoustic', 0.8], [0, 'kick_acoustic', 0.4], [4, 'ride_acoustic', 0.75], [8, 'ride_acoustic', 0.85], [12, 'ride_acoustic', 0.8]],
    [[0, 'tom_floor', 0.6], [2, 'tom_floor', 0.65], [4, 'tom_floor', 0.7], [6, 'tom_floor', 0.75], [8, 'tom_floor', 0.8], [10, 'tom_floor', 0.85], [12, 'tom_floor', 0.9], [14, 'tom_floor', 0.95]],
    [[0, 'tom_mid', 0.7], [2, 'tom_mid', 0.75], [4, 'tom_high', 0.8], [6, 'tom_high', 0.85], [8, 'tom_floor', 0.9], [10, 'tom_floor', 0.95], [12, 'tom_mid', 0.95], [14, 'tom_high', 1.0]],
    [[0, 'tom_floor', 0.9], [1, 'tom_floor', 0.9], [2, 'tom_mid', 0.95], [3, 'tom_mid', 0.95], [4, 'tom_high', 1.0], [5, 'tom_high', 1.0], [6, 'snare_acoustic', 0.8], [7, 'snare_acoustic', 0.85], [8, 'snare_rim', 0.95], [9, 'snare_rim', 0.95], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'kick_acoustic', 1.0], [13, 'kick_acoustic', 1.0], [14, 'crash_acoustic', 0.8], [15, 'crash_acoustic', 0.9]]
  ),
  make4MeasureFill(
    'b4m_15',
    '4-Bar Dub Reggae Echo Transition',
    'Bar 1 one-drop -> Bar 2 skank & tom echo -> Bar 3 delayed tom triplets -> Bar 4 sub bass drop',
    76,
    [[0, 'sidestick', 0.7], [2, 'hat_open', 0.8], [4, 'hat_closed', 0.6], [6, 'hat_open', 0.8], [8, 'kick_acoustic', 1.0], [8, 'snare_rim', 1.0], [10, 'hat_open', 0.8], [12, 'hat_closed', 0.6], [14, 'hat_open', 0.85]],
    [[0, 'hat_open', 0.8], [2, 'tom_high', 0.8], [4, 'tom_high', 0.6], [6, 'tom_high', 0.4], [8, 'kick_acoustic', 1.0], [8, 'snare_rim', 1.0], [10, 'tom_mid', 0.8], [12, 'tom_mid', 0.6], [14, 'tom_mid', 0.4]],
    [[0, 'tom_high', 0.85], [1.3, 'tom_high', 0.7], [2.6, 'tom_mid', 0.9], [4, 'tom_mid', 0.75], [5.3, 'tom_floor', 0.95], [6.6, 'tom_floor', 0.8], [8, 'snare_rim', 1.0], [10, 'tom_floor', 0.9], [12, 'tom_floor', 0.95], [14, 'kick_acoustic', 1.0]],
    [[0, 'tom_high', 0.95], [2, 'tom_mid', 0.95], [4, 'tom_floor', 1.0], [6, 'tom_floor', 1.0], [8, 'snare_rim', 1.0], [9, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'kick_acoustic', 1.0], [13, 'kick_acoustic', 1.0], [14, 'hat_open', 1.0], [15, 'hat_pedal', 1.0]]
  ),
  make4MeasureFill(
    'b4m_16',
    '4-Bar Grand Finale Tutti Crash & Resolve',
    'Bar 1 power tom pulse -> Bar 2 unison flams -> Bar 3 blast roll -> Bar 4 ultimate tutti crash',
    116,
    [[0, 'kick_acoustic', 1.0], [0, 'tom_floor', 0.9], [4, 'snare_rim', 1.0], [8, 'kick_acoustic', 1.0], [8, 'tom_floor', 0.95], [12, 'snare_rim', 1.0]],
    [[0, 'kick_acoustic', 1.0], [2, 'snare_rim', 0.9], [4, 'tom_high', 0.95], [6, 'tom_mid', 0.95], [8, 'tom_floor', 1.0], [10, 'kick_acoustic', 1.0], [12, 'snare_rim', 1.0], [14, 'tom_floor', 1.0]],
    [[0, 'kick_acoustic', 1.0], [1, 'kick_acoustic', 0.9], [2, 'snare_rim', 0.95], [3, 'snare_rim', 0.95], [4, 'tom_high', 0.95], [5, 'tom_high', 1.0], [6, 'tom_mid', 1.0], [7, 'tom_mid', 1.0], [8, 'tom_floor', 1.0], [9, 'tom_floor', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'kick_acoustic', 1.0], [13, 'kick_acoustic', 1.0], [14, 'kick_acoustic', 1.0], [15, 'kick_acoustic', 1.0]],
    [[0, 'tom_high', 1.0], [1, 'tom_high', 1.0], [2, 'tom_mid', 1.0], [3, 'tom_mid', 1.0], [4, 'tom_floor', 1.0], [5, 'tom_floor', 1.0], [6, 'snare_rim', 1.0], [7, 'snare_rim', 1.0], [8, 'snare_rim', 1.0], [9, 'snare_rim', 1.0], [10, 'snare_rim', 1.0], [11, 'snare_rim', 1.0], [12, 'tom_floor', 1.0], [13, 'tom_floor', 1.0], [14, 'china_acoustic', 1.0], [15, 'crash_acoustic', 1.0]]
  )
];

// Backwards-compatible aliases
export const DRUM_GROOVES_CATALOG = DRUM_MAIN_PARTS_CATALOG;
export const DRUM_CHORDS_CATALOG = DRUM_GROOVES_CATALOG;

// Guitar Chord Shapes
export const GUITAR_CHORDS_CATALOG = [
  { id: 'g_em', name: 'Open Em', notes: [40, 47, 52, 55, 59, 64], frets: '0-2-2-0-0-0', desc: 'Standard open E minor' },
  { id: 'g_c', name: 'Open C', notes: [48, 52, 55, 60, 64], frets: 'x-3-2-0-1-0', desc: 'Lush open C major' },
  { id: 'g_g', name: 'Open G', notes: [43, 47, 50, 55, 59, 67], frets: '3-2-0-0-0-3', desc: 'Bright full G major' },
  { id: 'g_d', name: 'Open D', notes: [50, 57, 62, 66], frets: 'x-x-0-2-3-2', desc: 'Crisp open D major' },
  { id: 'g_am', name: 'Open Am', notes: [45, 52, 57, 60, 64], frets: 'x-0-2-2-1-0', desc: 'Warm open A minor' },
  { id: 'g_f_barre', name: 'F Barre', notes: [41, 48, 53, 57, 60, 65], frets: '1-3-3-2-1-1', desc: 'Full 1st-fret barre' },
  { id: 'g_bm_barre', name: 'Bm Barre', notes: [47, 54, 59, 62, 66], frets: 'x-2-4-4-3-2', desc: '2nd-fret minor barre' },
  { id: 'g_e5', name: 'Power E5', notes: [40, 47, 52], frets: '0-2-2-x-x-x', desc: 'Heavy rock power chord' },
  { id: 'g_a5', name: 'Power A5', notes: [45, 52, 57], frets: 'x-0-2-2-x-x', desc: 'Tight overdrive power chord' },
  { id: 'g_e9', name: 'Funk E9', notes: [52, 56, 62, 66], frets: 'x-7-6-7-7-x', desc: 'James Brown 9th chord' },
  { id: 'g_dm9', name: 'Jazz Dm9', notes: [50, 53, 60, 64], frets: 'x-5-3-5-5-x', desc: 'Drop-2 jazz voicing' },
  { id: 'g_g7', name: 'Blues G7', notes: [43, 47, 53, 59, 65], frets: '3-2-0-0-0-1', desc: 'Classic 12-bar blues dominant' },
  { id: 'g_e7s9', name: 'Hendrix E7#9', notes: [52, 56, 62, 67], frets: 'x-7-6-7-8-x', desc: 'Purple Haze Hendrix chord' },
  { id: 'g_asus4', name: 'A Sus4', notes: [45, 52, 57, 62, 64], frets: 'x-0-2-2-3-0', desc: 'Suspended shimmer' },
  { id: 'g_csm7', name: 'C#m7', notes: [49, 56, 61, 64, 68], frets: 'x-4-6-4-5-4', desc: 'Soulful minor 7th barre' },
  { id: 'g_bbmaj7', name: 'Bb Maj7', notes: [46, 53, 57, 62, 65], frets: 'x-1-3-2-3-1', desc: 'Neo-Soul acoustic major 7th' },
];

// Genre Slices Catalog (16 unique slice definitions for each instrument & genre)
export const GENRE_SLICES = {
  funk: {
    piano: [
      { id: 'fp_1', name: 'Clavinet 16th Stab', pattern: [64, 67, 71], dur: 0.18, type: 'clav' },
      { id: 'fp_2', name: 'E9 Funky Comp', pattern: [64, 68, 74, 78], dur: 0.25, type: 'rhodes' },
      { id: 'fp_3', name: 'Ghost Chop', pattern: [60], dur: 0.12, type: 'clav' },
      { id: 'fp_4', name: '16th Syncopation', pattern: [67, 70, 72], dur: 0.22, type: 'clav' },
      { id: 'fp_5', name: 'Slap Bass Accent', pattern: [36, 48], dur: 0.2, type: 'piano' },
      { id: 'fp_6', name: '7#9 Funk Hit', pattern: [64, 68, 74, 79], dur: 0.28, type: 'rhodes' },
      { id: 'fp_7', name: 'Chromatic Slide', pattern: [63, 64], dur: 0.2, type: 'clav' },
      { id: 'fp_8', name: 'Wah Clav Riff', pattern: [67, 72, 74], dur: 0.35, type: 'clav' },
      { id: 'fp_9', name: 'Octave Funk Jump', pattern: [48, 60], dur: 0.18, type: 'piano' },
      { id: 'fp_10', name: '13th Chord Jab', pattern: [60, 67, 70, 76], dur: 0.24, type: 'rhodes' },
      { id: 'fp_11', name: 'Double Clav Hit', pattern: [72, 72], dur: 0.15, type: 'clav' },
      { id: 'fp_12', name: 'P-Funk Lead Chop', pattern: [76, 79, 81], dur: 0.4, type: 'synth' },
      { id: 'fp_13', name: 'Dampened Staccato', pattern: [65], dur: 0.1, type: 'clav' },
      { id: 'fp_14', name: 'Groove Resolv', pattern: [62, 65, 69, 72], dur: 0.3, type: 'rhodes' },
      { id: 'fp_15', name: 'Syncopated Triplet', pattern: [67, 69, 72], dur: 0.25, type: 'clav' },
      { id: 'fp_16', name: 'Turnaround Stab', pattern: [55, 64, 67, 71], dur: 0.35, type: 'piano' },
    ],
    drums: [
      { 
        id: 'fd_1', 
        name: 'Funky Drummer 16th Break', 
        desc: 'Clyde Stubblefield syncopated breakbeat with 16th hats & ghost snares',
        events: beatEvents(104, [[0, 'kick_acoustic'], [0, 'hat_closed', 0.7], [2, 'hat_closed', 0.6], [4, 'snare_rim', 1.0], [4, 'hat_closed', 0.6], [6, 'snare_acoustic', 0.35], [7, 'kick_acoustic', 0.8], [8, 'hat_open', 0.75], [10, 'kick_acoustic', 0.9], [12, 'snare_rim', 1.0], [14, 'snare_acoustic', 0.35], [15, 'hat_open', 0.8]])
      },
      { 
        id: 'fd_2', 
        name: 'Ghost Snare Pocket Roll', 
        desc: 'Rolling 16th ghost notes into sharp rim backbeat',
        events: beatEvents(106, [[0, 'kick_acoustic'], [0, 'hat_closed'], [1, 'snare_acoustic', 0.3], [2, 'hat_closed'], [3, 'snare_acoustic', 0.35], [4, 'snare_rim', 1.0], [6, 'hat_closed'], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [9, 'snare_acoustic', 0.3], [10, 'hat_closed'], [12, 'snare_rim', 1.0], [14, 'snare_acoustic', 0.4], [15, 'snare_acoustic', 0.5]])
      },
      { 
        id: 'fd_3', 
        name: 'James Brown Cold Sweat Accent', 
        desc: 'Staccato kick on one, punchy snare on two, and open hat choke',
        events: beatEvents(108, [[0, 'kick_acoustic'], [0, 'crash_acoustic', 0.8], [3, 'kick_acoustic'], [4, 'snare_rim', 1.0], [6, 'hat_closed'], [8, 'kick_acoustic'], [10, 'hat_open'], [12, 'snare_rim', 1.0], [14, 'kick_acoustic'], [15, 'snare_rim', 0.9]])
      },
      { 
        id: 'fd_4', 
        name: '16th Hat Sizzle Groove', 
        desc: 'Continuous 16th hi-hat stream with dynamic accent swings',
        events: beatEvents(105, [[0, 'kick_acoustic'], [0, 'hat_closed', 0.8], [1, 'hat_closed', 0.5], [2, 'hat_closed', 0.7], [3, 'hat_closed', 0.5], [4, 'snare_acoustic'], [4, 'hat_closed', 0.8], [5, 'hat_closed', 0.5], [6, 'hat_open', 0.7], [8, 'kick_acoustic'], [8, 'hat_closed'], [10, 'kick_acoustic', 0.8], [12, 'snare_rim'], [14, 'hat_closed', 0.7], [15, 'hat_open']])
      },
      { 
        id: 'fd_5', 
        name: 'Four-on-the-Floor Disco Funk', 
        desc: 'Solid four-on-the-floor kick with open hats on the upbeats',
        events: beatEvents(112, [[0, 'kick_acoustic'], [2, 'hat_open'], [4, 'kick_acoustic'], [4, 'snare_acoustic'], [6, 'hat_open'], [8, 'kick_acoustic'], [10, 'hat_open'], [12, 'kick_acoustic'], [12, 'snare_acoustic'], [14, 'hat_open']])
      },
      { 
        id: 'fd_6', 
        name: 'Slap & Pop Funk Beat', 
        desc: 'Aggressive syncopated double kick and crisp snare rimshot',
        events: beatEvents(107, [[0, 'kick_acoustic'], [2, 'hat_closed'], [4, 'snare_rim'], [6, 'kick_acoustic'], [7, 'kick_acoustic'], [8, 'hat_open'], [10, 'hat_closed'], [12, 'snare_rim'], [14, 'kick_acoustic']])
      },
      { 
        id: 'fd_7', 
        name: 'Syncopated Cowbell Break', 
        desc: 'Latin funk cowbell syncopation with driving kick & snare',
        events: beatEvents(110, [[0, 'kick_acoustic'], [0, 'cowbell_real'], [2, 'cowbell_real', 0.7], [4, 'snare_rim'], [4, 'cowbell_real'], [6, 'kick_acoustic'], [7, 'cowbell_real'], [8, 'kick_acoustic'], [10, 'cowbell_real'], [12, 'snare_rim'], [14, 'kick_acoustic'], [15, 'cowbell_real']])
      },
      { 
        id: 'fd_8', 
        name: 'Tight Rim Click Groove', 
        desc: 'Clean cross-stick wooden rim on 2 & 4 over punchy kick',
        events: beatEvents(102, [[0, 'kick_acoustic'], [2, 'sidestick'], [4, 'sidestick'], [6, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'sidestick'], [12, 'sidestick'], [14, 'hat_open']])
      },
      { 
        id: 'fd_9', 
        name: 'Tambourine 16th Shake Beat', 
        desc: 'Layered 16th tambourine shake over driving funk rhythm',
        events: beatEvents(106, [[0, 'kick_acoustic'], [0, 'tambourine'], [1, 'tambourine', 0.5], [2, 'tambourine', 0.7], [3, 'tambourine', 0.5], [4, 'snare_rim'], [4, 'tambourine'], [6, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'tambourine'], [12, 'snare_rim'], [14, 'tambourine']])
      },
      { 
        id: 'fd_10', 
        name: 'Linear Hi-Tom Funk Fill', 
        desc: 'Kick-snare-tom linear 16th fill leading into snare snap',
        events: beatEvents(108, [[0, 'kick_acoustic'], [2, 'snare_acoustic'], [4, 'tom_high'], [6, 'tom_mid'], [8, 'kick_acoustic'], [10, 'snare_rim'], [12, 'tom_floor'], [14, 'crash_acoustic']])
      },
      { 
        id: 'fd_11', 
        name: 'Floor Tom Funk Pocket', 
        desc: 'Deep floor tom backbeats interlaced with snare crack',
        events: beatEvents(100, [[0, 'tom_floor'], [0, 'kick_acoustic'], [2, 'hat_closed'], [4, 'snare_rim'], [6, 'tom_floor'], [8, 'tom_floor'], [10, 'kick_acoustic'], [12, 'snare_rim'], [14, 'hat_open']])
      },
      { 
        id: 'fd_12', 
        name: 'P-Funk Sub Breakbeat', 
        desc: 'Booming 808 sub kick with open hat wash and handclap',
        events: beatEvents(98, [[0, '808_sub'], [2, 'hat_closed'], [4, 'snare_acoustic'], [4, 'clap_acoustic'], [6, 'hat_open'], [8, '808_sub'], [10, 'kick_acoustic'], [12, 'snare_acoustic'], [14, 'hat_open']])
      },
      { 
        id: 'fd_13', 
        name: 'Syncopated Triplet Break', 
        desc: 'Triplet ghost snare accents resolving to punchy backbeat',
        events: beatEvents(104, [[0, 'kick_acoustic'], [2, 'hat_closed'], [3.3, 'snare_acoustic', 0.5], [4.6, 'snare_acoustic', 0.7], [6, 'snare_rim'], [8, 'kick_acoustic'], [10, 'kick_acoustic'], [12, 'snare_rim'], [14, 'hat_open']])
      },
      { 
        id: 'fd_14', 
        name: 'Clap & Rimshot Layer Beat', 
        desc: 'Dual acoustic clap and rimshot strike on 2 & 4 with double kick',
        events: beatEvents(105, [[0, 'kick_acoustic'], [2, 'hat_closed'], [4, 'clap_acoustic'], [4, 'snare_rim'], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'hat_open'], [12, 'clap_acoustic'], [12, 'snare_rim'], [14, 'hat_closed']])
      },
      { 
        id: 'fd_15', 
        name: 'Tower of Power 16th Climax', 
        desc: 'Fast 16th syncopation with open hat bark and tom roll',
        events: beatEvents(106, [[0, 'kick_acoustic'], [1, 'hat_closed', 0.5], [2, 'hat_closed'], [3, 'snare_acoustic', 0.4], [4, 'snare_rim'], [5, 'kick_acoustic'], [6, 'hat_open'], [8, 'kick_acoustic'], [9, 'snare_acoustic', 0.4], [10, 'hat_closed'], [11, 'kick_acoustic'], [12, 'snare_rim'], [13, 'tom_high'], [14, 'tom_mid'], [15, 'crash_acoustic']])
      },
      { 
        id: 'fd_16', 
        name: 'Clyde Stubblefield Finale', 
        desc: 'Full kit solo breakbeat with ghost rolls and crash climax',
        events: beatEvents(108, [[0, 'crash_acoustic'], [0, 'kick_acoustic'], [2, 'hat_closed'], [4, 'snare_rim'], [6, 'snare_acoustic', 0.4], [7, 'kick_acoustic'], [8, 'hat_open'], [9, 'kick_acoustic'], [10, 'snare_acoustic', 0.4], [11, 'snare_acoustic', 0.6], [12, 'snare_rim'], [13, 'tom_mid'], [14, 'tom_floor'], [15, 'crash_acoustic']])
      },
    ],
    guitar: [
      { id: 'fg_1', name: '16th Muted Scratch', pattern: [0], dur: 0.12, type: 'scratch' },
      { id: 'fg_2', name: 'E9 Chicken Pick', pattern: [64, 68, 74, 78], dur: 0.22, type: 'pluck' },
      { id: 'fg_3', name: 'Up-Strum Funk Jab', pattern: [62, 65, 69, 74], dur: 0.18, type: 'strum_up' },
      { id: 'fg_4', name: 'Wah Envelope Lick', pattern: [67, 69, 72], dur: 0.35, type: 'wah' },
      { id: 'fg_5', name: 'Slap Guitar Thump', pattern: [40, 52], dur: 0.2, type: 'slap' },
      { id: 'fg_6', name: 'Single-Coil Spank', pattern: [69, 72], dur: 0.24, type: 'clean' },
      { id: 'fg_7', name: 'Double Stop 4ths', pattern: [67, 72], dur: 0.25, type: 'clean' },
      { id: 'fg_8', name: 'Ghost Mute Downpick', pattern: [0, 0], dur: 0.15, type: 'scratch' },
      { id: 'fg_9', name: 'Chic 9th Strum Chop', pattern: [57, 61, 64, 68], dur: 0.28, type: 'clean' },
      { id: 'fg_10', name: '16th Triplet Rake', pattern: [0, 0, 64], dur: 0.22, type: 'scratch' },
      { id: 'fg_11', name: 'Blues-Funk Slide', pattern: [62, 64], dur: 0.26, type: 'slide' },
      { id: 'fg_12', name: 'Penta Groove Chop', pattern: [67, 64, 62], dur: 0.3, type: 'pluck' },
      { id: 'fg_13', name: 'Percussive Chuck', pattern: [0], dur: 0.1, type: 'scratch' },
      { id: 'fg_14', name: 'Dominant 7 Staccato', pattern: [55, 62, 65, 71], dur: 0.2, type: 'clean' },
      { id: 'fg_15', name: 'Wah-Wah Tail', pattern: [72, 71, 69], dur: 0.38, type: 'wah' },
      { id: 'fg_16', name: 'Downbeat Funk Snap', pattern: [40, 64, 68], dur: 0.3, type: 'slap' },
    ],
  },
  jazz: {
    piano: [
      { id: 'jp_1', name: 'Bill Evans Drop-2', pattern: [50, 57, 60, 64], dur: 0.5, type: 'piano' },
      { id: 'jp_2', name: 'Neo-Soul Min9 Comp', pattern: [53, 56, 60, 63, 67], dur: 0.45, type: 'rhodes' },
      { id: 'jp_3', name: 'Tritone Sub Stab', pattern: [54, 60, 64, 68], dur: 0.4, type: 'piano' },
      { id: 'jp_4', name: 'Chromatic Bebop Run', pattern: [60, 61, 62, 63, 64], dur: 0.35, type: 'piano' },
      { id: 'jp_5', name: 'Major 7th Air Voicing', pattern: [48, 55, 59, 64, 67], dur: 0.6, type: 'rhodes' },
      { id: 'jp_6', name: 'ii-V7-I Progression Chop', pattern: [50, 55, 48], dur: 0.5, type: 'piano' },
      { id: 'jp_7', name: 'Walking Bass Chop', pattern: [36, 40, 43, 44], dur: 0.45, type: 'piano' },
      { id: 'jp_8', name: 'Diminished Pass', pattern: [51, 54, 57, 60], dur: 0.35, type: 'piano' },
      { id: 'jp_9', name: 'Quartal McCoy Stack', pattern: [50, 55, 60, 65], dur: 0.55, type: 'piano' },
      { id: 'jp_10', name: '13b9 Tension Hit', pattern: [55, 63, 68, 71, 76], dur: 0.4, type: 'piano' },
      { id: 'jp_11', name: 'Bossa Nova Syncopation', pattern: [53, 57, 60, 64], dur: 0.35, type: 'rhodes' },
      { id: 'jp_12', name: 'Monk Dissonant Cluster', pattern: [65, 66, 71], dur: 0.4, type: 'piano' },
      { id: 'jp_13', name: 'Grace Note Turn', pattern: [71, 72, 74], dur: 0.3, type: 'piano' },
      { id: 'jp_14', name: 'Warm Velvet 9th', pattern: [50, 53, 57, 62], dur: 0.6, type: 'rhodes' },
      { id: 'jp_15', name: 'Bebop Scale Lick', pattern: [67, 69, 71, 72, 74], dur: 0.45, type: 'piano' },
      { id: 'jp_16', name: 'Final Cadence Bloom', pattern: [48, 55, 59, 62, 64], dur: 0.8, type: 'piano' },
    ],
    drums: [
      { 
        id: 'jd_1', 
        name: 'Bebop Swing Ride Beat', 
        desc: 'Traditional "Spang-a-lang" swing ride pattern with feathered bass drum & pedal hat',
        events: beatEvents(120, [[0, 'ride_acoustic', 0.9], [0, 'kick_acoustic', 0.35], [2.6, 'ride_acoustic', 0.65], [4, 'ride_acoustic', 0.9], [4, 'hat_pedal', 0.9], [4, 'snare_acoustic', 0.25], [6.6, 'ride_acoustic', 0.65], [8, 'ride_acoustic', 0.9], [8, 'kick_acoustic', 0.35], [10.6, 'ride_acoustic', 0.65], [12, 'ride_bell', 0.95], [12, 'hat_pedal', 0.9], [14.6, 'ride_acoustic', 0.65]])
      },
      { 
        id: 'jd_2', 
        name: 'Brush Snare Swirl Comp', 
        desc: 'Soft swept brush snare on 1 & 3 with delicate ride tap and feathered kick',
        events: beatEvents(110, [[0, 'snare_acoustic', 0.4], [0, 'kick_acoustic', 0.3], [2.6, 'ride_acoustic', 0.6], [4, 'snare_acoustic', 0.6], [4, 'hat_pedal'], [6.6, 'ride_acoustic', 0.6], [8, 'snare_acoustic', 0.4], [8, 'kick_acoustic', 0.3], [10.6, 'ride_acoustic', 0.6], [12, 'snare_acoustic', 0.7], [12, 'hat_pedal']])
      },
      { 
        id: 'jd_3', 
        name: 'Bossa Nova Cross-Stick', 
        desc: 'Authentic Brazilian bossa nova rimshot syncopation with gentle walking kick',
        events: beatEvents(125, [[0, 'sidestick', 0.85], [0, 'kick_acoustic', 0.4], [2, 'hat_closed', 0.5], [3, 'sidestick', 0.8], [4, 'hat_closed', 0.5], [6, 'sidestick', 0.85], [8, 'kick_acoustic', 0.4], [9, 'sidestick', 0.8], [10, 'hat_closed', 0.5], [12, 'sidestick', 0.85], [14, 'hat_closed', 0.5]])
      },
      { 
        id: 'jd_4', 
        name: '6/8 Jazz Waltz Turnaround', 
        desc: 'Swung 3/4 ride bell with light snare comping and pedal hat',
        events: beatEvents(135, [[0, 'ride_bell', 0.9], [0, 'kick_acoustic', 0.4], [2, 'ride_acoustic', 0.7], [4, 'ride_acoustic', 0.8], [4, 'hat_pedal'], [4, 'snare_acoustic', 0.35], [6, 'ride_bell', 0.9], [8, 'ride_acoustic', 0.7], [10, 'ride_acoustic', 0.8], [10, 'hat_pedal']])
      },
      { 
        id: 'jd_5', 
        name: 'Neo-Soul Swung Dilla Pocket', 
        desc: 'Laid-back unquantized kick-snare pocket with dragged hi-hats',
        events: beatEvents(86, [[0, 'kick_acoustic', 0.85], [2.4, 'hat_closed', 0.55], [4.4, 'sidestick', 0.95], [6.8, 'hat_closed', 0.55], [7.6, 'kick_acoustic', 0.75], [9.2, 'kick_acoustic', 0.8], [12.4, 'sidestick', 0.95], [14.8, 'hat_open', 0.65]])
      },
      { 
        id: 'jd_6', 
        name: 'Jazz Tom Cascading Roll', 
        desc: 'Melodic acoustic tom run: High Tom -> Mid Tom -> Floor Tom into Ride Bell',
        events: beatEvents(120, [[0, 'tom_high', 0.75], [1.3, 'tom_high', 0.8], [2.6, 'tom_mid', 0.85], [4, 'tom_mid', 0.9], [5.3, 'tom_floor', 0.9], [6.6, 'tom_floor', 0.95], [8, 'ride_bell', 1.0], [8, 'kick_acoustic', 0.8]])
      },
      { 
        id: 'jd_7', 
        name: 'Feathered Kick & Ride Bell', 
        desc: 'Subtle acoustic feathered bass drum with clean ride bell ping on the upbeats',
        events: beatEvents(118, [[0, 'ride_acoustic', 0.7], [0, 'kick_acoustic', 0.3], [2, 'ride_bell', 0.85], [4, 'ride_acoustic', 0.7], [4, 'hat_pedal'], [6, 'ride_bell', 0.85], [8, 'ride_acoustic', 0.7], [8, 'kick_acoustic', 0.3], [10, 'ride_bell', 0.9], [12, 'hat_pedal']])
      },
      { 
        id: 'jd_8', 
        name: 'Sizzle Cymbal Wash Groove', 
        desc: 'Long sustaining cymbal wash with gentle cross-stick backbeats',
        events: beatEvents(110, [[0, 'crash_acoustic', 0.7], [0, 'kick_acoustic', 0.35], [4, 'sidestick', 0.75], [4, 'hat_pedal'], [8, 'ride_acoustic', 0.7], [8, 'kick_acoustic', 0.3], [12, 'sidestick', 0.8], [12, 'hat_pedal']])
      },
      { 
        id: 'jd_9', 
        name: 'Bop Snare Flam Comping', 
        desc: 'Dynamic snare flams on off-beat syncopations over walking ride',
        events: beatEvents(124, [[0, 'ride_acoustic', 0.85], [2.6, 'snare_acoustic', 0.5], [2.8, 'snare_rim', 0.85], [4, 'hat_pedal'], [6.6, 'ride_acoustic', 0.7], [8, 'kick_acoustic', 0.4], [10.6, 'snare_acoustic', 0.4], [10.8, 'snare_rim', 0.9], [12, 'hat_pedal']])
      },
      { 
        id: 'jd_10', 
        name: 'Afro-Cuban 6/8 Jazz Bell', 
        desc: 'Intricate 6/8 bell pattern with conga tom accents and foot hat',
        events: beatEvents(130, [[0, 'ride_bell', 0.9], [0, 'tom_mid', 0.8], [2, 'ride_bell', 0.7], [4, 'ride_bell', 0.85], [4, 'tom_high', 0.85], [6, 'ride_bell', 0.9], [8, 'ride_bell', 0.7], [8, 'tom_floor', 0.9], [10, 'ride_bell', 0.85]])
      },
      { 
        id: 'jd_11', 
        name: 'Pedal Hat Splash & Ride', 
        desc: 'Hi-hat foot splash on 2 & 4 with walking swing rhythm',
        events: beatEvents(116, [[0, 'ride_acoustic', 0.8], [2.6, 'ride_acoustic', 0.6], [4, 'hat_open', 0.75], [4.5, 'hat_pedal', 0.9], [6.6, 'ride_acoustic', 0.6], [8, 'ride_acoustic', 0.8], [10.6, 'ride_acoustic', 0.6], [12, 'hat_open', 0.75], [12.5, 'hat_pedal', 0.9]])
      },
      { 
        id: 'jd_12', 
        name: 'Modern ECM Straight-8th Jazz', 
        desc: 'Straight-8th modern European jazz groove with rimshot and light ride',
        events: beatEvents(115, [[0, 'ride_acoustic', 0.7], [0, 'kick_acoustic', 0.4], [2, 'ride_acoustic', 0.6], [4, 'sidestick', 0.85], [6, 'ride_acoustic', 0.6], [7, 'kick_acoustic', 0.35], [8, 'ride_acoustic', 0.7], [10, 'ride_acoustic', 0.6], [12, 'sidestick', 0.85]])
      },
      { 
        id: 'jd_13', 
        name: 'Hard Bop Double-Time Break', 
        desc: 'High energy double-time swing ride with rapid snare comping',
        events: beatEvents(140, [[0, 'ride_acoustic', 0.95], [1, 'snare_acoustic', 0.35], [2, 'ride_acoustic', 0.7], [3, 'snare_acoustic', 0.4], [4, 'hat_pedal'], [4, 'snare_rim', 0.85], [6, 'ride_acoustic', 0.7], [7, 'kick_acoustic', 0.5], [8, 'ride_acoustic', 0.95]])
      },
      { 
        id: 'jd_14', 
        name: 'Vamp Cross-Stick Groove', 
        desc: 'Atmospheric rim click vamp ideal for solo piano and guitar comping',
        events: beatEvents(108, [[0, 'kick_acoustic', 0.35], [2, 'hat_closed', 0.5], [4, 'sidestick', 0.8], [6, 'hat_closed', 0.5], [8, 'sidestick', 0.7], [10, 'kick_acoustic', 0.3], [12, 'sidestick', 0.85], [14, 'hat_open', 0.6]])
      },
      { 
        id: 'jd_15', 
        name: 'Neo-Soul Snap & Rim Pocket', 
        desc: 'Deep neo-soul groove with snap/rim layer and sub-thump bass drum',
        events: beatEvents(88, [[0, 'kick_acoustic', 0.9], [2.2, 'hat_closed', 0.6], [4.2, 'clap_acoustic', 0.8], [4.2, 'sidestick', 0.85], [6.4, 'hat_closed', 0.5], [8, 'kick_acoustic', 0.75], [9.2, 'kick_acoustic', 0.8], [12.2, 'clap_acoustic', 0.85]])
      },
      { 
        id: 'jd_16', 
        name: 'Jazz Club Climax Roll', 
        desc: 'Dynamic crescendo snare buzz roll into cymbal crash turnaround',
        events: beatEvents(122, [[0, 'snare_acoustic', 0.3], [1, 'snare_acoustic', 0.4], [2, 'snare_acoustic', 0.55], [3, 'snare_acoustic', 0.7], [4, 'snare_acoustic', 0.85], [5, 'snare_rim', 0.95], [6, 'kick_acoustic', 0.9], [6, 'crash_acoustic', 0.95], [8, 'ride_acoustic', 0.8]])
      },
    ],
    guitar: [
      { id: 'jg_1', name: 'Wes Montgomery Octaves', pattern: [50, 62], dur: 0.35, type: 'octave' },
      { id: 'jg_2', name: 'Drop-2 Minor 9th', pattern: [50, 53, 57, 60], dur: 0.45, type: 'clean' },
      { id: 'jg_3', name: 'Walking Bass + Chord', pattern: [45, 52, 57, 60], dur: 0.4, type: 'clean' },
      { id: 'jg_4', name: 'Chromatic Enclosure', pattern: [61, 63, 62], dur: 0.3, type: 'clean' },
      { id: 'jg_5', name: 'Bebop Dominant Lick', pattern: [67, 65, 64, 62], dur: 0.4, type: 'clean' },
      { id: 'jg_6', name: 'Thumb Pluck Warmth', pattern: [48, 55, 59, 64], dur: 0.5, type: 'clean' },
      { id: 'jg_7', name: 'Altered Scale Run', pattern: [62, 63, 65, 66], dur: 0.38, type: 'clean' },
      { id: 'jg_8', name: 'Comping Downbeat Strum', pattern: [53, 57, 60, 65], dur: 0.25, type: 'clean' },
      { id: 'jg_9', name: 'Diminished Pass Lick', pattern: [57, 60, 63, 66], dur: 0.35, type: 'clean' },
      { id: 'jg_10', name: 'Smooth 13th Chord', pattern: [55, 62, 65, 71], dur: 0.45, type: 'clean' },
      { id: 'jg_11', name: 'Minor 11th Arp', pattern: [45, 55, 60, 62], dur: 0.5, type: 'clean' },
      { id: 'jg_12', name: 'Django Gypsy Grace', pattern: [64, 65, 67], dur: 0.28, type: 'clean' },
      { id: 'jg_13', name: 'Chord Melody Fragment', pattern: [50, 57, 62, 65], dur: 0.42, type: 'clean' },
      { id: 'jg_14', name: 'Bossa Guitar Strum', pattern: [48, 55, 60, 64], dur: 0.35, type: 'clean' },
      { id: 'jg_15', name: 'Jazz Blues Lick', pattern: [67, 70, 72], dur: 0.38, type: 'clean' },
      { id: 'jg_16', name: 'Tender Resolv Chord', pattern: [48, 55, 59, 64], dur: 0.7, type: 'clean' },
    ],
  },
  metal: {
    piano: [
      { id: 'mp_1', name: 'Gothic Minor 5th Slam', pattern: [36, 43, 48], dur: 0.45, type: 'piano' },
      { id: 'mp_2', name: 'Baroque Arp Fast', pattern: [60, 63, 67, 72, 75], dur: 0.3, type: 'piano' },
      { id: 'mp_3', name: 'Dissonant Tritone Hit', pattern: [42, 48], dur: 0.35, type: 'piano' },
      { id: 'mp_4', name: 'Diminished 7th Sweep', pattern: [60, 63, 66, 69, 72], dur: 0.35, type: 'piano' },
      { id: 'mp_5', name: 'Cathedral Pipe Organ', pattern: [36, 48, 60, 67], dur: 0.6, type: 'organ' },
      { id: 'mp_6', name: 'Chromatic Run Down', pattern: [72, 71, 70, 69], dur: 0.25, type: 'piano' },
      { id: 'mp_7', name: 'Heavy Low Octave Slam', pattern: [24, 36], dur: 0.5, type: 'piano' },
      { id: 'mp_8', name: 'Neoclassical Triad', pattern: [65, 69, 72], dur: 0.3, type: 'piano' },
      { id: 'mp_9', name: 'Suspended Doom Chord', pattern: [38, 45, 50, 53], dur: 0.65, type: 'piano' },
      { id: 'mp_10', name: 'Staccato Industrial Jab', pattern: [48, 54], dur: 0.18, type: 'piano' },
      { id: 'mp_11', name: 'Minor 2nd Clash', pattern: [64, 65], dur: 0.28, type: 'piano' },
      { id: 'mp_12', name: 'Double Kick Piano Sync', pattern: [36, 36], dur: 0.2, type: 'piano' },
      { id: 'mp_13', name: 'Melodic Death Riff', pattern: [60, 62, 63, 67], dur: 0.4, type: 'piano' },
      { id: 'mp_14', name: 'Funeral Bell Octaves', pattern: [57, 69, 81], dur: 0.7, type: 'bell' },
      { id: 'mp_15', name: 'Thrash Tremolo Pick', pattern: [60, 60, 60], dur: 0.2, type: 'piano' },
      { id: 'mp_16', name: 'Sub-Bass Drop Impact', pattern: [24], dur: 0.8, type: 'piano' },
    ],
    drums: [
      { 
        id: 'md_1', 
        name: 'Double-Bass Blast Beat', 
        desc: '150 BPM rapid 16th alternating double kicks, blasting snare, and crash cymbal',
        events: beatEvents(150, [[0, 'kick_acoustic'], [0, 'crash_acoustic'], [1, 'snare_rim'], [2, 'kick_acoustic'], [3, 'snare_rim'], [4, 'kick_acoustic'], [4, 'ride_bell'], [5, 'snare_rim'], [6, 'kick_acoustic'], [7, 'snare_rim'], [8, 'kick_acoustic'], [8, 'crash_acoustic'], [9, 'snare_rim'], [10, 'kick_acoustic'], [11, 'snare_rim'], [12, 'tom_high'], [13, 'tom_mid'], [14, 'tom_floor'], [15, 'crash_acoustic']])
      },
      { 
        id: 'md_2', 
        name: 'Thrash D-Beat Punk', 
        desc: 'Classic relentless d-beat: Kick-snare-kick-kick-snare with driving open hat',
        events: beatEvents(165, [[0, 'kick_acoustic'], [0, 'hat_open'], [2, 'snare_rim'], [4, 'kick_acoustic'], [5, 'kick_acoustic'], [6, 'snare_rim'], [8, 'kick_acoustic'], [8, 'hat_open'], [10, 'snare_rim'], [12, 'kick_acoustic'], [13, 'kick_acoustic'], [14, 'snare_rim']])
      },
      { 
        id: 'md_3', 
        name: 'Heavy Breakdown Mosh Stomp', 
        desc: 'Crushing half-time breakdown: massive double kick, wide snare crack, trash china',
        events: beatEvents(130, [[0, 'kick_acoustic', 1.0], [0, 'crash_acoustic', 1.0], [3, 'kick_acoustic'], [4, 'snare_rim', 1.0], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [11, 'kick_acoustic'], [12, 'snare_rim', 1.0], [14, 'kick_acoustic'], [15, 'crash_acoustic', 1.0]])
      },
      { 
        id: 'md_4', 
        name: 'Iron Maiden Gallop Beat', 
        desc: 'Galloping 16th double bass rhythm into heavy snare crack',
        events: beatEvents(145, [[0, 'kick_acoustic'], [1, 'kick_acoustic'], [2, 'kick_acoustic'], [4, 'snare_rim'], [4, 'ride_bell'], [6, 'kick_acoustic'], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'kick_acoustic'], [11, 'kick_acoustic'], [12, 'snare_rim'], [14, 'kick_acoustic'], [15, 'kick_acoustic']])
      },
      { 
        id: 'md_5', 
        name: 'Gravity Blast Extreme', 
        desc: 'Hyper-speed extreme metal gravity blast on snare with double kick pulses',
        events: beatEvents(170, [[0, 'snare_rim'], [0, 'kick_acoustic'], [1, 'snare_rim'], [2, 'snare_rim'], [2, 'kick_acoustic'], [3, 'snare_rim'], [4, 'snare_rim'], [4, 'kick_acoustic'], [5, 'snare_rim'], [6, 'snare_rim'], [6, 'kick_acoustic'], [7, 'snare_rim'], [8, 'crash_acoustic']])
      },
      { 
        id: 'md_6', 
        name: 'China Trash Cymbal Chug', 
        desc: 'Heavy china cymbal accents on quarter notes driving heavy guitar chugs',
        events: beatEvents(135, [[0, 'crash_acoustic', 1.0], [0, 'kick_acoustic'], [2, 'kick_acoustic'], [4, 'crash_acoustic', 1.0], [4, 'snare_rim'], [6, 'kick_acoustic'], [7, 'kick_acoustic'], [8, 'crash_acoustic', 1.0], [8, 'kick_acoustic'], [10, 'kick_acoustic'], [12, 'crash_acoustic', 1.0], [12, 'snare_rim']])
      },
      { 
        id: 'md_7', 
        name: 'Quad Double-Bass Burst', 
        desc: '4-stroke 32nd double bass burst resolving into heavy snare backbeat',
        events: beatEvents(140, [[0, 'kick_acoustic'], [0.5, 'kick_acoustic'], [1, 'kick_acoustic'], [1.5, 'kick_acoustic'], [2, 'snare_rim', 1.0], [4, 'kick_acoustic'], [4.5, 'kick_acoustic'], [5, 'kick_acoustic'], [5.5, 'kick_acoustic'], [6, 'snare_rim', 1.0], [8, 'crash_acoustic']])
      },
      { 
        id: 'md_8', 
        name: '16th Machine Gun Snare Roll', 
        desc: 'Military tight metal snare roll escalating into full kit crash',
        events: beatEvents(145, [[0, 'snare_acoustic', 0.6], [1, 'snare_acoustic', 0.7], [2, 'snare_acoustic', 0.8], [3, 'snare_acoustic', 0.9], [4, 'snare_rim', 1.0], [5, 'snare_acoustic', 0.8], [6, 'snare_acoustic', 0.9], [7, 'snare_rim', 1.0], [8, 'crash_acoustic', 1.0], [8, 'kick_acoustic']])
      },
      { 
        id: 'md_9', 
        name: 'Heavy Ride Bell Metal Pinger', 
        desc: 'Power ride bell accents on off-beats over relentless double kicks',
        events: beatEvents(148, [[0, 'kick_acoustic'], [0, 'ride_bell', 0.9], [1, 'kick_acoustic'], [2, 'kick_acoustic'], [2, 'ride_bell', 0.85], [3, 'kick_acoustic'], [4, 'snare_rim', 1.0], [4, 'ride_bell', 0.9], [6, 'kick_acoustic'], [6, 'ride_bell', 0.85], [8, 'kick_acoustic'], [8, 'ride_bell', 0.9]])
      },
      { 
        id: 'md_10', 
        name: 'Floor Tom Tribal War Beat', 
        desc: 'Driving double floor toms with accented snare rimshots on 3',
        events: beatEvents(128, [[0, 'tom_floor', 1.0], [0, 'kick_acoustic'], [2, 'tom_floor', 0.85], [4, 'tom_floor', 0.9], [4, 'snare_rim'], [6, 'tom_floor', 0.85], [8, 'tom_floor', 1.0], [8, 'kick_acoustic'], [10, 'tom_floor', 0.85], [12, 'snare_rim', 1.0], [14, 'crash_acoustic']])
      },
      { 
        id: 'md_11', 
        name: 'Splash Cymbal Quick Choke', 
        desc: 'Explosive splash choke accent with stop-start staccato kicks',
        events: beatEvents(140, [[0, 'crash_acoustic', 0.9], [0, 'kick_acoustic'], [2, 'snare_rim'], [4, 'kick_acoustic'], [5, 'crash_acoustic', 0.8], [6, 'snare_rim'], [8, 'kick_acoustic'], [10, 'snare_rim'], [12, 'kick_acoustic'], [14, 'crash_acoustic']])
      },
      { 
        id: 'md_12', 
        name: 'Pantera Groove Metal Stomp', 
        desc: 'Mid-tempo stomping groove with syncopated double kick & deep snare',
        events: beatEvents(116, [[0, 'kick_acoustic'], [0, 'crash_acoustic'], [3, 'kick_acoustic'], [4, 'snare_rim'], [6, 'hat_closed'], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'hat_open'], [12, 'snare_rim'], [14, 'kick_acoustic'], [15, 'kick_acoustic']])
      },
      { 
        id: 'md_13', 
        name: 'Progressive 7/8 Polyrhythm', 
        desc: 'Complex time signature metal groove with alternating snare placements',
        events: beatEvents(138, [[0, 'kick_acoustic'], [0, 'ride_bell'], [2, 'snare_rim'], [3, 'kick_acoustic'], [5, 'snare_rim'], [7, 'kick_acoustic'], [7, 'ride_bell'], [9, 'snare_rim'], [11, 'kick_acoustic'], [13, 'snare_rim']])
      },
      { 
        id: 'md_14', 
        name: 'Punk Rock 2-Step Skank Beat', 
        desc: 'Fast energetic 2-step skank beat on snare and high-hat',
        events: beatEvents(175, [[0, 'kick_acoustic'], [0, 'hat_open'], [1, 'snare_rim'], [2, 'kick_acoustic'], [3, 'snare_rim'], [4, 'kick_acoustic'], [5, 'snare_rim'], [6, 'kick_acoustic'], [7, 'snare_rim'], [8, 'crash_acoustic']])
      },
      { 
        id: 'md_15', 
        name: 'Dual Floor Tom Cascade', 
        desc: 'Thundering tom cascade rolling down to floor tom before the chorus',
        events: beatEvents(135, [[0, 'tom_high', 0.9], [1, 'tom_high', 0.95], [2, 'tom_mid', 0.9], [3, 'tom_mid', 0.95], [4, 'tom_floor', 1.0], [5, 'tom_floor', 1.0], [6, 'snare_rim', 1.0], [7, 'kick_acoustic'], [8, 'crash_acoustic', 1.0]])
      },
      { 
        id: 'md_16', 
        name: 'Full Metal Blast Climax', 
        desc: 'All-out double bass blast with simultaneous crash, china, and snare destruction',
        events: beatEvents(155, [[0, 'kick_acoustic'], [0, 'crash_acoustic'], [1, 'snare_rim'], [2, 'kick_acoustic'], [3, 'snare_rim'], [4, 'kick_acoustic'], [5, 'snare_rim'], [6, 'kick_acoustic'], [7, 'snare_rim'], [8, 'crash_acoustic', 1.0], [8, 'kick_acoustic'], [10, 'kick_acoustic'], [12, 'tom_floor'], [14, 'crash_acoustic', 1.0]])
      },
    ],
    guitar: [
      { id: 'mg_1', name: 'Palm-Mute Djent Chug', pattern: [38], dur: 0.15, type: 'chug' },
      { id: 'mg_2', name: 'Drop-D Power Chord Slam', pattern: [38, 45, 50], dur: 0.35, type: 'power' },
      { id: 'mg_3', name: 'Pinch Harmonic Squeal', pattern: [62, 74], dur: 0.4, type: 'harmonic' },
      { id: 'mg_4', name: 'Gallop Triplet Chug', pattern: [38, 38, 38], dur: 0.22, type: 'chug' },
      { id: 'mg_5', name: 'Tritone Dissonant Drop', pattern: [38, 44], dur: 0.3, type: 'power' },
      { id: 'mg_6', name: 'Breakdown Zero-Fret Slam', pattern: [38], dur: 0.45, type: 'chug' },
      { id: 'mg_7', name: 'Neoclassical Sweep Lick', pattern: [62, 65, 69, 74], dur: 0.35, type: 'lead' },
      { id: 'mg_8', name: 'Heavy Low E5 Chord', pattern: [40, 47, 52], dur: 0.4, type: 'power' },
      { id: 'mg_9', name: 'Tremolo Pick Thrash', pattern: [50, 50, 50, 50], dur: 0.25, type: 'tremolo' },
      { id: 'mg_10', name: 'Harmonized 3rds Riff', pattern: [62, 65], dur: 0.35, type: 'lead' },
      { id: 'mg_11', name: 'Pick Scrape Slide', pattern: [0], dur: 0.3, type: 'scrape' },
      { id: 'mg_12', name: 'Djent Staccato Pulse', pattern: [38, 0, 38], dur: 0.2, type: 'chug' },
      { id: 'mg_13', name: 'Diminished Lead Run', pattern: [62, 65, 68, 71], dur: 0.35, type: 'lead' },
      { id: 'mg_14', name: 'Heavy Whammy Dive', pattern: [38, 36, 34], dur: 0.5, type: 'lead' },
      { id: 'mg_15', name: 'Alternate Pick Burst', pattern: [50, 53, 52, 50], dur: 0.3, type: 'lead' },
      { id: 'mg_16', name: 'Final Doom Sustain', pattern: [38, 45, 50, 53], dur: 1.0, type: 'power' },
    ],
  },
  lofi: {
    piano: [
      { id: 'lp_1', name: 'Detuned Vinyl Rhodes', pattern: [48, 55, 59, 62], dur: 0.6, type: 'rhodes' },
      { id: 'lp_2', name: 'Mellow Min9 Chord', pattern: [50, 53, 57, 60, 64], dur: 0.55, type: 'rhodes' },
      { id: 'lp_3', name: 'Dusty High Pentatonic', pattern: [67, 72, 74], dur: 0.4, type: 'piano' },
      { id: 'lp_4', name: 'Rainy Day Maj7', pattern: [53, 57, 60, 64], dur: 0.65, type: 'rhodes' },
      { id: 'lp_5', name: 'Tape Flutter Chord', pattern: [45, 52, 55, 60], dur: 0.5, type: 'rhodes' },
      { id: 'lp_6', name: 'Wobbly 7th Drop', pattern: [51, 55, 58, 62], dur: 0.48, type: 'rhodes' },
      { id: 'lp_7', name: 'Soft Upright Piano', pattern: [48, 52, 55], dur: 0.6, type: 'piano' },
      { id: 'lp_8', name: 'Soulful Half-Step Slide', pattern: [63, 64], dur: 0.35, type: 'rhodes' },
      { id: 'lp_9', name: 'Late Night Chill 9th', pattern: [50, 55, 59, 62], dur: 0.7, type: 'rhodes' },
      { id: 'lp_10', name: 'Subtle Grace Note Lofi', pattern: [69, 71, 72], dur: 0.38, type: 'piano' },
      { id: 'lp_11', name: 'Cozy Fireplace Min7', pattern: [52, 55, 59, 62], dur: 0.6, type: 'rhodes' },
      { id: 'lp_12', name: 'Vinyl Noise Piano', pattern: [60, 64, 67, 71], dur: 0.5, type: 'piano' },
      { id: 'lp_13', name: 'Muffled Filter Sweep', pattern: [48, 55, 60], dur: 0.45, type: 'rhodes' },
      { id: 'lp_14', name: 'Slow Swung Arp', pattern: [50, 57, 60, 64], dur: 0.55, type: 'rhodes' },
      { id: 'lp_15', name: 'Nostalgic 11th Pad', pattern: [45, 52, 57, 62], dur: 0.75, type: 'rhodes' },
      { id: 'lp_16', name: 'Fadeout Velvet Tonic', pattern: [48, 55, 59, 64], dur: 0.9, type: 'rhodes' },
    ],
    drums: [
      { 
        id: 'ld_1', 
        name: 'SP-404 Dusty Boom-Bap Beat', 
        desc: '82 BPM unquantized kick, lazy snare with vinyl crackle, and swung shaker',
        events: beatEvents(82, [[0, 'kick_acoustic', 1.0], [0, 'tambourine', 0.6], [2.2, 'hat_closed', 0.55], [4.2, 'snare_acoustic', 0.95], [6.4, 'hat_closed', 0.5], [7.2, 'kick_acoustic', 0.75], [8.4, 'tambourine', 0.6], [10.2, 'kick_acoustic', 0.85], [12.2, 'snare_acoustic', 0.95], [14.4, 'hat_open', 0.6]])
      },
      { 
        id: 'ld_2', 
        name: 'Behind-the-Beat Lazy Snare Drag', 
        desc: 'Heavily delayed snare on 2 & 4 creating authentic late-night head-nod',
        events: beatEvents(80, [[0, 'kick_acoustic'], [2.3, 'hat_closed', 0.5], [4.4, 'snare_acoustic', 1.0], [6.6, 'hat_closed', 0.5], [8.0, 'kick_acoustic', 0.85], [10.4, 'hat_closed', 0.5], [12.4, 'snare_acoustic', 1.0], [14.6, 'hat_open', 0.65]])
      },
      { 
        id: 'ld_3', 
        name: 'Muffled Low-Pass Kick Groove', 
        desc: 'Warm filtered bass drum thump with gentle wooden rim knock',
        events: beatEvents(84, [[0, 'kick_acoustic', 0.9], [2, 'hat_closed', 0.4], [4, 'sidestick', 0.85], [6, 'hat_closed', 0.4], [7, 'kick_acoustic', 0.7], [8, 'kick_acoustic', 0.85], [10, 'hat_closed', 0.4], [12, 'sidestick', 0.85], [14, 'hat_open', 0.5]])
      },
      { 
        id: 'ld_4', 
        name: 'Vinyl Shaker Pocket Beat', 
        desc: 'Intimate continuous shaker pattern with quiet ghost kicks',
        events: beatEvents(85, [[0, 'kick_acoustic', 0.8], [0, 'tambourine'], [2, 'tambourine', 0.5], [4, 'sidestick', 0.8], [4, 'tambourine'], [6, 'tambourine', 0.5], [8, 'kick_acoustic', 0.7], [8, 'tambourine'], [10, 'kick_acoustic', 0.75], [12, 'sidestick', 0.85], [14, 'tambourine']])
      },
      { 
        id: 'ld_5', 
        name: 'Finger Snap & Ambient Reverb', 
        desc: 'Smooth finger snap backbeat with deep kick and tape warmth',
        events: beatEvents(78, [[0, 'kick_acoustic', 0.95], [2.2, 'hat_closed', 0.45], [4.2, 'clap_acoustic', 0.8], [6.4, 'hat_closed', 0.45], [8.0, 'kick_acoustic', 0.85], [10.3, 'kick_acoustic', 0.7], [12.2, 'clap_acoustic', 0.85], [14.4, 'hat_open', 0.6]])
      },
      { 
        id: 'ld_6', 
        name: 'Tape-Stop Pitch-Wobble Beat', 
        desc: 'Slow decaying kick-snare groove mimicking warped cassette tape',
        events: beatEvents(76, [[0, 'kick_acoustic', 0.85], [3, 'hat_closed', 0.4], [4.3, 'snare_acoustic', 0.9], [7, 'kick_acoustic', 0.7], [8.2, 'kick_acoustic', 0.8], [11, 'hat_closed', 0.4], [12.3, 'snare_acoustic', 0.9], [15, 'hat_pedal']])
      },
      { 
        id: 'ld_7', 
        name: 'Chillhop Conga & Rim Beat', 
        desc: 'Organic conga taps over relaxed boom-bap rhythm',
        events: beatEvents(86, [[0, 'kick_acoustic', 0.85], [1.5, 'tom_mid', 0.6], [3, 'tom_high', 0.55], [4, 'sidestick', 0.9], [6, 'tom_mid', 0.65], [8, 'kick_acoustic', 0.8], [9.5, 'tom_floor', 0.7], [12, 'sidestick', 0.9], [14, 'hat_open', 0.6]])
      },
      { 
        id: 'ld_8', 
        name: 'SP-1200 Crunchy 12-Bit Beat', 
        desc: 'Gritty punchy 12-bit filtered drum machine chop',
        events: beatEvents(88, [[0, 'kick_acoustic', 1.0], [2, 'hat_closed', 0.7], [4, 'snare_rim', 1.0], [6, 'hat_closed', 0.7], [7, 'kick_acoustic', 0.85], [8, 'kick_acoustic', 0.95], [10, 'hat_open', 0.8], [12, 'snare_rim', 1.0], [14, 'hat_closed', 0.7]])
      },
      { 
        id: 'ld_9', 
        name: 'Dusty Ghost Snare Pocket', 
        desc: 'Quiet ghost taps on the upbeat creating hypnotic study groove',
        events: beatEvents(82, [[0, 'kick_acoustic'], [1.5, 'snare_acoustic', 0.25], [2.5, 'hat_closed', 0.5], [4, 'snare_acoustic', 0.9], [5.5, 'snare_acoustic', 0.25], [7, 'kick_acoustic'], [8, 'kick_acoustic', 0.8], [9.5, 'snare_acoustic', 0.25], [12, 'snare_acoustic', 0.9], [14, 'hat_open']])
      },
      { 
        id: 'ld_10', 
        name: 'Sidechained Open Hat Splash', 
        desc: 'Mellow open hat ducking behind the kick with warm room verb',
        events: beatEvents(80, [[0, 'kick_acoustic', 1.0], [2, 'hat_open', 0.7], [4, 'snare_acoustic', 0.9], [6, 'hat_open', 0.6], [8, 'kick_acoustic', 0.9], [10, 'hat_open', 0.7], [12, 'snare_acoustic', 0.9], [14, 'hat_pedal']])
      },
      { 
        id: 'ld_11', 
        name: 'Bedroom Study Session Beat', 
        desc: 'Gentle, comforting lo-fi groove with soft transients and deep warmth',
        events: beatEvents(78, [[0, 'kick_acoustic', 0.75], [2, 'hat_closed', 0.4], [4, 'snare_acoustic', 0.7], [6, 'hat_closed', 0.4], [8, 'kick_acoustic', 0.7], [10, 'hat_closed', 0.4], [12, 'snare_acoustic', 0.7], [14, 'hat_open', 0.5]])
      },
      { 
        id: 'ld_12', 
        name: 'Vinyl Rain & Rim Click Beat', 
        desc: 'Ambient texture with delicate side-stick and quiet ride ping',
        events: beatEvents(83, [[0, 'kick_acoustic', 0.8], [0, 'ride_bell', 0.5], [2, 'hat_closed', 0.4], [4, 'sidestick', 0.8], [6, 'hat_closed', 0.4], [8, 'kick_acoustic', 0.7], [10, 'ride_bell', 0.5], [12, 'sidestick', 0.85], [14, 'hat_open', 0.55]])
      },
      { 
        id: 'ld_13', 
        name: 'Mellow Boom-Bap Turnaround', 
        desc: 'Subtle high tom and floor tom fill leading back into the pocket',
        events: beatEvents(84, [[0, 'kick_acoustic'], [2, 'hat_closed'], [4, 'snare_acoustic'], [6, 'tom_high', 0.6], [7, 'tom_mid', 0.65], [8, 'tom_floor', 0.7], [10, 'kick_acoustic'], [12, 'snare_acoustic'], [14, 'crash_acoustic', 0.6]])
      },
      { 
        id: 'ld_14', 
        name: 'Swung Hi-Hat Triplet Lofi', 
        desc: 'Deep swung 16th triplet hi-hats with relaxed kick drops',
        events: beatEvents(81, [[0, 'kick_acoustic'], [0, 'hat_closed'], [1.3, 'hat_closed', 0.5], [2.6, 'hat_closed', 0.6], [4, 'snare_acoustic'], [5.3, 'hat_closed', 0.5], [6.6, 'hat_closed', 0.6], [8, 'kick_acoustic'], [9.3, 'hat_closed', 0.5], [12, 'snare_acoustic']])
      },
      { 
        id: 'ld_15', 
        name: 'Dusty Clap & Vinyl Snare', 
        desc: 'Layered quiet handclap with vinyl textured snare and sub kick',
        events: beatEvents(85, [[0, 'kick_acoustic', 0.95], [2.2, 'hat_closed'], [4.2, 'clap_acoustic', 0.75], [4.2, 'snare_acoustic', 0.85], [7, 'kick_acoustic', 0.8], [8, 'kick_acoustic', 0.9], [10, 'hat_open', 0.6], [12.2, 'clap_acoustic', 0.8], [12.2, 'snare_acoustic', 0.9]])
      },
      { 
        id: 'ld_16', 
        name: 'Lofi Midnight Fadeout Break', 
        desc: 'Complete chillhop drum loop resolving into gentle cymbal ring',
        events: beatEvents(80, [[0, 'crash_acoustic', 0.6], [0, 'kick_acoustic', 0.85], [2, 'hat_closed', 0.45], [4, 'snare_acoustic', 0.85], [6, 'hat_open', 0.5], [7, 'kick_acoustic', 0.7], [8, 'kick_acoustic', 0.85], [10, 'sidestick', 0.75], [12, 'snare_acoustic', 0.9], [14, 'ride_bell', 0.6]])
      },
    ],
    guitar: [
      { id: 'lg_1', name: 'Warm Chorus Nylon Pluck', pattern: [52, 55, 59], dur: 0.45, type: 'nylon' },
      { id: 'lg_2', name: 'Detuned Lofi 7th Arp', pattern: [50, 53, 57, 60], dur: 0.5, type: 'clean' },
      { id: 'lg_3', name: 'Mellow Thumb Downpick', pattern: [45, 52, 57], dur: 0.4, type: 'nylon' },
      { id: 'lg_4', name: 'Vinyl Crackle Lick', pattern: [62, 64, 67], dur: 0.38, type: 'clean' },
      { id: 'lg_5', name: 'Tape Wobble Major 7', pattern: [48, 55, 59, 64], dur: 0.6, type: 'clean' },
      { id: 'lg_6', name: 'Fingerstyle Acoustic Riff', pattern: [40, 47, 52, 55], dur: 0.48, type: 'nylon' },
      { id: 'lg_7', name: 'Soulful Slide Lofi', pattern: [60, 62], dur: 0.32, type: 'clean' },
      { id: 'lg_8', name: 'Low-Pass Filtered Strum', pattern: [45, 52, 57, 60], dur: 0.45, type: 'clean' },
      { id: 'lg_9', name: 'Gentle Harmonics', pattern: [64, 67, 71], dur: 0.55, type: 'harmonic' },
      { id: 'lg_10', name: 'Subtle Pentatonic Drift', pattern: [67, 64, 62], dur: 0.4, type: 'clean' },
      { id: 'lg_11', name: 'Warm Min9 Chord Pluck', pattern: [50, 53, 60, 64], dur: 0.52, type: 'nylon' },
      { id: 'lg_12', name: 'Ambient Reverb Tail', pattern: [57, 60, 64], dur: 0.65, type: 'clean' },
      { id: 'lg_13', name: 'Muted Thumb Chomp', pattern: [40], dur: 0.18, type: 'pluck' },
      { id: 'lg_14', name: 'Late Night Soul Lick', pattern: [62, 65, 67], dur: 0.42, type: 'clean' },
      { id: 'lg_15', name: 'Swung Fingerpick Fill', pattern: [52, 55, 59, 62], dur: 0.48, type: 'nylon' },
      { id: 'lg_16', name: 'Resting Root Sustain', pattern: [48, 55, 60], dur: 0.8, type: 'nylon' },
    ],
  },
  trap: {
    piano: [
      { id: 'tp_1', name: 'Dark Minor Trap Bell', pattern: [72, 75], dur: 0.4, type: 'bell' },
      { id: 'tp_2', name: 'Detuned Synth Horn', pattern: [48, 60, 63], dur: 0.35, type: 'brass' },
      { id: 'tp_3', name: '808 Bass Line Piano Sync', pattern: [36, 38], dur: 0.45, type: 'piano' },
      { id: 'tp_4', name: 'Gothic Minor Staccato', pattern: [60, 63, 67], dur: 0.25, type: 'piano' },
      { id: 'tp_5', name: 'Fast Arp 32nd Roll', pattern: [72, 75, 79, 84], dur: 0.28, type: 'synth' },
      { id: 'tp_6', name: 'Reverse Piano Swell', pattern: [60, 63, 67], dur: 0.55, type: 'reverse' },
      { id: 'tp_7', name: 'Drill Minor 2nd Clash', pattern: [60, 61], dur: 0.2, type: 'piano' },
      { id: 'tp_8', name: 'Heavy Low 808 Hit', pattern: [24, 36], dur: 0.6, type: '808' },
      { id: 'tp_9', name: 'Dark Bell Chime', pattern: [84, 87], dur: 0.45, type: 'bell' },
      { id: 'tp_10', name: 'Spooky Melody Run', pattern: [67, 68, 67, 63], dur: 0.35, type: 'piano' },
      { id: 'tp_11', name: 'Detuned Brass Jab', pattern: [48, 55, 60], dur: 0.25, type: 'brass' },
      { id: 'tp_12', name: 'Trap Piano Pluck', pattern: [72, 75], dur: 0.2, type: 'piano' },
      { id: 'tp_13', name: 'Half-Speed Slow Chord', pattern: [48, 51, 55], dur: 0.65, type: 'piano' },
      { id: 'tp_14', name: 'Staccato Pitch Glide', pattern: [63, 65], dur: 0.3, type: 'synth' },
      { id: 'tp_15', name: 'Diminished Trap Triad', pattern: [60, 63, 66], dur: 0.28, type: 'piano' },
      { id: 'tp_16', name: 'Final Dark Drop', pattern: [24, 36, 48], dur: 0.8, type: '808' },
    ],
    drums: [
      { 
        id: 'td_1', 
        name: 'Spinz 808 & 1/32 Hat Roll', 
        desc: '140 BPM booming 808 sub, fast 1/32nd triplet hat roll, and sharp Pyrex clap on 3',
        events: beatEvents(140, [[0, '808_sub'], [0, 'hat_closed', 0.8], [2, 'hat_closed', 0.7], [4, '808_clap', 1.0], [5, 'hat_closed', 0.5], [6, 'hat_closed', 0.7], [6.5, 'hat_closed', 0.6], [7, 'hat_closed', 0.6], [7.5, 'hat_closed', 0.7], [8, '808_sub', 1.0], [8, 'hat_closed', 0.8], [10, 'hat_closed', 0.7], [12, '808_clap', 1.0], [14, 'hat_closed', 0.6], [14.5, 'hat_closed', 0.7], [15, 'hat_open', 0.8]])
      },
      { 
        id: 'td_2', 
        name: 'UK/NY Drill Sliding 808 Beat', 
        desc: 'Sliding 808 pitch glide with off-beat syncopated drill snare backbeat',
        events: beatEvents(142, [[0, '808_sub', 1.0], [2, 'hat_closed', 0.7], [3, '808_sub', 0.9], [4.5, 'snare_rim', 1.0], [6, 'hat_closed', 0.6], [7, '808_sub', 0.85], [8, 'hat_open', 0.7], [10, 'hat_closed', 0.7], [11, '808_sub', 0.9], [12.5, 'snare_rim', 1.0], [14, 'hat_closed', 0.6]])
      },
      { 
        id: 'td_3', 
        name: 'Triple 808 Stutter Drop', 
        desc: 'Stuttering 808 kick drops into sudden silence and piercing clap',
        events: beatEvents(138, [[0, '808_sub', 1.0], [0.75, '808_sub', 0.85], [1.5, '808_sub', 0.9], [4, '808_clap', 1.0], [6, 'hat_closed', 0.7], [8, '808_sub', 1.0], [10, 'hat_open', 0.7], [12, '808_clap', 1.0], [14, 'hat_closed', 0.6]])
      },
      { 
        id: 'td_4', 
        name: 'Accelerating Hat Roll Cascade', 
        desc: 'Hi-hat roll shifting from 1/16 to 1/32 to 1/64 speed over punchy 808',
        events: beatEvents(140, [[0, '808_sub'], [0, 'hat_closed'], [2, 'hat_closed'], [4, '808_clap'], [6, 'hat_closed'], [6.5, 'hat_closed'], [7, 'hat_closed'], [7.3, 'hat_closed'], [7.6, 'hat_closed'], [8, '808_sub'], [10, 'hat_closed'], [12, '808_clap'], [14, 'hat_open']])
      },
      { 
        id: 'td_5', 
        name: 'Pyrex Clap & Laser Tick', 
        desc: 'Crisp trap clap layered with high-frequency laser hat patterns',
        events: beatEvents(144, [[0, 'kick_acoustic', 0.9], [2, 'hat_closed', 0.7], [4, '808_clap', 1.0], [6, 'hat_closed', 0.7], [7, 'kick_acoustic', 0.8], [8, '808_sub', 1.0], [10, 'hat_open', 0.7], [12, '808_clap', 1.0], [14, 'hat_closed', 0.7]])
      },
      { 
        id: 'td_6', 
        name: 'Acoustic Punch + 808 Sub Layer', 
        desc: 'Hard acoustic top kick layered over sustained booming sub bass',
        events: beatEvents(136, [[0, 'kick_acoustic', 1.0], [0, '808_sub', 1.0], [2, 'hat_closed'], [4, '808_clap', 1.0], [6, 'hat_closed'], [7, 'kick_acoustic', 0.9], [8, '808_sub', 1.0], [10, 'hat_open'], [12, '808_clap', 1.0], [14, 'hat_closed']])
      },
      { 
        id: 'td_7', 
        name: 'Pitch-Down Hat Drop Beat', 
        desc: 'Descending pitch hi-hat roll falling into heavy 808 sub drop',
        events: beatEvents(140, [[0, 'hat_closed', 0.9], [0.5, 'hat_closed', 0.8], [1, 'hat_closed', 0.7], [1.5, 'hat_closed', 0.6], [2, '808_sub', 1.0], [4, '808_clap', 1.0], [6, 'hat_closed'], [8, '808_sub'], [10, 'hat_closed'], [12, '808_clap'], [14, 'hat_open']])
      },
      { 
        id: 'td_8', 
        name: 'Trap Triangle & Syncopated Rim', 
        desc: 'High metallic triangle ping with syncopated dark trap rimshot',
        events: beatEvents(138, [[0, '808_sub'], [0, 'cowbell_real', 0.8], [2, 'hat_closed'], [4, 'sidestick', 1.0], [6, 'cowbell_real', 0.8], [8, '808_sub'], [10, 'hat_closed'], [12, 'sidestick', 1.0], [14, 'cowbell_real', 0.9]])
      },
      { 
        id: 'td_9', 
        name: 'Rapid 32nd Snare Roll Build', 
        desc: 'Rising snare roll crescendo leading directly into 808 drop',
        events: beatEvents(142, [[0, '808_snare', 0.4], [0.5, '808_snare', 0.5], [1, '808_snare', 0.6], [1.5, '808_snare', 0.7], [2, '808_snare', 0.8], [2.5, '808_snare', 0.9], [3, '808_snare', 1.0], [4, '808_sub', 1.0], [4, 'crash_acoustic', 1.0], [6, 'hat_closed'], [8, '808_clap']])
      },
      { 
        id: 'td_10', 
        name: 'Drill Glissando Sub Roll', 
        desc: 'Two-stage 808 pitch glide with staggered rim clicks',
        events: beatEvents(140, [[0, '808_sub', 1.0], [3, 'sidestick', 0.85], [4.5, '808_clap', 1.0], [7, '808_sub', 0.9], [8, 'hat_closed'], [10, 'sidestick', 0.85], [12.5, '808_clap', 1.0], [14, 'hat_open']])
      },
      { 
        id: 'td_11', 
        name: 'Atlanta Bounce Kick-Clap', 
        desc: 'Modern Atlanta bounce kick-clap pattern with open hat accents',
        events: beatEvents(135, [[0, '808_sub'], [2, 'hat_closed'], [3, 'kick_acoustic', 0.85], [4, '808_clap'], [6, 'hat_open'], [8, '808_sub'], [10, 'kick_acoustic', 0.85], [12, '808_clap'], [14, 'hat_closed']])
      },
      { 
        id: 'td_12', 
        name: 'Dark Cinematic Trap Drop', 
        desc: 'Heavy 808 sub boom with reverb crash and syncopated snare',
        events: beatEvents(130, [[0, '808_sub', 1.0], [0, 'crash_acoustic', 1.0], [4, '808_clap', 1.0], [7, '808_sub', 0.85], [8, '808_sub', 1.0], [10, 'hat_open'], [12, '808_clap', 1.0], [14, 'crash_acoustic', 0.7]])
      },
      { 
        id: 'td_13', 
        name: 'Trap Hi-Hat Glitch Beat', 
        desc: 'Stuttering glitch hi-hats over heavy sub 808 and snare crack',
        events: beatEvents(140, [[0, '808_sub'], [0.7, 'hat_closed'], [1.4, 'hat_closed'], [2.1, 'hat_closed'], [4, '808_clap'], [6, 'hat_closed'], [8, '808_sub'], [9.5, 'hat_closed'], [12, '808_clap'], [14, 'hat_open']])
      },
      { 
        id: 'td_14', 
        name: 'Sub Drop & Open Hat Sizzle', 
        desc: 'Low-end sub boom with wide stereo open hi-hat wash',
        events: beatEvents(136, [[0, '808_sub', 1.0], [2, 'hat_open', 0.8], [4, '808_clap', 1.0], [6, 'hat_closed'], [8, '808_sub', 1.0], [10, 'hat_open', 0.8], [12, '808_clap', 1.0], [14, 'hat_closed']])
      },
      { 
        id: 'td_15', 
        name: 'Double Clap Drill Bounce', 
        desc: 'Rapid double clap with sliding 808 sub and fast hat rolls',
        events: beatEvents(144, [[0, '808_sub'], [2, 'hat_closed'], [4, '808_clap', 0.8], [4.5, '808_clap', 1.0], [7, '808_sub'], [8, 'hat_closed'], [10, 'hat_closed'], [12, '808_clap', 0.8], [12.5, '808_clap', 1.0]])
      },
      { 
        id: 'td_16', 
        name: 'Full Metro Trap Beat Drop', 
        desc: 'Complete trap beat: 808 sub, rolling hats, open hats, clap, and crash impact',
        events: beatEvents(140, [[0, 'crash_acoustic', 1.0], [0, '808_sub', 1.0], [2, 'hat_closed', 0.8], [3, 'hat_closed', 0.6], [4, '808_clap', 1.0], [5, 'hat_closed', 0.6], [6, 'hat_open', 0.8], [7, 'kick_acoustic', 0.9], [8, '808_sub', 1.0], [9, 'hat_closed', 0.6], [10, 'hat_closed', 0.8], [11, '808_sub', 0.8], [12, '808_clap', 1.0], [13, 'hat_closed', 0.6], [14, 'hat_open', 0.8], [15, '808_snare', 0.9]])
      },
    ],
    guitar: [
      { id: 'tg_1', name: 'Dark Spanish Trap Pluck', pattern: [60, 63, 67], dur: 0.35, type: 'nylon' },
      { id: 'tg_2', name: 'Reverse Acoustic Swell', pattern: [60, 63], dur: 0.45, type: 'reverse' },
      { id: 'tg_3', name: 'Drill Staccato Double Pluck', pattern: [60, 60], dur: 0.2, type: 'clean' },
      { id: 'tg_4', name: 'Minor 2nd Dark Slide', pattern: [60, 61], dur: 0.25, type: 'clean' },
      { id: 'tg_5', name: 'Pitch-Shifted Down Octave', pattern: [48, 51], dur: 0.4, type: 'clean' },
      { id: 'tg_6', name: 'Melodic Minor Bell Pluck', pattern: [67, 70, 72], dur: 0.35, type: 'nylon' },
      { id: 'tg_7', name: 'Fast Flamenco Roll', pattern: [60, 63, 67, 72], dur: 0.3, type: 'nylon' },
      { id: 'tg_8', name: '808-Tuned Root Strum', pattern: [36, 48, 55], dur: 0.5, type: 'clean' },
      { id: 'tg_9', name: 'Muted Drill Chug', pattern: [48], dur: 0.15, type: 'chug' },
      { id: 'tg_10', name: 'High E String Weep', pattern: [72, 71, 68], dur: 0.4, type: 'clean' },
      { id: 'tg_11', name: 'Trap Acoustic Chord Stab', pattern: [48, 51, 55, 60], dur: 0.28, type: 'nylon' },
      { id: 'tg_12', name: 'Chorus Guitar Lick', pattern: [63, 65, 67], dur: 0.35, type: 'clean' },
      { id: 'tg_13', name: 'Half-Speed Slowed Lick', pattern: [60, 63], dur: 0.6, type: 'nylon' },
      { id: 'tg_14', name: 'Diminished Drill Stab', pattern: [48, 54, 60], dur: 0.25, type: 'clean' },
      { id: 'tg_15', name: 'Spooky Arp Fragment', pattern: [60, 63, 67], dur: 0.32, type: 'nylon' },
      { id: 'tg_16', name: 'Bass Drop Octave Ring', pattern: [36, 48], dur: 0.7, type: 'nylon' },
    ],
  },
  blues: {
    piano: [
      { id: 'bp_1', name: '12-Bar Turnaround Lick', pattern: [60, 63, 64, 67], dur: 0.45, type: 'piano' },
      { id: 'bp_2', name: 'Blue Note Grace Strike', pattern: [62, 63, 64], dur: 0.3, type: 'piano' },
      { id: 'bp_3', name: 'Shuffle Triplet Comp', pattern: [55, 59, 62], dur: 0.35, type: 'piano' },
      { id: 'bp_4', name: 'Boogie-Woogie Bass Walk', pattern: [36, 40, 43, 45], dur: 0.5, type: 'piano' },
      { id: 'bp_5', name: 'Dominant 7th Slur', pattern: [60, 64, 67, 70], dur: 0.4, type: 'piano' },
      { id: 'bp_6', name: 'Crushed Minor 3rd', pattern: [63, 64, 67], dur: 0.28, type: 'piano' },
      { id: 'bp_7', name: 'Slow Blues Tremolo', pattern: [72, 72, 72], dur: 0.35, type: 'piano' },
      { id: 'bp_8', name: 'G7 Stride Chord', pattern: [43, 53, 59, 62], dur: 0.45, type: 'piano' },
      { id: 'bp_9', name: 'Ray Charles Gospel Jab', pattern: [55, 60, 64, 67], dur: 0.3, type: 'piano' },
      { id: 'bp_10', name: 'Minor Blues Pentatonic', pattern: [60, 63, 65, 66, 67], dur: 0.42, type: 'piano' },
      { id: 'bp_11', name: 'Swung 6th Interval', pattern: [60, 69], dur: 0.32, type: 'piano' },
      { id: 'bp_12', name: 'B.B. King Accent Chime', pattern: [72, 75, 76], dur: 0.38, type: 'piano' },
      { id: 'bp_13', name: 'Delta Blues Low Drone', pattern: [36, 48], dur: 0.6, type: 'piano' },
      { id: 'bp_14', name: 'Slide Down Resolv', pattern: [67, 65, 63, 60], dur: 0.4, type: 'piano' },
      { id: 'bp_15', name: 'Honky Tonk Clatter', pattern: [64, 67, 71], dur: 0.25, type: 'piano' },
      { id: 'bp_16', name: 'Final Blues Cadence', pattern: [36, 52, 58, 64], dur: 0.8, type: 'piano' },
    ],
    drums: [
      { 
        id: 'bd_1', 
        name: 'Chicago 12-Bar Shuffle Beat', 
        desc: '92 BPM classic Chicago blues driving swing ride, feathered kick, and fat backbeat snare',
        events: beatEvents(92, [[0, 'ride_acoustic', 0.9], [0, 'kick_acoustic', 0.8], [2.6, 'ride_acoustic', 0.65], [4, 'snare_rim', 1.0], [4, 'ride_acoustic', 0.9], [6.6, 'ride_acoustic', 0.65], [8, 'kick_acoustic', 0.8], [8, 'ride_acoustic', 0.9], [10.6, 'ride_acoustic', 0.65], [12, 'snare_rim', 1.0], [12, 'ride_bell', 0.9], [14.6, 'ride_acoustic', 0.65]])
      },
      { 
        id: 'bd_2', 
        name: 'Texas Blues Double Shuffle', 
        desc: 'Stevie Ray Vaughan style double-hand snare shuffle with driving kick',
        events: beatEvents(110, [[0, 'kick_acoustic', 0.9], [0, 'snare_acoustic', 0.4], [1.3, 'snare_acoustic', 0.6], [2.6, 'snare_acoustic', 0.5], [4, 'snare_rim', 1.0], [5.3, 'snare_acoustic', 0.6], [6.6, 'snare_acoustic', 0.5], [8, 'kick_acoustic', 0.9], [9.3, 'snare_acoustic', 0.6], [12, 'snare_rim', 1.0]])
      },
      { 
        id: 'bd_3', 
        name: 'Slow 6/8 Blues Ballad Beat', 
        desc: 'Deep 12/8 triplet slow blues groove with ride bell and rolling snare drags',
        events: beatEvents(65, [[0, 'ride_bell', 0.9], [0, 'kick_acoustic', 0.9], [1.3, 'ride_acoustic', 0.6], [2.6, 'ride_acoustic', 0.6], [4, 'snare_rim', 1.0], [4, 'ride_acoustic', 0.8], [5.3, 'ride_acoustic', 0.6], [6.6, 'ride_acoustic', 0.6], [8, 'kick_acoustic', 0.8], [9.3, 'ride_acoustic', 0.6], [12, 'snare_rim', 1.0]])
      },
      { 
        id: 'bd_4', 
        name: 'Wooden Side-Stick Blues Beat', 
        desc: 'Delicate wooden cross-stick on 2 & 4 with gentle walking kick',
        events: beatEvents(88, [[0, 'kick_acoustic', 0.7], [2.6, 'hat_closed', 0.5], [4, 'sidestick', 0.9], [6.6, 'hat_closed', 0.5], [8, 'kick_acoustic', 0.65], [10.6, 'hat_closed', 0.5], [12, 'sidestick', 0.9], [14.6, 'hat_open', 0.6]])
      },
      { 
        id: 'bd_5', 
        name: 'Swung Ride Bell Turnaround', 
        desc: 'Accented heavy ride bell on triplet upbeats leading into new 12-bar cycle',
        events: beatEvents(94, [[0, 'ride_bell', 0.95], [0, 'kick_acoustic'], [2.6, 'ride_bell', 0.8], [4, 'snare_rim', 0.9], [6.6, 'ride_bell', 0.8], [8, 'kick_acoustic'], [10.6, 'ride_bell', 0.85], [12, 'snare_rim', 1.0], [14.6, 'crash_acoustic', 0.85]])
      },
      { 
        id: 'bd_6', 
        name: 'Delta Blues Foot Stomp', 
        desc: 'Raw acoustic kick stomp on every quarter beat with tambourine shake',
        events: beatEvents(85, [[0, 'kick_acoustic', 1.0], [0, 'tambourine'], [2.6, 'tambourine', 0.6], [4, 'kick_acoustic', 0.9], [4, 'tambourine'], [6.6, 'tambourine', 0.6], [8, 'kick_acoustic', 1.0], [8, 'tambourine'], [10.6, 'tambourine', 0.6], [12, 'kick_acoustic', 0.9], [12, 'snare_acoustic', 0.7]])
      },
      { 
        id: 'bd_7', 
        name: 'Brush Shuffle Swirl Groove', 
        desc: 'Gentle swept brush snare pattern with swung ride cymbal',
        events: beatEvents(90, [[0, 'ride_acoustic', 0.7], [0, 'kick_acoustic', 0.4], [1.3, 'snare_acoustic', 0.4], [2.6, 'snare_acoustic', 0.5], [4, 'snare_acoustic', 0.8], [4, 'hat_pedal'], [6.6, 'ride_acoustic', 0.6], [8, 'kick_acoustic', 0.4], [12, 'snare_acoustic', 0.85]])
      },
      { 
        id: 'bd_8', 
        name: 'Fat Backbeat Rimshot Smack', 
        desc: 'Deep fat snare smack with open hi-hat splash on the ands',
        events: beatEvents(95, [[0, 'kick_acoustic', 0.95], [2.6, 'hat_open', 0.7], [4, 'snare_rim', 1.0], [6.6, 'hat_open', 0.7], [8, 'kick_acoustic', 0.9], [10.6, 'hat_open', 0.7], [12, 'snare_rim', 1.0], [14.6, 'hat_open', 0.8]])
      },
      { 
        id: 'bd_9', 
        name: 'Blues Tom Swung Fill', 
        desc: 'Lazy triplet tom fill rolling down to crash on beat one',
        events: beatEvents(90, [[0, 'kick_acoustic'], [2.6, 'hat_closed'], [4, 'snare_rim'], [6.6, 'tom_high', 0.8], [8, 'tom_mid', 0.85], [9.3, 'tom_mid', 0.85], [10.6, 'tom_floor', 0.95], [12, 'snare_rim', 1.0], [14.6, 'crash_acoustic', 1.0]])
      },
      { 
        id: 'bd_10', 
        name: 'Pumping Open Hi-Hat Blues', 
        desc: 'Swung 8th open/closed hat pump driving the blues engine',
        events: beatEvents(96, [[0, 'kick_acoustic'], [0, 'hat_closed'], [2, 'hat_open', 0.75], [4, 'snare_rim'], [4, 'hat_closed'], [6, 'hat_open', 0.75], [8, 'kick_acoustic'], [8, 'hat_closed'], [10, 'hat_open', 0.75], [12, 'snare_rim'], [14, 'hat_open', 0.85]])
      },
      { 
        id: 'bd_11', 
        name: 'Memphis Soul Stax Pocket', 
        desc: 'Tight, crisp drum pocket with tambourine accents and solid kick',
        events: beatEvents(100, [[0, 'kick_acoustic'], [0, 'tambourine'], [2, 'hat_closed'], [4, 'snare_rim'], [4, 'tambourine'], [6, 'kick_acoustic'], [7, 'kick_acoustic'], [8, 'tambourine'], [10, 'hat_open'], [12, 'snare_rim'], [12, 'tambourine'], [14, 'hat_closed']])
      },
      { 
        id: 'bd_12', 
        name: 'Slow Burn Triplet Snare Roll', 
        desc: 'Swelling triplet snare roll building tension for a guitar solo',
        events: beatEvents(70, [[0, 'snare_acoustic', 0.3], [1.3, 'snare_acoustic', 0.4], [2.6, 'snare_acoustic', 0.55], [4, 'snare_acoustic', 0.7], [5.3, 'snare_acoustic', 0.85], [6.6, 'snare_rim', 1.0], [8, 'kick_acoustic'], [8, 'crash_acoustic', 1.0]])
      },
      { 
        id: 'bd_13', 
        name: 'Blues Turnaround Crash Choke', 
        desc: 'Swung fill ending on an explosive choked crash cymbal',
        events: beatEvents(92, [[0, 'kick_acoustic'], [2.6, 'hat_closed'], [4, 'snare_rim'], [6.6, 'tom_floor', 0.8], [8, 'kick_acoustic'], [10.6, 'snare_rim'], [12, 'crash_acoustic', 0.95], [13, 'hat_pedal', 1.0]])
      },
      { 
        id: 'bd_14', 
        name: 'Juke Joint Backbeat Stomp', 
        desc: 'Raucous foot-stomping rhythm with loud handclaps and heavy kick',
        events: beatEvents(105, [[0, 'kick_acoustic', 1.0], [2, 'hat_closed'], [4, 'clap_acoustic', 1.0], [4, 'snare_rim', 0.9], [6, 'kick_acoustic'], [7, 'kick_acoustic'], [8, 'kick_acoustic'], [10, 'hat_open'], [12, 'clap_acoustic', 1.0], [14, 'kick_acoustic']])
      },
      { 
        id: 'bd_15', 
        name: 'Shuffle Snare Drag Beat', 
        desc: 'Subtle double-stroke snare drag on the upbeat before the backbeat',
        events: beatEvents(90, [[0, 'kick_acoustic'], [2.6, 'hat_closed'], [3.5, 'snare_acoustic', 0.4], [4, 'snare_rim', 1.0], [6.6, 'hat_closed'], [8, 'kick_acoustic'], [10.6, 'hat_closed'], [11.5, 'snare_acoustic', 0.4], [12, 'snare_rim', 1.0]])
      },
      { 
        id: 'bd_16', 
        name: 'B.B. King Final Blues Accent', 
        desc: 'Full band crash flam turnaround to resolve a 12-bar blues chorus',
        events: beatEvents(88, [[0, 'crash_acoustic', 1.0], [0, 'kick_acoustic', 1.0], [2.6, 'snare_acoustic', 0.4], [4, 'snare_rim', 0.9], [6.6, 'tom_high', 0.8], [8, 'tom_mid', 0.85], [10.6, 'tom_floor', 0.95], [12, 'snare_rim', 1.0], [12, 'crash_acoustic', 1.0]])
      },
    ],
    guitar: [
      { id: 'bg_1', name: 'Albert King String Bend', pattern: [62, 64], dur: 0.45, type: 'bend' },
      { id: 'bg_2', name: '12-Bar Shuffle Boiled Strum', pattern: [40, 47, 52, 56], dur: 0.35, type: 'clean' },
      { id: 'bg_3', name: 'Double-Stop 6ths Riff', pattern: [60, 69], dur: 0.3, type: 'clean' },
      { id: 'bg_4', name: 'Slow Blues Pentatonic Wail', pattern: [67, 70, 72], dur: 0.5, type: 'bend' },
      { id: 'bg_5', name: 'Delta Blues Thumb Thump', pattern: [40, 52], dur: 0.38, type: 'acoustic' },
      { id: 'bg_6', name: 'Turnaround Chord Chop', pattern: [43, 49, 53, 58], dur: 0.35, type: 'clean' },
      { id: 'bg_7', name: 'Blue Note Slide', pattern: [62, 63, 64], dur: 0.32, type: 'slide' },
      { id: 'bg_8', name: 'Stevie Ray Vaughan Shuffle', pattern: [40, 47, 52, 59], dur: 0.3, type: 'overdrive' },
      { id: 'bg_9', name: 'B.B. King Vibrato Queen', pattern: [72], dur: 0.6, type: 'vibrato' },
      { id: 'bg_10', name: 'Overdriven Power 7th', pattern: [45, 52, 55, 60], dur: 0.4, type: 'overdrive' },
      { id: 'bg_11', name: 'Acoustic Slide Lick', pattern: [55, 59, 62], dur: 0.42, type: 'slide' },
      { id: 'bg_12', name: 'Call and Response Lick', pattern: [67, 65, 62, 60], dur: 0.45, type: 'clean' },
      { id: 'bg_13', name: 'Dominant 9th Strum', pattern: [45, 52, 57, 61, 66], dur: 0.35, type: 'clean' },
      { id: 'bg_14', name: 'Hammer-On Blues Trill', pattern: [62, 64, 62], dur: 0.28, type: 'clean' },
      { id: 'bg_15', name: 'Low E Drone Shifter', pattern: [40, 43, 44], dur: 0.4, type: 'acoustic' },
      { id: 'bg_16', name: 'Final Stung Resolv', pattern: [40, 47, 52, 56, 59, 64], dur: 0.9, type: 'clean' },
    ],
  },
};

// ============================================================================
// TOUCH CONTROLLER ENGINE STATE
// ============================================================================

class TouchControllerEngine {
  constructor() {
    this.activeInstrument = 'drums'; // 'piano' | 'drums' | 'guitar'
    this.activeMode = 'notes';       // 'notes' | 'chords' | 'slices'
    this.activeGenre = 'funk';       // 'funk' | 'jazz' | 'metal' | 'lofi' | 'trap' | 'blues'
    
    // Octave transpose & pitch controls
    this.pianoOctave = 3;            // C3 (48) - C5 (72)
    this.guitarTuning = 'standard';  // 'standard' | 'drop_d' | 'dadgad' | 'open_g'
    this.slicePitchShift = 0;        // -12 to +12 semitones
    this.sliceSpeed = 1.0;           // 0.5, 1.0, 2.0
    this.sliceFilter = 1.0;          // Cutoff multiplier
    
    // Interactive Chord Builder state (Piano & Guitar)
    this.selectedChordRoot = 0;      // 0 = C, 2 = D, etc.
    this.selectedChordType = 'maj7'; // 'maj', 'min', 'maj7', 'min7', 'dom7', 'min9', 'maj9', 'sus4', 'dim'
    this.selectedChordInversion = 0; // 0 = Root, 1 = 1st, 2 = 2nd
    this.chordStrumSpeed = 0.024;    // Strum spread in seconds
    
    // Drum Engine & Groove state (Drums)
    this.selectedDrumKit = 'studio_acoustic';
    this.drumSwing = 0;              // 0, 0.08, 0.16
    this.rollDensity = '16th';       // '8th', '16th', '32nd'
    this.activeSliceTimeouts = [];
    
    // Drum Fills & Main Parts arrangement state
    this.drumGrooveCategory = 'fill_1m'; // 'main' | 'fill_1m' | 'fill_4m'
    this.selectedMainPartIndex = 0;      // Target main part for fills to drop into
    this.autoResolveMainPart = true;     // Automatically drop into main part when fill completes
  }

  // Instrument-Specific Modes (Drums do not have chords!)
  getModesForInstrument() {
    if (this.activeInstrument === 'drums') {
      return [
        { id: 'notes', name: 'Single Hits', icon: '', desc: '16-Pad MPC one-shot drum hits' },
        { id: 'chords', name: 'Grooves & Fills', icon: '', desc: 'Dynamic drum rolls, groove stems, and rhythm fills' },
        { id: 'slices', name: 'Genre Beats', icon: '', desc: 'Live genre-based breakbeats, chops, and drum loops' },
      ];
    }
    if (this.activeInstrument === 'guitar') {
      return [
        { id: 'notes', name: 'Single Notes', icon: '', desc: 'Fretboard frets & open strings' },
        { id: 'chords', name: 'Guitar Chords', icon: '', desc: 'Strummable chord shapes & barres' },
        { id: 'slices', name: 'Genre Riffs', icon: '', desc: 'Genre-based guitar riffs & chops' },
      ];
    }
    // Piano
    return [
      { id: 'notes', name: 'Single Notes', icon: '', desc: '2+ Octaves chromatic piano keys' },
      { id: 'chords', name: 'Harmonic Chords', icon: '', desc: 'Jazz, Soul, Pop & Classical chord voicings' },
      { id: 'slices', name: 'Genre Licks', icon: '', desc: 'Genre-based piano phrases & stabs' },
    ];
  }

  // Directional Navigation (Left, Middle, Right)
  navInstrument(direction) {
    const ids = ['piano', 'drums', 'guitar'];
    const currentIndex = ids.indexOf(this.activeInstrument);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = ids.length - 1;
    if (nextIndex >= ids.length) nextIndex = 0;
    this.setInstrument(ids[nextIndex]);
  }

  setInstrument(instId) {
    if (!['piano', 'drums', 'guitar'].includes(instId)) return;
    this.stopActiveSlice();
    this.activeInstrument = instId;
    
    // Match instrument voice in instrumentEngine & preload real studio soundfonts
    if (instId === 'piano') {
      instrumentEngine.setInstrument('grand_piano');
    } else if (instId === 'guitar') {
      instrumentEngine.setInstrument('steel_acoustic');
    } else if (instId === 'drums') {
      sampleEngine.preloadAcousticDrums();
    }
    
    this.render();
  }

  setMode(modeId) {
    if (!['notes', 'chords', 'slices'].includes(modeId)) return;
    this.stopActiveSlice();
    this.activeMode = modeId;
    this.render();
  }

  setGenre(genreId) {
    if (!GENRES_CATALOG.some(g => g.id === genreId)) return;
    this.stopActiveSlice();
    this.activeGenre = genreId;
    this.render();
  }

  shiftOctave(delta) {
    this.pianoOctave = Math.max(1, Math.min(6, this.pianoOctave + delta));
    this.render();
  }

  setSlicePitch(st) {
    this.slicePitchShift = Math.max(-12, Math.min(12, parseInt(st) || 0));
    const label = document.getElementById('ctrlSlicePitchVal');
    if (label) label.textContent = `${this.slicePitchShift > 0 ? '+' : ''}${this.slicePitchShift} st`;
  }

  setSliceSpeed(speed) {
    this.sliceSpeed = parseFloat(speed) || 1.0;
    this.render();
  }

  setDrumSwing(amt) {
    this.drumSwing = parseFloat(amt) || 0;
    this.render();
  }

  setRollDensity(density) {
    this.rollDensity = density;
    this.render();
  }

  stopActiveSlice() {
    if (this.activeSliceTimeouts && this.activeSliceTimeouts.length > 0) {
      this.activeSliceTimeouts.forEach(id => clearTimeout(id));
      this.activeSliceTimeouts = [];
    }
  }

  auditionDrumFill() {
    const kit = instrumentEngine.getDrumKit();
    const is808 = kit && kit.id === 'trap_808';
    const snare = is808 ? '808_snare' : 'snare_acoustic';
    const kick = is808 ? '808_sub' : 'kick_acoustic';
    const crash = is808 ? '808_crash' : 'crash_acoustic';
    const steps = this.rollDensity === '32nd' 
      ? [[0, kick], [2, snare], [3, snare], [4, snare], [5, snare], [6, snare], [7, snare], [8, crash]]
      : this.rollDensity === '8th'
      ? [[0, kick], [2, snare], [4, 'tom_mid'], [6, 'tom_floor'], [8, crash]]
      : [[0, kick], [2, snare], [3, snare], [4, 'tom_high'], [5, 'tom_mid'], [6, 'tom_floor'], [7, 'tom_floor'], [8, crash]];
    
    const events = beatEvents(120, steps);
    this.stopActiveSlice();
    events.forEach(evt => {
      const tId = setTimeout(() => {
        instrumentEngine.playDrumSound(evt.sound, evt.vel);
      }, evt.time * 1000);
      this.activeSliceTimeouts.push(tId);
    });
  }

  /**
   * Instant 1-Click Studio Sound Check: Plays authentic studio multi-samples
   */
  auditionInstrument(instId) {
    this.stopActiveSlice();
    const ctx = instrumentEngine.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (instId === 'piano') {
      this.setInstrument('piano');
      // Authentic Concert Grand Piano Arpeggio (C Major 9)
      const pianoNotes = [48, 55, 60, 62, 64, 71, 72]; // C3, G3, C4, D4, E4, B4, C5
      pianoNotes.forEach((midi, idx) => {
        const tId = setTimeout(() => {
          instrumentEngine.playNote(midi, 2.2, 0.95);
        }, idx * 170);
        this.activeSliceTimeouts.push(tId);
      });
    } else if (instId === 'drums') {
      this.setInstrument('drums');
      // Authentic Acoustic Drum Kit Sequence (Kick, Snare, Hats, Toms & Ride)
      const drumSequence = [
        { sound: 'kick_acoustic', time: 0, vel: 1.0 },
        { sound: 'hat_closed', time: 0.15, vel: 0.8 },
        { sound: 'snare_acoustic', time: 0.35, vel: 0.95 },
        { sound: 'hat_closed', time: 0.50, vel: 0.75 },
        { sound: 'kick_acoustic', time: 0.65, vel: 0.9 },
        { sound: 'tom_high', time: 0.80, vel: 0.85 },
        { sound: 'tom_mid', time: 0.95, vel: 0.85 },
        { sound: 'snare_rim', time: 1.10, vel: 0.95 },
        { sound: 'ride_acoustic', time: 1.25, vel: 1.0 },
      ];
      drumSequence.forEach(evt => {
        const tId = setTimeout(() => {
          instrumentEngine.playDrumSound(evt.sound, evt.vel);
        }, evt.time * 1000);
        this.activeSliceTimeouts.push(tId);
      });
    } else if (instId === 'guitar') {
      this.setInstrument('guitar');
      // Authentic Steel-String Acoustic Guitar Strum (Em9 / G)
      const guitarNotes = [40, 47, 52, 55, 59, 62]; // E2, B2, E3, G3, B3, D4
      guitarNotes.forEach((midi, idx) => {
        const tId = setTimeout(() => {
          instrumentEngine.playNote(midi, 2.4, 0.92);
        }, idx * 35);
        this.activeSliceTimeouts.push(tId);
      });
    }
  }

  // ==========================================================================
  // PLAYBACK DISPATCHERS
  // ==========================================================================

  playSingleNote(midi, velocity = 0.95) {
    instrumentEngine.noteOn(midi, velocity);
    setTimeout(() => instrumentEngine.noteOff(midi), 400);
  }

  playDrumHit(padNum, velocity = 0.95) {
    instrumentEngine.playDrumPad(padNum, velocity);
  }

  playChordVoicing(midis, isGuitarStrum = false, velocity = 0.9) {
    if (!midis || midis.length === 0) return;
    const dur = 1.8;
    const strum = isGuitarStrum ? this.chordStrumSpeed : 0.012;
    
    midis.forEach((midi, i) => {
      setTimeout(() => {
        instrumentEngine.playNote(midi, dur, velocity * (0.92 + Math.random() * 0.1));
      }, i * strum * 1000);
    });
  }

  // Play Dynamic Drum Grooves, 1-Measure Fills, & 4-Measure Buildups
  playDrumGroove(grooveItem) {
    if (!grooveItem) return;
    this.stopActiveSlice();
    
    if (grooveItem.events && grooveItem.events.length > 0) {
      grooveItem.events.forEach((evt) => {
        const timeoutId = setTimeout(() => {
          instrumentEngine.playDrumSound(evt.sound, evt.vel || 0.95);
        }, evt.time * 1000);
        this.activeSliceTimeouts.push(timeoutId);
      });

      // Seamless Auto-Drop into Target Main Part when Fill Completes
      const isFill = grooveItem.category === 'fill_1m' || grooveItem.category === 'fill_4m' || this.drumGrooveCategory.startsWith('fill');
      if (this.autoResolveMainPart && isFill) {
        const mainPart = this.getActiveMainPart();
        if (mainPart && mainPart.events && mainPart.events.length > 0) {
          const measures = grooveItem.measures || (this.drumGrooveCategory === 'fill_4m' ? 4 : 1);
          const bpm = grooveItem.bpm || 120;
          const fillDuration = measures * ((60 / bpm) * 4);
          
          mainPart.events.forEach((evt) => {
            const timeoutId = setTimeout(() => {
              instrumentEngine.playDrumSound(evt.sound, evt.vel || 0.95);
            }, (fillDuration + evt.time) * 1000);
            this.activeSliceTimeouts.push(timeoutId);
          });
        }
      }
      return;
    }
    
    if (grooveItem.sounds) {
      grooveItem.sounds.forEach((soundName, i) => {
        setTimeout(() => {
          instrumentEngine.playDrumSound(soundName, 0.95);
        }, i * 20);
      });
    }
  }

  // Backward-compatible alias
  playDrumChord(chordItem) {
    this.playDrumGroove(chordItem);
  }

  setDrumGrooveCategory(cat) {
    this.drumGrooveCategory = cat;
    this.render();
  }

  getActiveDrumCatalog() {
    if (this.drumGrooveCategory === 'fill_4m') return DRUM_FOUR_MEASURE_FILLS;
    if (this.drumGrooveCategory === 'fill_1m') return DRUM_SINGLE_MEASURE_FILLS;
    return DRUM_MAIN_PARTS_CATALOG;
  }

  getDrumGroove(idx) {
    const catalog = this.getActiveDrumCatalog();
    return catalog[idx] || catalog[0];
  }

  getDrumChord(idx) {
    return this.getDrumGroove(idx);
  }

  getActiveMainPart() {
    return DRUM_MAIN_PARTS_CATALOG[this.selectedMainPartIndex] || DRUM_MAIN_PARTS_CATALOG[0];
  }

  toggleAutoResolveMainPart() {
    this.autoResolveMainPart = !this.autoResolveMainPart;
    this.render();
  }

  setSelectedMainPart(index) {
    this.selectedMainPartIndex = parseInt(index, 10) || 0;
    this.render();
  }

  auditionFillMode(mode) {
    this.stopActiveSlice();
    if (mode === 'fill_4m') {
      const item = DRUM_FOUR_MEASURE_FILLS[0];
      this.playDrumGroove(item);
    } else if (mode === 'fill_1m') {
      const item = DRUM_SINGLE_MEASURE_FILLS[0];
      this.playDrumGroove(item);
    } else {
      const item = this.getActiveMainPart();
      this.playDrumGroove(item);
    }
  }

  // Play authentic genre-based breakbeat chops & musical loops
  playGenreSlice(slice) {
    if (!slice) return;
    
    const pitchOffset = this.slicePitchShift;
    const speedMult = this.sliceSpeed;
    
    if (this.activeInstrument === 'drums') {
      // DRUM SLICE: Play fully sequenced genre breakbeats!
      this.stopActiveSlice();
      if (slice.events && slice.events.length > 0) {
        slice.events.forEach((evt) => {
          const timeoutId = setTimeout(() => {
            instrumentEngine.playDrumSound(evt.sound, evt.vel || 0.95);
          }, (evt.time * 1000) / speedMult);
          this.activeSliceTimeouts.push(timeoutId);
        });
        return;
      }
      
      // Fallback single sound if no events array
      instrumentEngine.playDrumSound(slice.sound || 'snare_acoustic', 0.95);
      return;
    }
    
    // Piano or Guitar Slice phrase / chord
    const notes = (slice.pattern || [60]).map(n => n + pitchOffset);
    const baseDuration = (slice.dur || 0.3) / speedMult;
    
    if (notes.length === 1) {
      instrumentEngine.playNote(notes[0], baseDuration, 0.95);
    } else {
      notes.forEach((midi, i) => {
        setTimeout(() => {
          instrumentEngine.playNote(midi, baseDuration, 0.92);
        }, i * (25 / speedMult));
      });
    }
  }

  // ==========================================================================
  // RENDERING ENGINE
  // ==========================================================================

  render() {
    const container = document.getElementById('mpcDeck');
    if (!container) return;

    const modes = this.getModesForInstrument();

    container.innerHTML = `
      <!-- Top Directional Carousel Header -->
      <div class="ctrl-carousel-header">
        <div class="ctrl-brand-group">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); border-color: var(--dds-border-color);">
              Hardware &amp; Touch Controller
            </span>
            <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); border-color: var(--dds-border-color); display: inline-flex; align-items: center; gap: 0.35rem;">
              <span style="width: 6px; height: 6px; border-radius: var(--dds-radius-dot);"></span>
              Studio SoundFonts Active
            </span>
          </div>
          <h3 class="ctrl-title">
            ${this.getInstrumentIcon()} ${this.getInstrumentName()} Surface
          </h3>
          <p class="ctrl-sub">
            ${this.activeInstrument === 'drums' 
              ? 'Dynamic drum computer: 4×4 pad hits, sequenced rhythm fills &amp; rolls, and live genre breakbeats.' 
              : 'Interactive workstation: switch instruments, edit single notes, trigger rich chords, and perform genre-based slices.'}
          </p>
        </div>

        <!-- Left / Right Directional Instrument Selector -->
        <div class="ctrl-nav-container">
          <button 
            type="button" 
            class="ctrl-nav-arrow" 
            id="ctrlNavLeft" 
            onclick="window.touchController.navInstrument(-1)" 
            title="Previous Instrument (Left: Piano)"
          >
            ‹
          </button>
          
          <div class="ctrl-instruments-row">
            <button 
              type="button" 
              class="ctrl-inst-pill ${this.activeInstrument === 'piano' ? 'active' : ''}" 
              onclick="window.touchController.setInstrument('piano')"
            >
              Piano Keyboard
            </button>
            <button 
              type="button" 
              class="ctrl-inst-pill ${this.activeInstrument === 'drums' ? 'active' : ''}" 
              onclick="window.touchController.setInstrument('drums')"
            >
              Drum Pad
            </button>
            <button 
              type="button" 
              class="ctrl-inst-pill ${this.activeInstrument === 'guitar' ? 'active' : ''}" 
              onclick="window.touchController.setInstrument('guitar')"
            >
              Guitar Fretboard
            </button>
          </div>

          <button 
            type="button" 
            class="ctrl-nav-arrow" 
            id="ctrlNavRight" 
            onclick="window.touchController.navInstrument(1)" 
            title="Next Instrument (Right: Guitar)"
          >
            ›
          </button>
        </div>
      </div>

      <!-- Instant 1-Click Studio Sound Check Bar -->
      ${this.renderAuditionBarHtml()}

      <!-- Performance Mode Tabs (Instrument-Adapted) -->
      <div class="ctrl-modes-bar">
        <div class="ctrl-modes-tabs">
          ${modes.map(m => `
            <button 
              type="button" 
              class="ctrl-mode-btn ${this.activeMode === m.id ? 'active' : ''}" 
              onclick="window.touchController.setMode('${m.id}')"
              title="${m.desc}"
            >
              <span>${m.icon}</span> ${m.name}
            </button>
          `).join('')}
        </div>

        <!-- Contextual Controls for active Mode & Instrument -->
        <div class="ctrl-context-controls">
          ${this.renderContextControlsHtml()}
        </div>
      </div>

      <!-- Main Playable Surface -->
      <div id="controllerInteractiveSurface" class="ctrl-main-surface">
        ${this.renderSurfaceContentHtml()}
      </div>

      <!-- Interactive Editor Drawer (Customized Per Instrument) -->
      <div class="ctrl-editor-drawer">
        ${this.renderEditorDrawerHtml()}
      </div>

      <!-- Dynamic Active Instrument QWERTY HUD -->
      ${this.renderActiveInstrumentHudHtml()}
      
      <p style="font-size: 0.72rem; color: var(--dds-ink-muted); text-align: center; margin-top: 0.65rem;">
        <em>Active Instrument Isolation: Whichever instrument is selected exclusively controls the computer keyboard. Clicking text inputs restores standard typing.</em>
      </p>
    `;
  }

  renderAuditionBarHtml() {
    return `
      <div class="ctrl-audition-bar" style="display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.55rem 0.9rem; background: var(--dds-canvas); border: 1px solid var(--dds-border-color); border-radius: var(--dds-radius-panel); margin: 0.6rem 0 1rem 0; flex-wrap: wrap;">
        <span style="font-size: 0.75rem; font-weight: 600; color: var(--dds-ink-muted); text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 0.35rem;">
          Instant Sample Audition:
        </span>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.auditionInstrument('piano')" style="display: inline-flex; align-items: center; gap: 0.35rem;">
          Play Grand Piano
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.auditionInstrument('drums')" style="display: inline-flex; align-items: center; gap: 0.35rem;">
          Play Acoustic Drum Kit
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.auditionInstrument('guitar')" style="display: inline-flex; align-items: center; gap: 0.35rem;">
          Play Acoustic Guitar
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.stopActiveSlice()" title="Stop Sound">
          Stop
        </button>
      </div>
    `;
  }

  renderActiveInstrumentHudHtml() {
    if (this.activeInstrument === 'drums') {
      const is4m = this.drumGrooveCategory === 'fill_4m';
      const is1m = this.drumGrooveCategory === 'fill_1m';
      const modeLabel = this.activeMode === 'chords' 
        ? (is4m 
            ? '4-Measure Fills (64-Step Buildups)' 
            : (is1m ? '1-Measure Fills (16-Step Transitions)' : 'Main Parts (Core Grooves)'))
        : (this.activeMode === 'slices' ? 'Genre Breakbeat Chops' : '16-Pad MPC One-Shots');
      const badgeDesc = this.activeMode === 'chords' 
        ? (is4m ? '4-Bar Extended Buildups' : (is1m ? '1-Bar Transition Fills' : 'Foundational Grooves'))
        : (this.activeMode === 'slices' ? `${this.activeGenre.toUpperCase()} Breakbeats` : 'Velocity One-Shots');
      return `
        <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
          <div class="qwerty-hud-group active-hud" style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); grid-column: 1 / -1;">
            <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--dds-ink); font-weight: 600; font-size: 0.95rem;">Active Instrument: Drum Machine (${modeLabel})</span>
              <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); font-size: 0.7rem; border-color: var(--dds-border-color);">
                ${badgeDesc}
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
              <div style="background: var(--dds-surface-subtle); padding: 0.5rem 0.75rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <span style="font-size: 0.75rem; color: var(--dds-ink-muted); display: block; margin-bottom: 0.25rem;">Row 4 (Pads 13-16):</span>
                <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>
              </div>
              <div style="background: var(--dds-surface-subtle); padding: 0.5rem 0.75rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <span style="font-size: 0.75rem; color: var(--dds-ink-muted); display: block; margin-bottom: 0.25rem;">Row 3 (Pads 9-12):</span>
                <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd>
              </div>
              <div style="background: var(--dds-surface-subtle); padding: 0.5rem 0.75rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <span style="font-size: 0.75rem; color: var(--dds-ink-muted); display: block; margin-bottom: 0.25rem;">Row 2 (Pads 5-8):</span>
                <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd>
              </div>
              <div style="background: var(--dds-surface-subtle); padding: 0.5rem 0.75rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <span style="font-size: 0.75rem; color: var(--dds-ink-muted); display: block; margin-bottom: 0.25rem;">Row 1 (Pads 1-4):</span>
                <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd>
              </div>
            </div>
            <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: var(--dds-ink);">
              Press QWERTY keys or click on-screen pads. In Grooves &amp; Fills mode, each key triggers ${is4m ? 'a 4-measure buildup fill (64 steps)' : (is1m ? 'a 1-measure transition fill (16 steps)' : 'a foundational main part groove')}${this.autoResolveMainPart && this.drumGrooveCategory !== 'main' ? ' &mdash; automatically dropping into the target Main Part.' : '.'}
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeInstrument === 'piano') {
      return `
        <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
          <div class="qwerty-hud-group active-hud" style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); grid-column: 1 / -1;">
            <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="color: var(--dds-ink); font-weight: 600; font-size: 0.95rem;">Active Instrument: Chromatic Piano (Full Keyboard Layout)</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); font-size: 0.7rem; border-color: var(--dds-border-color);">
                  Octave: C${this.pianoOctave} - C${this.pianoOctave + 2} (Press [1] / [-] to Shift)
                </span>
                <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); font-size: 0.7rem; border-color: var(--dds-border-color);">
                  Hold [Shift] for Sustain
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
              <!-- Upper Octave -->
              <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--dds-ink); margin-bottom: 0.35rem;">
                  Upper Tier (Octave C${this.pianoOctave + 1} - G${this.pianoOctave + 2}):
                </div>
                <div style="margin-bottom: 0.3rem;">
                  <span style="color: var(--dds-ink-muted); font-size: 0.7rem;">Whites:</span> 
                  <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>I</kbd> <kbd>O</kbd> <kbd>P</kbd> <kbd>[</kbd> <kbd>]</kbd>
                </div>
                <div>
                  <span style="color: var(--dds-ink-muted); font-size: 0.7rem;">Blacks:</span> 
                  <kbd>2</kbd> <kbd>3</kbd> &nbsp; <kbd>5</kbd> <kbd>6</kbd> <kbd>7</kbd> &nbsp; <kbd>9</kbd> <kbd>0</kbd> <kbd>=</kbd>
                </div>
              </div>

              <!-- Lower Octave -->
              <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--dds-ink); margin-bottom: 0.35rem;">
                  Lower Tier (Octave C${this.pianoOctave} - E${this.pianoOctave + 1}):
                </div>
                <div style="margin-bottom: 0.3rem;">
                  <span style="color: var(--dds-ink-muted); font-size: 0.7rem;">Whites:</span> 
                  <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd> <kbd>B</kbd> <kbd>N</kbd> <kbd>M</kbd> <kbd>,</kbd> <kbd>.</kbd> <kbd>/</kbd>
                </div>
                <div>
                  <span style="color: var(--dds-ink-muted); font-size: 0.7rem;">Blacks:</span> 
                  <kbd>S</kbd> <kbd>D</kbd> &nbsp; <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> &nbsp; <kbd>L</kbd> <kbd>;</kbd>
                </div>
              </div>
            </div>

            <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: var(--dds-ink);">
              Over two full continuous octaves mapped across your keyboard like a professional digital audio workstation.
            </div>
          </div>
        </div>
      `;
    }

    // Guitar Active HUD
    return `
      <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
        <div class="qwerty-hud-group active-hud" style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); grid-column: 1 / -1;">
          <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="color: var(--dds-ink); font-weight: 600; font-size: 0.95rem;">Active Instrument: Guitar Fretboard &amp; Strummer (Full Keyboard Layout)</span>
            <span class="calc-panel-badge" style="background: var(--dds-surface-subtle); color: var(--dds-ink); font-size: 0.7rem; border-color: var(--dds-border-color);">
              Full 4-Row Guitar Map
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
            <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
              <span style="font-size: 0.75rem; color: var(--dds-ink); font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 1: Open Strings Plucks</span>
              <kbd>1</kbd> (E4) <kbd>2</kbd> (B3) <kbd>3</kbd> (G3) <kbd>4</kbd> (D3) <kbd>5</kbd> (A2) <kbd>6</kbd> (E2) &bull; <kbd>7</kbd><kbd>8</kbd><kbd>9</kbd><kbd>0</kbd>
            </div>
            <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
              <span style="font-size: 0.75rem; color: var(--dds-ink); font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 2: Lead Solo Frets (High E Fret 0-12)</span>
              <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>I</kbd> <kbd>O</kbd> <kbd>P</kbd> <kbd>[</kbd> <kbd>]</kbd>
            </div>
            <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
              <span style="font-size: 0.75rem; color: var(--dds-ink); font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 3: Mid Riffing Frets (Strings 3 &amp; 4)</span>
              <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd> <kbd>'</kbd>
            </div>
            <div style="background: var(--dds-surface-subtle); padding: 0.6rem 0.85rem; border-radius: var(--dds-radius-control); border: 1px solid var(--dds-border-color);">
              <span style="font-size: 0.75rem; color: var(--dds-ink); font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 4: Bass Notes &amp; Chord Strums</span>
              Bass: <kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd> &bull; Chords: <kbd>B</kbd>(Em) <kbd>N</kbd>(C) <kbd>M</kbd>(G) <kbd>,</kbd>(D) <kbd>.</kbd>(Am) <kbd>/</kbd>(F)
            </div>
          </div>

          <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: var(--dds-ink);">
            Pluck individual open strings, run guitar solos up the neck, or trigger full chord strums with realistic acoustic resonance.
          </div>
        </div>
      </div>
    `;
  }

  getInstrumentName() {
    const item = CONTROLLER_INSTRUMENTS.find(i => i.id === this.activeInstrument);
    return item ? item.name : 'Controller';
  }

  getInstrumentIcon() {
    const item = CONTROLLER_INSTRUMENTS.find(i => i.id === this.activeInstrument);
    return item ? item.icon : '';
  }

  renderContextControlsHtml() {
    if (this.activeMode === 'slices') {
      return `
        <div class="ctrl-genre-picker">
          <label class="ctrl-label">Genre Slices:</label>
          <div class="ctrl-genre-pills">
            ${GENRES_CATALOG.map(g => `
              <button 
                type="button" 
                class="ctrl-genre-pill ${this.activeGenre === g.id ? 'active' : ''}" 
                onclick="window.touchController.setGenre('${g.id}')"
                aria-pressed="${this.activeGenre === g.id}"
              >
                ${g.icon} ${g.name}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.activeMode === 'notes') {
      if (this.activeInstrument === 'piano') {
        return `
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.shiftOctave(-1)">Octave -</button>
            <span style="font-family: var(--dds-font-mono); font-size: 0.8rem; font-weight: 600; color: var(--dds-ink);">Octave C${this.pianoOctave}–C${this.pianoOctave + 2}</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.shiftOctave(1)">Octave + </button>
          </div>
        `;
      }
      if (this.activeInstrument === 'drums') {
        return `
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="ctrl-label">Kit:</label>
            <select class="theory-select" onchange="window.handleDrumKitChange(this.value)">
              <option value="studio_acoustic" ${instrumentEngine.settings.drumKit === 'studio_acoustic' ? 'selected' : ''}>Studio Acoustic</option>
              <option value="trap_808" ${instrumentEngine.settings.drumKit === 'trap_808' ? 'selected' : ''}>808 Trap &amp; Drill</option>
              <option value="dance_909" ${instrumentEngine.settings.drumKit === 'dance_909' ? 'selected' : ''}>909 Dance</option>
              <option value="lofi_vinyl" ${instrumentEngine.settings.drumKit === 'lofi_vinyl' ? 'selected' : ''}>Lofi Vinyl</option>
              <option value="latin_perc" ${instrumentEngine.settings.drumKit === 'latin_perc' ? 'selected' : ''}>Latin Perc</option>
            </select>
          </div>
        `;
      }
      if (this.activeInstrument === 'guitar') {
        return `
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="ctrl-label">Guitar Voice:</label>
            <select class="theory-select" onchange="window.handleGlobalInstrumentChange(this.value)">
              <option value="steel_acoustic" selected>Steel Acoustic</option>
              <option value="classical_guitar">Classical Nylon</option>
              <option value="electric_clean">Clean Electric</option>
              <option value="rock_overdrive">Rock Overdrive</option>
              <option value="palm_mute">Palm Muted</option>
            </select>
          </div>
        `;
      }
    }

    if (this.activeMode === 'chords') {
      if (this.activeInstrument === 'drums') {
        return `
          <div class="ctrl-genre-picker" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <label class="ctrl-label">Drum Part / Fill:</label>
            <div class="ctrl-genre-pills">
              <button 
                type="button" 
                class="ctrl-genre-pill ${this.drumGrooveCategory === 'main' ? 'active' : ''}" 
                onclick="window.touchController.setDrumGrooveCategory('main')"
                aria-pressed="${this.drumGrooveCategory === 'main'}"
                title="16 Foundational Main Part Grooves"
              >
                Main Parts
              </button>
              <button 
                type="button" 
                class="ctrl-genre-pill ${this.drumGrooveCategory === 'fill_1m' ? 'active' : ''}" 
                onclick="window.touchController.setDrumGrooveCategory('fill_1m')"
                aria-pressed="${this.drumGrooveCategory === 'fill_1m'}"
                title="16 Dynamic 1-Measure / 1-Bar Drum Fills"
              >
                1-Measure Fills
              </button>
              <button 
                type="button" 
                class="ctrl-genre-pill ${this.drumGrooveCategory === 'fill_4m' ? 'active' : ''}" 
                onclick="window.touchController.setDrumGrooveCategory('fill_4m')"
                aria-pressed="${this.drumGrooveCategory === 'fill_4m'}"
                title="16 Epic 4-Measure Extended Buildups"
              >
                4-Measure Fills
              </button>
            </div>
          </div>
        `;
      }
      return `
        <div style="font-size: 0.78rem; color: var(--dds-ink-muted);">
          Harmonic Chord Engine &bull; Click any pad to trigger or edit voicing below
        </div>
      `;
    }

    return '';
  }

  // ==========================================================================
  // SURFACE CONTENT (PIANO / DRUMS / GUITAR)
  // ==========================================================================

  renderSurfaceContentHtml() {
    // 1. SLICES MODE (Genre-based for all 3 instruments)
    if (this.activeMode === 'slices') {
      return this.renderGenreSlicesGridHtml();
    }

    // 2. CHORDS / GROOVES MODE
    if (this.activeMode === 'chords') {
      if (this.activeInstrument === 'piano') return this.renderPianoChordsGridHtml();
      if (this.activeInstrument === 'drums') return this.renderDrumGroovesGridHtml();
      if (this.activeInstrument === 'guitar') return this.renderGuitarChordsGridHtml();
    }

    // 3. SINGLE NOTES MODE
    if (this.activeInstrument === 'piano') {
      return this.renderPianoKeyboardHtml();
    }
    if (this.activeInstrument === 'guitar') {
      return this.renderGuitarFretboardHtml();
    }
    // Default: Drum Pad
    return this.renderDrumPadGridHtml();
  }

  // Single Notes: Piano Keyboard (25 Keys)
  renderPianoKeyboardHtml() {
    const startMidi = this.pianoOctave * 12 + 12; // e.g. Octave 3 = 48 (C3)
    const whiteKeyOffsets = [0, 2, 4, 5, 7, 9, 11];
    const totalKeys = 25; // 2 octaves + high C
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Map primary QWERTY key badges for all 25 keys across lower and upper tiers
    const qwertyBadges = [
      'Z', 'S', 'X', 'D', 'C', 'V', 'G', 'B', 'H', 'N', 'J', 'M',
      'Q', '2', 'W', '3', 'E', 'R', '5', 'T', '6', 'Y', '7', 'U', 'I'
    ];

    let html = '<div class="piano-wrapper" style="overflow-x: auto; padding: 1rem 0;"><div class="piano-keyboard">';
    
    for (let i = 0; i < totalKeys; i++) {
      const midi = startMidi + i;
      const semi = midi % 12;
      const isWhite = whiteKeyOffsets.includes(semi);
      const noteName = noteNames[semi];
      const oct = Math.floor(midi / 12) - 1;
      const badge = qwertyBadges[i] || '';

      html += `
        <div 
          class="piano-key ${isWhite ? 'white-key' : 'black-key'}" 
          data-midi="${midi}"
          data-offset="${i}"
          onmousedown="window.touchController.playSingleNote(${midi}); this.classList.add('playing');"
          onmouseup="this.classList.remove('playing');"
          onmouseleave="this.classList.remove('playing');"
          ontouchstart="window.touchController.playSingleNote(${midi}); this.classList.add('playing');"
          ontouchend="this.classList.remove('playing');"
          title="${noteName}${oct} • Computer Key: [${badge}]"
        >
          <span style="font-size: 0.65rem; opacity: 0.85;">${noteName}${oct}</span>
          ${badge ? `<span class="piano-key-badge" style="font-size: 0.58rem; opacity: 0.75; margin-top: 2px;">[${badge}]</span>` : ''}
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  }

  // Single Notes: Guitar Fretboard (6 strings x 18 frets)
  renderGuitarFretboardHtml() {
    const stringOpenMidis = [64, 59, 55, 50, 45, 40]; // High E to Low E
    const totalFrets = 18;
    const inlayFrets = [3, 5, 7, 9, 12, 15, 17];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    let html = '<div class="fretboard-wrapper"><div class="fretboard">';

    stringOpenMidis.forEach((openMidi, strIdx) => {
      html += '<div class="fret-string-row">';
      html += `<div class="fret-string-wire" style="height: ${1 + strIdx * 0.6}px;"></div>`;

      for (let fret = 0; fret <= totalFrets; fret++) {
        const midi = openMidi + fret;
        const semi = midi % 12;
        const noteName = noteNames[semi];

        html += `
          <div 
            class="fret-cell ${fret === 0 ? 'fret-nut' : ''}" 
            data-midi="${midi}"
            onmousedown="window.touchController.playSingleNote(${midi}); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playSingleNote(${midi}); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="String ${6 - strIdx} • Fret ${fret} • ${noteName} (${midi})"
          >
            <div class="fret-note-marker ${fret === 0 ? 'marker-root' : 'marker-degree'}">
              ${noteName}
            </div>
          </div>
        `;
      }
      html += '</div>';
    });

    // Fret Numbers Row
    html += '<div class="fret-numbers-row">';
    for (let fret = 0; fret <= totalFrets; fret++) {
      const hasInlay = inlayFrets.includes(fret);
      html += `
        <div class="fret-num-cell ${fret === 0 ? 'fret-nut' : ''}">
          ${fret === 0 ? 'Nut' : fret} ${hasInlay ? (fret === 12 ? '••' : '•') : ''}
        </div>
      `;
    }
    html += '</div></div></div>';
    return html;
  }

  // Single Notes: Drum Pad 4x4 Grid
  renderDrumPadGridHtml() {
    const kit = instrumentEngine.getDrumKit();
    const pads = [
      { pad: 13, key: '1' }, { pad: 14, key: '2' }, { pad: 15, key: '3' }, { pad: 16, key: '4' },
      { pad: 9, key: 'Q' }, { pad: 10, key: 'W' }, { pad: 11, key: 'E' }, { pad: 12, key: 'R' },
      { pad: 5, key: 'A' }, { pad: 6, key: 'S' }, { pad: 7, key: 'D' }, { pad: 8, key: 'F' },
      { pad: 1, key: 'Z' }, { pad: 2, key: 'X' }, { pad: 3, key: 'C' }, { pad: 4, key: 'V' },
    ];

    return `
      <div class="mpc-grid">
        ${pads.map(p => {
          const padData = kit && kit.pads[p.pad] ? kit.pads[p.pad] : { name: `Pad ${p.pad}` };
          return `
            <div 
              class="mpc-pad" 
              id="ctrlMpcPad_${p.pad}" 
              onmousedown="window.touchController.playDrumHit(${p.pad}); this.classList.add('active');"
              onmouseup="this.classList.remove('active');"
              onmouseleave="this.classList.remove('active');"
              ontouchstart="window.touchController.playDrumHit(${p.pad}); this.classList.add('active');"
              ontouchend="this.classList.remove('active');"
            >
              <div class="mpc-pad-key">[ ${p.key} ]</div>
              <div class="mpc-pad-name">${padData.name}</div>
              <div class="mpc-pad-note">Pad ${p.pad}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Chords Mode: Piano Chord Voicings 4x4 Grid
  renderPianoChordsGridHtml() {
    return `
      <div class="mpc-grid">
        ${PIANO_CHORDS_CATALOG.map((chord, idx) => `
          <div 
            class="mpc-pad" 
            style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0.55rem 0.35rem; gap: 0.25rem;"
            onmousedown="window.touchController.playChordVoicing([${chord.notes.join(',')}], false); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playChordVoicing([${chord.notes.join(',')}], false); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="${chord.name}: ${chord.desc}"
          >
            <div style="font-size: 0.68rem; font-weight: 600; color: var(--dds-ink); opacity: 0.85; text-transform: uppercase;">CHORD ${idx + 1}</div>
            <div style="color: var(--dds-ink); font-weight: 600; font-size: 1.05rem; line-height: 1.2;">${chord.name}</div>
            <div style="font-size: 0.66rem; color: var(--dds-ink-muted); font-family: var(--dds-font-mono);">VOICING</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Grooves & Fills Mode: Drum Main Parts, 1-Measure Fills, & 4-Measure Buildups 4x4 Grid
  renderDrumGroovesGridHtml() {
    const catalog = this.getActiveDrumCatalog();
    const is4m = this.drumGrooveCategory === 'fill_4m';
    const is1m = this.drumGrooveCategory === 'fill_1m';
    
    // Category marker uses the data-viz palette (DAW exception): main = viz-6, 1-bar = viz-1, 4-bar = viz-2
    const borderColor = is4m ? 'var(--dds-viz-2)' : (is1m ? 'var(--dds-viz-1)' : 'var(--dds-viz-6)');
    const bgColor = 'var(--dds-surface-subtle)';
    const textColor = 'var(--dds-ink-muted)';
    const badgePrefix = is4m ? 'BUILD' : (is1m ? 'FILL' : 'PART');

    return `
      <div class="mpc-grid">
        ${catalog.map((item, idx) => {
          const cleanName = (item.name || '')
            .replace(/\s*(?:1-Bar Fill|1-Bar|4-Bar Buildup|4-Bar Extended Buildup|4-Bar Build|4-Bar|Main Part|Main Pocket|1-Measure)\b/gi, '')
            .trim();

          return `
            <div 
              class="mpc-pad" 
              id="drumGroovePad_${idx}"
              style="border-color: ${borderColor}; background: ${bgColor}; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0.55rem 0.35rem; gap: 0.3rem;"
              onmousedown="window.touchController.playDrumGroove(window.touchController.getDrumGroove(${idx})); this.classList.add('active');"
              onmouseup="this.classList.remove('active');"
              onmouseleave="this.classList.remove('active');"
              ontouchstart="window.touchController.playDrumGroove(window.touchController.getDrumGroove(${idx})); this.classList.add('active');"
              ontouchend="this.classList.remove('active');"
              title="${item.name}: ${item.desc} • ${item.measures || (is4m ? 4 : 1)} Measure(s) (${item.bpm} BPM)"
            >
              <div style="font-size: 0.68rem; font-weight: 800; color: ${textColor}; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em;">
                ${badgePrefix} ${idx + 1}
              </div>
              <div style="color: var(--dds-ink); font-weight: 600; font-size: 0.92rem; line-height: 1.25;">
                ${cleanName}
              </div>
              <div style="font-size: 0.66rem; color: var(--dds-ink-muted); font-family: var(--dds-font-mono); font-weight: 600;">
                ${is4m ? '4 BARS' : (is1m ? '1 BAR' : 'GROOVE')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Alias for backward compatibility
  renderDrumChordsGridHtml() {
    return this.renderDrumGroovesGridHtml();
  }

  // Chords Mode: Guitar Strummed Chord Shapes 4x4 Grid
  renderGuitarChordsGridHtml() {
    return `
      <div class="mpc-grid">
        ${GUITAR_CHORDS_CATALOG.map((gc, idx) => `
          <div 
            class="mpc-pad" 
            style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0.55rem 0.35rem; gap: 0.25rem;"
            onmousedown="window.touchController.playChordVoicing([${gc.notes.join(',')}], true); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playChordVoicing([${gc.notes.join(',')}], true); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="${gc.name}: ${gc.desc} • Frets: ${gc.frets}"
          >
            <div style="font-size: 0.68rem; font-weight: 600; color: var(--dds-ink); opacity: 0.85; text-transform: uppercase;">[ ${gc.frets} ]</div>
            <div style="color: var(--dds-ink); font-weight: 600; font-size: 1.05rem; line-height: 1.2;">${gc.name}</div>
            <div style="font-size: 0.66rem; color: var(--dds-ink-muted); font-family: var(--dds-font-mono);">STRUM</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Slices Mode: Genre-Based Slices Grid
  renderGenreSlicesGridHtml() {
    const genreData = GENRE_SLICES[this.activeGenre] || GENRE_SLICES.funk;
    const slices = genreData[this.activeInstrument] || genreData.drums;

    return `
      <div class="mpc-grid">
        ${slices.map((slice, idx) => `
          <div 
            class="mpc-pad" 
            id="slicePad_${idx}"
            style="border-color: var(--dds-border-color); background: var(--dds-surface-subtle); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0.55rem 0.35rem; gap: 0.25rem;"
            onmousedown="window.touchController.playGenreSlice(window.touchController.getSlice(${idx})); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playGenreSlice(window.touchController.getSlice(${idx})); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="Slice ${idx + 1} (${slice.name}) • Click to trigger"
          >
            <div style="font-size: 0.68rem; font-weight: 600; color: var(--dds-ink); opacity: 0.85; text-transform: uppercase;">SLICE ${idx + 1}</div>
            <div style="color: var(--dds-ink); font-weight: 600; font-size: 0.95rem; line-height: 1.2;">${slice.name}</div>
            <div style="font-size: 0.66rem; color: var(--dds-ink-muted); font-family: var(--dds-font-mono);">${this.activeGenre.toUpperCase()}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getSlice(idx) {
    const genreData = GENRE_SLICES[this.activeGenre] || GENRE_SLICES.funk;
    const slices = genreData[this.activeInstrument] || genreData.drums;
    return slices[idx];
  }

  // ==========================================================================
  // INTERACTIVE EDITOR DRAWER (Single Note, Chord, & Slice Manipulation)
  // ==========================================================================

  renderEditorDrawerHtml() {
    // 1. SLICES MODE (Genre-based)
    if (this.activeMode === 'slices') {
      if (this.activeInstrument === 'drums') {
        return `
          <div class="ctrl-editor-panel">
            <div class="ctrl-editor-title">
              <span>Drum Breakbeat &amp; Slice Designer (${this.activeGenre.toUpperCase()})</span>
              <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Time-stretching, groove swing, and sound model for genre beat chops</span>
            </div>
            <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <div class="ctrl-editor-field">
                <label>Drum Kit Profile:</label>
                <select class="theory-select" onchange="window.handleDrumKitChange(this.value)">
                  <option value="studio_acoustic" ${instrumentEngine.settings.drumKit === 'studio_acoustic' ? 'selected' : ''}>Studio Acoustic</option>
                  <option value="trap_808" ${instrumentEngine.settings.drumKit === 'trap_808' ? 'selected' : ''}>808 Trap &amp; Drill</option>
                  <option value="dance_909" ${instrumentEngine.settings.drumKit === 'dance_909' ? 'selected' : ''}>909 Dance</option>
                  <option value="lofi_vinyl" ${instrumentEngine.settings.drumKit === 'lofi_vinyl' ? 'selected' : ''}>Lofi Vinyl</option>
                  <option value="latin_perc" ${instrumentEngine.settings.drumKit === 'latin_perc' ? 'selected' : ''}>Latin Perc</option>
                </select>
              </div>
              <div class="ctrl-editor-field">
                <label>Playback Speed / Time Stretch:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 0.5 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(0.5)">0.5x Half</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 1.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(1.0)">1.0x Normal</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 2.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(2.0)">2.0x Double</button>
                </div>
              </div>
              <div class="ctrl-editor-field">
                <label>Groove Swing Feel:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0)">Straight</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0.02 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0.02)">16th Swing</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0.045 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0.045)">Shuffle</button>
                </div>
              </div>
              <div class="ctrl-editor-field">
                <label>Pitch Shift: <span id="ctrlSlicePitchVal" style="color: var(--dds-ink);">${this.slicePitchShift > 0 ? '+' : ''}${this.slicePitchShift} st</span></label>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  step="1" 
                  value="${this.slicePitchShift}" 
                  class="calc-slider"
                  oninput="window.touchController.setSlicePitch(this.value)"
                />
              </div>
            </div>
          </div>
        `;
      }
      if (this.activeInstrument === 'guitar') {
        return `
          <div class="ctrl-editor-panel">
            <div class="ctrl-editor-title">
              <span>Guitar Riff &amp; Lick Designer (${this.activeGenre.toUpperCase()})</span>
              <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Real-time pitch shift, tempo stretch, &amp; guitar timbre</span>
            </div>
            <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <div class="ctrl-editor-field">
                <label>Guitar Voice:</label>
                <select class="theory-select" onchange="window.handleGlobalInstrumentChange(this.value)">
                  <option value="steel_acoustic" selected>Steel Acoustic</option>
                  <option value="classical_guitar">Classical Nylon</option>
                  <option value="electric_clean">Clean Electric</option>
                  <option value="rock_overdrive">Rock Overdrive</option>
                  <option value="palm_mute">Palm Muted</option>
                </select>
              </div>
              <div class="ctrl-editor-field">
                <label>Pitch Shift: <span id="ctrlSlicePitchVal" style="color: var(--dds-ink);">${this.slicePitchShift > 0 ? '+' : ''}${this.slicePitchShift} st</span></label>
                <input 
                  type="range" 
                  min="-12" 
                  max="12" 
                  step="1" 
                  value="${this.slicePitchShift}" 
                  class="calc-slider"
                  oninput="window.touchController.setSlicePitch(this.value)"
                />
              </div>
              <div class="ctrl-editor-field">
                <label>Playback Speed / Time Stretch:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 0.5 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(0.5)">0.5x Half</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 1.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(1.0)">1.0x Normal</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 2.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(2.0)">2.0x Double</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }
      // Piano Slices
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>Piano Lick Sound Designer (${this.activeGenre.toUpperCase()})</span>
            <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Real-time pitch shift, tempo stretch, &amp; harmonic resonance</span>
          </div>
          <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="ctrl-editor-field">
              <label>Pitch Shift: <span id="ctrlSlicePitchVal" style="color: var(--dds-ink);">${this.slicePitchShift > 0 ? '+' : ''}${this.slicePitchShift} st</span></label>
              <input 
                type="range" 
                min="-12" 
                max="12" 
                step="1" 
                value="${this.slicePitchShift}" 
                class="calc-slider"
                oninput="window.touchController.setSlicePitch(this.value)"
              />
            </div>
            <div class="ctrl-editor-field">
              <label>Playback Speed / Time Stretch:</label>
              <div style="display: flex; gap: 0.35rem;">
                <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 0.5 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(0.5)">0.5x Half</button>
                <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 1.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(1.0)">1.0x Normal</button>
                <button type="button" class="btn btn-secondary btn-sm ${this.sliceSpeed === 2.0 ? 'active' : ''}" onclick="window.touchController.setSliceSpeed(2.0)">2.0x Double</button>
              </div>
            </div>
            <div class="ctrl-editor-field" style="display: flex; align-items: flex-end;">
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="window.toggleSustainPedal()" 
                style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
              >
                <span class="sustain-pedal-led ${instrumentEngine.settings.sustainPedal ? 'active' : ''}"></span>
                Sustain Pedal (Shift Key)
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. CHORDS / GROOVES MODE
    if (this.activeMode === 'chords') {
      if (this.activeInstrument === 'drums') {
        return `
          <div class="ctrl-editor-panel">
            <div class="ctrl-editor-title">
              <span>Drum Fills &amp; Main Parts Articulation Rack</span>
              <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">1-measure fills, 4-measure buildups, and target main parts with seamless drop resolution</span>
            </div>
            <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <!-- Active Fills / Parts Selection -->
              <div class="ctrl-editor-field">
                <label>Active Fills / Parts:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumGrooveCategory === 'main' ? 'active' : ''}" onclick="window.touchController.setDrumGrooveCategory('main')">Main Parts</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumGrooveCategory === 'fill_1m' ? 'active' : ''}" onclick="window.touchController.setDrumGrooveCategory('fill_1m')">1-Bar Fills</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumGrooveCategory === 'fill_4m' ? 'active' : ''}" onclick="window.touchController.setDrumGrooveCategory('fill_4m')">4-Bar Fills</button>
                </div>
              </div>

              <!-- Target Main Part for Fills to Drop Into -->
              <div class="ctrl-editor-field">
                <label>Target Main Part (Fill Drops Into):</label>
                <select class="theory-select" onchange="window.touchController.setSelectedMainPart(this.value)">
                  ${DRUM_MAIN_PARTS_CATALOG.map((mp, idx) => `
                    <option value="${idx}" ${this.selectedMainPartIndex === idx ? 'selected' : ''}>${idx + 1}. ${mp.name}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Auto-Drop into Main Part Toggle -->
              <div class="ctrl-editor-field">
                <label>Auto-Drop into Main Part:</label>
                <button 
                  type="button" 
                  class="btn btn-secondary btn-sm" 
                  onclick="window.touchController.toggleAutoResolveMainPart()" 
                  style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; width: 100%;"
                >
                  <span class="sustain-pedal-led ${this.autoResolveMainPart ? 'active' : ''}"></span>
                  ${this.autoResolveMainPart ? 'Auto-Drop: ACTIVE' : 'Auto-Drop: OFF'}
                </button>
              </div>

              <!-- Drum Kit Profile -->
              <div class="ctrl-editor-field">
                <label>Drum Kit Profile:</label>
                <select class="theory-select" onchange="window.handleDrumKitChange(this.value)">
                  <option value="studio_acoustic" ${instrumentEngine.settings.drumKit === 'studio_acoustic' ? 'selected' : ''}>Studio Acoustic</option>
                  <option value="trap_808" ${instrumentEngine.settings.drumKit === 'trap_808' ? 'selected' : ''}>808 Trap &amp; Drill</option>
                  <option value="dance_909" ${instrumentEngine.settings.drumKit === 'dance_909' ? 'selected' : ''}>909 Dance</option>
                  <option value="lofi_vinyl" ${instrumentEngine.settings.drumKit === 'lofi_vinyl' ? 'selected' : ''}>Lofi Vinyl</option>
                  <option value="latin_perc" ${instrumentEngine.settings.drumKit === 'latin_perc' ? 'selected' : ''}>Latin Perc</option>
                </select>
              </div>

              <!-- Groove Swing Feel -->
              <div class="ctrl-editor-field">
                <label>Groove Swing Feel:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0)">Straight</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0.02 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0.02)">16th Swing</button>
                  <button type="button" class="btn btn-secondary btn-sm ${this.drumSwing === 0.045 ? 'active' : ''}" onclick="window.touchController.setDrumSwing(0.045)">Shuffle</button>
                </div>
              </div>

              <!-- Direct Audition Buttons -->
              <div class="ctrl-editor-field" style="display: flex; gap: 0.35rem; align-items: flex-end;">
                <button type="button" class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.touchController.auditionFillMode('fill_1m')">
                  1-Bar Fill
                </button>
                <button type="button" class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.touchController.auditionFillMode('fill_4m')">
                  4-Bar Build
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="flex: 1;" onclick="window.touchController.auditionFillMode('main')">
                  Main Part
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.stopActiveSlice()" title="Stop audio">
                  
                </button>
              </div>
            </div>
          </div>
        `;
      }
      if (this.activeInstrument === 'guitar') {
        return `
          <div class="ctrl-editor-panel">
            <div class="ctrl-editor-title">
              <span>Guitar Voicing &amp; Strum Physics Rack</span>
              <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Custom fret voicing builder, pick dynamics &amp; acoustic strum speed</span>
            </div>
            <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
              <div class="ctrl-editor-field">
                <label>Guitar Voice:</label>
                <select class="theory-select" onchange="window.handleGlobalInstrumentChange(this.value)">
                  <option value="steel_acoustic" selected>Steel Acoustic</option>
                  <option value="classical_guitar">Classical Nylon</option>
                  <option value="electric_clean">Clean Electric</option>
                  <option value="rock_overdrive">Rock Overdrive</option>
                  <option value="palm_mute">Palm Muted</option>
                </select>
              </div>
              <div class="ctrl-editor-field">
                <label>Root Note:</label>
                <select class="theory-select" onchange="window.touchController.selectedChordRoot = parseInt(this.value)">
                  <option value="0">C</option>
                  <option value="1">C# / Db</option>
                  <option value="2">D</option>
                  <option value="3">D# / Eb</option>
                  <option value="4">E</option>
                  <option value="5">F</option>
                  <option value="6">F# / Gb</option>
                  <option value="7">G</option>
                  <option value="8">G# / Ab</option>
                  <option value="9">A</option>
                  <option value="10">A# / Bb</option>
                  <option value="11">B</option>
                </select>
              </div>
              <div class="ctrl-editor-field">
                <label>Chord Type:</label>
                <select class="theory-select" onchange="window.touchController.selectedChordType = this.value">
                  <option value="maj7" selected>Major 7th (Maj7)</option>
                  <option value="min7">Minor 7th (m7)</option>
                  <option value="dom7">Dominant 7th (7)</option>
                  <option value="min9">Minor 9th (m9)</option>
                  <option value="maj9">Major 9th (Maj9)</option>
                  <option value="sus4">Suspended 4th (sus4)</option>
                  <option value="dim7">Diminished 7th (dim7)</option>
                  <option value="add9">Add 9 (add9)</option>
                </select>
              </div>
              <div class="ctrl-editor-field">
                <label>Strum Physics:</label>
                <div style="display: flex; gap: 0.35rem;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.005">Tight Block</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.024">Standard Strum</button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.05">Slow Arp</button>
                </div>
              </div>
              <div class="ctrl-editor-field" style="display: flex; align-items: flex-end;">
                <button type="button" class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.touchController.auditionCustomChord()">
                  Audition Guitar Chord
                </button>
              </div>
            </div>
          </div>
        `;
      }
      // Piano Chords
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>Piano Harmonic Voicing &amp; Inversion Builder</span>
            <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Build, voice, and invert rich piano chords</span>
          </div>
          <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="ctrl-editor-field">
              <label>Root Note:</label>
              <select class="theory-select" onchange="window.touchController.selectedChordRoot = parseInt(this.value)">
                <option value="0">C</option>
                <option value="1">C# / Db</option>
                <option value="2">D</option>
                <option value="3">D# / Eb</option>
                <option value="4">E</option>
                <option value="5">F</option>
                <option value="6">F# / Gb</option>
                <option value="7">G</option>
                <option value="8">G# / Ab</option>
                <option value="9">A</option>
                <option value="10">A# / Bb</option>
                <option value="11">B</option>
              </select>
            </div>
            <div class="ctrl-editor-field">
              <label>Chord Type:</label>
              <select class="theory-select" onchange="window.touchController.selectedChordType = this.value">
                <option value="maj7" selected>Major 7th (Maj7)</option>
                <option value="min7">Minor 7th (m7)</option>
                <option value="dom7">Dominant 7th (7)</option>
                <option value="min9">Minor 9th (m9)</option>
                <option value="maj9">Major 9th (Maj9)</option>
                <option value="sus4">Suspended 4th (sus4)</option>
                <option value="dim7">Diminished 7th (dim7)</option>
                <option value="add9">Add 9 (add9)</option>
              </select>
            </div>
            <div class="ctrl-editor-field">
              <label>Sustain Resonance:</label>
              <button 
                type="button" 
                class="btn btn-secondary btn-sm" 
                onclick="window.toggleSustainPedal()" 
                style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
              >
                <span class="sustain-pedal-led ${instrumentEngine.settings.sustainPedal ? 'active' : ''}"></span>
                Sustain Pedal (Shift Key)
              </button>
            </div>
            <div class="ctrl-editor-field" style="display: flex; align-items: flex-end;">
              <button type="button" class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.touchController.auditionCustomChord()">
                Audition Piano Chord
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 3. SINGLE NOTES MODE
    if (this.activeInstrument === 'drums') {
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>MPC Drum Kit &amp; Pad Velocity Rack</span>
            <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Select kit acoustic timbre and trigger velocity</span>
          </div>
          <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="ctrl-editor-field">
              <label>Drum Kit Profile:</label>
              <select class="theory-select" onchange="window.handleDrumKitChange(this.value)">
                <option value="studio_acoustic" ${instrumentEngine.settings.drumKit === 'studio_acoustic' ? 'selected' : ''}>Studio Acoustic</option>
                <option value="trap_808" ${instrumentEngine.settings.drumKit === 'trap_808' ? 'selected' : ''}>808 Trap &amp; Drill</option>
                <option value="dance_909" ${instrumentEngine.settings.drumKit === 'dance_909' ? 'selected' : ''}>909 Dance</option>
                <option value="lofi_vinyl" ${instrumentEngine.settings.drumKit === 'lofi_vinyl' ? 'selected' : ''}>Lofi Vinyl</option>
                <option value="latin_perc" ${instrumentEngine.settings.drumKit === 'latin_perc' ? 'selected' : ''}>Latin Perc</option>
              </select>
            </div>
            <div class="ctrl-editor-field">
              <label>Pad Hit Velocity: <span style="color: var(--dds-ink);">95%</span></label>
              <input type="range" min="40" max="100" value="95" class="calc-slider" />
            </div>
          </div>
        </div>
      `;
    }
    if (this.activeInstrument === 'guitar') {
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>Guitar Timbre &amp; Fret Dynamics Rack</span>
            <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Tune guitar sound model, string action, and pick velocity</span>
          </div>
          <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="ctrl-editor-field">
              <label>Guitar Voice:</label>
              <select class="theory-select" onchange="window.handleGlobalInstrumentChange(this.value)">
                <option value="steel_acoustic" selected>Steel Acoustic</option>
                <option value="classical_guitar">Classical Nylon</option>
                <option value="electric_clean">Clean Electric</option>
                <option value="rock_overdrive">Rock Overdrive</option>
                <option value="palm_mute">Palm Muted</option>
              </select>
            </div>
            <div class="ctrl-editor-field">
              <label>Pick Attack Velocity: <span style="color: var(--dds-ink);">95%</span></label>
              <input type="range" min="40" max="100" value="95" class="calc-slider" />
            </div>
          </div>
        </div>
      `;
    }
    // Piano single notes
    return `
      <div class="ctrl-editor-panel">
        <div class="ctrl-editor-title">
          <span>Piano Keybed Articulation Rack</span>
          <span style="font-size: 0.72rem; color: var(--dds-ink-muted);">Tune key velocity, octave range, and sustain resonance</span>
        </div>
        <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="ctrl-editor-field">
            <label>Master Velocity: <span style="color: var(--dds-ink);">95%</span></label>
            <input type="range" min="40" max="100" value="95" class="calc-slider" />
          </div>
          <div class="ctrl-editor-field">
            <label>Acoustic Resonance &bull; Sustain Pedal:</label>
            <button 
              type="button" 
              class="btn btn-secondary btn-sm" 
              onclick="window.toggleSustainPedal()" 
              style="display: flex; align-items: center; justify-content: center; gap: 0.4rem;"
            >
              <span class="sustain-pedal-led ${instrumentEngine.settings.sustainPedal ? 'active' : ''}"></span>
              Sustain Pedal (Shift Key)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  auditionCustomChord() {
    const root = this.selectedChordRoot + 48; // Base C3
    let intervals = [0, 4, 7, 11]; // maj7 default
    
    if (this.selectedChordType === 'min7') intervals = [0, 3, 7, 10];
    else if (this.selectedChordType === 'dom7') intervals = [0, 4, 7, 10];
    else if (this.selectedChordType === 'min9') intervals = [0, 3, 7, 10, 14];
    else if (this.selectedChordType === 'maj9') intervals = [0, 4, 7, 11, 14];
    else if (this.selectedChordType === 'sus4') intervals = [0, 5, 7, 10];
    else if (this.selectedChordType === 'dim7') intervals = [0, 3, 6, 9];
    else if (this.selectedChordType === 'add9') intervals = [0, 4, 7, 14];

    const notes = intervals.map(int => root + int);
    this.playChordVoicing(notes, this.activeInstrument === 'guitar');
  }
}

export const touchController = new TouchControllerEngine();
