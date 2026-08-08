const { getStockBySymbol, getStockHistory: getStockHistoryFromService } = require('../services/stockService');

const getStock = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required',
      });
    }

    const stock = await getStockBySymbol(symbol);

    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

const getStockHistory = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { range = '1m' } = req.query;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required',
      });
    }

    const history = await getStockHistoryFromService(symbol, range);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStock, getStockHistory };