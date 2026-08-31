const {
  getQuizByTopic,
  submitQuiz,
  markCueCardComplete,
  getProgress,
} = require('../services/learningService');

/**
 * Validate and normalize a topic from a request param or body.
 * Topics are matched exactly against CueCard.topic, so only surrounding
 * whitespace is trimmed. Returns null if invalid.
 */
const normalizeTopic = (topic) => {
  if (typeof topic !== 'string' || !topic.trim()) return null;
  return topic.trim();
};

/**
 * Validate the submitted answers array.
 * Every entry needs a non-empty questionId and a non-negative integer
 * selectedIndex. Returns the array, or null if the payload is unusable.
 */
const validateAnswers = (answers) => {
  if (!Array.isArray(answers) || answers.length === 0) return null;

  const isValidAnswer = (answer) =>
    answer &&
    typeof answer === 'object' &&
    typeof answer.questionId === 'string' &&
    answer.questionId.trim() !== '' &&
    Number.isInteger(answer.selectedIndex) &&
    answer.selectedIndex >= 0;

  if (!answers.every(isValidAnswer)) return null;

  return answers;
};

/**
 * GET /api/learning/quiz/:topic
 * Questions for one topic, with the answer key removed by the service.
 */
const getQuiz = async (req, res, next) => {
  try {
    // Express has already decoded the percent-encoded topic from the URL.
    const topic = normalizeTopic(req.params.topic);

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'A valid topic is required',
      });
    }

    const questions = await getQuizByTopic(topic);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No quiz questions found for this topic',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        topic,
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/learning/quiz/submit
 * Body: { topic, answers: [{ questionId, selectedIndex }] }
 * Graded server-side against the stored questions.
 */
const postQuizAttempt = async (req, res, next) => {
  try {
    const { topic, answers } = req.body;

    const normalizedTopic = normalizeTopic(topic);
    if (!normalizedTopic) {
      return res.status(400).json({
        success: false,
        message: 'A valid topic is required',
      });
    }

    const validAnswers = validateAnswers(answers);
    if (!validAnswers) {
      return res.status(400).json({
        success: false,
        message:
          'answers must be a non-empty array of { questionId, selectedIndex } entries',
      });
    }

    const result = await submitQuiz(req.user, normalizedTopic, validAnswers);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No quiz questions found for this topic',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/learning/cuecard/complete
 * Body: { topic }
 * Idempotent — marking the same cue card twice changes nothing.
 */
const completeCueCard = async (req, res, next) => {
  try {
    const topic = normalizeTopic(req.body.topic);

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: 'A valid topic is required',
      });
    }

    const learningProgress = await markCueCardComplete(req.user, topic);

    res.status(200).json({
      success: true,
      message: 'Cue card marked as complete',
      data: learningProgress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/learning/progress
 * Learning progress for the authenticated user.
 */
const getMyProgress = async (req, res, next) => {
  try {
    const learningProgress = getProgress(req.user);

    res.status(200).json({
      success: true,
      data: learningProgress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuiz,
  postQuizAttempt,
  completeCueCard,
  getMyProgress,
};
