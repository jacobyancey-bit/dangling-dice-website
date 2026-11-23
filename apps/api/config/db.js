import mongoose from 'mongoose';
import { initializeDailyMetrics } from '../middleware/analytics.js';

/**
 * Connect to MongoDB instance using Mongoose.
 * Reads connection URI from MONGODB_URI environment variable.
 * Gracefully terminates process on fatal connection failure.
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    if (process.env.NODE_ENV === 'test') {
      console.log('[Database] MONGODB_URI not provided; skipping live connection in test environment.');
      return;
    }
    console.error('[Database Error] MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
    await initializeDailyMetrics();
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    // Terminate process with failure code to prevent running without database connection in production/dev
    process.exit(1);
  }
};

export default connectDB;
