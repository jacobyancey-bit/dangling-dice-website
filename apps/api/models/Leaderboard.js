import mongoose from 'mongoose';

// In-memory score store fallback for tests / offline mode
const memoryScores = [];

const leaderboardSchema = new mongoose.Schema(
  {
    gameId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    playerName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 32,
    },
    score: {
      type: Number,
      required: true,
      index: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

let LeaderboardModel;
try {
  LeaderboardModel = mongoose.model('Leaderboard');
} catch {
  LeaderboardModel = mongoose.model('Leaderboard', leaderboardSchema);
}

/**
 * Save new high score entry
 */
export async function recordScore({ gameId, playerName, score, level = 1, metadata = {} }) {
  const entry = {
    id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    gameId: String(gameId).toLowerCase().trim(),
    playerName: String(playerName).trim().slice(0, 32),
    score: Number(score) || 0,
    level: Number(level) || 1,
    metadata,
    verified: true,
    createdAt: new Date(),
  };

  memoryScores.push(entry);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const created = await LeaderboardModel.create(entry);
      return created.toObject();
    } catch {
      // fallback
    }
  }

  return entry;
}

/**
 * Fetch top scores for gameId with pagination and ranking
 */
export async function getTopScores({ gameId, limit = 20, offset = 0 }) {
  const cleanId = String(gameId).toLowerCase().trim();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const count = await LeaderboardModel.countDocuments({ gameId: cleanId });
      const docs = await LeaderboardModel.find({ gameId: cleanId })
        .sort({ score: -1, createdAt: 1 })
        .skip(safeOffset)
        .limit(safeLimit)
        .lean();

      const ranked = docs.map((doc, idx) => ({
        rank: safeOffset + idx + 1,
        id: doc._id,
        playerName: doc.playerName,
        score: doc.score,
        level: doc.level,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
      }));

      return {
        gameId: cleanId,
        totalEntries: count,
        offset: safeOffset,
        limit: safeLimit,
        leaderboard: ranked,
      };
    } catch {
      // fallback
    }
  }

  // Memory fallback
  const filtered = memoryScores
    .filter((s) => s.gameId === cleanId)
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt);

  const paginated = filtered.slice(safeOffset, safeOffset + safeLimit).map((doc, idx) => ({
    rank: safeOffset + idx + 1,
    id: doc.id,
    playerName: doc.playerName,
    score: doc.score,
    level: doc.level,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  }));

  return {
    gameId: cleanId,
    totalEntries: filtered.length,
    offset: safeOffset,
    limit: safeLimit,
    leaderboard: paginated,
  };
}

export default LeaderboardModel;
