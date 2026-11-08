import mongoose from 'mongoose';

/**
 * Daily Analytics Record for Dangling Dice Studios™
 * Stores historical daily aggregates so metrics persist across server restarts.
 */
const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: String, // ISO date string YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    totalRequests: { type: Number, default: 0 },
    crawlers: {
      ai: { type: Number, default: 0 },
      search: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      browsers: { type: Number, default: 0 },
      tools: { type: Number, default: 0 },
    },
    apiChannels: {
      rapidapi: { type: Number, default: 0 },
      postman: { type: Number, default: 0 },
      web: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
    },
    endpoints: {
      type: Map,
      of: Number,
      default: {},
    },
    statusCodes: {
      type: Map,
      of: Number,
      default: {},
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const DailyAnalytics = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
export default DailyAnalytics;
