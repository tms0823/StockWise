/**
 * Frozen anchor tables + constants for the Module 2 reputation factor
 * scorers. Pure configuration only — no I/O, no dependencies.
 *
 * Each band table is a list of { x, y } anchors where:
 *   - x = raw metric value
 *   - y = submetric score (0–100)
 * bandScore() interpolates linearly BETWEEN anchors and saturates only
 * beyond the outer endpoints.
 *
 * These thresholds are PROJECT SCORING RULES for StockWise (a university
 * project) — they are NOT universal investment advice.
 */

const MARGIN_BANDS = Object.freeze([
  Object.freeze({ x: -0.2, y: 5 }),
  Object.freeze({ x: -0.1, y: 10 }),
  Object.freeze({ x: -0.05, y: 25 }),
  Object.freeze({ x: 0, y: 40 }),
  Object.freeze({ x: 0.05, y: 55 }),
  Object.freeze({ x: 0.1, y: 70 }),
  Object.freeze({ x: 0.15, y: 85 }),
  Object.freeze({ x: 0.2, y: 100 }),
]);

const OP_MARGIN_BANDS = Object.freeze([
  Object.freeze({ x: -0.2, y: 5 }),
  Object.freeze({ x: -0.1, y: 10 }),
  Object.freeze({ x: -0.05, y: 25 }),
  Object.freeze({ x: 0, y: 38 }),
  Object.freeze({ x: 0.05, y: 50 }),
  Object.freeze({ x: 0.1, y: 62 }),
  Object.freeze({ x: 0.15, y: 75 }),
  Object.freeze({ x: 0.2, y: 88 }),
  Object.freeze({ x: 0.25, y: 100 }),
]);

const REVENUE_GROWTH_BANDS = Object.freeze([
  Object.freeze({ x: -0.5, y: 0 }),
  Object.freeze({ x: -0.2, y: 5 }),
  Object.freeze({ x: -0.1, y: 20 }),
  Object.freeze({ x: -0.05, y: 35 }),
  Object.freeze({ x: 0, y: 50 }),
  Object.freeze({ x: 0.05, y: 65 }),
  Object.freeze({ x: 0.1, y: 75 }),
  Object.freeze({ x: 0.2, y: 90 }),
  Object.freeze({ x: 0.3, y: 100 }),
]);

const EARNINGS_GROWTH_BANDS = Object.freeze([
  Object.freeze({ x: -0.5, y: 0 }),
  Object.freeze({ x: -0.2, y: 15 }),
  Object.freeze({ x: -0.1, y: 28 }),
  Object.freeze({ x: -0.05, y: 38 }),
  Object.freeze({ x: 0, y: 50 }),
  Object.freeze({ x: 0.05, y: 63 }),
  Object.freeze({ x: 0.1, y: 72 }),
  Object.freeze({ x: 0.2, y: 84 }),
  Object.freeze({ x: 0.3, y: 92 }),
  Object.freeze({ x: 0.5, y: 100 }),
]);

// Annualized volatility (decimal, e.g. 0.30 = 30%).
const VOLATILITY_BANDS = Object.freeze([
  Object.freeze({ x: 0.15, y: 100 }),
  Object.freeze({ x: 0.2, y: 90 }),
  Object.freeze({ x: 0.3, y: 75 }),
  Object.freeze({ x: 0.4, y: 60 }),
  Object.freeze({ x: 0.6, y: 40 }),
  Object.freeze({ x: 0.8, y: 25 }),
  Object.freeze({ x: 1.2, y: 5 }),
]);

const BETA_BANDS = Object.freeze([
  Object.freeze({ x: 0.5, y: 95 }),
  Object.freeze({ x: 0.8, y: 85 }),
  Object.freeze({ x: 1, y: 75 }),
  Object.freeze({ x: 1.5, y: 60 }),
  Object.freeze({ x: 2, y: 45 }),
  Object.freeze({ x: 3, y: 25 }),
  Object.freeze({ x: 5, y: 5 }),
]);

const DEBT_TO_EQUITY_BANDS = Object.freeze([
  Object.freeze({ x: 0, y: 100 }),
  Object.freeze({ x: 0.3, y: 100 }),
  Object.freeze({ x: 0.5, y: 88 }),
  Object.freeze({ x: 0.8, y: 75 }),
  Object.freeze({ x: 1, y: 65 }),
  Object.freeze({ x: 1.5, y: 50 }),
  Object.freeze({ x: 2, y: 38 }),
  Object.freeze({ x: 3, y: 20 }),
  Object.freeze({ x: 5, y: 5 }),
]);

// Minimum number of valid (finite, positive) daily closes required before
// historical volatility is considered reliable.
const VOLATILITY_MIN_DAYS = 60;

// Trading days used to annualize daily volatility.
const ANNUALIZATION_FACTOR = 252;

// A single-day adjacent return with absolute value above this threshold is
// considered unreliable (split / bad unadjusted data / genuine extreme),
// making priceStability unavailable rather than guessed.
const EXTREME_RETURN_THRESHOLD = 1.0;

const SUBMETRIC_WEIGHTS = Object.freeze({
  priceStability: Object.freeze({ volatility: 0.7, beta: 0.3 }),
  profitGrowth: Object.freeze({ earnings: 0.5, revenue: 0.5 }),
});

module.exports = {
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
};