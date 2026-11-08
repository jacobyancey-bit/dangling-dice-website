import mongoose from 'mongoose';

/**
 * Scheduled Marketing Drop Schema
 * Manages in-house queue for automated Discord broadcasts and social syndication.
 */
const scheduledPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a post title'],
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      required: [true, 'Please provide post content / description'],
      trim: true,
      maxlength: 2000,
    },
    link: {
      type: String,
      trim: true,
      default: 'https://dangling-dice-studios.com',
    },
    category: {
      type: String,
      enum: ['Developer Tools', 'Beats & Audio', 'Affiliate Deals', 'Studio Update'],
      default: 'Studio Update',
    },
    scheduledFor: {
      type: Date,
      required: [true, 'Please specify scheduled publication date and time'],
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    sentAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

const ScheduledPost = mongoose.model('ScheduledPost', scheduledPostSchema);
export default ScheduledPost;

