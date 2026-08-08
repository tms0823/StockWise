const StockListing = require('../models/StockListing');
const { searchAndFilterListings, getFilterOptions, getListingQuote } = require('../services/stockListingService');

const isValidEnumValue = (value, allowed) => !value || allowed.includes(value);

const SORT_BY_OPTIONS = ['symbol', 'companyName', 'price', 'dailyChangePercent'];
const SORT_ORDER_OPTIONS = ['asc', 'desc'];

const searchStockListings = async (req, res, next) => {
  try {
    const { sector, marketType, reputationStatus, riskLevel, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    if (!isValidEnumValue(sector, StockListing.SECTORS)) {
      return res.status(400).json({ success: false, message: 'Invalid sector filter' });
    }

    if (!isValidEnumValue(marketType, StockListing.MARKET_TYPES)) {
      return res.status(400).json({ success: false, message: 'Invalid marketType filter' });
    }

    if (!isValidEnumValue(reputationStatus, StockListing.REPUTATION_STATUSES)) {
      return res.status(400).json({ success: false, message: 'Invalid reputationStatus filter' });
    }

    if (!isValidEnumValue(riskLevel, StockListing.RISK_LEVELS)) {
      return res.status(400).json({ success: false, message: 'Invalid riskLevel filter' });
    }

    if (minPrice !== undefined && Number.isNaN(Number(minPrice))) {
      return res.status(400).json({ success: false, message: 'minPrice must be a number' });
    }

    if (maxPrice !== undefined && Number.isNaN(Number(maxPrice))) {
      return res.status(400).json({ success: false, message: 'maxPrice must be a number' });
    }

    if (!isValidEnumValue(sortBy, SORT_BY_OPTIONS)) {
      return res.status(400).json({ success: false, message: 'Invalid sortBy value' });
    }

    if (!isValidEnumValue(sortOrder, SORT_ORDER_OPTIONS)) {
      return res.status(400).json({ success: false, message: 'Invalid sortOrder value' });
    }

    const data = await searchAndFilterListings(req.query);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getStockListingFilterOptions = async (req, res, next) => {
  try {
    const options = await getFilterOptions();

    res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    next(error);
  }
};

const getListingQuoteHandler = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({ success: false, message: 'Stock symbol is required' });
    }

    const quote = await getListingQuote(symbol);

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchStockListings,
  getStockListingFilterOptions,
  getListingQuote: getListingQuoteHandler,
};
