const express = require('express');
const { getStock, getStockHistory } = require('../controllers/stockController');
const { getReputation } = require('../controllers/reputationController');
const { getSuggestion } = require('../controllers/suggestionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:symbol/history', protect, getStockHistory);
router.get('/:symbol/reputation', protect, getReputation);
router.get('/:symbol/suggestion', protect, getSuggestion);
router.get('/:symbol', protect, getStock);

module.exports = router;
