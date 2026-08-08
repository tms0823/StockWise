const express = require('express');
const { getMarketOverview } = require('../controllers/marketController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview', protect, getMarketOverview);

module.exports = router;