const express = require('express');
const {
  getCueCards,
  getCueCardPreview,
} = require('../controllers/cueCardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public preview for unauthenticated visitors (fixed limited subset)
router.get('/preview', getCueCardPreview);

// Full set for authenticated users
router.get('/', protect, getCueCards);

module.exports = router;