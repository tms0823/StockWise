const mongoose = require('mongoose');
const QuizQuestion = require('../models/QuizQuestion');

/**
 * Fields that make up the answer key. They are projected out at the query
 * level so the answer key never reaches the controller, let alone the API
 * response — hiding them only in the client would ship the answers to
 * anyone reading the network tab.
 */
const ANSWER_KEY_FIELDS = { correctOptionIndex: 0, explanation: 0 };

/**
 * Error carrying an HTTP status for the centralized error handler, which
 * already honours `err.statusCode`.
 */
const httpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Questions for one topic, safe to serve to a client taking the quiz.
 *
 * `topic` is matched exactly against the same strings used by CueCard.topic.
 * Returns an empty array when the topic has no questions; the controller
 * turns that into a 404.
 */
const getQuizByTopic = async (topic) =>
  QuizQuestion.find({ topic })
    .select(ANSWER_KEY_FIELDS)
    .sort({ createdAt: 1 })
    .lean();

/**
 * Grade a submission and record the attempt on the user.
 *
 * Grading always uses the stored questions, never anything the client sent
 * beyond its chosen indexes. Answers are scoped to the requested topic and
 * de-duplicated by question, so a client cannot pad its score by repeating a
 * question or by mixing in questions from another topic. Ids that match no
 * question in the topic are ignored rather than counted as wrong.
 *
 * Returns null when the topic has no questions at all (controller -> 404).
 */
const submitQuiz = async (user, topic, answers) => {
  const questions = await QuizQuestion.find({ topic }).sort({ createdAt: 1 }).lean();

  if (questions.length === 0) {
    return null;
  }

  // Keep the first answer per question id, ignoring ids that cannot be an
  // ObjectId so a malformed value can never reach the comparison below.
  const selectionByQuestionId = new Map();
  for (const answer of answers) {
    const questionId = String(answer.questionId);

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      continue;
    }

    if (!selectionByQuestionId.has(questionId)) {
      selectionByQuestionId.set(questionId, answer.selectedIndex);
    }
  }

  // Canonical question order, limited to the ones actually answered.
  const graded = questions
    .filter((question) => selectionByQuestionId.has(String(question._id)))
    .map((question) => {
      const selectedIndex = selectionByQuestionId.get(String(question._id));
      const isCorrect = selectedIndex === question.correctOptionIndex;

      return {
        questionId: question._id,
        question: question.question,
        selectedIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
      };
    });

  if (graded.length === 0) {
    throw httpError('No submitted answers match a question in this topic', 400);
  }

  const score = graded.filter((result) => result.isCorrect).length;
  const total = graded.length;

  if (!user.learningProgress) {
    user.learningProgress = { completedCueCards: [], quizAttempts: [] };
  }

  user.learningProgress.quizAttempts.push({
    topic,
    score,
    totalQuestions: total,
  });

  await user.save();

  return {
    topic,
    score,
    total,
    results: graded,
  };
};

/**
 * Record that a user has finished reading a cue card.
 * Idempotent: a repeat call for the same topic is a no-op and skips the save.
 */
const markCueCardComplete = async (user, topic) => {
  if (!user.learningProgress) {
    user.learningProgress = { completedCueCards: [], quizAttempts: [] };
  }

  if (!user.learningProgress.completedCueCards.includes(topic)) {
    user.learningProgress.completedCueCards.push(topic);
    await user.save();
  }

  return user.learningProgress;
};

/**
 * The authenticated user's learning progress as stored on their document.
 */
const getProgress = (user) => user.learningProgress;

module.exports = {
  getQuizByTopic,
  submitQuiz,
  markCueCardComplete,
  getProgress,
};
