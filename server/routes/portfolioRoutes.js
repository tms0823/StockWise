const express = require('express');
const { getMyPortfolio, getMyTransactions } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/transactions', protect, getMyTransactions);
router.get('/', protect, getMyPortfolio);

module.exports = router;
