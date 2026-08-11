/**
 * Pure reputation score aggregation engine for the Module 2 Company
 * Reputation Score feature.
 *
 * - PURE: no I/O, no Alpha Vantage, no MongoDB, no external dependencies.
 * - Consumes per-factor results ({ score, available, reason? }) and the
 *   frozen FACTOR_WEIGHTS config to produce:
 *     - score             -> final /100 score, only when coverage is 100%
 *     - provisionalScore  -> weighted average over AVAILABLE factors only
 *     - coveragePercent   -> weight-based coverage (available / 100 * 100)
 *     - complete          -> true only when ALL configured factors available
 *     - missingFactors    -> factor key + reason for each unavailable factor
 *     - breakdown         -> per-factor score / weight / available / reason
 *
 * Design rules:
 * - Unavailable factors NEVER contribute to the weighted score.
 * - The final `score` is null until coverage is 100% — missing-factor
 *   weights are never silently redistributed.
 * - Available factor scores are strictly validated (finite, 0..100).
 * - Unavailable factors must NOT carry a non-null score — that is a
 *   validation error, not something we silently drop or display.
 * - No labels (Strong/Weak), no factor-specific financial thresholds.
 */

const { FACTOR_WEIGHTS, TOTAL_WEIGHT } = require('./reputationWeights');

const DEFAULT_PRECISION = 1;

/**
 * Round a numeric value to a fixed decimal precision.
 * @param {number|null} value
 * @param {number} [precision=1]
 * @returns {number|null}
 */
function roundScore(value, precision = DEFAULT_PRECISION) {
  if (value === null || value === undefined) return null;
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Validate that an available factor's score is a finite number in [0, 100].
 * Throws a descriptive error otherwise — scores are never silently clamped.
 * @param {unknown} score
 * @param {string} factorKey
 */
function validateAvailableFactorScore(score, factorKey) {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw new Error(
      `Reputation factor "${factorKey}" is marked available=true but has a non-finite score: ${String(score)}`
    );
  }
  if (score < 0 || score > 100) {
    throw new Error(
      `Reputation factor "${factorKey}" score must be between 0 and 100; received ${score}`
    );
  }
}

/**
 * Validate that an unavailable factor does not carry a non-null score.
 * @param {unknown} score
 * @param {string} factorKey
 */
function validateUnavailableFactorScore(score, factorKey) {
  if (score !== null && score !== undefined) {
    throw new Error(
      `Reputation factor "${factorKey}" is marked available=false but has a score: ${String(score)}`
    );
  }
}

/**
 * Weight-based coverage percentage: (available weight / total weight) * 100.
 * @param {number} availableWeight
 * @param {number} [totalWeight=TOTAL_WEIGHT]
 * @returns {number}
 */
function calculateCoveragePercent(availableWeight, totalWeight = TOTAL_WEIGHT) {
  if (typeof availableWeight !== 'number' || !Number.isFinite(availableWeight) || availableWeight < 0) {
    throw new Error('availableWeight must be a non-negative finite number');
  }
  if (totalWeight <= 0) {
    return 0;
  }
  return roundScore((availableWeight / totalWeight) * 100);
}

/**
 * Aggregate per-factor results into a reputation score summary.
 *
 * @param {Object} factors - object keyed by every configured factor name.
 *   Each value: { score: number|null, available: boolean, reason?: string }
 * @returns {{
 *   score: number|null,
 *   provisionalScore: number|null,
 *   coveragePercent: number,
 *   complete: boolean,
 *   missingFactors: Array<{ factor: string, reason: string|null }>,
 *   breakdown: Object<string, { score: number|null, weight: number, available: boolean, reason?: string }>,
 *   availableWeight: number,
 *   totalWeight: number
 * }}
 */
function aggregateReputationScore(factors = {}) {
  if (!factors || typeof factors !== 'object' || Array.isArray(factors)) {
    throw new Error('Reputation factors must be provided as an object keyed by factor name');
  }

  const factorKeys = Object.keys(FACTOR_WEIGHTS);

  // Every configured factor must be present so a partial input can never be
  // mistaken for a complete one.
  for (const key of factorKeys) {
    if (!Object.prototype.hasOwnProperty.call(factors, key)) {
      throw new Error(`Missing reputation factor "${key}" in input`);
    }
  }

  const breakdown = {};
  const missingFactors = [];
  let availableWeight = 0;
  let weightedScoreSum = 0;

  for (const key of factorKeys) {
    const factor = factors[key] || {};
    const weight = FACTOR_WEIGHTS[key];

    if (typeof factor.available !== 'boolean') {
      throw new Error(
        `Reputation factor "${key}" must have available set to true or false`
      );
    }
    const available = factor.available;

    const score = factor.score === undefined || factor.score === null ? null : factor.score;
    const reason = factor.reason === undefined ? null : factor.reason;

    if (available) {
      validateAvailableFactorScore(score, key);
      availableWeight += weight;
      weightedScoreSum += score * weight;
    } else {
      validateUnavailableFactorScore(score, key);
      missingFactors.push({ factor: key, reason });
    }

    breakdown[key] = {
      score,
      weight,
      available,
      ...(reason !== null ? { reason } : {}),
    };
  }

  const coveragePercent = calculateCoveragePercent(availableWeight);

  let provisionalScore = null;
  if (availableWeight > 0) {
    // Normalize ONLY over the available weight — unavailable factors never
    // dilute or inflate the provisional figure.
    provisionalScore = roundScore(weightedScoreSum / availableWeight);
  }

  const complete = availableWeight === TOTAL_WEIGHT;
  const score = complete ? provisionalScore : null;

  return {
    score,
    provisionalScore,
    coveragePercent,
    complete,
    missingFactors,
    breakdown,
    availableWeight,
    totalWeight: TOTAL_WEIGHT,
  };
}

module.exports = {
  aggregateReputationScore,
  calculateCoveragePercent,
  roundScore,
  validateAvailableFactorScore,
  validateUnavailableFactorScore,
};