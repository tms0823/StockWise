const express = require('express');
const { getStock, getStockHistory } = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:symbol/history', protect, getStockHistory);
router.get('/:symbol', protect, getStock);

module.exports = router;