import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createApiKeyRecord,
  findApiKeyRecord,
  revokeApiKeyRecord,
  generateKeyString,
} from '../models/ApiKey.js';
import {
  resolveScale,
  generateProgression,
  calculateDelayAcoustics,
  buildMidiBuffer,
} from '../engines/music.js';
import {
  rollProvablyFairDice,
} from '../engines/gaming.js';
import {
  recordScore,
  getTopScores,
} from '../models/Leaderboard.js';
import {
  isSafeOutboundUrl,
  generateSvgQrCode,
  extractAudioWaveform,
} from '../engines/tools.js';
import {
  createShortUrl,
  findAndTrackShortUrl,
} from '../models/ShortUrl.js';

describe('⚡ Dangling Dice Studios™ Public API Suite (V1)', () => {
  describe('🔑 API Key Provisioning & Lifecycle', () => {
    it('API-01: Generates prefixed cryptographically secure API key tokens', () => {
      const key = generateKeyString();
      assert.match(key, /^dds_live_[0-9a-f]{48}$/);
    });

    it('API-02: Creates, stores, and looks up API key records with assigned tier quotas', async () => {
      const created = await createApiKeyRecord({
        ownerEmail: 'developer@dangling-dice-studios.com',
        name: 'Test Runner',
        tier: 'pro',
      });

      assert.equal(created.ownerEmail, 'developer@dangling-dice-studios.com');
      assert.equal(created.tier, 'pro');
      assert.equal(created.monthlyQuota, 5000);
      assert.equal(created.isActive, true);

      const fetched = await findApiKeyRecord(created.key);
      assert.ok(fetched);
      assert.equal(fetched.key, created.key);
    });

    it('API-03: Successfully revokes active API keys', async () => {
      const keyDoc = await createApiKeyRecord({
        ownerEmail: 'revoke-test@example.com',
      });
      const revoked = await revokeApiKeyRecord(keyDoc.key);
      assert.equal(revoked, true);

      const searchResult = await findApiKeyRecord(keyDoc.key);
      assert.equal(searchResult, null);
    });
  });

  describe('🎵 Music Theory & Acoustic Engine', () => {
    it('API-04: Resolves modal scale notes, intervals, frequencies, and guitar fret positions', () => {
      const res = resolveScale({ root: 'D', scale: 'dorian', tuning: 'guitar_standard', maxFret: 12 });
      assert.equal(res.root, 'D');
      assert.equal(res.scaleName, 'Dorian Mode');
      assert.equal(res.notes.length, 7);

      const noteNames = res.notes.map((n) => n.name);
      assert.deepEqual(noteNames, ['D', 'E', 'F', 'G', 'A', 'B', 'C']);

      // Check fretboard contains guitar strings
      assert.equal(res.fretboard.length, 6);
      const lowE = res.fretboard.find((s) => s.stringName === 'E2');
      assert.ok(lowE);
      // Low E open string (E2) is in D Dorian
      assert.ok(lowE.frets.some((f) => f.fret === 0 && f.note === 'E'));
    });

    it('API-05: Generates structured chord progressions with Roman numerals and MIDI voicings', () => {
      const res = generateProgression({ preset: 'lofi_chill', key: 'C', baseOctave: 3 });
      assert.equal(res.genre, 'Lo-Fi Chillhop');
      assert.equal(res.key, 'C');
      assert.ok(res.chords.length >= 4);

      res.chords.forEach((chord) => {
        assert.ok(chord.name);
        assert.ok(chord.numeral);
        assert.ok(chord.midiNotes.length >= 3);
        assert.ok(chord.frequenciesHz.length >= 3);
        assert.ok(chord.voicing.spreadSemitones >= 0);
      });
    });

    it('API-06: Computes accurate BPM delay divisions (straight, dotted, triplet) and reverb pre-delays', () => {
      const acoustics = calculateDelayAcoustics({ bpm: 120, sampleRate: 44100 });
      assert.equal(acoustics.bpm, 120);
      assert.equal(acoustics.quarterNoteMs, 500); // 60,000 / 120 = 500ms

      const quarter = acoustics.timings.find((t) => t.division === '1/4 Quarter');
      assert.ok(quarter);
      assert.equal(quarter.straight.ms, 500);
      assert.equal(quarter.dotted.ms, 750); // 500 * 1.5
      assert.equal(quarter.triplet.ms, 333.33); // 500 * (2/3)

      assert.ok(acoustics.reverbPreDelays.intimateRoom.ms > 0);
      assert.ok(acoustics.reverbPreDelays.grandHall.ms > acoustics.reverbPreDelays.intimateRoom.ms);
    });

    it('API-07: Synthesizes valid Standard MIDI File (SMF 0) binary headers', () => {
      const midi = buildMidiBuffer({
        chordEvents: [{ pitches: [60, 64, 67] }, { pitches: [62, 65, 69] }],
        bpm: 128,
        title: 'Test Beats',
      });

      assert.ok(Buffer.isBuffer(midi));
      assert.ok(midi.length > 20);
      // SMF header begins with 'MThd' (0x4D, 0x54, 0x68, 0x64)
      assert.equal(midi.toString('utf8', 0, 4), 'MThd');
    });
  });

  describe('🎲 Provably Fair RNG & Leaderboard Engine', () => {
    it('API-08: Generates provably fair dice rolls with clientSeed and HMAC-SHA256 proof', () => {
      const result = rollProvablyFairDice({
        count: 4,
        sides: 6,
        clientSeed: 'player_verification_seed',
        serverSeed: 'fixed_server_secret_for_reproducibility',
        nonce: 10,
        modifier: 2,
      });

      assert.equal(result.count, 4);
      assert.equal(result.sides, 6);
      assert.equal(result.rolls.length, 4);
      assert.equal(result.totalWithModifier, result.sum + 2);
      assert.ok(result.provablyFairProof.serverSeedHash);
      assert.equal(result.provablyFairProof.clientSeed, 'player_verification_seed');
      assert.equal(result.provablyFairProof.nonce, 10);

      // Verify every roll is between 1 and 6
      result.rolls.forEach((r) => {
        assert.ok(r >= 1 && r <= 6);
      });
    });

    it('API-09: Records leaderboard high scores and queries ranked standings', async () => {
      const gameId = 'dice_duel_v1';
      await recordScore({ gameId, playerName: 'ShadowKnight', score: 12000, level: 8 });
      await recordScore({ gameId, playerName: 'AuraMage', score: 18500, level: 12 });
      await recordScore({ gameId, playerName: 'RogueOne', score: 9400, level: 6 });

      const standings = await getTopScores({ gameId, limit: 10 });
      assert.equal(standings.gameId, gameId);
      assert.ok(standings.totalEntries >= 3);
      assert.equal(standings.leaderboard[0].playerName, 'AuraMage');
      assert.equal(standings.leaderboard[0].rank, 1);
      assert.equal(standings.leaderboard[1].playerName, 'ShadowKnight');
      assert.equal(standings.leaderboard[1].rank, 2);
    });
  });

  describe('🛠️ Developer Utilities, QR Codes & URL Shortening', () => {
    it('API-10: SSRF safety check strictly blocks localhost, loopback, private RFC1918 & metadata IPs', () => {
      assert.equal(isSafeOutboundUrl('http://localhost:3000'), false);
      assert.equal(isSafeOutboundUrl('http://127.0.0.1:8080'), false);
      assert.equal(isSafeOutboundUrl('http://10.0.0.1/admin'), false);
      assert.equal(isSafeOutboundUrl('http://192.168.1.1/router'), false);
      assert.equal(isSafeOutboundUrl('http://172.20.0.5/secret'), false);
      assert.equal(isSafeOutboundUrl('http://169.254.169.254/latest/meta-data/'), false);
      assert.equal(isSafeOutboundUrl('javascript:alert(1)'), false);

      // Safe public URLs should pass
      assert.equal(isSafeOutboundUrl('https://dangling-dice-studios.com'), true);
      assert.equal(isSafeOutboundUrl('https://github.com/dangling-dice'), true);
    });

    it('API-11: Generates scalable vector SVG QR matrix and data URLs', () => {
      const qr = generateSvgQrCode({
        text: 'https://dangling-dice-studios.com',
        size: 256,
        color: '#10b981',
        bg: '#0f172a',
      });

      assert.equal(qr.size, 256);
      assert.ok(qr.svg.includes('<svg'));
      assert.ok(qr.svg.includes('<rect'));
      assert.ok(qr.svg.includes('#10b981'));
      assert.ok(qr.dataUrl.startsWith('data:image/svg+xml;utf8,'));
    });

    it('API-12: Creates shortened URL slug and increments click analytics upon tracking', async () => {
      const created = await createShortUrl({
        targetUrl: 'https://dangling-dice-studios.com/games',
        title: 'Games Lab',
      });

      assert.ok(created.slug);
      assert.equal(created.targetUrl, 'https://dangling-dice-studios.com/games');
      assert.equal(created.clicks, 0);

      // Simulate a visit click
      const visited = await findAndTrackShortUrl(created.slug);
      assert.ok(visited);
      assert.equal(visited.clicks, 1);
      assert.ok(visited.lastClickedAt);
    });

    it('API-13: Waveform peak extraction returns normalized RMS bars from 0.0 to 1.0', () => {
      const out = extractAudioWaveform({ targetBars: 32 });
      assert.equal(out.targetBars, 32);
      assert.equal(out.peaks.length, 32);
      out.peaks.forEach((peak) => {
        assert.ok(peak >= 0.0 && peak <= 1.0);
      });
    });
  });
});

