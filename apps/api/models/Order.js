import mongoose from 'mongoose';
import { ORDER_STATUSES } from '@dangling-dice/shared';

/**
 * Commercial Order & Digital License Schema
 * Tracks customer purchases, Stripe payment intents, and license fulfillment.
 */
const orderSchema = new mongoose.Schema(
  {
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid customer email',
      ],
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Valued Creator',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Order must reference a studio resource item'],
    },
    itemTitle: {
      type: String,
      required: true,
      trim: true,
    },
    licenseTier: {
      type: String,
      required: [true, 'Order must specify a license tier'],
      enum: ['standard_lease', 'premium_trackout', 'exclusive_rights', 'digital_asset'],
    },
    amount: {
      type: Number,
      required: [true, 'Order must include an amount'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
      trim: true,
    },
    stripeSessionId: {
      type: String,
      required: [true, 'Stripe Checkout Session ID is required'],
      unique: true,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    licenseKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    downloadUrl: {
      type: String,
      trim: true,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High performance indexes for order lookups & customer receipts
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

