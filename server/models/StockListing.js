const mongoose = require('mongoose');

const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Energy',
  'Consumer Discretionary',
  'Consumer Staples',
  'Industrials',
  'Utilities',
  'Real Estate',
  'Materials',
  'Communication Services',
];

const MARKET_TYPES = ['Large-cap', 'Mid-cap', 'Small-cap'];

const REPUTATION_STATUSES = ['Blue-chip', 'Established', 'Emerging', 'Penny Stock'];

const RISK_LEVELS = ['Low', 'Medium', 'High'];

const stockListingSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      required: true,
      enum: SECTORS,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    dailyChange: {
      type: Number,
      default: 0,
    },
    dailyChangePercent: {
      type: Number,
      default: 0,
    },
    marketType: {
      type: String,
      required: true,
      enum: MARKET_TYPES,
    },
    reputationStatus: {
      type: String,
      required: true,
      enum: REPUTATION_STATUSES,
    },
    riskLevel: {
      type: String,
      required: true,
      enum: RISK_LEVELS,
    },
  },
  {
    timestamps: true,
  }
);

stockListingSchema.index({ companyName: 1 });
stockListingSchema.index({ sector: 1 });
stockListingSchema.index({ marketType: 1 });
stockListingSchema.index({ reputationStatus: 1 });
stockListingSchema.index({ riskLevel: 1 });
stockListingSchema.index({ price: 1 });

stockListingSchema.statics.SECTORS = SECTORS;
stockListingSchema.statics.MARKET_TYPES = MARKET_TYPES;
stockListingSchema.statics.REPUTATION_STATUSES = REPUTATION_STATUSES;
stockListingSchema.statics.RISK_LEVELS = RISK_LEVELS;

module.exports = mongoose.model('StockListing', stockListingSchema);
