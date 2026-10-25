import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose.
 * Reads connection URI from MONGODB_URI environment variable.
 * Gracefully terminates process on fatal connection failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Terminate process with failure code to prevent running without database connection
    process.exit(1);
  }
};

export default connectDB;
