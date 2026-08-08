const { getMarketOverview } = require('../services/marketService');

const getMarketOverviewHandler = async (req, res, next) => {
  try {
    const overview = await getMarketOverview();

    res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMarketOverview: getMarketOverviewHandler };