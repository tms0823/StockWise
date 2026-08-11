const express = require('express');
const {
  getDummyInvestment,
  buyStock,
  sellStock,
} = require('../controllers/dummyInvestmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getDummyInvestment);
router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);

module.exports = router;