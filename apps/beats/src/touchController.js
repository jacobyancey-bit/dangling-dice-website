/**
 * Dangling Beats Studio™ — Multi-Instrument Hardware & Touch Controller Engine
 * 
 * Provides interactive performance surfaces:
 * - Left: 🎹 Piano Keyboard
 * - Middle: 🥁 Drum Pad
 * - Right: 🎸 Guitar Fretboard
 * 
 * Supported Edit / Performance Modes across all instruments:
 * 1. Single Notes (Chromatic piano keys, drum one-shots, guitar frets)
 * 2. Chords (Harmonic piano voicings, layered drum stacks, strummable guitar shapes)
 * 3. Slices (Genre-based slice chops: Funk, Jazz, Metal, Lofi, Trap, Blues)
 */

import { instrumentEngine, DRUM_KITS } from './instrumentEngine.js';
import { midiEngine } from './midiEngine.js';

// ============================================================================
// CONSTANTS & CATALOGS
// ============================================================================

export const CONTROLLER_INSTRUMENTS = [
  { id: 'piano', name: 'Piano Keyboard', icon: '🎹', shortcut: 'Left' },
  { id: 'drums', name: 'Drum Pad', icon: '🥁', shortcut: 'Middle' },
  { id: 'guitar', name: 'Guitar Fretboard', icon: '🎸', shortcut: 'Right' },
];

export const CONTROLLER_MODES = [
  { id: 'notes', name: 'Single Notes', icon: '🎵', desc: 'Individual notes, frets, and drum one-shots' },
  { id: 'chords', name: 'Chords', icon: '🎼', desc: 'Harmonic voicings, layered drum chords, and guitar strums' },
  { id: 'slices', name: 'Slices (Genre-Based)', icon: '✂️', desc: 'Live musical chops & loops categorized by genre' },
];

export const GENRES_CATALOG = [
  { id: 'funk', name: 'Funk', icon: '🕺', color: '#f59e0b', desc: 'Syncopated 16th clavs, breakbeat chops, muted scratches' },
  { id: 'jazz', name: 'Jazz & Neo-Soul', icon: '🎷', color: '#8b5cf6', desc: 'Lush 9th/11th chords, swing ride chops, bebop runs' },
  { id: 'metal', name: 'Metal & Rock', icon: '⚡', color: '#ef4444', desc: 'Palm-muted chugs, double-bass blasts, high-gain riffs' },
  { id: 'lofi', name: 'Lofi & Chillhop', icon: '📻', color: '#ec4899', desc: 'Dusty vinyl Rhodes, boom-bap chops, mellow nylon plucks' },
  { id: 'trap', name: 'Trap & Drill', icon: '🚀', color: '#06b6d4', desc: '808 slides, fast hi-hat rolls, dark acoustic stabs' },
  { id: 'blues', name: 'Blues & Soul', icon: '🎸', color: '#3b82f6', desc: '12-bar turnarounds, shuffle swing chops, pentatonic bends' },
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

// Drum Chords (Layered Multi-Stem Stacks)
export const DRUM_CHORDS_CATALOG = [
  { id: 'dc_1', name: 'Heavy Drop', sounds: ['kick', 'sub_drop', 'shaker'], desc: 'Sub Kick + 808 Boom + Shaker' },
  { id: 'dc_2', name: 'Punchy Backbeat', sounds: ['snare', 'clap', 'rimshot'], desc: 'Fat Snare + Clap + Rimshot' },
  { id: 'dc_3', name: 'Sizzle Top', sounds: ['hat_open', 'hat_closed', 'tambourine'], desc: 'Open Hat + Closed Hat + Tamb' },
  { id: 'dc_4', name: 'Power Crash', sounds: ['crash', 'sub_drop'], desc: 'Heavy Crash + 808 Boom' },
  { id: 'dc_5', name: 'Tom Cascade', sounds: ['tom_hi', 'tom_mid'], desc: 'High Tom + Mid Tom Flam' },
  { id: 'dc_6', name: 'Latin Poly', sounds: ['conga_hi', 'conga_low', 'woodblock'], desc: 'Conga High + Low + Woodblock' },
  { id: 'dc_7', name: 'Funk Ghost Stack', sounds: ['ghost_snare', 'hat_tick', 'kick'], desc: 'Ghost Snare + Hat + Kick' },
  { id: 'dc_8', name: 'Drill Stutter', sounds: ['snare_roll', 'sub_drop'], desc: 'Triple Snare Roll + 808 Slide' },
  { id: 'dc_9', name: 'Trap Drop', sounds: ['kick_808', 'crash'], desc: 'Sub Kick 808 + Crash Accent' },
  { id: 'dc_10', name: 'R&B Snap Stack', sounds: ['snap', 'rimshot', 'hat_closed'], desc: 'Finger Snap + Rim + Tight Hat' },
  { id: 'dc_11', name: 'House 909 Stack', sounds: ['kick_909', 'hat_open', 'ride'], desc: '909 Punch + Open Hat + Ride' },
  { id: 'dc_12', name: 'Afro Shaker Stack', sounds: ['shaker', 'conga_hi'], desc: 'Afrobeat Shaker + High Conga' },
  { id: 'dc_13', name: 'Metal Double Blast', sounds: ['double_kick', 'china'], desc: 'Double Kick + China Cymbal' },
  { id: 'dc_14', name: 'Lofi Slap', sounds: ['lofi_snare', 'vinyl_crack', 'kick'], desc: 'Dusty Snare + Vinyl + Kick' },
  { id: 'dc_15', name: 'Gated 80s Stack', sounds: ['gated_snare', 'tom_low'], desc: '80s Gated Snare + Low Tom' },
  { id: 'dc_16', name: 'Tutti Fill', sounds: ['tom_hi', 'tom_low', 'crash', 'snare'], desc: 'All Toms + Snare Roll + Crash' },
];

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
      { id: 'fd_1', name: 'Funky Drummer Kick-Hat', sound: 'kick_funky', dur: 0.25 },
      { id: 'fd_2', name: 'Ghost Snare Roll', sound: 'snare_ghost', dur: 0.2 },
      { id: 'fd_3', name: 'Accent Snare Crack', sound: 'snare_crack', dur: 0.28 },
      { id: 'fd_4', name: '16th Hat Sizzle', sound: 'hat_sizzle', dur: 0.18 },
      { id: 'fd_5', name: 'Open-Close Hat Swung', sound: 'hat_open_close', dur: 0.3 },
      { id: 'fd_6', name: 'James Brown Break Chop', sound: 'jb_break', dur: 0.35 },
      { id: 'fd_7', name: 'Syncopated Double Kick', sound: 'kick_double', dur: 0.24 },
      { id: 'fd_8', name: 'Tight Rim Click', sound: 'rim_tight', dur: 0.15 },
      { id: 'fd_9', name: 'Cowbell Accent', sound: 'cowbell_funk', dur: 0.22 },
      { id: 'fd_10', name: 'Tambourine Shake Chop', sound: 'tamb_shake', dur: 0.25 },
      { id: 'fd_11', name: 'Hi-Tom Accent', sound: 'tom_funk_hi', dur: 0.28 },
      { id: 'fd_12', name: 'Floor Tom Groove', sound: 'tom_funk_low', dur: 0.3 },
      { id: 'fd_13', name: 'Splash Cymbal Choke', sound: 'splash_choke', dur: 0.2 },
      { id: 'fd_14', name: 'Clap-Rim Layer', sound: 'clap_rim', dur: 0.22 },
      { id: 'fd_15', name: 'Funk Break Fill', sound: 'break_fill', dur: 0.45 },
      { id: 'fd_16', name: 'Downbeat Crash Slam', sound: 'crash_funk', dur: 0.5 },
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
      { id: 'jd_1', name: 'Swing Ride Pattern', sound: 'ride_swing', dur: 0.35 },
      { id: 'jd_2', name: 'Feathered Kick Thump', sound: 'kick_jazz', dur: 0.3 },
      { id: 'jd_3', name: 'Brush Snare Swirl', sound: 'snare_brush', dur: 0.45 },
      { id: 'jd_4', name: 'Hi-Hat 2 & 4 Snap', sound: 'hat_pedal_snap', dur: 0.2 },
      { id: 'jd_5', name: 'Cross-Stick Accent', sound: 'cross_stick_jazz', dur: 0.25 },
      { id: 'jd_6', name: 'Bebop Snare Comp', sound: 'snare_bebop', dur: 0.22 },
      { id: 'jd_7', name: 'Ride Bell Tap', sound: 'ride_bell_jazz', dur: 0.3 },
      { id: 'jd_8', name: 'Bossa Nova Rim Tap', sound: 'bossa_rim', dur: 0.25 },
      { id: 'jd_9', name: 'Swung Hi-Hat Open', sound: 'hat_jazz_open', dur: 0.28 },
      { id: 'jd_10', name: 'Tom Jazz Roll', sound: 'tom_jazz_roll', dur: 0.38 },
      { id: 'jd_11', name: 'Sizzle Cymbal Wash', sound: 'sizzle_wash', dur: 0.6 },
      { id: 'jd_12', name: 'Brush Tap Fast', sound: 'brush_tap', dur: 0.18 },
      { id: 'jd_13', name: 'Ghost Kick Sync', sound: 'kick_ghost', dur: 0.2 },
      { id: 'jd_14', name: 'Triplet Snare Comp', sound: 'triplet_snare', dur: 0.3 },
      { id: 'jd_15', name: 'Crash Accent Decay', sound: 'crash_jazz', dur: 0.55 },
      { id: 'jd_16', name: 'Free Jazz Accent', sound: 'free_jazz_tutti', dur: 0.5 },
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
      { id: 'md_1', name: 'Double Kick Blast 16th', sound: 'blast_kick_double', dur: 0.2 },
      { id: 'md_2', name: 'Machine Gun Snare Crack', sound: 'snare_machine_gun', dur: 0.18 },
      { id: 'md_3', name: 'China Cymbal Trash Accent', sound: 'china_cymbal', dur: 0.4 },
      { id: 'md_4', name: 'Fast Thrash D-Beat', sound: 'd_beat_loop', dur: 0.35 },
      { id: 'md_5', name: 'Breakdown Mosh Stomp', sound: 'mosh_stomp', dur: 0.45 },
      { id: 'md_6', name: 'Gravity Blast Snare', sound: 'gravity_blast', dur: 0.15 },
      { id: 'md_7', name: 'Heavy Low Tom Bomb', sound: 'tom_metal_floor', dur: 0.35 },
      { id: 'md_8', name: 'Ride Cymbal Bell Pinger', sound: 'ride_metal_bell', dur: 0.28 },
      { id: 'md_9', name: 'Double-Bass 32nd Quad', sound: 'kick_metal_quad', dur: 0.25 },
      { id: 'md_10', name: 'Snare Rim Shot Explosive', sound: 'snare_metal_rim', dur: 0.25 },
      { id: 'md_11', name: 'Splash Cymbal Quick Choke', sound: 'splash_metal', dur: 0.2 },
      { id: 'md_12', name: 'Double Kick Gallop', sound: 'kick_gallop', dur: 0.3 },
      { id: 'md_13', name: 'Trash Can Snare Ping', sound: 'snare_trash_can', dur: 0.2 },
      { id: 'md_14', name: 'High Tom Fill Burst', sound: 'tom_metal_burst', dur: 0.32 },
      { id: 'md_15', name: 'Half-Time Slam', sound: 'half_time_slam', dur: 0.45 },
      { id: 'md_16', name: 'Final Crash Doom Ring', sound: 'crash_metal_doom', dur: 0.9 },
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
      { id: 'ld_1', name: 'Dusty Boom-Bap Kick', sound: 'kick_lofi_dusty', dur: 0.3 },
      { id: 'ld_2', name: 'Swung Lazy Snare', sound: 'snare_lofi_lazy', dur: 0.28 },
      { id: 'ld_3', name: 'Crackle Closed Hat', sound: 'hat_lofi_crackle', dur: 0.2 },
      { id: 'ld_4', name: 'Vinyl Shaker Drift', sound: 'shaker_lofi', dur: 0.32 },
      { id: 'ld_5', name: 'Muffled Rim Knock', sound: 'rim_lofi_knock', dur: 0.22 },
      { id: 'ld_6', name: 'SP-404 Swung Kick', sound: 'kick_sp404', dur: 0.35 },
      { id: 'ld_7', name: 'Sidechained Hat Splash', sound: 'hat_lofi_splash', dur: 0.26 },
      { id: 'ld_8', name: 'Snap & Ambient Verb', sound: 'snap_lofi', dur: 0.3 },
      { id: 'ld_9', name: 'Low-Pass Filtered Kick', sound: 'kick_lofi_filter', dur: 0.35 },
      { id: 'ld_10', name: 'Tape Stop Perc', sound: 'perc_tape_stop', dur: 0.25 },
      { id: 'ld_11', name: 'Ghost Snare Drag', sound: 'snare_lofi_ghost', dur: 0.22 },
      { id: 'ld_12', name: 'Subtle Conga Tap', sound: 'conga_lofi', dur: 0.28 },
      { id: 'ld_13', name: 'Vinyl Drop Pop', sound: 'vinyl_pop', dur: 0.15 },
      { id: 'ld_14', name: 'Swung Ride Tap', sound: 'ride_lofi_swing', dur: 0.35 },
      { id: 'ld_15', name: 'Lazy Drum Fill', sound: 'lofi_drum_fill', dur: 0.45 },
      { id: 'ld_16', name: 'Cymbal Wash Warm', sound: 'cymbal_lofi_wash', dur: 0.7 },
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
      { id: 'td_1', name: 'Spinz 808 Sub Boom', sound: 'kick_808_spinz', dur: 0.5 },
      { id: 'td_2', name: 'Sharp Pyrex Clap', sound: 'clap_pyrex', dur: 0.22 },
      { id: 'td_3', name: '1/32 Hi-Hat Roll Triplet', sound: 'hat_32_roll', dur: 0.25 },
      { id: 'td_4', name: 'Drill Sliding 808', sound: '808_slide', dur: 0.45 },
      { id: 'td_5', name: 'Snare Stutter Fill', sound: 'snare_stutter', dur: 0.3 },
      { id: 'td_6', name: 'Open Hat Laser Tick', sound: 'hat_laser', dur: 0.2 },
      { id: 'td_7', name: 'Hard Acoustic Kick Punch', sound: 'kick_trap_punch', dur: 0.28 },
      { id: 'td_8', name: 'Dark Perc Rimshot', sound: 'rim_dark_trap', dur: 0.22 },
      { id: 'td_9', name: 'High Pitch Hat Pitch-Down', sound: 'hat_pitch_down', dur: 0.25 },
      { id: 'td_10', name: 'Sub Drop 808 Gliss', sound: '808_gliss', dur: 0.55 },
      { id: 'td_11', name: 'Trap Triangle Accent', sound: 'triangle_trap', dur: 0.3 },
      { id: 'td_12', name: 'Fast Double Snare Chop', sound: 'snare_double', dur: 0.2 },
      { id: 'td_13', name: 'Cymbal Reverse Swell', sound: 'cymbal_reverse', dur: 0.4 },
      { id: 'td_14', name: 'Sub Stutter Drop', sound: 'sub_stutter', dur: 0.35 },
      { id: 'td_15', name: 'Trap Fill 16th Burst', sound: 'trap_fill_burst', dur: 0.38 },
      { id: 'td_16', name: 'Heavy Drop Impact Crash', sound: 'crash_trap_impact', dur: 0.65 },
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
      { id: 'bd_1', name: 'Chicago Shuffle Swing', sound: 'shuffle_swing', dur: 0.35 },
      { id: 'bd_2', name: 'Texas Blues Kick Thump', sound: 'kick_blues_texas', dur: 0.3 },
      { id: 'bd_3', name: 'Slow 6/8 Blues Roll', sound: 'snare_6_8_roll', dur: 0.45 },
      { id: 'bd_4', name: 'Rim Accent Turnaround', sound: 'rim_turnaround', dur: 0.25 },
      { id: 'bd_5', name: 'Swung Ride Bell Pattern', sound: 'ride_blues_bell', dur: 0.32 },
      { id: 'bd_6', name: 'Brush Swirl Shuffle', sound: 'brush_swirl_blues', dur: 0.4 },
      { id: 'bd_7', name: 'Double Shuffled Snare', sound: 'snare_double_shuffle', dur: 0.22 },
      { id: 'bd_8', name: 'Open Hi-Hat Accent', sound: 'hat_blues_open', dur: 0.28 },
      { id: 'bd_9', name: 'Fat Backbeat Snare Crack', sound: 'snare_backbeat_fat', dur: 0.28 },
      { id: 'bd_10', name: 'Blues Tom Fill Swung', sound: 'tom_blues_fill', dur: 0.35 },
      { id: 'bd_11', name: 'Crash Accent on One', sound: 'crash_blues_one', dur: 0.55 },
      { id: 'bd_12', name: 'Side Stick Slow Blues', sound: 'sidestick_blues', dur: 0.25 },
      { id: 'bd_13', name: 'Triplet Kick Thump', sound: 'kick_triplet_blues', dur: 0.28 },
      { id: 'bd_14', name: 'Hi-Hat Foot Chic', sound: 'hat_foot_chic', dur: 0.18 },
      { id: 'bd_15', name: 'End-of-12 Bar Fill', sound: 'fill_12_bar', dur: 0.48 },
      { id: 'bd_16', name: 'Grand Blues Finale Crash', sound: 'crash_blues_finale', dur: 0.8 },
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
    
    // Interactive Chord Builder state
    this.selectedChordRoot = 0;      // 0 = C, 2 = D, etc.
    this.selectedChordType = 'maj7'; // 'maj', 'min', 'maj7', 'min7', 'dom7', 'min9', 'maj9', 'sus4', 'dim'
    this.selectedChordInversion = 0; // 0 = Root, 1 = 1st, 2 = 2nd
    this.chordStrumSpeed = 0.024;    // Strum spread in seconds
    
    // Drum Kit state
    this.selectedDrumKit = 'studio_acoustic';
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
    this.activeInstrument = instId;
    
    // Match instrument voice in instrumentEngine
    if (instId === 'piano') {
      instrumentEngine.setInstrument('acoustic_grand');
    } else if (instId === 'guitar') {
      instrumentEngine.setInstrument('steel_acoustic');
    }
    
    this.render();
  }

  setMode(modeId) {
    if (!['notes', 'chords', 'slices'].includes(modeId)) return;
    this.activeMode = modeId;
    this.render();
  }

  setGenre(genreId) {
    if (!GENRES_CATALOG.some(g => g.id === genreId)) return;
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

  playDrumChord(chordItem) {
    if (!chordItem || !chordItem.sounds) return;
    
    // Trigger multi-drum sounds simultaneously for massive layered stem punch
    chordItem.sounds.forEach((soundName, i) => {
      setTimeout(() => {
        // Map sound to kit or synthesis
        if (soundName.includes('kick')) instrumentEngine.playDrumSound('kick', 1.0);
        else if (soundName.includes('snare')) instrumentEngine.playDrumSound('snare', 0.95);
        else if (soundName.includes('hat')) instrumentEngine.playDrumSound('hat_closed', 0.85);
        else if (soundName.includes('crash')) instrumentEngine.playDrumSound('crash', 0.9);
        else if (soundName.includes('tom')) instrumentEngine.playDrumSound('tom_hi', 0.85);
        else if (soundName.includes('clap')) instrumentEngine.playDrumSound('clap', 0.92);
        else instrumentEngine.playDrumSound('percussion', 0.85);
      }, i * 8); // subtle 8ms flam
    });
  }

  playGenreSlice(slice) {
    if (!slice) return;
    
    const pitchOffset = this.slicePitchShift;
    const speedMult = this.sliceSpeed;
    
    if (this.activeInstrument === 'drums') {
      // Drum Slice hit
      instrumentEngine.playDrumSound(slice.sound || 'snare', 0.95);
    } else {
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
  }

  // ==========================================================================
  // RENDERING ENGINE
  // ==========================================================================

  render() {
    const container = document.getElementById('mpcDeck');
    if (!container) return;

    container.innerHTML = `
      <!-- Top Directional Carousel Header -->
      <div class="ctrl-carousel-header">
        <div class="ctrl-brand-group">
          <span class="calc-panel-badge" style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3);">
            Hardware &amp; Touch Controller
          </span>
          <h3 class="ctrl-title">
            ${this.getInstrumentIcon()} ${this.getInstrumentName()} Surface
          </h3>
          <p class="ctrl-sub">
            Interactive multi-instrument workstation: switch instruments, edit single notes, trigger rich chords, and perform genre-based slices.
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
              🎹 Piano Keyboard
            </button>
            <button 
              type="button" 
              class="ctrl-inst-pill ${this.activeInstrument === 'drums' ? 'active' : ''}" 
              onclick="window.touchController.setInstrument('drums')"
            >
              🥁 Drum Pad
            </button>
            <button 
              type="button" 
              class="ctrl-inst-pill ${this.activeInstrument === 'guitar' ? 'active' : ''}" 
              onclick="window.touchController.setInstrument('guitar')"
            >
              🎸 Guitar Fretboard
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

      <!-- Performance Mode Tabs (Single Notes, Chords, Slices) -->
      <div class="ctrl-modes-bar">
        <div class="ctrl-modes-tabs">
          ${CONTROLLER_MODES.map(m => `
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

      <!-- Interactive Editor Drawer (Single Note Tuning, Chord Voicing, Slice Pitch) -->
      <div class="ctrl-editor-drawer">
        ${this.renderEditorDrawerHtml()}
      </div>

      <!-- Dynamic Active Instrument QWERTY HUD -->
      ${this.renderActiveInstrumentHudHtml()}
      
      <p style="font-size: 0.72rem; color: var(--text-muted); text-align: center; margin-top: 0.65rem;">
        ⌨️ <em>Active Instrument Isolation: Whichever instrument is selected exclusively controls the computer keyboard. Clicking text inputs restores standard typing.</em>
      </p>
    `;
  }

  renderActiveInstrumentHudHtml() {
    if (this.activeInstrument === 'drums') {
      return `
        <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
          <div class="qwerty-hud-group active-hud" style="border-color: rgba(245, 158, 11, 0.45); background: rgba(245, 158, 11, 0.05); grid-column: 1 / -1;">
            <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #fbbf24; font-weight: 700; font-size: 0.95rem;">🥁 Active Instrument: Drum Machine (16-Pad MPC)</span>
              <span class="calc-panel-badge" style="background: rgba(245, 158, 11, 0.25); color: #fbbf24; font-size: 0.7rem; border-color: rgba(245, 158, 11, 0.4);">
                Dedicated 4×4 Pad Keys
              </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
              <div style="background: rgba(0,0,0,0.3); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 0.75rem; color: #a1a1aa; display: block; margin-bottom: 0.25rem;">Row 4 (Pads 13-16):</span>
                <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 0.75rem; color: #a1a1aa; display: block; margin-bottom: 0.25rem;">Row 3 (Pads 9-12):</span>
                <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 0.75rem; color: #a1a1aa; display: block; margin-bottom: 0.25rem;">Row 2 (Pads 5-8):</span>
                <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
                <span style="font-size: 0.75rem; color: #a1a1aa; display: block; margin-bottom: 0.25rem;">Row 1 (Pads 1-4):</span>
                <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd>
              </div>
            </div>
            <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: #cbd5e1;">
              ⚡ Velocity-responsive drum hits and layered stacks. Each key corresponds directly to one pad.
            </div>
          </div>
        </div>
      `;
    }

    if (this.activeInstrument === 'piano') {
      return `
        <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
          <div class="qwerty-hud-group active-hud" style="border-color: rgba(6, 182, 212, 0.45); background: rgba(6, 182, 212, 0.05); grid-column: 1 / -1;">
            <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="color: #67e8f9; font-weight: 700; font-size: 0.95rem;">🎹 Active Instrument: Chromatic Piano (Full Keyboard Layout)</span>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="calc-panel-badge" style="background: rgba(6, 182, 212, 0.2); color: #67e8f9; font-size: 0.7rem; border-color: rgba(6, 182, 212, 0.4);">
                  Octave: C${this.pianoOctave} - C${this.pianoOctave + 2} (Press [1] / [-] to Shift)
                </span>
                <span class="calc-panel-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 0.7rem; border-color: rgba(16, 185, 129, 0.4);">
                  Hold [Shift] for Sustain
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
              <!-- Upper Octave -->
              <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.15);">
                <div style="font-size: 0.75rem; font-weight: 600; color: #67e8f9; margin-bottom: 0.35rem;">
                  Upper Tier (Octave C${this.pianoOctave + 1} - G${this.pianoOctave + 2}):
                </div>
                <div style="margin-bottom: 0.3rem;">
                  <span style="color: #a1a1aa; font-size: 0.7rem;">Whites:</span> 
                  <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>I</kbd> <kbd>O</kbd> <kbd>P</kbd> <kbd>[</kbd> <kbd>]</kbd>
                </div>
                <div>
                  <span style="color: #a1a1aa; font-size: 0.7rem;">Blacks:</span> 
                  <kbd>2</kbd> <kbd>3</kbd> &nbsp; <kbd>5</kbd> <kbd>6</kbd> <kbd>7</kbd> &nbsp; <kbd>9</kbd> <kbd>0</kbd> <kbd>=</kbd>
                </div>
              </div>

              <!-- Lower Octave -->
              <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.15);">
                <div style="font-size: 0.75rem; font-weight: 600; color: #67e8f9; margin-bottom: 0.35rem;">
                  Lower Tier (Octave C${this.pianoOctave} - E${this.pianoOctave + 1}):
                </div>
                <div style="margin-bottom: 0.3rem;">
                  <span style="color: #a1a1aa; font-size: 0.7rem;">Whites:</span> 
                  <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd> <kbd>B</kbd> <kbd>N</kbd> <kbd>M</kbd> <kbd>,</kbd> <kbd>.</kbd> <kbd>/</kbd>
                </div>
                <div>
                  <span style="color: #a1a1aa; font-size: 0.7rem;">Blacks:</span> 
                  <kbd>S</kbd> <kbd>D</kbd> &nbsp; <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> &nbsp; <kbd>L</kbd> <kbd>;</kbd>
                </div>
              </div>
            </div>

            <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: #cbd5e1;">
              🎹 Over two full continuous octaves mapped across your keyboard like a professional digital audio workstation.
            </div>
          </div>
        </div>
      `;
    }

    // Guitar Active HUD
    return `
      <div class="qwerty-multi-instrument-hud active-single-instrument-hud" style="margin-top: 1.5rem;">
        <div class="qwerty-hud-group active-hud" style="border-color: rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.05); grid-column: 1 / -1;">
          <div class="qwerty-hud-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <span style="color: #34d399; font-weight: 700; font-size: 0.95rem;">🎸 Active Instrument: Guitar Fretboard &amp; Strummer (Full Keyboard Layout)</span>
            <span class="calc-panel-badge" style="background: rgba(16, 185, 129, 0.25); color: #34d399; font-size: 0.7rem; border-color: rgba(16, 185, 129, 0.4);">
              Full 4-Row Guitar Map
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin-top: 0.75rem;">
            <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.15);">
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 1: Open Strings Plucks</span>
              <kbd>1</kbd> (E4) <kbd>2</kbd> (B3) <kbd>3</kbd> (G3) <kbd>4</kbd> (D3) <kbd>5</kbd> (A2) <kbd>6</kbd> (E2) &bull; <kbd>7</kbd><kbd>8</kbd><kbd>9</kbd><kbd>0</kbd>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.15);">
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 2: Lead Solo Frets (High E Fret 0-12)</span>
              <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd> <kbd>I</kbd> <kbd>O</kbd> <kbd>P</kbd> <kbd>[</kbd> <kbd>]</kbd>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.15);">
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 3: Mid Riffing Frets (Strings 3 &amp; 4)</span>
              <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>;</kbd> <kbd>'</kbd>
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.15);">
              <span style="font-size: 0.75rem; color: #34d399; font-weight: 600; display: block; margin-bottom: 0.25rem;">Row 4: Bass Notes &amp; Chord Strums</span>
              Bass: <kbd>Z</kbd><kbd>X</kbd><kbd>C</kbd><kbd>V</kbd> &bull; Chords: <kbd>B</kbd>(Em) <kbd>N</kbd>(C) <kbd>M</kbd>(G) <kbd>,</kbd>(D) <kbd>.</kbd>(Am) <kbd>/</kbd>(F)
            </div>
          </div>

          <div class="qwerty-hud-desc" style="margin-top: 0.5rem; color: #cbd5e1;">
            🎸 Pluck individual open strings, run guitar solos up the neck, or trigger full chord strums with realistic acoustic resonance.
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
    return item ? item.icon : '🎛️';
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
                style="${this.activeGenre === g.id ? `border-color: ${g.color}; box-shadow: 0 0 10px ${g.color}40;` : ''}"
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
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.shiftOctave(-1)">◀ Octave -</button>
            <span style="font-family: monospace; font-size: 0.8rem; font-weight: 700; color: var(--neon-cyan);">Octave C${this.pianoOctave}–C${this.pianoOctave + 2}</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.shiftOctave(1)">Octave + ▶</button>
          </div>
        `;
      }
      if (this.activeInstrument === 'drums') {
        return `
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="ctrl-label">Kit:</label>
            <select class="theory-select" onchange="window.handleDrumKitChange(this.value)">
              <option value="studio_acoustic" ${instrumentEngine.settings.drumKit === 'studio_acoustic' ? 'selected' : ''}>🥁 Studio Acoustic</option>
              <option value="trap_808" ${instrumentEngine.settings.drumKit === 'trap_808' ? 'selected' : ''}>⚡ 808 Trap &amp; Drill</option>
              <option value="dance_909" ${instrumentEngine.settings.drumKit === 'dance_909' ? 'selected' : ''}>🎛️ 909 Dance</option>
              <option value="lofi_vinyl" ${instrumentEngine.settings.drumKit === 'lofi_vinyl' ? 'selected' : ''}>📻 Lofi Vinyl</option>
              <option value="latin_perc" ${instrumentEngine.settings.drumKit === 'latin_perc' ? 'selected' : ''}>🪘 Latin Perc</option>
            </select>
          </div>
        `;
      }
      if (this.activeInstrument === 'guitar') {
        return `
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <label class="ctrl-label">Guitar Voice:</label>
            <select class="theory-select" onchange="window.handleGlobalInstrumentChange(this.value)">
              <option value="steel_acoustic" selected>🎸 Steel Acoustic</option>
              <option value="classical_guitar">🎸 Classical Nylon</option>
              <option value="electric_clean">⚡ Clean Electric</option>
              <option value="rock_overdrive">🔥 Rock Overdrive</option>
              <option value="palm_mute">🤘 Palm Muted</option>
            </select>
          </div>
        `;
      }
    }

    if (this.activeMode === 'chords') {
      return `
        <div style="font-size: 0.78rem; color: #a1a1aa;">
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

    // 2. CHORDS MODE
    if (this.activeMode === 'chords') {
      if (this.activeInstrument === 'piano') return this.renderPianoChordsGridHtml();
      if (this.activeInstrument === 'drums') return this.renderDrumChordsGridHtml();
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
            style="border-color: rgba(6, 182, 212, 0.35); background: rgba(6, 182, 212, 0.05);"
            onmousedown="window.touchController.playChordVoicing([${chord.notes.join(',')}], false); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playChordVoicing([${chord.notes.join(',')}], false); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="${chord.desc}"
          >
            <div class="mpc-pad-key">Chord ${idx + 1}</div>
            <div class="mpc-pad-name" style="color: var(--neon-cyan); font-size: 0.95rem;">${chord.name}</div>
            <div class="mpc-pad-note" style="color: #cbd5e1;">${chord.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Chords Mode: Drum Chords (Layered Stem Stacks) 4x4 Grid
  renderDrumChordsGridHtml() {
    return `
      <div class="mpc-grid">
        ${DRUM_CHORDS_CATALOG.map((dc, idx) => `
          <div 
            class="mpc-pad" 
            style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.05);"
            onmousedown="window.touchController.playDrumChord(window.touchController.getDrumChord(${idx})); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playDrumChord(window.touchController.getDrumChord(${idx})); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="${dc.desc}"
          >
            <div class="mpc-pad-key">Stack ${idx + 1}</div>
            <div class="mpc-pad-name" style="color: var(--neon-gold); font-size: 0.9rem;">${dc.name}</div>
            <div class="mpc-pad-note" style="color: #cbd5e1;">${dc.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  getDrumChord(idx) {
    return DRUM_CHORDS_CATALOG[idx];
  }

  // Chords Mode: Guitar Strummed Chord Shapes 4x4 Grid
  renderGuitarChordsGridHtml() {
    return `
      <div class="mpc-grid">
        ${GUITAR_CHORDS_CATALOG.map((gc, idx) => `
          <div 
            class="mpc-pad" 
            style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05);"
            onmousedown="window.touchController.playChordVoicing([${gc.notes.join(',')}], true); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playChordVoicing([${gc.notes.join(',')}], true); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="${gc.desc} • Frets: ${gc.frets}"
          >
            <div class="mpc-pad-key">Fret: ${gc.frets}</div>
            <div class="mpc-pad-name" style="color: #34d399; font-size: 0.95rem;">${gc.name}</div>
            <div class="mpc-pad-note" style="color: #cbd5e1;">${gc.desc}</div>
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
            style="border-color: rgba(236, 72, 153, 0.4); background: rgba(236, 72, 153, 0.06);"
            onmousedown="window.touchController.playGenreSlice(window.touchController.getSlice(${idx})); this.classList.add('active');"
            onmouseup="this.classList.remove('active');"
            onmouseleave="this.classList.remove('active');"
            ontouchstart="window.touchController.playGenreSlice(window.touchController.getSlice(${idx})); this.classList.add('active');"
            ontouchend="this.classList.remove('active');"
            title="Slice ${idx + 1} (${slice.name}) • Click to trigger"
          >
            <div class="mpc-pad-key">Slice ${idx + 1}</div>
            <div class="mpc-pad-name" style="color: var(--neon-pink); font-size: 0.85rem;">${slice.name}</div>
            <div class="mpc-pad-note">${this.activeGenre.toUpperCase()}</div>
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
    if (this.activeMode === 'slices') {
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>✂️ Genre Slice Sound Designer</span>
            <span style="font-size: 0.72rem; color: #a1a1aa;">Real-time pitch shift, tempo stretch, &amp; envelope editing</span>
          </div>
          <div class="ctrl-editor-controls">
            <div class="ctrl-editor-field">
              <label>Pitch Shift: <span id="ctrlSlicePitchVal" style="color: var(--neon-cyan);">${this.slicePitchShift > 0 ? '+' : ''}${this.slicePitchShift} st</span></label>
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

    if (this.activeMode === 'chords') {
      return `
        <div class="ctrl-editor-panel">
          <div class="ctrl-editor-title">
            <span>🎼 Interactive Chord Voicing Builder</span>
            <span style="font-size: 0.72rem; color: #a1a1aa;">Build, edit, and strum custom harmonic chord structures</span>
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
              <label>Strum Physics:</label>
              <div style="display: flex; gap: 0.35rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.005">Tight Block</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.024">Standard Strum</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.touchController.chordStrumSpeed = 0.05">Slow Arp</button>
              </div>
            </div>
            <div class="ctrl-editor-field" style="display: flex; align-items: flex-end;">
              <button type="button" class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.touchController.auditionCustomChord()">
                ▶ Audition Chord
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Single Notes Mode Editor
    return `
      <div class="ctrl-editor-panel">
        <div class="ctrl-editor-title">
          <span>🎵 Single Note Articulation Rack</span>
          <span style="font-size: 0.72rem; color: #a1a1aa;">Tune key sensitivity, velocity, and decay</span>
        </div>
        <div class="ctrl-editor-controls" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="ctrl-editor-field">
            <label>Master Velocity: <span style="color: var(--neon-cyan);">95%</span></label>
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
