const StockListing = require('../models/StockListing');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

  const [results, total] = await Promise.all([
    StockListing.find(filter).sort({ symbol: 1 }).skip(skip).limit(limitNum).lean(),
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

module.exports = {
  searchAndFilterListings,
  getFilterOptions,
};
