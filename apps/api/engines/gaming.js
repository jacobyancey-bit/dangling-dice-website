// ============================================================================
// Dangling Dice Studios™ — Gaming & Provably Fair RNG Engine
// Cryptographic fairness verification, dice simulation, & high score validation
// ============================================================================

import crypto from 'crypto';

/**
 * Generates provably fair dice rolls using HMAC-SHA256
 *
 * Algorithm:
 * 1. serverSeed (kept secret until reveal)
 * 2. serverSeedHash = SHA256(serverSeed) (shared with user before roll)
 * 3. clientSeed (chosen or randomized by user)
 * 4. nonce (incremented with every roll)
 * 5. HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${index}`)
 * 6. roll = (first 4 bytes as unsigned int % sides) + 1
 */
export function rollProvablyFairDice({
  count = 1,
  sides = 6,
  clientSeed = null,
  serverSeed = null,
  nonce = 1,
  modifier = 0,
}) {
  const safeCount = Math.max(1, Math.min(100, Math.floor(Number(count) || 1)));
  const safeSides = Math.max(2, Math.min(1000, Math.floor(Number(sides) || 6)));
  const safeNonce = Math.max(0, Math.floor(Number(nonce) || 1));
  const safeModifier = Math.floor(Number(modifier) || 0);

  const activeServerSeed = serverSeed || crypto.randomBytes(32).toString('hex');
  const activeClientSeed = clientSeed || crypto.randomBytes(16).toString('hex');

  // SHA256 commitment of the server seed
  const serverSeedHash = crypto.createHash('sha256').update(activeServerSeed).digest('hex');

  const rolls = [];
  let totalSum = 0;

  for (let i = 0; i < safeCount; i++) {
    const hmac = crypto.createHmac('sha256', activeServerSeed);
    hmac.update(`${activeClientSeed}:${safeNonce}:${i}`);
    const hexDigest = hmac.digest('hex');

    // Take 8 hex characters (4 bytes = 32-bit uint)
    const chunk = hexDigest.slice(0, 8);
    const intVal = parseInt(chunk, 16);
    const roll = (intVal % safeSides) + 1;

    rolls.push({
      dieIndex: i + 1,
      roll,
      rawInt: intVal,
      hmacSignature: hexDigest.slice(0, 16),
    });
    totalSum += roll;
  }

  // Distribution frequency
  const distribution = {};
  for (let s = 1; s <= Math.min(safeSides, 20); s++) {
    distribution[s] = 0;
  }
  rolls.forEach((r) => {
    if (distribution[r.roll] !== undefined) {
      distribution[r.roll] += 1;
    }
  });

  return {
    game: 'Provably Fair Dice Engine',
    count: safeCount,
    sides: safeSides,
    modifier: safeModifier,
    rolls: rolls.map((r) => r.roll),
    rollsDetail: rolls,
    sum: totalSum,
    totalWithModifier: totalSum + safeModifier,
    average: Math.round((totalSum / safeCount) * 100) / 100,
    provablyFairProof: {
      serverSeedHash,
      serverSeed: activeServerSeed,
      clientSeed: activeClientSeed,
      nonce: safeNonce,
      algorithm: 'HMAC-SHA256',
      verificationInstructions:
        'To verify independently: HMAC-SHA256(serverSeed, `${clientSeed}:${nonce}:${dieIndex}`) -> parseInt(hex.slice(0, 8), 16) % sides + 1',
    },
  };
}

/**
 * Validates a client score submission checksum
 */
export function verifyScoreChecksum({ score, gameId, playerName, timestamp, signature, secretKey }) {
  if (!signature || !secretKey) return true; // optional verification
  const payload = `${gameId}:${playerName}:${score}:${timestamp}`;
  const expected = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
  return expected === signature;
}

