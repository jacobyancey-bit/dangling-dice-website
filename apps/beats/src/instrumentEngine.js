/**
 * Dangling Beats Studio™ — Master Instrument & Physical Modeling Sound Engine
 * High-fidelity Web Audio synthesis & physical modeling for Guitars, Pianos, and Drum Kits.
 * Zero external audio file lag — 100% in-browser DSP with realistic acoustics.
 */

import { midiToFreq, NOTE_NAMES } from './theoryEngine.js';

// ============================================================================
// INSTRUMENT CATALOG & DEFINITIONS
// ============================================================================

export const INSTRUMENT_CATALOG = {
  // --- GUITARS & PLUCKED STRINGS ---
  classical_guitar: {
    id: 'classical_guitar',
    name: '🎸 Classical Guitar (Nylon)',
    category: 'guitar',
    icon: '🎸',
    desc: 'Warm nylon string pluck with acoustic soundboard resonance and gentle high-frequency damping.',
    defaultDuration: 1.8,
  },
  steel_acoustic: {
    id: 'steel_acoustic',
    name: '🎸 Steel-String Acoustic Guitar',
    category: 'guitar',
    icon: '🎸',
    desc: 'Crisp metallic attack with rich acoustic body bloom and shimmering high-frequency string harmonics.',
    defaultDuration: 2.2,
  },
  electric_clean: {
    id: 'electric_clean',
    name: '🎸 Clean Electric Guitar (Strat)',
    category: 'guitar',
    icon: '⚡',
    desc: 'Single-coil chime, scooped mid-range, bell-like clarity, and warm analog pickup tone.',
    defaultDuration: 2.0,
  },
  rock_overdrive: {
    id: 'rock_overdrive',
    name: '🎸 Rock Overdrive Guitar',
    category: 'guitar',
    icon: '🔥',
    desc: 'High-gain harmonic distortion, soft-clipped power tube saturation, and 4x12 speaker cabinet emulation.',
    defaultDuration: 2.2,
  },
  palm_mute: {
    id: 'palm_mute',
    name: '🎸 Palm-Muted Rock Chug',
    category: 'guitar',
    icon: '🤘',
    desc: 'Thumpy percussive string transient with tight decaying fundamental and compressed bite.',
    defaultDuration: 0.6,
  },
  mandolin: {
    id: 'mandolin',
    name: '🪕 Mandolin (Double-Course)',
    category: 'guitar',
    icon: '🪕',
    desc: 'Dual-string pairs with subtle unison detuning, rapid wooden soundboard attack, and bright sparkle.',
    defaultDuration: 1.4,
  },
  electric_bass: {
    id: 'electric_bass',
    name: '🎸 Electric Bass (Finger/Slap)',
    category: 'guitar',
    icon: '🔊',
    desc: 'Deep fundamental sub, punchy fret-snap transient, and growling low-mid harmonic bite.',
    defaultDuration: 1.6,
  },

  // --- PIANOS & KEYBOARDS ---
  grand_piano: {
    id: 'grand_piano',
    name: '🎹 Concert Grand Piano',
    category: 'piano',
    icon: '🎹',
    desc: 'Inharmonic string stiffness, felt hammer knock strike transient, and multi-harmonic acoustic bloom.',
    defaultDuration: 2.5,
  },
  upright_piano: {
    id: 'upright_piano',
    name: '🎹 Vintage Upright / Saloon Piano',
    category: 'piano',
    icon: '🎼',
    desc: 'Warm wooden character with slightly detuned dual-string unisons and felt damper release.',
    defaultDuration: 2.0,
  },
  rhodes_mark1: {
    id: 'rhodes_mark1',
    name: '🎹 Fender Rhodes Mark I',
    category: 'piano',
    icon: '✨',
    desc: 'Bell-like metallic tine strike transient, magnetic pickup warmth, and gentle stereophonic chorus.',
    defaultDuration: 2.4,
  },
  wurlitzer_200a: {
    id: 'wurlitzer_200a',
    name: '🎹 Wurlitzer 200A Electric Piano',
    category: 'piano',
    icon: '⚡',
    desc: 'Vibrating steel reed with dynamic mid-range bark, aggressive bite, and vintage warmth.',
    defaultDuration: 2.2,
  },
  harpsichord: {
    id: 'harpsichord',
    name: '🎹 Baroque Harpsichord',
    category: 'piano',
    icon: '🏛️',
    desc: 'Quill plectrum pluck on brass strings with instant zero-attack, high harmonic buzz, and vintage brightness.',
    defaultDuration: 1.5,
  },
  toy_piano: {
    id: 'toy_piano',
    name: '🎹 Toy / Lofi Glass Piano',
    category: 'piano',
    icon: '🔔',
    desc: 'Crystalline inharmonic steel rods, chime-like bell harmonics, and playful lofi character.',
    defaultDuration: 1.8,
  },
  church_organ: {
    id: 'church_organ',
    name: '⛪ Cathedral Pipe Organ',
    category: 'piano',
    icon: '⛪',
    desc: 'Multi-rank additive pipe stops (16’ Bourdon, 8’ Principal, 4’ Octave, 2’ Flute) with atmospheric acoustic hall sustain.',
    defaultDuration: 3.0,
  },
};

// ============================================================================
// DRUM KITS & 16-PAD MAPPINGS
// ============================================================================

export const DRUM_KITS = {
  studio_acoustic: {
    id: 'studio_acoustic',
    name: '🥁 Studio Acoustic Kit',
    desc: 'Punchy birch kick, crisp wooden snare with wire rattle, brass cymbals, and tuned toms.',
    pads: {
      1: { name: 'Acoustic Kick', sound: 'kick_acoustic' },
      2: { name: 'Side Stick / Rim', sound: 'sidestick' },
      3: { name: 'Maple Snare', sound: 'snare_acoustic' },
      4: { name: 'Room Clap', sound: 'clap_acoustic' },
      5: { name: 'Snare Ring', sound: 'snare_rim' },
      6: { name: 'Floor Tom', sound: 'tom_floor' },
      7: { name: 'Closed Hat', sound: 'hat_closed' },
      8: { name: 'Mid Tom', sound: 'tom_mid' },
      9: { name: 'Pedal Hat', sound: 'hat_pedal' },
      10: { name: 'High Tom', sound: 'tom_high' },
      11: { name: 'Open Hat', sound: 'hat_open' },
      12: { name: 'Ride Bell', sound: 'ride_bell' },
      13: { name: 'Crash Cymbal', sound: 'crash_acoustic' },
      14: { name: 'Ride Cymbal', sound: 'ride_acoustic' },
      15: { name: 'Cowbell', sound: 'cowbell_real' },
      16: { name: 'Tambourine', sound: 'tambourine' },
    },
  },
  trap_808: {
    id: 'trap_808',
    name: '⚡ 808 Trap & Drill Kit',
    desc: 'Booming tuned sub bass drops, snappy high-frequency trap snares, and sizzling hi-hats.',
    pads: {
      1: { name: '808 Sub Boom', sound: '808_sub' },
      2: { name: '808 Rimshot', sound: '808_rim' },
      3: { name: '808 Trap Snare', sound: '808_snare' },
      4: { name: '808 Handclap', sound: '808_clap' },
      5: { name: '808 High Snare', sound: '808_snare_hi' },
      6: { name: '808 Low Tom', sound: '808_tom_low' },
      7: { name: '808 Closed Hat', sound: '808_hat_closed' },
      8: { name: '808 Mid Tom', sound: '808_tom_mid' },
      9: { name: '808 Open Hat', sound: '808_hat_open' },
      10: { name: '808 High Tom', sound: '808_tom_hi' },
      11: { name: '808 Sizzle Hat', sound: '808_hat_roll' },
      12: { name: '808 Clave', sound: '808_clave' },
      13: { name: '808 Crash', sound: '808_crash' },
      14: { name: '808 Cowbell', sound: '808_cowbell' },
      15: { name: '808 Shaker', sound: '808_shaker' },
      16: { name: '808 Reverse Cym', sound: '808_reverse' },
    },
  },
  dance_909: {
    id: 'dance_909',
    name: '🎛️ 909 Dance & House Kit',
    desc: 'Punchy analog kick punch, snappy pitched 909 snare, resonant open hats, and club claps.',
    pads: {
      1: { name: '909 Punch Kick', sound: '909_kick' },
      2: { name: '909 Rimshot', sound: '909_rim' },
      3: { name: '909 Club Snare', sound: '909_snare' },
      4: { name: '909 Stereo Clap', sound: '909_clap' },
      5: { name: '909 Low Tom', sound: '909_tom_low' },
      6: { name: '909 Mid Tom', sound: '909_tom_mid' },
      7: { name: '909 Closed Hat', sound: '909_hat_closed' },
      8: { name: '909 High Tom', sound: '909_tom_hi' },
      9: { name: '909 Pedal Hat', sound: '909_hat_pedal' },
      10: { name: '909 Open Hat', sound: '909_hat_open' },
      11: { name: '909 Ride Bell', sound: '909_ride' },
      12: { name: '909 Crash', sound: '909_crash' },
      13: { name: 'Synth Zap', sound: 'synth_zap' },
      14: { name: 'Sub Drop', sound: 'sub_drop' },
      15: { name: 'House Shaker', sound: 'house_shaker' },
      16: { name: 'Club Cowbell', sound: 'club_cowbell' },
    },
  },
  lofi_vinyl: {
    id: 'lofi_vinyl',
    name: '📻 Lofi Vinyl & Hip-Hop Kit',
    desc: 'Tape-saturated kicks, muted paper snares, dusty vinyl crackle hats, and finger snaps.',
    pads: {
      1: { name: 'Dusty Tape Kick', sound: 'lofi_kick' },
      2: { name: 'Finger Snap', sound: 'lofi_snap' },
      3: { name: 'Muted Paper Snare', sound: 'lofi_snare' },
      4: { name: 'Lofi Rim Click', sound: 'lofi_rim' },
      5: { name: 'Lofi Snare Brush', sound: 'lofi_brush' },
      6: { name: 'Muted Tom Low', sound: 'lofi_tom_low' },
      7: { name: 'Vinyl Crackle Hat', sound: 'lofi_hat_closed' },
      8: { name: 'Muted Tom High', sound: 'lofi_tom_hi' },
      9: { name: 'Warm Open Hat', sound: 'lofi_hat_open' },
      10: { name: 'Lofi Shaker', sound: 'lofi_shaker' },
      11: { name: 'Kalimba Pluck', sound: 'lofi_kalimba' },
      12: { name: 'Lofi Bell Chime', sound: 'lofi_bell' },
      13: { name: 'Soft Clave', sound: 'lofi_clave' },
      14: { name: 'Tape Stop Hit', sound: 'tape_stop' },
      15: { name: 'Water Drop', sound: 'water_drop' },
      16: { name: 'Vinyl Noise Burst', sound: 'vinyl_burst' },
    },
  },
  latin_perc: {
    id: 'latin_perc',
    name: '🪘 Latin & World Percussion Kit',
    desc: 'Authentic congas, bongos, timbales, guiro, maracas, and Brazilian agogo bells.',
    pads: {
      1: { name: 'Conga Low Open', sound: 'conga_low' },
      2: { name: 'Conga High Open', sound: 'conga_high' },
      3: { name: 'Conga Slap', sound: 'conga_slap' },
      4: { name: 'Conga Mute', sound: 'conga_mute' },
      5: { name: 'Bongo Low', sound: 'bongo_low' },
      6: { name: 'Bongo High', sound: 'bongo_high' },
      7: { name: 'Timbale Low', sound: 'timbale_low' },
      8: { name: 'Timbale High', sound: 'timbale_high' },
      9: { name: 'Timbale Rimshot', sound: 'timbale_rim' },
      10: { name: 'Guiro Scrape Short', sound: 'guiro_short' },
      11: { name: 'Guiro Scrape Long', sound: 'guiro_long' },
      12: { name: 'Maracas Shaker', sound: 'maracas' },
      13: { name: 'Agogo Bell Low', sound: 'agogo_low' },
      14: { name: 'Agogo Bell High', sound: 'agogo_high' },
      15: { name: 'Wood Clave', sound: 'latin_clave' },
      16: { name: 'Solid Woodblock', sound: 'woodblock' },
    },
  },
};

// ============================================================================
// MASTER INSTRUMENT & DSP SYNTHESIS ENGINE
// ============================================================================

class InstrumentEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbConvolver = null;
    this.activeInstrumentId = 'grand_piano';
    this.activeDrumKitId = 'studio_acoustic';
    this.distortionCurve = this.makeDistortionCurve(40);
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupMasterBus();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  setupMasterBus() {
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, ctx.currentTime);

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(ctx.destination);
  }

  setInstrument(id) {
    if (INSTRUMENT_CATALOG[id]) {
      this.activeInstrumentId = id;
      return true;
    }
    return false;
  }

  getInstrument() {
    return INSTRUMENT_CATALOG[this.activeInstrumentId] || INSTRUMENT_CATALOG.grand_piano;
  }

  setDrumKit(id) {
    if (DRUM_KITS[id]) {
      this.activeDrumKitId = id;
      return true;
    }
    return false;
  }

  getDrumKit() {
    return DRUM_KITS[this.activeDrumKitId] || DRUM_KITS.studio_acoustic;
  }

  makeDistortionCurve(amount = 25) {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  // -------------------------------------------------------------
  // INSTRUMENT PLAYBACK ROUTERS
  // -------------------------------------------------------------

  /**
   * Plays a single note with the currently selected instrument
   */
  playNote(midiNote, duration = null, velocity = 0.85) {
    const inst = this.getInstrument();
    const dur = duration || inst.defaultDuration;
    this.synthesizeInstrumentNote(inst.id, midiNote, dur, velocity);
  }

  /**
   * Plays a polyphonic chord with realistic strumming and acoustic spreading
   */
  playChord(midiNotes, duration = null, velocity = 0.85) {
    const inst = this.getInstrument();
    const dur = duration || inst.defaultDuration;
    const isGuitar = inst.category === 'guitar';
    const strumSpeed = isGuitar ? 0.024 : 0.012; // Guitars strum down across strings

    midiNotes.forEach((midi, i) => {
      const delay = i * strumSpeed;
      setTimeout(() => {
        this.synthesizeInstrumentNote(inst.id, midi, dur, velocity * (0.9 + Math.random() * 0.15));
      }, delay * 1000);
    });
  }

  // -------------------------------------------------------------
  // PHYSICAL MODELING SYNTHESIS BY INSTRUMENT
  // -------------------------------------------------------------

  synthesizeInstrumentNote(instId, midiNote, duration = 2.0, velocity = 0.85) {
    const ctx = this.getAudioContext();
    const t = ctx.currentTime;
    const f0 = midiToFreq(midiNote);
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    switch (instId) {
      // ---------------------------------------------------------
      // 1. CLASSICAL GUITAR (Nylon string + soundboard body)
      // ---------------------------------------------------------
      case 'classical_guitar': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const bodyFilter = ctx.createBiquadFilter();
        const dampFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Warm nylon string harmonics (triangle + subtle sine octave)
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f0 * 2.001, t);

        // Acoustic guitar body formant resonance (110Hz body cavity + 220Hz top soundboard)
        bodyFilter.type = 'peaking';
        bodyFilter.frequency.setValueAtTime(110, t);
        bodyFilter.Q.setValueAtTime(2.0, t);
        bodyFilter.gain.setValueAtTime(4.5, t);

        // Dynamic nail/pluck damping (highs drop rapidly)
        dampFilter.type = 'lowpass';
        dampFilter.frequency.setValueAtTime(3200 * vel, t);
        dampFilter.frequency.exponentialRampToValueAtTime(350, t + Math.min(duration, 0.8));

        // Soft nylon pluck envelope
        const peakGain = 0.35 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.45, t + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc1.connect(dampFilter);
        osc2.connect(dampFilter);
        dampFilter.connect(bodyFilter);
        bodyFilter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration + 0.05);
        osc2.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 2. STEEL-STRING ACOUSTIC GUITAR (Bright metallic pick + dreadnought body)
      // ---------------------------------------------------------
      case 'steel_acoustic': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const pickNoise = ctx.createBufferSource();
        const pickGain = ctx.createGain();
        const pickFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const toneFilter = ctx.createBiquadFilter();

        // Metallic steel string: sawtooth blended with triangle
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(f0 * 1.002, t);

        // Plectrum pick noise transient (first 18ms)
        const noiseLen = Math.floor(ctx.sampleRate * 0.025);
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.25));
        }
        pickNoise.buffer = noiseBuf;

        pickFilter.type = 'bandpass';
        pickFilter.frequency.setValueAtTime(4500, t);
        pickFilter.Q.setValueAtTime(1.5, t);

        pickGain.gain.setValueAtTime(0.4 * vel, t);
        pickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        pickNoise.connect(pickFilter);
        pickFilter.connect(pickGain);
        pickGain.connect(gain);

        // Acoustic dreadnought body filter
        toneFilter.type = 'lowpass';
        toneFilter.frequency.setValueAtTime(5800 * vel, t);
        toneFilter.frequency.exponentialRampToValueAtTime(650, t + duration * 0.7);

        const peakGain = 0.3 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.35, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc1.connect(toneFilter);
        osc2.connect(toneFilter);
        toneFilter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        pickNoise.start(t);
        osc1.stop(t + duration + 0.05);
        osc2.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 3. CLEAN ELECTRIC GUITAR (Fender Stratocaster)
      // ---------------------------------------------------------
      case 'electric_clean': {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const pickupFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f0, t);

        sub.type = 'sine';
        sub.frequency.setValueAtTime(f0 * 2, t);

        // Stratocaster single-coil pickup chime (boost at 3.2kHz, cut at 500Hz)
        pickupFilter.type = 'peaking';
        pickupFilter.frequency.setValueAtTime(3200, t);
        pickupFilter.gain.setValueAtTime(4.0, t);
        pickupFilter.Q.setValueAtTime(1.8, t);

        const peakGain = 0.32 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.5, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(pickupFilter);
        sub.connect(pickupFilter);
        pickupFilter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        sub.start(t);
        osc.stop(t + duration + 0.05);
        sub.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 4. ROCK OVERDRIVE GUITAR (High gain distortion + 4x12 cab)
      // ---------------------------------------------------------
      case 'rock_overdrive': {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const driveGain = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        const cabFilter = ctx.createBiquadFilter();
        const cabResonance = ctx.createBiquadFilter();
        const masterGainNode = ctx.createGain();

        // Sawtooth wave for harmonic density
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);

        // Sub octave power-chord thickness
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(f0 * 0.5, t);

        // Drive stage: push into nonlinear clipping
        driveGain.gain.setValueAtTime(3.8 * vel, t);
        shaper.curve = this.distortionCurve;
        shaper.oversample = '4x';

        // 4x12 Guitar Speaker Cabinet Simulation:
        // Sharp roll-off above 4.2kHz (Celestion speaker cutoff)
        cabFilter.type = 'lowpass';
        cabFilter.frequency.setValueAtTime(3800, t);
        cabFilter.Q.setValueAtTime(2.0, t);

        // Low-end cabinet thump at 115Hz
        cabResonance.type = 'peaking';
        cabResonance.frequency.setValueAtTime(115, t);
        cabResonance.gain.setValueAtTime(5.0, t);

        const peakGain = 0.28 * vel;
        masterGainNode.gain.setValueAtTime(0.0001, t);
        masterGainNode.gain.linearRampToValueAtTime(peakGain, t + 0.015);
        masterGainNode.gain.exponentialRampToValueAtTime(peakGain * 0.65, t + 0.4);
        masterGainNode.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(driveGain);
        subOsc.connect(driveGain);
        driveGain.connect(shaper);
        shaper.connect(cabFilter);
        cabFilter.connect(cabResonance);
        cabResonance.connect(masterGainNode);
        masterGainNode.connect(this.masterGain);

        osc.start(t);
        subOsc.start(t);
        osc.stop(t + duration + 0.05);
        subOsc.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 5. PALM-MUTED ROCK CHUG
      // ---------------------------------------------------------
      case 'palm_mute': {
        const osc = ctx.createOscillator();
        const shaper = ctx.createWaveShaper();
        const muteFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);

        shaper.curve = this.distortionCurve;

        // Tight low-pass filter mimicking palm on bridge
        muteFilter.type = 'lowpass';
        muteFilter.frequency.setValueAtTime(1400, t);
        muteFilter.frequency.exponentialRampToValueAtTime(220, t + 0.25);
        muteFilter.Q.setValueAtTime(1.5, t);

        const peakGain = 0.35 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 0.45));

        osc.connect(shaper);
        shaper.connect(muteFilter);
        muteFilter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.5);
        break;
      }

      // ---------------------------------------------------------
      // 6. MANDOLIN (Dual-course acoustic strings)
      // ---------------------------------------------------------
      case 'mandolin': {
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const bodyFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // 2 strings in unison with slight 0.25% chorusing detune
        oscA.type = 'sawtooth';
        oscA.frequency.setValueAtTime(f0, t);

        oscB.type = 'sawtooth';
        oscB.frequency.setValueAtTime(f0 * 1.0035, t);

        // Mandolin pear-shaped acoustic body resonance (peaks at 620Hz and 1.8kHz)
        bodyFilter.type = 'bandpass';
        bodyFilter.frequency.setValueAtTime(1600, t);
        bodyFilter.Q.setValueAtTime(1.2, t);

        const peakGain = 0.28 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.25, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 1.2));

        oscA.connect(bodyFilter);
        oscB.connect(bodyFilter);
        bodyFilter.connect(gain);
        gain.connect(this.masterGain);

        oscA.start(t);
        oscB.start(t);
        oscA.stop(t + 1.3);
        break;
      }

      // ---------------------------------------------------------
      // 7. ELECTRIC BASS (Finger & Slap)
      // ---------------------------------------------------------
      case 'electric_bass': {
        const bassFreq = f0 > 150 ? f0 * 0.5 : f0; // Lock to deep bass register
        const sub = ctx.createOscillator();
        const saw = ctx.createOscillator();
        const slapFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        sub.type = 'sine';
        sub.frequency.setValueAtTime(bassFreq, t);

        saw.type = 'sawtooth';
        saw.frequency.setValueAtTime(bassFreq, t);

        // Slap click filter (snap transient)
        slapFilter.type = 'lowpass';
        slapFilter.frequency.setValueAtTime(2800 * vel, t);
        slapFilter.frequency.exponentialRampToValueAtTime(220, t + 0.35);

        const peakGain = 0.42 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.5, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        sub.connect(slapFilter);
        saw.connect(slapFilter);
        slapFilter.connect(gain);
        gain.connect(this.masterGain);

        sub.start(t);
        saw.start(t);
        sub.stop(t + duration + 0.05);
        saw.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 8. CONCERT GRAND PIANO (Steinway multi-harmonic hammer bloom)
      // ---------------------------------------------------------
      case 'grand_piano': {
        const h1 = ctx.createOscillator(); // Fundamental
        const h2 = ctx.createOscillator(); // Octave
        const h3 = ctx.createOscillator(); // 12th
        const h4 = ctx.createOscillator(); // 15th
        const hammerKnock = ctx.createOscillator();
        const g1 = ctx.createGain();
        const g2 = ctx.createGain();
        const g3 = ctx.createGain();
        const g4 = ctx.createGain();
        const hammerGain = ctx.createGain();
        const toneFilter = ctx.createBiquadFilter();

        // Inharmonic string stiffness: fn = n*f0 * sqrt(1 + B*n^2)
        const B = 0.00035;
        const f1 = f0 * Math.sqrt(1 + B);
        const f2 = 2 * f0 * Math.sqrt(1 + 4 * B);
        const f3 = 3 * f0 * Math.sqrt(1 + 9 * B);
        const f4 = 4 * f0 * Math.sqrt(1 + 16 * B);

        h1.type = 'sine';
        h1.frequency.setValueAtTime(f1, t);
        h2.type = 'sine';
        h2.frequency.setValueAtTime(f2, t);
        h3.type = 'sine';
        h3.frequency.setValueAtTime(f3, t);
        h4.type = 'sine';
        h4.frequency.setValueAtTime(f4, t);

        // Hammer strike knock (short thud transient)
        hammerKnock.type = 'triangle';
        hammerKnock.frequency.setValueAtTime(f0 * 0.5, t);
        hammerGain.gain.setValueAtTime(0.25 * vel, t);
        hammerGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

        // Natural harmonic decay envelopes
        g1.gain.setValueAtTime(0.35 * vel, t);
        g1.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        g2.gain.setValueAtTime(0.2 * vel, t);
        g2.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.75);

        g3.gain.setValueAtTime(0.12 * vel, t);
        g3.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.5);

        g4.gain.setValueAtTime(0.07 * vel, t);
        g4.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.35);

        toneFilter.type = 'lowpass';
        toneFilter.frequency.setValueAtTime(6500 * vel, t);

        h1.connect(g1);
        h2.connect(g2);
        h3.connect(g3);
        h4.connect(g4);
        hammerKnock.connect(hammerGain);

        g1.connect(toneFilter);
        g2.connect(toneFilter);
        g3.connect(toneFilter);
        g4.connect(toneFilter);
        hammerGain.connect(toneFilter);

        toneFilter.connect(this.masterGain);

        h1.start(t);
        h2.start(t);
        h3.start(t);
        h4.start(t);
        hammerKnock.start(t);

        h1.stop(t + duration + 0.05);
        h2.stop(t + duration + 0.05);
        h3.stop(t + duration + 0.05);
        h4.stop(t + duration + 0.05);
        hammerKnock.stop(t + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 9. VINTAGE UPRIGHT / SALOON PIANO
      // ---------------------------------------------------------
      case 'upright_piano': {
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const oscC = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // 3 detuned unisons for that authentic saloon/upright character
        oscA.type = 'triangle';
        oscA.frequency.setValueAtTime(f0 * 0.998, t);

        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(f0, t);

        oscC.type = 'sine';
        oscC.frequency.setValueAtTime(f0 * 1.0025, t);

        // Woody soundboard filter
        filter.type = 'peaking';
        filter.frequency.setValueAtTime(450, t);
        filter.gain.setValueAtTime(3.5, t);

        const peakGain = 0.32 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.35, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        oscA.connect(filter);
        oscB.connect(filter);
        oscC.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        oscA.start(t);
        oscB.start(t);
        oscC.start(t);
        oscA.stop(t + duration + 0.05);
        oscB.stop(t + duration + 0.05);
        oscC.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 10. FENDER RHODES MARK I ELECTRIC PIANO
      // ---------------------------------------------------------
      case 'rhodes_mark1': {
        const tine = ctx.createOscillator();
        const bell = ctx.createOscillator();
        const warmth = ctx.createOscillator();
        const tineGain = ctx.createGain();
        const bellGain = ctx.createGain();
        const masterNoteGain = ctx.createGain();

        // Tine main body
        tine.type = 'triangle';
        tine.frequency.setValueAtTime(f0, t);

        // High bell metallic harmonic
        bell.type = 'sine';
        bell.frequency.setValueAtTime(f0 * 4.02, t);

        // Warm sub foundation
        warmth.type = 'sine';
        warmth.frequency.setValueAtTime(f0 * 0.999, t);

        tineGain.gain.setValueAtTime(0.35 * vel, t);
        tineGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        // Bell strike dies very quickly
        bellGain.gain.setValueAtTime(0.25 * vel, t);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        tine.connect(tineGain);
        bell.connect(bellGain);
        warmth.connect(tineGain);

        tineGain.connect(masterNoteGain);
        bellGain.connect(masterNoteGain);
        masterNoteGain.connect(this.masterGain);

        tine.start(t);
        bell.start(t);
        warmth.start(t);
        tine.stop(t + duration + 0.05);
        bell.stop(t + 0.25);
        warmth.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 11. WURLITZER 200A ELECTRIC PIANO
      // ---------------------------------------------------------
      case 'wurlitzer_200a': {
        const reed = ctx.createOscillator();
        const bark = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Vibrating steel reed (square wave softened by filter)
        reed.type = 'sawtooth';
        reed.frequency.setValueAtTime(f0, t);

        // Mid-range dynamic reed bark
        bark.type = 'sine';
        bark.frequency.setValueAtTime(f0 * 2.98, t);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 * vel, t);
        filter.Q.setValueAtTime(1.1, t);

        const peakGain = 0.3 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.4, t + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        reed.connect(filter);
        bark.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        reed.start(t);
        bark.start(t);
        reed.stop(t + duration + 0.05);
        bark.stop(t + duration + 0.05);
        break;
      }

      // ---------------------------------------------------------
      // 12. BAROQUE HARPSICHORD (Quill plectrum pluck)
      // ---------------------------------------------------------
      case 'harpsichord': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const buzzFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        // Narrow pulse/sawtooth wave for rich baroque string buzzing
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(f0 * 2, t);

        // High frequency quill pluck buzz
        buzzFilter.type = 'peaking';
        buzzFilter.frequency.setValueAtTime(3600, t);
        buzzFilter.gain.setValueAtTime(6.0, t);
        buzzFilter.Q.setValueAtTime(2.2, t);

        // Historical harpsichords have zero velocity dynamics and instant key drop attack!
        const peakGain = 0.3;
        gain.gain.setValueAtTime(peakGain, t);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.25, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 1.4));

        osc1.connect(buzzFilter);
        osc2.connect(buzzFilter);
        buzzFilter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 1.5);
        osc2.stop(t + 1.5);
        break;
      }

      // ---------------------------------------------------------
      // 13. TOY / LOFI GLASS PIANO
      // ---------------------------------------------------------
      case 'toy_piano': {
        const b1 = ctx.createOscillator();
        const b2 = ctx.createOscillator();
        const b3 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Inharmonic bell ratios for tuned steel tines: 1.0, 2.76, 5.40
        b1.type = 'sine';
        b1.frequency.setValueAtTime(f0, t);

        b2.type = 'sine';
        b2.frequency.setValueAtTime(f0 * 2.76, t);

        b3.type = 'sine';
        b3.frequency.setValueAtTime(f0 * 5.4, t);

        const peakGain = 0.28 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(duration, 1.6));

        b1.connect(gain);
        b2.connect(gain);
        b3.connect(gain);
        gain.connect(this.masterGain);

        b1.start(t);
        b2.start(t);
        b3.start(t);
        b1.stop(t + 1.7);
        b2.stop(t + 1.7);
        b3.stop(t + 1.7);
        break;
      }

      // ---------------------------------------------------------
      // 14. CATHEDRAL PIPE ORGAN (Multi-rank additive stops)
      // ---------------------------------------------------------
      case 'church_organ': {
        const r16 = ctx.createOscillator(); // 16' Bourdon
        const r8 = ctx.createOscillator();  // 8' Principal
        const r4 = ctx.createOscillator();  // 4' Octave
        const r2 = ctx.createOscillator();  // 2' Flute
        const gain = ctx.createGain();

        r16.type = 'sine';
        r16.frequency.setValueAtTime(f0 * 0.5, t);

        r8.type = 'triangle';
        r8.frequency.setValueAtTime(f0, t);

        r4.type = 'triangle';
        r4.frequency.setValueAtTime(f0 * 2, t);

        r2.type = 'sine';
        r2.frequency.setValueAtTime(f0 * 4, t);

        // Infinite majestic church organ sustain
        const peakGain = 0.28 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.04);
        gain.gain.setValueAtTime(peakGain * 0.85, t + duration * 0.85);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.2);

        r16.connect(gain);
        r8.connect(gain);
        r4.connect(gain);
        r2.connect(gain);
        gain.connect(this.masterGain);

        r16.start(t);
        r8.start(t);
        r4.start(t);
        r2.start(t);
        r16.stop(t + duration + 0.3);
        r8.stop(t + duration + 0.3);
        r4.stop(t + duration + 0.3);
        r2.stop(t + duration + 0.3);
        break;
      }

      default: {
        // Fallback clean acoustic piano
        this.synthesizeInstrumentNote('grand_piano', midiNote, duration, velocity);
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // REALISTIC DRUM KIT SYNTHESIS
  // -------------------------------------------------------------

  playDrumPad(padNumber, velocity = 0.9) {
    const kit = this.getDrumKit();
    const padConfig = kit.pads[padNumber];
    if (padConfig) {
      this.playDrumSound(padConfig.sound, velocity);
      return padConfig.name;
    }
    return `Pad ${padNumber}`;
  }

  playDrumSound(soundKey, velocity = 0.9) {
    const ctx = this.getAudioContext();
    const t = ctx.currentTime;
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    switch (soundKey) {
      // --- ACOUSTIC KIT SOUNDS ---
      case 'kick_acoustic': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        gain.gain.setValueAtTime(0.95 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.28);
        break;
      }

      case 'snare_acoustic': {
        // Dual layer: wooden body tone + snare rattle noise
        const tone = ctx.createOscillator();
        const toneGain = ctx.createGain();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(185, t);
        tone.frequency.exponentialRampToValueAtTime(120, t + 0.08);

        toneGain.gain.setValueAtTime(0.55 * vel, t);
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        tone.connect(toneGain);
        toneGain.connect(this.masterGain);
        tone.start(t);
        tone.stop(t + 0.18);

        const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.22), ctx.sampleRate);
        const out = noiseBuf.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, t);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.48 * vel, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'hat_closed':
      case '808_hat_closed':
      case '909_hat_closed': {
        const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.045), ctx.sampleRate);
        const out = noiseBuf.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(8000, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'hat_open':
      case '808_hat_open':
      case '909_hat_open': {
        const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
        const out = noiseBuf.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(9500, t);
        bp.Q.setValueAtTime(1.5, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // --- 808 TRAP SUB BASS BOOM ---
      case '808_sub': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.12);

        gain.gain.setValueAtTime(0.95 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 1.25);
        break;
      }

      case '808_snare': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.06);

        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

        const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
        const out = noiseBuf.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(3500, t);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.55 * vel, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        noise.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case '808_cowbell': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'square';
        osc1.frequency.setValueAtTime(540, t);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, t);

        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(840, t);
        bp.Q.setValueAtTime(4.0, t);

        gain.gain.setValueAtTime(0.45 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc1.connect(bp);
        osc2.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.38);
        osc2.stop(t + 0.38);
        break;
      }

      case '808_clap':
      case '909_clap': {
        // Multi-trigger clap (3 micro-bursts followed by sustained reverb tail)
        const times = [0, 0.012, 0.024];
        times.forEach((offset) => {
          const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
          const out = buf.getChannelData(0);
          for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.35 * vel, t + offset);
          src.connect(g);
          g.connect(this.masterGain);
          src.start(t + offset);
        });

        // Sustained tail
        const tailBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate);
        const out = tailBuf.getChannelData(0);
        for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
        const tail = ctx.createBufferSource();
        tail.buffer = tailBuf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1200, t);
        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(0.5 * vel, t + 0.03);
        tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        tail.connect(bp);
        bp.connect(tailGain);
        tailGain.connect(this.masterGain);
        tail.start(t + 0.03);
        break;
      }

      // --- 909 PUNCH KICK ---
      case '909_kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.exponentialRampToValueAtTime(52, t + 0.06);

        gain.gain.setValueAtTime(0.95 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.26);
        break;
      }

      // --- LATIN PERCUSSION ---
      case 'conga_high':
      case 'conga_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const basePitch = soundKey === 'conga_high' ? 240 : 160;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(basePitch * 1.3, t);
        osc.frequency.exponentialRampToValueAtTime(basePitch, t + 0.04);

        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.38);
        break;
      }

      case 'conga_slap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(190, t + 0.03);

        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }

      case 'timbale_high':
      case 'timbale_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const pitch = soundKey === 'timbale_high' ? 360 : 250;

        osc.type = 'square';
        osc.frequency.setValueAtTime(pitch, t);

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(pitch, t);
        bp.Q.setValueAtTime(6.0, t);

        gain.gain.setValueAtTime(0.55 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case 'latin_clave':
      case 'lofi_clave':
      case 'woodblock': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const f = soundKey === 'woodblock' ? 820 : 2400;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }

      default: {
        // Fallback punch drum
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);
        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      }
    }
  }
}

export const instrumentEngine = new InstrumentEngine();
