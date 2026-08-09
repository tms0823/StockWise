const express = require('express');
const { getStock, getStockHistory } = require('../controllers/stockController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:symbol/history', protect, getStockHistory);
router.get('/:symbol', protect, getStock);
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
});
router.get('/:symbol/chart', async (req, res) => {
});

module.exports = router;