/**
 * suggestionService.js — Module 2, Feature 2
 * Member 4: Investment Suggestion Status (M2-F3) + Risk Indicator System (M2-F4)
 *
 * DESIGN RULES:
 * - Pure function: no I/O, no MongoDB, no Alpha Vantage calls here.
 * - Consumes the output of reputationService.getReputation() and the raw
 *   stock object from stockService.getStockBySymbol() — both already exist
 *   in the team codebase, so nothing is duplicated.
 * - Returns null fields with a reason when data is unavailable; never
 *   fabricates a label from missing data.
 * - The DISCLAIMER constant is injected into every response object so the
 *   frontend can never accidentally omit it (spec requirement).
 */

const DISCLAIMER =
  'For educational purposes only — not guaranteed financial advice.';

// ─────────────────────────────────────────────────────────────────────────────
// M2-F3 SUGGESTION STATUS
// Thresholds map directly from the spec: Strong / Moderate / Risky / Weak
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a numeric reputation score (0–100) to a suggestion status label.
 * Uses `provisionalScore` when a full score is not yet available (coverage < 100%).
 *
 * @param {number|null} score         - Final score (available when coverage = 100%)
 * @param {number|null} provisionalScore - Partial score (available even with missing factors)
 * @param {boolean}     complete      - True when all 7 factors were available
 * @returns {{ status, statusColor, description, score: number|null, scoreSource: string }|null}
 */
function deriveSuggestion(score, provisionalScore, complete) {
  // Prefer the final score; fall back to provisional; return null if neither exists.
  const useScore = score !== null && score !== undefined ? score : provisionalScore;

  if (useScore === null || useScore === undefined || !Number.isFinite(Number(useScore))) {
    return null;
  }

  const s = Number(useScore);
  const scoreSource = complete ? 'complete' : 'provisional';

  if (s >= 80) {
    return {
      status: 'Strong',
      statusColor: 'green',
      description:
        'This company demonstrates excellent financial health, strong profit growth, ' +
        'and stable market behavior. It is considered a top-quality educational study subject.',
      score: s,
      scoreSource,
    };
  }

  if (s >= 65) {
    return {
      status: 'Moderate',
      statusColor: 'blue',
      description:
        'This company shows solid fundamentals with some areas that warrant attention. ' +
        'Suitable for intermediate-level educational analysis.',
      score: s,
      scoreSource,
    };
  }

  if (s >= 50) {
    return {
      status: 'Risky',
      statusColor: 'amber',
      description:
        'This company has notable weaknesses in one or more financial factors. ' +
        'Caution is advised; useful for studying high-risk investment scenarios.',
      score: s,
      scoreSource,
    };
  }

  return {
    status: 'Weak',
    statusColor: 'red',
    description:
      'This company exhibits significant financial instability or declining performance. ' +
      'Recommended for educational case studies on underperforming assets only.',
    score: s,
    scoreSource,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// M2-F4 RISK INDICATOR SYSTEM
// Combines: price volatility (beta), leverage (debt-to-equity), and
// news sentiment factor score from the reputation breakdown.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map beta to a risk contribution label.
 * Based on the BETA_BANDS already defined in reputationBands.js (reference only,
 * not imported — we apply plain threshold logic here to keep this file standalone).
 *
 * @param {number} beta
 * @returns {{ label: string, severity: number }} severity: 1=low, 2=medium, 3=high
 */
function betaRisk(beta) {
  if (!Number.isFinite(beta) || beta < 0) return { label: 'Unknown', severity: 2 };
  if (beta < 0.8)  return { label: 'Below Market Volatility', severity: 1 };
  if (beta < 1.2)  return { label: 'Near Market Volatility',  severity: 2 };
  if (beta < 2.0)  return { label: 'Above Market Volatility', severity: 2 };
  return { label: 'High Volatility', severity: 3 };
}

/**
 * Map debt-to-equity ratio to a risk contribution.
 *
 * @param {number} debtToEquity
 * @returns {{ label: string, severity: number }}
 */
function debtRisk(debtToEquity) {
  if (!Number.isFinite(debtToEquity) || debtToEquity < 0) return { label: 'Unknown', severity: 2 };
  if (debtToEquity < 0.5)  return { label: 'Low Leverage',      severity: 1 };
  if (debtToEquity < 1.0)  return { label: 'Moderate Leverage', severity: 2 };
  if (debtToEquity < 2.0)  return { label: 'Elevated Leverage', severity: 2 };
  return { label: 'High Leverage', severity: 3 };
}

/**
 * Map newsSentiment score (0–100) to a sentiment label for risk purposes.
 *
 * @param {number|null} sentimentScore
 * @returns {{ label: string, severity: number }}
 */
function sentimentRisk(sentimentScore) {
  if (sentimentScore === null || sentimentScore === undefined || !Number.isFinite(sentimentScore)) {
    return { label: 'Unavailable', severity: 2 };
  }
  if (sentimentScore >= 75) return { label: 'Positive News Trend',  severity: 1 };
  if (sentimentScore >= 50) return { label: 'Neutral News Trend',   severity: 2 };
  if (sentimentScore >= 30) return { label: 'Mixed News Trend',     severity: 2 };
  return { label: 'Negative News Trend', severity: 3 };
}

/**
 * Aggregate the three severity signals into a combined risk level.
 *
 * @param {number} betaSeverity
 * @param {number} debtSeverity
 * @param {number} sentimentSeverity
 * @returns {{ level: string, levelColor: string, badge: string }}
 */
function aggregateRiskLevel(betaSeverity, debtSeverity, sentimentSeverity) {
  // Simple average, then round to nearest integer band.
  const avg = (betaSeverity + debtSeverity + sentimentSeverity) / 3;

  if (avg <= 1.5) {
    return {
      level: 'Low Risk',
      levelColor: 'green',
      badge: 'Low Volatility',
    };
  }

  if (avg <= 2.3) {
    return {
      level: 'Medium Risk',
      levelColor: 'amber',
      badge: 'Moderate Volatility',
    };
  }

  return {
    level: 'High Risk',
    levelColor: 'red',
    badge: 'High Volatility',
  };
}

/**
 * Build a human-readable risk description from the contributing factors.
 *
 * @param {string} betaLabel
 * @param {string} debtLabel
 * @param {string} sentimentLabel
 * @param {string} overallLevel
 * @returns {string}
 */
function buildRiskDescription(betaLabel, debtLabel, sentimentLabel, overallLevel) {
  return (
    `${overallLevel} assessment: price volatility is ${betaLabel.toLowerCase()}, ` +
    `debt leverage is ${debtLabel.toLowerCase()}, and market sentiment shows ` +
    `${sentimentLabel.toLowerCase()}. ` +
    'This is an educational classification, not a professional risk rating.'
  );
}

/**
 * Derive the M2-F4 risk indicator result from raw stock metrics and the
 * reputation factor breakdown.
 *
 * @param {object} stockIndicators  - stock.indicators from stockService
 * @param {object|null} breakdown   - reputation.breakdown from reputationService
 * @returns {object}
 */
function deriveRisk(stockIndicators, breakdown) {
  // Extract beta and debtToEquity from stockIndicators (may be missing).
  const beta = stockIndicators?.beta;
  const debtToEquity = stockIndicators?.debtToEquity;

  // Extract newsSentiment sub-score from the reputation breakdown (if available).
  const newsSentimentEntry = breakdown?.newsSentiment;
  const sentimentScore =
    newsSentimentEntry?.available === true ? newsSentimentEntry.score : null;

  const betaResult      = betaRisk(beta !== null && beta !== undefined ? Number(beta) : NaN);
  const debtResult      = debtRisk(debtToEquity !== null && debtToEquity !== undefined ? Number(debtToEquity) : NaN);
  const sentimentResult = sentimentRisk(sentimentScore);

  const { level, levelColor, badge } = aggregateRiskLevel(
    betaResult.severity,
    debtResult.severity,
    sentimentResult.severity
  );

  const description = buildRiskDescription(
    betaResult.label,
    debtResult.label,
    sentimentResult.label,
    level
  );

  return {
    level,
    levelColor,
    badge,
    description,
    factors: {
      beta: Number.isFinite(Number(beta)) ? Number(beta) : null,
      betaLabel: betaResult.label,
      debtToEquity: Number.isFinite(Number(debtToEquity)) ? Number(debtToEquity) : null,
      debtLabel: debtResult.label,
      sentimentScore,
      sentimentLabel: sentimentResult.label,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compose the full M2-F3 + M2-F4 result object.
 *
 * @param {object} reputationResult - Output of reputationService.getReputation()
 * @param {object} stockData        - Output of stockService.getStockBySymbol()
 * @returns {{
 *   symbol: string,
 *   suggestion: object|null,
 *   risk: object,
 *   disclaimer: string,
 *   computedAt: string
 * }}
 */
function computeSuggestionAndRisk(reputationResult, stockData) {
  const { score, provisionalScore, complete, breakdown } = reputationResult;

  const suggestion = deriveSuggestion(score, provisionalScore, complete);
  const risk = deriveRisk(stockData.indicators || stockData, breakdown);

  return {
    symbol: stockData.symbol,
    suggestion,
    risk,
    disclaimer: DISCLAIMER,
    computedAt: new Date().toISOString(),
  };
}

module.exports = { computeSuggestionAndRisk, DISCLAIMER };
