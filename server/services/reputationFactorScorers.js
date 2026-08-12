/**
 * Pure factor-specific scorers for the Module 2 Company Reputation Score.
 *
 * - PURE: no I/O, no Alpha Vantage, no MongoDB, no external dependencies.
 * - Consumes ONLY real fields from the existing Module 1 getStockBySymbol
 *   response shape (top-level + indicators + history).
 * - Each scorer returns the exact contract required by
 *   reputationScoringEngine.js:
 *     { score: 0-100, available: true }  OR
 *     { score: null, available: false, reason: "..." }
 *
 * Design rules (locked):
 * - peRatio, eps, dividendYield, week52High/Low, marketCap, volume,
 *   dailyChange, reputationStatus, riskLevel are NEVER numeric score inputs.
 * - Missing data is distinguished from genuine poor performance.
 * - Malformed values are never silently clamped.
 * - Thresholds are PROJECT scoring rules, not universal investment advice.
 */

const {
  MARGIN_BANDS,
  OP_MARGIN_BANDS,
  REVENUE_GROWTH_BANDS,
  EARNINGS_GROWTH_BANDS,
  VOLATILITY_BANDS,
  BETA_BANDS,
  DEBT_TO_EQUITY_BANDS,
  VOLATILITY_MIN_DAYS,
  ANNUALIZATION_FACTOR,
  EXTREME_RETURN_THRESHOLD,
  SUBMETRIC_WEIGHTS,
} = require('./reputationBands');

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Normalize a value to a finite number or null.
 *
 * Because this scorer consumes already-normalized values from stockService,
 * NO type coercion is performed: strings, booleans, arrays, objects, NaN and
 * Infinity are treated as unavailable rather than silently converted.
 * @param {unknown} value
 * @returns {number|null}
 */
function nullableNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Deterministic piecewise-linear interpolation over sorted anchors.
 * Saturates only beyond the defined endpoints.
 * @param {number} value
 * @param {Array<{x:number,y:number}>} anchors - sorted ascending by x
 * @returns {number} submetric score rounded to 1 decimal
 */
function bandScore(value, anchors) {
  if (!Array.isArray(anchors) || anchors.length === 0) {
    throw new Error('bandScore requires a non-empty anchors array');
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('bandScore requires a finite numeric value');
  }

  const first = anchors[0];
  const last = anchors[anchors.length - 1];

  if (value <= first.x) return round1(first.y);
  if (value >= last.x) return round1(last.y);

  for (let i = 0; i < anchors.length - 1; i += 1) {
    const lo = anchors[i];
    const hi = anchors[i + 1];
    if (value >= lo.x && value <= hi.x) {
      const t = (value - lo.x) / (hi.x - lo.x);
      return round1(lo.y + t * (hi.y - lo.y));
    }
  }

  // Defensive fallback (should be unreachable).
  return round1(last.y);
}

/**
 * Compute annualized volatility from daily close history.
 * @param {Array<{date:string,open:number,high:number,low:number,close:number,volume:number}>} history
 * @returns {{state:'ok'|'insufficient'|'extreme', annualizedVolatility:number|null, volScore:number|null, reason?:string, returnCount:number}}
 */
function computeAnnualizedVolatility(history) {
  if (!Array.isArray(history)) {
    return {
      state: 'insufficient',
      annualizedVolatility: null,
      volScore: null,
      reason: 'Price history too short for reliable volatility (need ≥ 60 trading days)',
      returnCount: 0,
    };
  }

  // Non-finite or <= 0 closes are invalid data — never interpreted as poor
  // performance, simply excluded from the valid sequence.
  const validCloses = [];
  for (const day of history) {
    const close = nullableNumber(day && day.close);
    if (close !== null && close > 0) {
      validCloses.push(close);
    }
  }

  if (validCloses.length < VOLATILITY_MIN_DAYS) {
    return {
      state: 'insufficient',
      annualizedVolatility: null,
      volScore: null,
      reason: 'Price history too short for reliable volatility (need ≥ 60 trading days)',
      returnCount: 0,
    };
  }

  // Daily simple returns over the valid sequence.
  const returns = [];
  for (let i = 1; i < validCloses.length; i += 1) {
    returns.push(validCloses[i] / validCloses[i - 1] - 1);
  }

  // Extreme adjacent return: do NOT discard it. Volatility is unreliable.
  for (const r of returns) {
    if (Math.abs(r) > EXTREME_RETURN_THRESHOLD) {
      return {
        state: 'extreme',
        annualizedVolatility: null,
        volScore: null,
        reason: 'Extreme adjacent return (>100%) detected in price history - volatility considered unreliable',
        returnCount: returns.length,
      };
    }
  }

  // Sample standard deviation (n - 1).
  const n = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / n;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / (n - 1);
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(ANNUALIZATION_FACTOR);

  return {
    state: 'ok',
    annualizedVolatility,
    volScore: bandScore(annualizedVolatility, VOLATILITY_BANDS),
    returnCount: n,
  };
}

/**
 * financialPerformance — requires at least 2 finite of
 * { profitMargin, operatingMargin, revenueGrowth }.
 */
function scoreFinancialPerformance({ profitMargin, operatingMargin, revenueGrowth } = {}) {
  const margin = nullableNumber(profitMargin);
  const opMargin = nullableNumber(operatingMargin);
  const revGrowth = nullableNumber(revenueGrowth);

  const present = [margin, opMargin, revGrowth].filter((v) => v !== null);
  if (present.length < 2) {
    return {
      score: null,
      available: false,
      reason: 'Insufficient financial performance data',
    };
  }

  const scores = [];
  if (margin !== null) scores.push(bandScore(margin, MARGIN_BANDS));
  if (opMargin !== null) scores.push(bandScore(opMargin, OP_MARGIN_BANDS));
  if (revGrowth !== null) scores.push(bandScore(revGrowth, REVENUE_GROWTH_BANDS));

  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return { score: round1(avg), available: true };
}

/**
 * priceStability — requires reliable historical volatility (>= 60 valid
 * closes, no extreme adjacent return). Beta is optional.
 */
function scorePriceStability({ beta, history } = {}) {
  const vol = computeAnnualizedVolatility(history);
  if (vol.state !== 'ok') {
    return { score: null, available: false, reason: vol.reason };
  }

  const betaNum = nullableNumber(beta);
  const betaScore = betaNum !== null && betaNum >= 0 ? bandScore(betaNum, BETA_BANDS) : null;

  let score;
  if (betaScore !== null) {
    score =
      SUBMETRIC_WEIGHTS.priceStability.volatility * vol.volScore +
      SUBMETRIC_WEIGHTS.priceStability.beta * betaScore;
  } else {
    score = vol.volScore;
  }

  return { score: round1(score), available: true };
}

/**
 * debtLevel — single submetric debtToEquity.
 */
function scoreDebtLevel({ debtToEquity } = {}) {
  const dte = nullableNumber(debtToEquity);
  if (dte === null) {
    return {
      score: null,
      available: false,
      reason: 'Debt-to-equity not provided by data provider',
    };
  }

  if (dte < 0) {
    return {
      score: 10.0,
      available: true,
      reason: 'Negative equity / unusual capital structure',
    };
  }

  return { score: round1(bandScore(dte, DEBT_TO_EQUITY_BANDS)), available: true };
}

/**
 * profitGrowth — earningsGrowthYoY is REQUIRED; revenueGrowth is optional.
 */
function scoreProfitGrowth({ earningsGrowthYoY, revenueGrowth } = {}) {
  const earnings = nullableNumber(earningsGrowthYoY);
  if (earnings === null) {
    return {
      score: null,
      available: false,
      reason: 'Insufficient profit growth data - earnings growth (primary metric) unavailable',
    };
  }

  const earningsScore = bandScore(earnings, EARNINGS_GROWTH_BANDS);
  const rev = nullableNumber(revenueGrowth);

  let score;
  if (rev !== null) {
    const revScore = bandScore(rev, REVENUE_GROWTH_BANDS);
    score =
      SUBMETRIC_WEIGHTS.profitGrowth.earnings * earningsScore +
      SUBMETRIC_WEIGHTS.profitGrowth.revenue * revScore;
  } else {
    score = earningsScore;
  }

  return { score: round1(score), available: true };
}

/**
 * marketReputation — analyst consensus from Alpha Vantage OVERVIEW rating
 * counts (already fetched by getStockBySymbol; no new provider call).
 *
 * Availability rules:
 * - all five rating counts must be finite numbers
 * - every count must be >= 0
 * - total analyst ratings must be > 0
 *
 * Scoring weights:
 *   Strong Buy = 100, Buy = 75, Hold = 50, Sell = 25, Strong Sell = 0
 */
function scoreMarketReputation({
  analystRatingStrongBuy,
  analystRatingBuy,
  analystRatingHold,
  analystRatingSell,
  analystRatingStrongSell,
} = {}) {
  const strongBuy = nullableNumber(analystRatingStrongBuy);
  const buy = nullableNumber(analystRatingBuy);
  const hold = nullableNumber(analystRatingHold);
  const sell = nullableNumber(analystRatingSell);
  const strongSell = nullableNumber(analystRatingStrongSell);

  const counts = [strongBuy, buy, hold, sell, strongSell];

  // All five must be finite and non-negative.
  if (counts.some((c) => c === null || c < 0)) {
    return {
      score: null,
      available: false,
      reason: 'Insufficient analyst rating data',
    };
  }

  const totalRatings = strongBuy + buy + hold + sell + strongSell;
  if (totalRatings <= 0) {
    return {
      score: null,
      available: false,
      reason: 'Insufficient analyst rating data',
    };
  }

  const score =
    (strongBuy * 100 + buy * 75 + hold * 50 + sell * 25 + strongSell * 0) /
    totalRatings;

  return { score: round1(score), available: true };
}

/**
 * dividendRecord — pure scorer over normalized dividend history.
 *
 * Consumes ONLY the normalized contract produced by stockService:
 *   {
 *     state: 'ok' | 'unavailable',
 *     completeYears: [YYYY, YYYY, YYYY],
 *     yearlyTotals: { YYYY: number, YYYY: number, YYYY: number },
 *     reason?: string
 *   }
 *
 * Never knows Alpha Vantage field names or HTTP.
 *
 * State validation:
 *   - ONLY 'ok' and 'unavailable' are allowed; anything else (including
 *     missing/undefined) THROWS — a programming/invariant error.
 *
 * For state:'ok', completeYears must be exactly 3 integers, strictly
 * increasing and consecutive calendar years (e.g. [2023, 2024, 2025]).
 * Violations THROW — never silently become a score.
 *
 * Scoring (frequency-neutral — calendar-year totals, not payment counts):
 *   Payment consistency 60%: 3 years paid => 100, 2 => 60, 1 => 20, 0 => 0
 *   Dividend trend 40%: pattern table below
 *
 * Y1 = oldest, Y2 = middle, Y3 = most recent complete year total.
 */
function scoreDividendRecord(dividendHistory) {
  if (!dividendHistory || typeof dividendHistory !== 'object') {
    throw new Error('scoreDividendRecord: dividendHistory must be an object');
  }

  if (dividendHistory.state !== 'ok' && dividendHistory.state !== 'unavailable') {
    throw new Error('scoreDividendRecord: invalid dividend history state');
  }

  if (dividendHistory.state === 'unavailable') {
    return {
      score: null,
      available: false,
      reason: dividendHistory.reason || 'Dividend history unavailable',
    };
  }

  const { completeYears, yearlyTotals } = dividendHistory;

  // Invariant validation — programming errors throw.
  if (
    !Array.isArray(completeYears) ||
    completeYears.length !== 3 ||
    !completeYears.every((y) => Number.isInteger(y))
  ) {
    throw new Error('scoreDividendRecord: completeYears must be exactly 3 integers');
  }

  // Strictly increasing + consecutive calendar years.
  for (let i = 1; i < completeYears.length; i += 1) {
    if (completeYears[i] !== completeYears[i - 1] + 1) {
      throw new Error('scoreDividendRecord: completeYears must be consecutive calendar years');
    }
  }

  if (!yearlyTotals || typeof yearlyTotals !== 'object' || Array.isArray(yearlyTotals)) {
    throw new Error('scoreDividendRecord: yearlyTotals must be an object');
  }

  for (const year of completeYears) {
    const total = yearlyTotals[year];
    if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
      throw new Error(
        `scoreDividendRecord: yearlyTotals[${year}] must be a finite number >= 0`
      );
    }
  }

  const y1 = yearlyTotals[completeYears[0]];
  const y2 = yearlyTotals[completeYears[1]];
  const y3 = yearlyTotals[completeYears[2]];

  const paidYears = [y1, y2, y3].filter((total) => total > 0).length;

  // Payment consistency — 60%.
  let consistencyScore;
  if (paidYears === 3) consistencyScore = 100;
  else if (paidYears === 2) consistencyScore = 60;
  else if (paidYears === 1) consistencyScore = 20;
  else consistencyScore = 0;

  // Dividend trend — 40%. Pattern rules based on zero/non-zero per year.
  const isPositive = (v) => v > 0;
  let trendScore;

  if (isPositive(y1) && isPositive(y2) && isPositive(y3)) {
    // [+, +, +]
    const growth = (y3 - y1) / y1;
    if (growth >= 0.1) trendScore = 100;
    else if (growth >= 0) trendScore = 80;
    else if (growth >= -0.2) trendScore = 55;
    else trendScore = 25;
  } else if (isPositive(y1) && !isPositive(y2) && isPositive(y3)) {
    // [+, 0, +]
    trendScore = 40;
  } else if (isPositive(y1) && isPositive(y2) && !isPositive(y3)) {
    // [+, +, 0]
    trendScore = 0;
  } else if (!isPositive(y1) && isPositive(y2) && isPositive(y3)) {
    // [0, +, +]
    trendScore = 70;
  } else if (!isPositive(y1) && !isPositive(y2) && isPositive(y3)) {
    // [0, 0, +]
    trendScore = 70;
  } else if (!isPositive(y1) && isPositive(y2) && !isPositive(y3)) {
    // [0, +, 0]
    trendScore = 30;
  } else if (isPositive(y1) && !isPositive(y2) && !isPositive(y3)) {
    // [+, 0, 0]
    trendScore = 0;
  } else {
    // [0, 0, 0]
    trendScore = 0;
  }

  const score = 0.6 * consistencyScore + 0.4 * trendScore;

  return { score: round1(score), available: true };
}

/**
 * scoreNewsSentiment — pure scorer over the provider-neutral news sentiment
 * contract produced by stockService.getNewsSentiment():
 *   {
 *     status: 'ok' | 'unavailable',
 *     symbol: string,
 *     entries: Array<{ sentimentScore: number, relevanceScore: number }>,
 *     reason?: string
 *   }
 *
 * APPROVED StockWise scoring formula:
 * - Relevance-weighted average of all valid ticker-specific entries:
 *     weightedSentiment = Σ(sentimentScore * relevanceScore) / Σ(relevanceScore)
 * - If no valid entries or total relevance <= 0 -> unavailable.
 * - Convert weightedSentiment (-0.35..+0.35) to a 0-100 score:
 *     weightedSentiment <= -0.35 => 0
 *     weightedSentiment ==  0    => 50
 *     weightedSentiment >= +0.35 => 100
 *     between: rawScore = ((weightedSentiment + 0.35) / 0.70) * 100
 * - Clamp to [0, 100], round to 1 decimal via round1.
 *
 * Alpha Vantage's text sentiment label is NEVER used as the numeric score,
 * and a fake neutral 50 is never assigned when data is missing.
 */
function scoreNewsSentiment(newsData) {
  if (!newsData || typeof newsData !== 'object') {
    return {
      score: null,
      available: false,
      reason: 'News sentiment provider unavailable',
    };
  }

  if (newsData.status !== 'ok') {
    return {
      score: null,
      available: false,
      reason: newsData.reason || 'News sentiment data unavailable',
    };
  }

  const entries = newsData.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      score: null,
      available: false,
      reason: 'No usable ticker-specific news sentiment data',
    };
  }

  let weightedSum = 0;
  let relevanceSum = 0;

  for (const entry of entries) {
    const sentimentScore = nullableNumber(entry && entry.sentimentScore);
    const relevanceScore = nullableNumber(entry && entry.relevanceScore);

    if (sentimentScore === null || relevanceScore === null || relevanceScore <= 0) {
      continue;
    }

    weightedSum += sentimentScore * relevanceScore;
    relevanceSum += relevanceScore;
  }

  if (relevanceSum <= 0) {
    return {
      score: null,
      available: false,
      reason: 'Insufficient news sentiment data',
    };
  }

  const weightedSentiment = weightedSum / relevanceSum;

  // Approved mapping: -0.35 -> 0, 0 -> 50, +0.35 -> 100 (linear between).
  const rawScore = ((weightedSentiment + 0.35) / 0.7) * 100;
  const clamped = Math.min(100, Math.max(0, rawScore));

  return { score: round1(clamped), available: true };
}

/**
 * Orchestrator: consume the existing getStockBySymbol response shape and
 * return all 7 factors in the exact contract required by
 * reputationScoringEngine.js.
 *
 * @param {Object} stockData - getStockBySymbol response:
 *   { symbol, ..., indicators: { profitMargin, operatingMargin, revenueGrowth,
 *     epsGrowthYoY, debtToEquity, beta, analystRatingStrongBuy, ... }, history: [...] }
 */
function evaluateReputationFactors(stockData = {}) {
  const indicators = stockData.indicators || {};

  // earningsGrowthYoY is exposed by stockService as indicators.epsGrowthYoY;
  // accept indicators.earningsGrowthYoY as a fallback alias.
  const earningsGrowthYoY =
    indicators.epsGrowthYoY !== undefined ? indicators.epsGrowthYoY : indicators.earningsGrowthYoY;

  return {
    financialPerformance: scoreFinancialPerformance({
      profitMargin: indicators.profitMargin,
      operatingMargin: indicators.operatingMargin,
      revenueGrowth: indicators.revenueGrowth,
    }),
    priceStability: scorePriceStability({
      beta: indicators.beta,
      history: stockData.history,
    }),
    debtLevel: scoreDebtLevel({ debtToEquity: indicators.debtToEquity }),
    profitGrowth: scoreProfitGrowth({
      earningsGrowthYoY,
      revenueGrowth: indicators.revenueGrowth,
    }),
    dividendRecord: {
      score: null,
      available: false,
      reason: 'Dividend history unavailable - current yield alone does not establish a record',
    },
    marketReputation: scoreMarketReputation({
      analystRatingStrongBuy: indicators.analystRatingStrongBuy,
      analystRatingBuy: indicators.analystRatingBuy,
      analystRatingHold: indicators.analystRatingHold,
      analystRatingSell: indicators.analystRatingSell,
      analystRatingStrongSell: indicators.analystRatingStrongSell,
    }),
    newsSentiment: {
      score: null,
      available: false,
      reason: 'News sentiment provider unavailable',
    },
  };
}

module.exports = {
  bandScore,
  nullableNumber,
  round1,
  computeAnnualizedVolatility,
  scoreFinancialPerformance,
  scorePriceStability,
  scoreDebtLevel,
  scoreProfitGrowth,
  scoreMarketReputation,
  scoreDividendRecord,
  scoreNewsSentiment,
  evaluateReputationFactors,
};
