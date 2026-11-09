/**
 * Dangling Beats Studio™ — Web MIDI & Hardware Controller Engine
 * Provides native Web MIDI API access (USB/Bluetooth MIDI keyboards & pad controllers)
 * plus 16-Pad Virtual MPC / Launchpad Controller logic.
 */

class MidiEngine {
  constructor() {
    this.midiAccess = null;
    this.inputs = [];
    this.connectedDevice = null;
    this.activeNoteListeners = new Set();
    this.activeControlListeners = new Set();
    this.isSupported = typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
    this.lastMidiEvent = null;
  }

  /**
   * Initializes Web MIDI access with prompt
   */
  async init() {
    if (!this.isSupported) {
      console.warn('[Web MIDI] Web MIDI API not supported in this browser.');
      return { supported: false, error: 'Web MIDI API not supported. Please use Chrome, Edge, or Opera.' };
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.scanInputs();

      // Listen for connection changes (plug/unplug)
      this.midiAccess.onstatechange = (e) => {
        console.log(`[Web MIDI Device State Change] ${e.port.name}: ${e.port.state}`);
        this.scanInputs();
      };

      return {
        supported: true,
        connected: this.inputs.length > 0,
        deviceName: this.connectedDevice ? this.connectedDevice.name : null,
      };
    } catch (err) {
      console.warn('[Web MIDI] Access denied or error:', err.message);
      return { supported: true, connected: false, error: err.message };
    }
  }

  scanInputs() {
    if (!this.midiAccess) return;
    this.inputs = [];
    const inputsIter = this.midiAccess.inputs.values();

    for (let input of inputsIter) {
      this.inputs.push(input);
      input.onmidimessage = (msg) => this.handleMidiMessage(msg, input);
    }

    if (this.inputs.length > 0) {
      this.connectedDevice = this.inputs[0];
    } else {
      this.connectedDevice = null;
    }

    this.notifyStatusListeners();
  }

  handleMidiMessage(message, sourceInput) {
    const [status, note, velocity] = message.data;
    const command = status >> 4;
    const channel = (status & 0xf) + 1;

    this.lastMidiEvent = {
      command,
      channel,
      note,
      velocity: velocity / 127,
      rawVelocity: velocity,
      deviceName: sourceInput.name,
      timestamp: message.timeStamp,
    };

    // Note On (command 9 with velocity > 0)
    if (command === 9 && velocity > 0) {
      this.activeNoteListeners.forEach((fn) => {
        try {
          fn({ type: 'noteon', note, velocity: velocity / 127, rawVelocity: velocity, channel });
        } catch (e) {
          console.error(e);
        }
      });
    }
    // Note Off (command 8 or command 9 with velocity === 0)
    else if (command === 8 || (command === 9 && velocity === 0)) {
      this.activeNoteListeners.forEach((fn) => {
        try {
          fn({ type: 'noteoff', note, channel });
        } catch (e) {
          console.error(e);
        }
      });
    }
    // Control Change (command 11) - e.g. Mod wheel, knobs
    else if (command === 11) {
      this.activeControlListeners.forEach((fn) => {
        try {
          fn({ type: 'controlchange', controller: note, value: velocity, channel });
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  onNote(callback) {
    this.activeNoteListeners.add(callback);
    return () => this.activeNoteListeners.delete(callback);
  }

  onControl(callback) {
    this.activeControlListeners.add(callback);
    return () => this.activeControlListeners.delete(callback);
  }

  onStatusChange(callback) {
    if (!this.statusListeners) this.statusListeners = new Set();
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatusListeners() {
    if (!this.statusListeners) return;
    const status = {
      supported: this.isSupported,
      connected: this.inputs.length > 0,
      deviceName: this.connectedDevice ? this.connectedDevice.name : null,
      deviceCount: this.inputs.length,
    };
    this.statusListeners.forEach((cb) => cb(status));
  }
}

export const midiEngine = new MidiEngine();

// 16-Pad MPC Layout Map (Bank A)
// Standard Akai/General MIDI Drum mapping:
// Pad 1 = 36 (C1 Kick), Pad 2 = 37 (Side Stick), Pad 3 = 38 (Snare 1), Pad 4 = 39 (Clap)
// Pad 5 = 40 (Snare 2), Pad 6 = 41 (Low Floor Tom), Pad 7 = 42 (Closed Hat), Pad 8 = 43 (High Floor Tom)
// Pad 9 = 44 (Pedal Hat), Pad 10 = 45 (Low Tom), Pad 11 = 46 (Open Hat), Pad 12 = 47 (Low-Mid Tom)
// Pad 13 = 48 (Hi-Mid Tom), Pad 14 = 49 (Crash 1), Pad 15 = 50 (High Tom), Pad 16 = 51 (Ride 1)
export const MPC_PADS_CONFIG = [
  { pad: 13, note: 48, name: 'Hi Tom', key: '1' },
  { pad: 14, note: 49, name: 'Crash', key: '2' },
  { pad: 15, note: 50, name: 'High Tom 2', key: '3' },
  { pad: 16, note: 51, name: 'Ride', key: '4' },

  { pad: 9, note: 44, name: 'Pedal Hat', key: 'Q' },
  { pad: 10, note: 45, name: 'Mid Tom', key: 'W' },
  { pad: 11, note: 46, name: 'Open Hat', key: 'E' },
  { pad: 12, note: 47, name: 'Mid Tom 2', key: 'R' },

  { pad: 5, note: 40, name: 'Snare 2', key: 'A' },
  { pad: 6, note: 41, name: 'Low Tom', key: 'S' },
  { pad: 7, note: 42, name: 'Closed Hat', key: 'D' },
  { pad: 8, note: 43, name: 'High Floor', key: 'F' },

  { pad: 1, note: 36, name: '808 / Kick', key: 'Z' },
  { pad: 2, note: 37, name: 'Side Stick', key: 'X' },
  { pad: 3, note: 38, name: 'Main Snare', key: 'C' },
  { pad: 4, note: 39, name: 'Clap', key: 'V' },
];
