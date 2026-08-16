// WatchlistController: HTTP layer for the authenticated user's watchlist.
// All routes rely on the existing `protect` middleware (req.user).

const { getQuote } = require('../services/stockService');
const {
  getEnrichedWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  normalizeSymbol,
} = require('../services/watchlistService');

/**
 * GET /api/watchlist
 * Return the authenticated user's watchlist enriched for display.
 */
const getWatchlist = async (req, res, next) => {
  try {
    const data = await getEnrichedWatchlist(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/watchlist/:symbol
 * Add a symbol to the authenticated user's watchlist.
 */
const addWatchlistSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalized = normalizeSymbol(symbol);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: 'A valid stock symbol is required',
      });
    }

    // Ensure the symbol represents a valid known/fetchable company before
    // persisting it. Reuses the existing cached quote path.
    try {
      const quote = await getQuote(normalized);
      if (!quote || quote.currentPrice == null) {
        return res.status(400).json({
          success: false,
          message: 'Unable to verify this stock symbol',
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify this stock symbol',
      });
    }

    const result = await addToWatchlist(req.user, normalized);

    if (result.alreadyWatched) {
      return res.status(200).json({
        success: true,
        message: 'Stock is already in your watchlist',
        data: { symbol: normalized, alreadyWatched: true },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Stock added to watchlist',
      data: { symbol: normalized, alreadyWatched: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/watchlist/:symbol
 * Remove a symbol from the authenticated user's watchlist.
 */
const removeWatchlistSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const normalized = normalizeSymbol(symbol);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: 'A valid stock symbol is required',
      });
    }

    const result = await removeFromWatchlist(req.user, normalized);

    if (!result.removed) {
      return res.status(404).json({
        success: false,
        message: 'Stock is not in your watchlist',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist',
      data: { symbol: normalized },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addWatchlistSymbol,
  removeWatchlistSymbol,
};