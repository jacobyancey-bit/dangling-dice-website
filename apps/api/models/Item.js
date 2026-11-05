import mongoose from "mongoose";
import { ITEM_CATEGORIES } from "@dangling-dice/shared";

/**
 * Studio Resource / Item Schema for Dangling Dice Studios
 * Handles Coding Tutorials, Beats & Audio Releases, Games, and Digital Assets.
 */
const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Resource must be associated with a creator user"],
    },
    title: {
      type: String,
      required: [true, "Please provide a resource title"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a detailed description"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Please specify a studio category"],
      enum: ITEM_CATEGORIES,
      default: "Coding Tutorials",
    },
    mediaUrl: {
      type: String,
      trim: true,
      default: "",
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "/images/banner.jpg",
    },
    tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      min: [0, "Price must be positive or 0 for free"],
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Developer Tool Metadata
    isTool: {
      type: Boolean,
      default: false,
    },
    toolType: {
      type: String,
      enum: [
        "web-utility",
        "standalone-app",
        "mobile-companion",
        "api-service",
        "",
      ],
      default: "",
    },
    liveUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // Curated Partner & Affiliate Recommendations
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    affiliateUrl: {
      type: String,
      trim: true,
      default: "",
    },
    affiliateBadge: {
      type: String,
      trim: true,
      default: "",
    },
    affiliateCategory: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Performance Indexes for fast catalog querying and sorting
itemSchema.index({ category: 1, createdAt: -1 });
itemSchema.index({ isFeatured: 1, isAvailable: 1 });
itemSchema.index({ title: "text", description: "text", tags: "text" });

const Item = mongoose.model("Item", itemSchema);

export default Item;
