const express = require('express');
const {
  getCueCards,
  getCueCardPreview,
  createCueCard,
  deleteCueCard,
} = require('../controllers/cueCardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public preview for unauthenticated visitors
router.get('/preview', getCueCardPreview);

// Authenticated routes
router.route('/')
  .get(protect, getCueCards)
  .post(protect, authorize('admin'), createCueCard);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteCueCard);

module.exports = router;