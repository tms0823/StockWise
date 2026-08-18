/**
 * One-off script to populate the QuizQuestion collection with beginner quiz
 * content. Run manually: node scripts/seedQuizQuestions.js
 *
 * Idempotent: questions have no natural unique key, so instead of upserting
 * this clears every question belonging to a seeded topic and re-inserts the
 * current set. Running it again leaves exactly one copy of each question.
 * Questions for topics outside the seed file are left untouched.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const QuizQuestion = require('../models/QuizQuestion');
const quizQuestionsSeed = require('../data/quizQuestionsSeed');

const run = async () => {
  await connectDB();

  const topics = [...new Set(quizQuestionsSeed.map((question) => question.topic))];

  const { deletedCount } = await QuizQuestion.deleteMany({
    topic: { $in: topics },
  });

  const inserted = await QuizQuestion.insertMany(quizQuestionsSeed);

  console.log(
    `Removed ${deletedCount} existing question(s); seeded ${inserted.length} quiz questions across ${topics.length} topics.`
  );
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed quiz questions:', error.message);
  process.exit(1);
});
