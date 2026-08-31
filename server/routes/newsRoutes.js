const express = require('express');
const {
  getNewsArticles,
  explainArticle,
} = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Provider-backed article list for a symbol — requires JWT.
router.get('/symbol/:symbol/articles', protect, getNewsArticles);

// AI explanation for ONE provider-backed article — requires JWT.
// Only registered users can trigger the paid OpenAI call.
router.post('/explain', protect, explainArticle);

module.exports = router;