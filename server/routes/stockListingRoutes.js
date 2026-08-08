const express = require('express');
const {
  searchStockListings,
  getStockListingFilterOptions,
  getListingQuote,
} = require('../controllers/stockListingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/filter-options', protect, getStockListingFilterOptions);
router.get('/:symbol/quote', protect, getListingQuote);
router.get('/', protect, searchStockListings);

module.exports = router;
