const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['BUY', 'SELL'];

const transactionSchema = new mongoose.Schema(
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
      enum: TRANSACTION_TYPES,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Supports "this user's transactions, newest first" — the primary history query.
transactionSchema.index({ user: 1, createdAt: -1 });

transactionSchema.statics.TRANSACTION_TYPES = TRANSACTION_TYPES;

module.exports = mongoose.model('Transaction', transactionSchema);
