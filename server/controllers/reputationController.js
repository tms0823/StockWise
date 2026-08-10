const { getReputation } = require('../services/reputationService');

const getReputationHandler = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required',
      });
    }

    const reputation = await getReputation(symbol);

    res.status(200).json({
      success: true,
      data: reputation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReputation: getReputationHandler };