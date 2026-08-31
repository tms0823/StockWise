// WatchlistService: composes existing stock/reputation/listing data into the
// enriched watchlist payload. Reuses existing services — no duplicated
// stock-price or reputation algorithms.

const StockListing = require('../models/StockListing');
const { getQuote } = require('./stockService');
const { getReputation } = require('./reputationService');

const normalizeSymbol = (symbol) => {
  if (typeof symbol !== 'string' || !symbol.trim()) return null;
  return symbol.trim().toUpperCase();
};

/**
 * Enrich a single watched symbol for display.
 * A failure for one symbol must not crash the whole watchlist.
 */
const enrichWatchlistItem = async (entry) => {
  const symbol = entry.symbol;
  const base = {
    symbol,
    addedAt: entry.addedAt || null,
    currentPrice: null,
    dailyChange: null,
    dailyChangePercent: null,
    name: null,
    riskLevel: null,
    reputationScore: null,
    provisionalScore: null,
    reputationComplete: false,
    coveragePercent: null,
  };

  // Company name / risk level from the seeded catalog (cheap, no provider call).
  try {
    const listing = await StockListing.findOne({ symbol }).lean();
    if (listing) {
      base.name = listing.companyName || null;
      base.riskLevel = listing.riskLevel || null;
    }
  } catch (error) {
    // Catalog lookup failure — leave name/riskLevel null, continue.
  }

  // Current price / daily change via the existing cached quote path.
  try {
    const quote = await getQuote(symbol);
    base.currentPrice = quote && quote.currentPrice != null ? quote.currentPrice : null;
    base.dailyChange = quote && quote.dailyChange != null ? quote.dailyChange : null;
    base.dailyChangePercent =
      quote && quote.dailyChangePercent != null ? quote.dailyChangePercent : null;
  } catch (error) {
    // Provider failure/rate-limit — leave price fields null, continue.
  }

  // Reputation via the existing reputation service (never duplicated).
  try {
    const reputation = await getReputation(symbol);
    base.reputationScore = reputation && reputation.score != null ? reputation.score : null;
    base.provisionalScore =
      reputation && reputation.provisionalScore != null ? reputation.provisionalScore : null;
    base.reputationComplete = reputation ? Boolean(reputation.complete) : false;
    base.coveragePercent =
      reputation && reputation.coveragePercent != null ? reputation.coveragePercent : null;
  } catch (error) {
    // Reputation failure — leave reputation fields null, continue.
  }

  return base;
};

/**
 * Build the enriched watchlist for an authenticated user.
 */
const getEnrichedWatchlist = async (user) => {
  const entries = user.watchlist || [];
  const enriched = await Promise.all(entries.map(enrichWatchlistItem));
  return enriched;
};

/**
 * Add a symbol to the user's watchlist.
 * Returns { added: boolean, alreadyWatched: boolean }.
 */
const addToWatchlist = async (user, symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    const error = new Error('A valid stock symbol is required');
    error.statusCode = 400;
    throw error;
  }

  const watchlist = user.watchlist || [];
  const exists = watchlist.some((entry) => entry.symbol === normalized);
  if (exists) {
    return { added: false, alreadyWatched: true };
  }

  watchlist.push({ symbol: normalized, addedAt: new Date() });
  user.watchlist = watchlist;
  await user.save();

  return { added: true, alreadyWatched: false };
};

/**
 * Remove a symbol from the user's watchlist.
 * Returns { removed: boolean }.
 */
const removeFromWatchlist = async (user, symbol) => {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) {
    const error = new Error('A valid stock symbol is required');
    error.statusCode = 400;
    throw error;
  }

  const watchlist = user.watchlist || [];
  const exists = watchlist.some((entry) => entry.symbol === normalized);
  if (!exists) {
    return { removed: false };
  }

  user.watchlist = watchlist.filter((entry) => entry.symbol !== normalized);
  await user.save();

  return { removed: true };
};

module.exports = {
  normalizeSymbol,
  getEnrichedWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};