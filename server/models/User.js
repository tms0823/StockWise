const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    virtualBalance: {
      type: Number,
      default: 100000,
      min: 0,
    },
    holdings: [
      {
        symbol: {
          type: String,
          required: true,
          uppercase: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        averageBuyPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    watchlist: [
      {
        symbol: {
          type: String,
          required: true,
          uppercase: true,
          trim: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        priceAlertBaseline: {
          type: Number,
        },
        reputationBaseline: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare candidate password with stored hash
userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
