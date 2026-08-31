const express = require('express');
const {
  getQuiz,
  postQuizAttempt,
  completeCueCard,
  getMyProgress,
} = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Learning progress is personal, so every route requires authentication.
router.get('/progress', protect, getMyProgress);

// Registered before '/quiz/:topic' so 'submit' is never read as a topic.
router.post('/quiz/submit', protect, postQuizAttempt);
router.get('/quiz/:topic', protect, getQuiz);

router.post('/cuecard/complete', protect, completeCueCard);

module.exports = router;
