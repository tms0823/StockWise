const mongoose = require('mongoose');

/**
 * A single multiple-choice question belonging to one cue card topic.
 *
 * `topic` is a plain string that must match a CueCard.topic value exactly
 * (including spaces, parentheses and curly apostrophes), so quizzes can be
 * looked up by the same key the cue cards already use.
 */
const optionsLimit = {
  validator: (options) => options.length >= 2 && options.length <= 4,
  message: 'A quiz question must have between 2 and 4 options.',
};

/**
 * Keeps the answer index pointing at a real option. `this` is the document
 * during full document validation (save / insertMany); on update queries it
 * is the query, where `options` is not reliably available, so those are
 * skipped rather than failed.
 */
const correctOptionInRange = {
  validator: function (index) {
    const options = this && this.options;

    if (!Array.isArray(options)) {
      return true;
    }

    return index < options.length;
  },
  message: 'correctOptionIndex must be less than the number of options.',
};

const quizQuestionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: optionsLimit,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      validate: correctOptionInRange,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

quizQuestionSchema.index({ topic: 1 });

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);
