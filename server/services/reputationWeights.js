/**
 * Reputation factor weight configuration for the Module 2 Company
 * Reputation Score feature.
 *
 * - Total configured weight MUST equal 100.
 * - Object is frozen (immutable) so downstream services cannot mutate it.
 * - No I/O, no dependencies — safe to require anywhere.
 *
 * NOTE: These weights reserve 20 points for factors that are not yet
 * available (marketReputation, newsSentiment). The scoring engine handles
 * unavailable factors via weight-based coverage — it never silently
 * redistributes these reserved points.
 */

const FACTOR_WEIGHTS = Object.freeze({
  financialPerformance: 20,
  priceStability: 15,
  dividendRecord: 15,
  debtLevel: 15,
  profitGrowth: 15,
  marketReputation: 10,
  newsSentiment: 10,
});

// Validate the invariant at module load time (pure, no I/O).
const TOTAL_WEIGHT = Object.values(FACTOR_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0
);

if (TOTAL_WEIGHT !== 100) {
  throw new Error(
    `Reputation factor weights must total 100; current total is ${TOTAL_WEIGHT}`
  );
}

module.exports = { FACTOR_WEIGHTS, TOTAL_WEIGHT };