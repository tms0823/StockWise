const express = require('express');
const { searchStockListings, getStockListingFilterOptions } = require('../controllers/stockListingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/filter-options', protect, getStockListingFilterOptions);
router.get('/', protect, searchStockListings);

module.exports = router;
