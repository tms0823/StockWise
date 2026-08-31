const mongoose = require('mongoose');

const cueCardSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    definition: {
      type: String,
      required: true,
      trim: true,
    },
    example: {
      type: String,
      trim: true,
      default: '',
    },
    displayOrder: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

cueCardSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('CueCard', cueCardSchema);