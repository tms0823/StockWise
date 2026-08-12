/**
 * ReputationService: composes the Module 2 reputation score from existing
 * Module 1 stock data.
 *
 * - Calls getStockBySymbol(symbol) EXACTLY ONCE — no direct provider/API
 *   calls, no duplicated Alpha Vantage logic.
 * - Uses stockData.symbol as the canonical normalized symbol.
 * - evaluateReputationFactors() produces the 7-factor contract, then
 *   aggregateReputationScore() computes score/provisionalScore/coverage.
 * - score stays null until coverage is 100%; unavailable factors are never
 *   fabricated; seeded reputationStatus/riskLevel are never scoring inputs.
 */

const { getStockBySymbol, getDividends, getNewsSentiment } = require('./stockService');
const {
  evaluateReputationFactors,
  scoreDividendRecord,
  scoreNewsSentiment,
} = require('./reputationFactorScorers');
const { aggregateReputationScore } = require('./reputationScoringEngine');

/**
 * Fetch the dividendRecord factor for a symbol.
 *
 * Dividend history is a SUPPLEMENTARY reputation factor:
 * - EXPECTED provider/operational failures (rate limit, 5xx, network,
 *   malformed provider response) make only dividendRecord unavailable so
 *   the reputation endpoint can still return a provisional score.
 * - PROGRAMMING/INTERNAL errors (scorer invariant failures, TypeError,
 *   TypeError, etc.) propagate and must NOT be silently swallowed.
 *
 * Only errors carrying the provider `STOCK_PROVIDER_*` code namespace are
 * downgraded to an unavailable factor; STOCK_API_KEY_MISSING and any other
 * unexpected error propagate.
 */
async function fetchDividendFactor(symbol) {
  try {
    const dividendHistory = await getDividends(symbol);
    return scoreDividendRecord(dividendHistory);
  } catch (error) {
    if (error && typeof error.code === 'string' && error.code.startsWith('STOCK_PROVIDER_')) {
      if (error.code === 'STOCK_PROVIDER_RATE_LIMIT') {
        return {
          score: null,
          available: false,
          reason: 'Dividend data provider rate limit reached',
        };
      }
      return {
        score: null,
        available: false,
        reason: 'Dividend history unavailable',
      };
    }
    throw error;
  }
}

/**
 * Fetch the newsSentiment factor for a symbol.
 *
 * News sentiment is a SUPPLEMENTARY reputation factor:
 * - EXPECTED provider/operational failures (rate limit, 5xx, network,
 *   malformed provider response) make only newsSentiment unavailable so
 *   the reputation endpoint can still return a provisional score.
 * - PROGRAMMING/INTERNAL errors (scorer invariant failures, TypeError,
 *   etc.) propagate and must NOT be silently swallowed.
 *
 * Only errors carrying the provider `STOCK_PROVIDER_*` code namespace are
 * downgraded to an unavailable factor; STOCK_API_KEY_MISSING and any other
 * unexpected error propagate.
 */
async function fetchNewsSentimentFactor(symbol) {
  try {
    const newsData = await getNewsSentiment(symbol);
    return scoreNewsSentiment(newsData);
  } catch (error) {
    if (error && typeof error.code === 'string' && error.code.startsWith('STOCK_PROVIDER_')) {
      if (error.code === 'STOCK_PROVIDER_RATE_LIMIT') {
        return {
          score: null,
          available: false,
          reason: 'News sentiment data provider rate limit reached',
        };
      }
      return {
        score: null,
        available: false,
        reason: 'News sentiment data unavailable',
      };
    }
    throw error;
  }
}

/**
 * Get the reputation score summary for a symbol.
 * @param {string} symbol
 * @returns {Promise<{
 *   symbol: string,
 *   score: number|null,
 *   provisionalScore: number|null,
 *   coveragePercent: number,
 *   complete: boolean,
 *   missingFactors: Array<{ factor: string, reason: string|null }>,
 *   breakdown: Object,
 *   availableWeight: number,
 *   totalWeight: number,
 *   computedAt: string
 * }>}
 */
async function getReputation(symbol) {
  // Core data — if this fails, the whole reputation endpoint fails.
  const stockData = await getStockBySymbol(symbol);

  const dividendFactor = await fetchDividendFactor(stockData.symbol);
  const newsSentimentFactor = await fetchNewsSentimentFactor(stockData.symbol);

  // Build factors immutably: the supplementary provider results replace only
  // the dividendRecord and newsSentiment entries produced by
  // evaluateReputationFactors.
  const factors = {
    ...evaluateReputationFactors(stockData),
    dividendRecord: dividendFactor,
    newsSentiment: newsSentimentFactor,
  };

  const result = aggregateReputationScore(factors);

  return {
    symbol: stockData.symbol,
    ...result,
    computedAt: new Date().toISOString(),
  };
}

module.exports = { getReputation };