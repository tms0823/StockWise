const { getPortfolio, getTransactions } = require('../services/portfolioService');

/**
 * GET /api/portfolio
 * Portfolio holdings and summary for the authenticated user.
 */
const getMyPortfolio = async (req, res, next) => {
  try {
    const data = await getPortfolio(req.user);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portfolio/transactions
 * Recent trade history for the authenticated user, newest first.
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await getTransactions(req.user._id);

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPortfolio,
  getMyTransactions,
};
