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
      5: { name: 'Snare Rimshot', sound: 'snare_rim' },
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
    this.activeInstrumentId = 'grand_piano';
    this.activeDrumKitId = 'studio_acoustic';
    this.distortionCurve = this.makeDistortionCurve(50);
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
    this.masterGain.gain.setValueAtTime(0.75, ctx.currentTime);

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, ctx.currentTime);
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

  makeDistortionCurve(amount = 50) {
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

  playNote(midiNote, duration = null, velocity = 0.85) {
    const inst = this.getInstrument();
    const dur = duration || inst.defaultDuration;
    this.synthesizeInstrumentNote(inst.id, midiNote, dur, velocity);
  }

  playChord(midiNotes, duration = null, velocity = 0.85) {
    const inst = this.getInstrument();
    const dur = duration || inst.defaultDuration;
    const isGuitar = inst.category === 'guitar';
    const strumSpeed = isGuitar ? 0.024 : 0.012;

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
      // 1. CLASSICAL GUITAR (Nylon string + soundboard body)
      case 'classical_guitar': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const bodyFilter = ctx.createBiquadFilter();
        const dampFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f0 * 2.001, t);

        bodyFilter.type = 'peaking';
        bodyFilter.frequency.setValueAtTime(110, t);
        bodyFilter.Q.setValueAtTime(2.0, t);
        bodyFilter.gain.setValueAtTime(5.0, t);

        dampFilter.type = 'lowpass';
        dampFilter.frequency.setValueAtTime(2800 * vel, t);
        dampFilter.frequency.exponentialRampToValueAtTime(320, t + Math.min(duration, 0.7));

        const peakGain = 0.38 * vel;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(peakGain * 0.4, t + 0.15);
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

      // 2. STEEL-STRING ACOUSTIC GUITAR
      case 'steel_acoustic': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const pickNoise = ctx.createBufferSource();
        const pickGain = ctx.createGain();
        const pickFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const toneFilter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(f0 * 1.002, t);

        const noiseLen = Math.floor(ctx.sampleRate * 0.025);
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.25));
        }
        pickNoise.buffer = noiseBuf;

        pickFilter.type = 'bandpass';
        pickFilter.frequency.setValueAtTime(5000, t);
        pickFilter.Q.setValueAtTime(1.5, t);

        pickGain.gain.setValueAtTime(0.45 * vel, t);
        pickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        pickNoise.connect(pickFilter);
        pickFilter.connect(pickGain);
        pickGain.connect(gain);

        toneFilter.type = 'lowpass';
        toneFilter.frequency.setValueAtTime(6200 * vel, t);
        toneFilter.frequency.exponentialRampToValueAtTime(600, t + duration * 0.7);

        const peakGain = 0.32 * vel;
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

      // 3. CLEAN ELECTRIC GUITAR (Fender Stratocaster)
      case 'electric_clean': {
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        const pickupFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f0, t);

        sub.type = 'sine';
        sub.frequency.setValueAtTime(f0 * 2, t);

        pickupFilter.type = 'peaking';
        pickupFilter.frequency.setValueAtTime(3200, t);
        pickupFilter.gain.setValueAtTime(4.5, t);
        pickupFilter.Q.setValueAtTime(1.8, t);

        const peakGain = 0.34 * vel;
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

      // 4. ROCK OVERDRIVE GUITAR (Crunch distortion + 4x12 cab)
      case 'rock_overdrive': {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const driveGain = ctx.createGain();
        const shaper = ctx.createWaveShaper();
        const cabFilter = ctx.createBiquadFilter();
        const cabResonance = ctx.createBiquadFilter();
        const masterGainNode = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);

        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(f0 * 0.5, t);

        driveGain.gain.setValueAtTime(4.2 * vel, t);
        shaper.curve = this.distortionCurve;
        shaper.oversample = '4x';

        cabFilter.type = 'lowpass';
        cabFilter.frequency.setValueAtTime(3600, t);
        cabFilter.Q.setValueAtTime(2.2, t);

        cabResonance.type = 'peaking';
        cabResonance.frequency.setValueAtTime(120, t);
        cabResonance.gain.setValueAtTime(6.0, t);

        const peakGain = 0.3 * vel;
        masterGainNode.gain.setValueAtTime(0.0001, t);
        masterGainNode.gain.linearRampToValueAtTime(peakGain, t + 0.015);
        masterGainNode.gain.exponentialRampToValueAtTime(peakGain * 0.7, t + 0.4);
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

      // 5. PALM-MUTED ROCK CHUG
      case 'palm_mute': {
        const osc = ctx.createOscillator();
        const shaper = ctx.createWaveShaper();
        const muteFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f0, t);

        shaper.curve = this.distortionCurve;

        muteFilter.type = 'lowpass';
        muteFilter.frequency.setValueAtTime(1400, t);
        muteFilter.frequency.exponentialRampToValueAtTime(200, t + 0.22);
        muteFilter.Q.setValueAtTime(1.8, t);

        const peakGain = 0.38 * vel;
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

      // 6. MANDOLIN (Dual-course acoustic strings)
      case 'mandolin': {
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const bodyFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        oscA.type = 'sawtooth';
        oscA.frequency.setValueAtTime(f0, t);

        oscB.type = 'sawtooth';
        oscB.frequency.setValueAtTime(f0 * 1.0035, t);

        bodyFilter.type = 'bandpass';
        bodyFilter.frequency.setValueAtTime(1700, t);
        bodyFilter.Q.setValueAtTime(1.4, t);

        const peakGain = 0.3 * vel;
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
        oscB.stop(t + 1.3);
        break;
      }

      // 7. ELECTRIC BASS (Finger & Slap)
      case 'electric_bass': {
        const bassFreq = f0 > 150 ? f0 * 0.5 : f0;
        const sub = ctx.createOscillator();
        const saw = ctx.createOscillator();
        const slapFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        sub.type = 'sine';
        sub.frequency.setValueAtTime(bassFreq, t);

        saw.type = 'sawtooth';
        saw.frequency.setValueAtTime(bassFreq, t);

        slapFilter.type = 'lowpass';
        slapFilter.frequency.setValueAtTime(2800 * vel, t);
        slapFilter.frequency.exponentialRampToValueAtTime(220, t + 0.35);

        const peakGain = 0.44 * vel;
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

      // 8. CONCERT GRAND PIANO (Steinway multi-harmonic hammer bloom)
      case 'grand_piano': {
        const h1 = ctx.createOscillator();
        const h2 = ctx.createOscillator();
        const h3 = ctx.createOscillator();
        const h4 = ctx.createOscillator();
        const hammerKnock = ctx.createOscillator();
        const g1 = ctx.createGain();
        const g2 = ctx.createGain();
        const g3 = ctx.createGain();
        const g4 = ctx.createGain();
        const hammerGain = ctx.createGain();
        const toneFilter = ctx.createBiquadFilter();

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

        hammerKnock.type = 'triangle';
        hammerKnock.frequency.setValueAtTime(f0 * 0.5, t);
        hammerGain.gain.setValueAtTime(0.25 * vel, t);
        hammerGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

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

      // 9. VINTAGE UPRIGHT / SALOON PIANO
      case 'upright_piano': {
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        const oscC = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        oscA.type = 'triangle';
        oscA.frequency.setValueAtTime(f0 * 0.998, t);

        oscB.type = 'triangle';
        oscB.frequency.setValueAtTime(f0, t);

        oscC.type = 'sine';
        oscC.frequency.setValueAtTime(f0 * 1.0025, t);

        filter.type = 'peaking';
        filter.frequency.setValueAtTime(450, t);
        filter.gain.setValueAtTime(4.0, t);

        const peakGain = 0.34 * vel;
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

      // 10. FENDER RHODES MARK I
      case 'rhodes_mark1': {
        const tine = ctx.createOscillator();
        const bell = ctx.createOscillator();
        const warmth = ctx.createOscillator();
        const tineGain = ctx.createGain();
        const bellGain = ctx.createGain();
        const masterNoteGain = ctx.createGain();

        tine.type = 'triangle';
        tine.frequency.setValueAtTime(f0, t);

        bell.type = 'sine';
        bell.frequency.setValueAtTime(f0 * 4.02, t);

        warmth.type = 'sine';
        warmth.frequency.setValueAtTime(f0 * 0.999, t);

        tineGain.gain.setValueAtTime(0.38 * vel, t);
        tineGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        bellGain.gain.setValueAtTime(0.28 * vel, t);
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

      // 11. WURLITZER 200A
      case 'wurlitzer_200a': {
        const reed = ctx.createOscillator();
        const bark = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        reed.type = 'sawtooth';
        reed.frequency.setValueAtTime(f0, t);

        bark.type = 'sine';
        bark.frequency.setValueAtTime(f0 * 2.98, t);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400 * vel, t);
        filter.Q.setValueAtTime(1.2, t);

        const peakGain = 0.32 * vel;
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

      // 12. BAROQUE HARPSICHORD
      case 'harpsichord': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const buzzFilter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(f0, t);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(f0 * 2, t);

        buzzFilter.type = 'peaking';
        buzzFilter.frequency.setValueAtTime(3600, t);
        buzzFilter.gain.setValueAtTime(6.0, t);
        buzzFilter.Q.setValueAtTime(2.2, t);

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

      // 13. TOY / LOFI GLASS PIANO
      case 'toy_piano': {
        const b1 = ctx.createOscillator();
        const b2 = ctx.createOscillator();
        const b3 = ctx.createOscillator();
        const gain = ctx.createGain();

        b1.type = 'sine';
        b1.frequency.setValueAtTime(f0, t);

        b2.type = 'sine';
        b2.frequency.setValueAtTime(f0 * 2.76, t);

        b3.type = 'sine';
        b3.frequency.setValueAtTime(f0 * 5.4, t);

        const peakGain = 0.3 * vel;
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

      // 14. CATHEDRAL PIPE ORGAN
      case 'church_organ': {
        const r16 = ctx.createOscillator();
        const r8 = ctx.createOscillator();
        const r4 = ctx.createOscillator();
        const r2 = ctx.createOscillator();
        const gain = ctx.createGain();

        r16.type = 'sine';
        r16.frequency.setValueAtTime(f0 * 0.5, t);

        r8.type = 'triangle';
        r8.frequency.setValueAtTime(f0, t);

        r4.type = 'triangle';
        r4.frequency.setValueAtTime(f0 * 2, t);

        r2.type = 'sine';
        r2.frequency.setValueAtTime(f0 * 4, t);

        const peakGain = 0.3 * vel;
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
        this.synthesizeInstrumentNote('grand_piano', midiNote, duration, velocity);
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // REALISTIC DRUM KIT SYNTHESIS (Every Single Pad Authentically Modeled)
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

    // Helper: Generate White Noise Buffer
    const makeNoise = (durationSec) => {
      const len = Math.floor(ctx.sampleRate * durationSec);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      return src;
    };

    switch (soundKey) {
      // =========================================================
      // ACOUSTIC DRUM KIT
      // =========================================================

      // 1. Kick: Heavy pitch sweep + beater click
      case 'kick_acoustic': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

        gain.gain.setValueAtTime(0.95 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        // Click transient
        const click = makeNoise(0.015);
        const cFilter = ctx.createBiquadFilter();
        cFilter.type = 'bandpass';
        cFilter.frequency.setValueAtTime(1400, t);
        const cGain = ctx.createGain();
        cGain.gain.setValueAtTime(0.4 * vel, t);
        cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

        click.connect(cFilter);
        cFilter.connect(cGain);
        cGain.connect(this.masterGain);
        click.start(t);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      // 2. Sidestick: Clean wooden stick-on-metal rim crack
      case 'sidestick':
      case 'lofi_rim': {
        const tone = ctx.createOscillator();
        const toneGain = ctx.createGain();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(1800, t);
        tone.frequency.exponentialRampToValueAtTime(450, t + 0.018);

        toneGain.gain.setValueAtTime(0.85 * vel, t);
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        tone.connect(toneGain);
        toneGain.connect(this.masterGain);
        tone.start(t);
        tone.stop(t + 0.03);
        break;
      }

      // 3. Maple Snare: Dual layer (shell tone + snare wire rattle)
      case 'snare_acoustic': {
        const tone = ctx.createOscillator();
        const toneGain = ctx.createGain();
        tone.type = 'triangle';
        tone.frequency.setValueAtTime(190, t);
        tone.frequency.exponentialRampToValueAtTime(125, t + 0.08);

        toneGain.gain.setValueAtTime(0.6 * vel, t);
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        tone.connect(toneGain);
        toneGain.connect(this.masterGain);
        tone.start(t);
        tone.stop(t + 0.18);

        const noise = makeNoise(0.22);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1400, t);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55 * vel, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // 4. Snare Rimshot: Piercing rimshot crack with high ring (distinct from normal snare)
      case 'snare_rim':
      case '808_rim':
      case '909_rim': {
        const rimTone = ctx.createOscillator();
        const rimGain = ctx.createGain();
        rimTone.type = 'triangle';
        rimTone.frequency.setValueAtTime(450, t);
        rimTone.frequency.exponentialRampToValueAtTime(260, t + 0.04);

        rimGain.gain.setValueAtTime(0.75 * vel, t);
        rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        rimTone.connect(rimGain);
        rimGain.connect(this.masterGain);
        rimTone.start(t);
        rimTone.stop(t + 0.1);

        const crackNoise = makeNoise(0.06);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(3200, t);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.65 * vel, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        crackNoise.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.masterGain);
        crackNoise.start(t);
        break;
      }

      // 5. Acoustic Room Clap: Multi-burst claps with natural room delay
      case 'clap_acoustic':
      case '808_clap':
      case '909_clap': {
        const times = [0, 0.012, 0.024];
        times.forEach((offset) => {
          const src = makeNoise(0.018);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.38 * vel, t + offset);
          src.connect(g);
          g.connect(this.masterGain);
          src.start(t + offset);
        });

        const tail = makeNoise(0.24);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1150, t);
        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(0.55 * vel, t + 0.03);
        tailGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        tail.connect(bp);
        bp.connect(tailGain);
        tailGain.connect(this.masterGain);
        tail.start(t + 0.03);
        break;
      }

      // 6. Floor Tom (16" Deep Floor Tom, boomy 65Hz)
      case 'tom_floor':
      case '808_tom_low':
      case '909_tom_low':
      case 'lofi_tom_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.16);

        gain.gain.setValueAtTime(0.85 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }

      // 7. Mid Tom (12" Rack Tom, warm 95Hz)
      case 'tom_mid':
      case '808_tom_mid':
      case '909_tom_mid': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(155, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.14);

        gain.gain.setValueAtTime(0.8 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      // 8. High Tom (10" Rack Tom, snappy 140Hz)
      case 'tom_high':
      case '808_tom_hi':
      case '909_tom_hi':
      case 'lofi_tom_hi': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(215, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.26);
        break;
      }

      // 9. Closed Hi-Hat: Tight metallic brass choke (9.5kHz)
      case 'hat_closed':
      case '808_hat_closed':
      case '909_hat_closed':
      case 'lofi_hat_closed': {
        const noise = makeNoise(0.045);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(8500, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.42 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // 10. Pedal Hat: Dark foot "chick" (bandpass at 5.5kHz, soft attack)
      case 'hat_pedal':
      case '909_hat_pedal': {
        const noise = makeNoise(0.06);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(5500, t);
        bp.Q.setValueAtTime(2.0, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // 11. Open Hi-Hat: Long sizzling brass wash (450ms)
      case 'hat_open':
      case '808_hat_open':
      case '909_hat_open':
      case 'lofi_hat_open': {
        const noise = makeNoise(0.45);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(9000, t);
        bp.Q.setValueAtTime(1.8, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.45 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // 12. Ride Bell: High metallic ping on heavy cymbal bell (1850Hz & 3200Hz)
      case 'ride_bell':
      case '909_ride': {
        const b1 = ctx.createOscillator();
        const b2 = ctx.createOscillator();
        const bGain = ctx.createGain();

        b1.type = 'sine';
        b1.frequency.setValueAtTime(1850, t);
        b2.type = 'sine';
        b2.frequency.setValueAtTime(3200, t);

        bGain.gain.setValueAtTime(0.6 * vel, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

        b1.connect(bGain);
        b2.connect(bGain);
        bGain.connect(this.masterGain);

        b1.start(t);
        b2.start(t);
        b1.stop(t + 0.7);
        b2.stop(t + 0.7);
        break;
      }

      // 13. Crash Cymbal: 16" explosive shimmering brass wash (1.4s)
      case 'crash_acoustic':
      case '808_crash':
      case '909_crash': {
        const noise = makeNoise(1.4);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(4500, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // 14. Ride Cymbal: Stick ping + sustained brass shimmer
      case 'ride_acoustic': {
        const ping = ctx.createOscillator();
        const pGain = ctx.createGain();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(2600, t);
        pGain.gain.setValueAtTime(0.4 * vel, t);
        pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        ping.connect(pGain);
        pGain.connect(this.masterGain);
        ping.start(t);
        ping.stop(t + 0.15);

        const shimmer = makeNoise(1.1);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(6500, t);
        bp.Q.setValueAtTime(1.5, t);
        const sGain = ctx.createGain();
        sGain.gain.setValueAtTime(0.35 * vel, t);
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        shimmer.connect(bp);
        bp.connect(sGain);
        sGain.connect(this.masterGain);
        shimmer.start(t);
        break;
      }

      // 15. Cowbell: Latin metal cowbell (560Hz & 845Hz)
      case 'cowbell_real':
      case '808_cowbell':
      case 'club_cowbell': {
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        o1.type = 'square';
        o1.frequency.setValueAtTime(560, t);
        o2.type = 'square';
        o2.frequency.setValueAtTime(845, t);

        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(800, t);
        bp.Q.setValueAtTime(4.5, t);

        gain.gain.setValueAtTime(0.55 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        o1.connect(bp);
        o2.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);

        o1.start(t);
        o2.start(t);
        o1.stop(t + 0.35);
        o2.stop(t + 0.35);
        break;
      }

      // 16. Tambourine: Multi-burst jingle cluster (7kHz-12kHz)
      case 'tambourine':
      case '808_shaker':
      case 'house_shaker':
      case 'lofi_shaker':
      case 'maracas': {
        const n1 = makeNoise(0.025);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.35 * vel, t);
        n1.connect(g1);
        g1.connect(this.masterGain);
        n1.start(t);

        const n2 = makeNoise(0.08);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(7500, t);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.5 * vel, t + 0.012);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        n2.connect(hp);
        hp.connect(g2);
        g2.connect(this.masterGain);
        n2.start(t + 0.012);
        break;
      }

      // =========================================================
      // 808 TRAP & DRILL SOUNDS
      // =========================================================

      case '808_sub': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, t);
        osc.frequency.exponentialRampToValueAtTime(36, t + 0.12);

        gain.gain.setValueAtTime(0.98 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 1.45);
        break;
      }

      case '808_snare':
      case '808_snare_hi': {
        const isHi = soundKey === '808_snare_hi';
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isHi ? 340 : 250, t);
        osc.frequency.exponentialRampToValueAtTime(isHi ? 180 : 135, t + 0.06);

        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

        const noise = makeNoise(0.18);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(isHi ? 4500 : 3200, t);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.6 * vel, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        noise.connect(hp);
        hp.connect(nGain);
        nGain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case '808_hat_roll': {
        const rollTimes = [0, 0.025, 0.05];
        rollTimes.forEach((offset) => {
          const noise = makeNoise(0.035);
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(9500, t + offset);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.4 * vel, t + offset);
          g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.035);
          noise.connect(hp);
          hp.connect(g);
          g.connect(this.masterGain);
          noise.start(t + offset);
        });
        break;
      }

      case '808_reverse': {
        const noise = makeNoise(0.6);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(7000, t);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.7 * vel, t + 0.55);
        gain.gain.setValueAtTime(0.0001, t + 0.6);
        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // =========================================================
      // 909 DANCE & CLUB SOUNDS
      // =========================================================

      case '909_kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(52, t + 0.06);

        gain.gain.setValueAtTime(0.98 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.28);
        break;
      }

      case '909_snare': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.07);
        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.18);

        const noise = makeNoise(0.24);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2400, t);
        bp.Q.setValueAtTime(1.2, t);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.65 * vel, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        noise.connect(bp);
        bp.connect(nGain);
        nGain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'synth_zap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.14);

        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.16);
        break;
      }

      case 'sub_drop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, t);
        osc.frequency.exponentialRampToValueAtTime(28, t + 0.7);

        gain.gain.setValueAtTime(0.9 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.8);
        break;
      }

      // =========================================================
      // LOFI VINYL SOUNDS
      // =========================================================

      case 'lofi_kick': {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.09);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, t);

        gain.gain.setValueAtTime(0.85 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case 'lofi_snap': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1750, t);
        osc.frequency.exponentialRampToValueAtTime(420, t + 0.02);

        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.04);
        break;
      }

      case 'lofi_snare': {
        const noise = makeNoise(0.14);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, t);
        filter.Q.setValueAtTime(1.8, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'lofi_brush': {
        const noise = makeNoise(0.28);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3200, t);
        filter.Q.setValueAtTime(1.0, t);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.4 * vel, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'lofi_kalimba': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5

        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      }

      case 'lofi_bell': {
        const b1 = ctx.createOscillator();
        const b2 = ctx.createOscillator();
        const gain = ctx.createGain();
        b1.type = 'sine';
        b1.frequency.setValueAtTime(880, t);
        b2.type = 'sine';
        b2.frequency.setValueAtTime(2430, t);

        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        b1.connect(gain);
        b2.connect(gain);
        gain.connect(this.masterGain);
        b1.start(t);
        b2.start(t);
        b1.stop(t + 0.65);
        b2.stop(t + 0.65);
        break;
      }

      case 'water_drop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(1250, t + 0.06);

        gain.gain.setValueAtTime(0.85 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.14);
        break;
      }

      case 'tape_stop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.35);

        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.38);
        break;
      }

      case 'vinyl_burst': {
        const noise = makeNoise(0.08);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(2500, t);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.45 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        noise.connect(hp);
        hp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      // =========================================================
      // LATIN PERCUSSION SOUNDS
      // =========================================================

      case 'conga_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(155, t + 0.05);

        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.42);
        break;
      }

      case 'conga_high': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(310, t);
        osc.frequency.exponentialRampToValueAtTime(245, t + 0.04);

        gain.gain.setValueAtTime(0.75 * vel, t);
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
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(210, t + 0.025);

        gain.gain.setValueAtTime(0.85 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'conga_mute': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }

      case 'bongo_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(195, t + 0.035);

        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case 'bongo_high': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(340, t + 0.03);

        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }

      case 'timbale_low': {
        const osc = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, t);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(250, t);
        bp.Q.setValueAtTime(6.0, t);

        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case 'timbale_high': {
        const osc = ctx.createOscillator();
        const bp = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(360, t);
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(360, t);
        bp.Q.setValueAtTime(6.0, t);

        gain.gain.setValueAtTime(0.65 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }

      case 'timbale_rim': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2800, t);

        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }

      case 'guiro_short': {
        const noise = makeNoise(0.06);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2400, t);
        bp.Q.setValueAtTime(3.0, t);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'guiro_long': {
        const noise = makeNoise(0.22);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(2600, t);
        bp.Q.setValueAtTime(2.5, t);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.55 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        noise.connect(bp);
        bp.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        break;
      }

      case 'agogo_low': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(720, t);
        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.38);
        break;
      }

      case 'agogo_high': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1150, t);
        gain.gain.setValueAtTime(0.7 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      }

      case 'latin_clave':
      case '808_clave':
      case 'lofi_clave': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, t);
        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
        break;
      }

      case 'woodblock': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, t);
        gain.gain.setValueAtTime(0.75 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }

      default: {
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
