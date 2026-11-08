import mongoose from 'mongoose';

/**
 * Developer Showcase & App of the Week Schema
 * Empowers Dangling Dice Studios™ to curate, feature, and showcase
 * community tools, developer apps, and indie creators.
 */
const devShowcaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide the project or app name'],
      trim: true,
      maxlength: [80, 'Title cannot exceed 80 characters'],
    },
    tagline: {
      type: String,
      required: [true, 'Please provide a 1-sentence punchy tagline'],
      trim: true,
      maxlength: [140, 'Tagline cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a project description'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    appUrl: {
      type: String,
      required: [true, 'Please provide a live demo or app URL'],
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: 'https://dangling-dice-studios.com/images/banner.jpg',
    },
    authorName: {
      type: String,
      required: [true, 'Creator name or handle is required'],
      trim: true,
      maxlength: 60,
    },
    authorSocial: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['Web App', 'Developer Tool', 'Audio & Music', 'Mobile App', 'AI / ML', 'Open Source'],
      default: 'Developer Tool',
    },
    techStack: {
      type: [String],
      default: ['JavaScript'],
    },
    isAppOfTheWeek: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    featuredAt: {
      type: Date,
      default: null,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DevShowcase = mongoose.model('DevShowcase', devShowcaseSchema);
export default DevShowcase;

