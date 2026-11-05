import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import itemRoutes from './itemRoutes.js';

const router = express.Router();

/**
 * Health check / meta endpoint for the API tier & MongoDB connection status
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbState] || 'unknown',
      connected: dbState === 1,
      name: mongoose.connection.name || 'dangling_dice_db',
      host: mongoose.connection.host || '127.0.0.1',
    },
    endpoints: {
      auth: '/api/auth (register, login, profile)',
      items: '/api/items (GET, POST, PUT, DELETE)',
    },
  });
});

/**
 * Mount sub-routers
 */
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);

export default router;
