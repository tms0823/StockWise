/**
 * suggestionController.js — Module 2, Feature 2
 * Member 4: Investment Suggestion Status (M2-F3) + Risk Indicator System (M2-F4)
 *
 * Route:  GET /api/stocks/:symbol/suggestion
 * Auth:   JWT protected (uses the `protect` middleware already in stockRoutes.js)
 *
 * Data flow:
 *   1. getStockBySymbol(symbol)  — existing Module 1 service, no duplication
 *   2. getReputation(symbol)     — existing Module 2 Member 1 service
 *   3. computeSuggestionAndRisk  — our new pure function (suggestionService.js)
 *
 * Error handling follows the same pattern as reputationController.js so that
 * a failure here never breaks the rest of the Company Profile page.
 */

const { getStockBySymbol } = require('../services/stockService');
const { getReputation }    = require('../services/reputationService');
const { computeSuggestionAndRisk } = require('../services/suggestionService');

/**
 * GET /api/stocks/:symbol/suggestion
 *
 * Returns:
 *  {
 *    success: true,
 *    data: {
 *      symbol:      string,
 *      suggestion:  { status, statusColor, description, score, scoreSource } | null,
 *      risk:        { level, levelColor, badge, description, factors },
 *      disclaimer:  string,
 *      computedAt:  string (ISO)
 *    }
 *  }
 */
const getSuggestion = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required',
      });
    }

    // 1. Fetch live stock data (already cached/rate-limited by stockService).
    const stockData = await getStockBySymbol(symbol);

    // 2. Fetch reputation result (already computed by reputationService).
    //    We pass it through even if it is partial (provisional score) so the
    //    suggestion can still render with a clearly-labelled provisional tag.
    const reputationResult = await getReputation(stockData.symbol);

    // 3. Derive suggestion + risk labels — pure function, no extra I/O.
    const result = computeSuggestionAndRisk(reputationResult, stockData);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSuggestion };
