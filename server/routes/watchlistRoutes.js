const express = require('express');
const {
  getWatchlist,
  addWatchlistSymbol,
  removeWatchlistSymbol,
} = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getWatchlist);
router.post('/:symbol', protect, addWatchlistSymbol);
router.delete('/:symbol', protect, removeWatchlistSymbol);

module.exports = router;