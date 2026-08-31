const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['PRICE_CHANGE', 'REPUTATION_CHANGE'];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPES,
    },
    previousValue: {
      type: Number,
    },
    newValue: {
      type: Number,
    },
    changePercent: {
      type: Number,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Supports "this user's notifications, newest first" — the primary history query.
notificationSchema.index({ user: 1, createdAt: -1 });

// Supports unread-count queries for a user.
notificationSchema.index({ user: 1, read: 1 });

notificationSchema.statics.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

module.exports = mongoose.model('Notification', notificationSchema);