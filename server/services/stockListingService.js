const StockListing = require('../models/StockListing');
const { getStockBySymbol } = require('./stockService');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORT_FIELDS = {
  symbol: 'symbol',
  companyName: 'companyName',
  price: 'price',
  dailyChangePercent: 'dailyChangePercent',
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInt = (value, fallback) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : fallback;
};

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * Build a Mongo filter from search + filter query params and run a
 * single paginated query against the StockListing collection.
 */
const searchAndFilterListings = async (params = {}) => {
  const {
    q,
    sector,
    minPrice,
    maxPrice,
    marketType,
    reputationStatus,
    riskLevel,
    page,
    limit,
    sortBy,
    sortOrder,
  } = params;

  const filter = {};

  if (q && q.trim()) {
    const escaped = escapeRegex(q.trim());
    filter.$or = [
      { symbol: { $regex: `^${escaped}`, $options: 'i' } },
      { companyName: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (sector) {
    filter.sector = sector;
  }

  if (marketType) {
    filter.marketType = marketType;
  }

  if (reputationStatus) {
    filter.reputationStatus = reputationStatus;
  }

  if (riskLevel) {
    filter.riskLevel = riskLevel;
  }

  const min = toFiniteNumber(minPrice);
  const max = toFiniteNumber(maxPrice);
  if (min !== null || max !== null) {
    filter.price = {};
    if (min !== null) filter.price.$gte = min;
    if (max !== null) filter.price.$lte = max;
  }

  const pageNum = toPositiveInt(page, 1);
  const limitNum = Math.min(toPositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (pageNum - 1) * limitNum;

  const sortField = SORT_FIELDS[sortBy] || SORT_FIELDS.symbol;
  const sortDirection = sortOrder === 'desc' ? -1 : 1;

  const [results, total] = await Promise.all([
    StockListing.find(filter)
      .sort({ [sortField]: sortDirection, symbol: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    StockListing.countDocuments(filter),
  ]);

  return {
    results,
    total,
    page: pageNum,
    limit: limitNum,
  };
};

const getFilterOptions = async () => {
  const [sectors, marketTypes, reputationStatuses, riskLevels] = await Promise.all([
    StockListing.distinct('sector'),
    StockListing.distinct('marketType'),
    StockListing.distinct('reputationStatus'),
    StockListing.distinct('riskLevel'),
  ]);

  return {
    sectors: sectors.sort(),
    marketTypes,
    reputationStatuses,
    riskLevels,
  };
};

/**
 * Get a live quote for a single symbol when a user opens its detail view.
 * Falls back to the last stored catalog price if the live provider is
 * rate-limited, so search/filter browsing never depends on live quota.
 */
const getListingQuote = async (symbol) => {
  const normalized = symbol.trim().toUpperCase();

  try {
    const live = await getStockBySymbol(normalized);
    return { source: 'live', ...live };
  } catch (error) {
    if (error.code !== 'STOCK_PROVIDER_RATE_LIMIT') {
      throw error;
    }

    const listing = await StockListing.findOne({ symbol: normalized }).lean();
    if (!listing) {
      throw error;
    }

    return {
      source: 'catalog',
      symbol: listing.symbol,
      name: listing.companyName,
      currentPrice: listing.price,
      dailyChange: listing.dailyChange,
      dailyChangePercent: listing.dailyChangePercent,
      volume: null,
      marketCap: null,
      week52High: null,
      week52Low: null,
    };
  }
};

module.exports = {
  searchAndFilterListings,
  getFilterOptions,
  getListingQuote,
};
