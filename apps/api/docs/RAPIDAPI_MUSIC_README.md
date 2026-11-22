# Music Theory, Chord Progression & MIDI Generator API

[![Sub-Millisecond](https://img.shields.io/badge/Compute-Sub--Millisecond-brightgreen)](#)
[![Format](https://img.shields.io/badge/MIDI-SMF%20Type%200-blue)](#)
[![Audio Ready](https://img.shields.io/badge/Acoustics-Delay%20%26%20Reverb-orange)](#)

A high-performance algorithmic music computation engine. Instantly generate emotionally tailored chord progressions with Roman numeral analysis and MIDI voicings, resolve scales across all Greek modes with guitar/bass fretboard maps, calculate BPM-synchronized delay timings and reverb pre-delays, and synthesize binary Standard MIDI Files (`.mid`) on the fly.

Built for **music production web apps, VST/DAW developers, AI composition pipelines, and beatmaker tools**.

---

## 🎹 Why Developers Use This API

1. **AI & Generative Music Pipelines**: Programmatically supply harmonically correct chords, voice leading, and scale constraints to AI melody generators.
2. **DAW & VST Integration**: Generate downloadable `.mid` binary tracks or Base64 arrays that drag-and-drop into FL Studio, Ableton Live, Logic Pro, and Reaper.
3. **Audio Effect Plugins**: Calculate exact sample-accurate delay millisecond timings (straight, dotted, triplet) and acoustic reverb pre-delays from project BPM.
4. **Interactive Fretboards & Scales**: Power web tuners, guitar tab tools, and music theory visualizers with exact string/fret coordinates and frequencies in Hz.

---

## ⚡ Core Endpoints

### 1. `POST /v1/music/progression`
Generates structured chord progressions across genres with Roman numeral analysis, voicing details, and exact MIDI note arrays.

**Genre & Mood Presets Supported:**
- `lofi_chill` (Neo-soul 7ths & 9ths, melancholic jazz cadences)
- `dark_trap` (Ominous phonk/trap progressions with minor second tensions)
- `synthwave` (80s retrowave, nostalgic power chords)
- `math_rock` (Midwest emo, suspended add9 tunings)
- `ambient_dream` (Ethereal major7 and sus2 ambient floaters)
- `neo_soul`, `jazz_standard`, `pop_hit`

#### Request Example:
```json
{
  "preset": "lofi_chill",
  "key": "F",
  "baseOctave": 3
}
```

#### Response Example:
```json
{
  "success": true,
  "engine": "music",
  "latencyMs": 0.42,
  "data": {
    "preset": "lofi_chill",
    "genre": "Lofi & Chillhop",
    "key": "F",
    "scale": "minor",
    "recommendedBpm": 88,
    "chordCount": 6,
    "chords": [
      {
        "name": "Bbm9",
        "numeral": "iv9",
        "root": "Bb",
        "midiNotes": [34, 46, 49, 53, 56, 60],
        "frequenciesHz": [58.27, 116.54, 138.59, 174.61, 207.65, 261.63],
        "noteNames": ["Bb", "Bb", "Db", "F", "Ab", "C"],
        "voicing": {
          "bassNote": "Bb",
          "leadNote": "C",
          "spreadSemitones": 26
        }
      }
    ]
  }
}
```

---

### 2. `GET /v1/music/scale`
Resolves scale notes, degree names, octave 3 & 4 frequencies (in Hz), and guitar/bass fretboard maps.

**Supported Scales & Modes:**
`minor` (Aeolian), `major` (Ionian), `dorian`, `phrygian`, `lydian`, `mixolydian`, `harmonic_minor`, `phrygian_dominant`, `minor_pentatonic`, `major_pentatonic`, `blues`.

**Supported Tunings:** `guitar_standard`, `guitar_drop_d`, `bass_standard`, `ukulele`.

#### Query Parameters:
- `root=C`
- `scale=dorian`
- `tuning=guitar_standard`
- `maxFret=15`

---

### 3. `GET /v1/music/delay-calc`
Calculates millisecond delay timings and reverb pre-delays synchronized to musical tempo.

#### Query Parameters:
- `bpm=128`
- `sampleRate=44100`

**Output Divisions:** Whole (1/1), Half (1/2), Quarter (1/4), 8th, 16th, 32nd, 64th in **Straight, Dotted, and Triplet** timing, plus LFO cycle frequencies in Hz.

---

### 4. `POST /v1/music/midi`
Synthesizes valid binary Standard MIDI Files (SMF Type 0).

- Pass `format: "json"` to receive a Base64-encoded string ready for browser audio playback (Tone.js / Web MIDI).
- Pass `format: "binary"` or `?download=true` to download a real `.mid` file directly.

#### Request Example:
```json
{
  "bpm": 120,
  "title": "Chords Sequence",
  "format": "json",
  "notes": [
    { "pitch": 60, "durationTicks": 480, "velocity": 90 },
    { "pitch": 64, "durationTicks": 480, "velocity": 85 },
    { "pitch": 67, "durationTicks": 480, "velocity": 85 }
  ]
}
```

---

### 5. `POST /v1/media/waveform`
Extracts normalized RMS peak bars (0.0 to 1.0) from raw audio samples for wave visualizations.

---

## 💻 Quickstart Implementations

### Python (with RapidAPI)
```python
import requests

url = "https://music-theory-chord-progression-and-midi-api.p.rapidapi.com/v1/music/progression"

payload = {
    "preset": "lofi_chill",
    "key": "Db",
    "baseOctave": 3
}

headers = {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "music-theory-chord-progression-and-midi-api.p.rapidapi.com",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

### Node.js (Fetch)
```javascript
const response = await fetch("https://music-theory-chord-progression-and-midi-api.p.rapidapi.com/v1/music/scale?root=G&scale=phrygian", {
  headers: {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "music-theory-chord-progression-and-midi-api.p.rapidapi.com"
  }
});

const data = await response.json();
console.log(data);
```

---

## ⚡ Latency & SLA
- Average response time: **< 1.0 ms**
- Stateless architecture: Zero logging of musical inputs.
- 99.9% uptime backing.
