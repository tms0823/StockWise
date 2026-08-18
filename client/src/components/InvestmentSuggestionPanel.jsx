/**
 * InvestmentSuggestionPanel.jsx
 * Module 2 — Feature 2 | Member 4
 *
 * Renders TWO cards side-by-side:
 *   Card A — M2-F3: Investment Suggestion Status  (Strong / Moderate / Risky / Weak)
 *   Card B — M2-F4: Risk Indicator System          (Low / Medium / High Risk)
 *
 * Both cards share a mandatory educational disclaimer banner at the bottom,
 * satisfying the spec requirement that every view presenting suggestion
 * statuses or risk indicators must display the disclaimer.
 *
 * Props:
 *   symbol  {string}  — stock ticker, e.g. "AAPL"
 *
 * Data:
 *   Fetches GET /api/stocks/:symbol/suggestion (JWT attached by the api client).
 *   Independent of the parent's stock / reputation fetch — a failure here
 *   renders a graceful fallback without breaking the rest of CompanyDetail.
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/suggestion.css';

// ─── Colour helpers (map color strings from the API to CSS classes) ────────
const COLOR_TO_CLASS = {
  green: 'sw-sug--green',
  blue:  'sw-sug--blue',
  amber: 'sw-sug--amber',
  red:   'sw-sug--red',
};

const colorClass = (color) => COLOR_TO_CLASS[color] || 'sw-sug--blue';

// ─── Icon helpers (Unicode, no extra dependency) ───────────────────────────
const SUGGESTION_ICONS = {
  Strong:   '🏆',
  Moderate: '📊',
  Risky:    '⚠️',
  Weak:     '📉',
};

const RISK_ICONS = {
  'Low Risk':    '🛡️',
  'Medium Risk': '⚡',
  'High Risk':   '🔥',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Suggestion Status Card (M2-F3)
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionCard({ suggestion }) {
  if (!suggestion) {
    return (
      <div className="sw-card sw-card--muted">
        <div className="sw-card__header">
          <span className="sw-card__icon">📊</span>
          <h3 className="sw-card__title">Investment Suggestion</h3>
        </div>
        <p className="sw-card__unavailable">
          Suggestion status unavailable — insufficient reputation data.
        </p>
      </div>
    );
  }

  const { status, statusColor, description, score, scoreSource } = suggestion;
  const cc = colorClass(statusColor);
  const icon = SUGGESTION_ICONS[status] || '📊';

  return (
    <div className={`sw-card ${cc}`}>
      {/* Header */}
      <div className="sw-card__header">
        <span className="sw-card__icon" aria-hidden="true">{icon}</span>
        <h3 className="sw-card__title">Investment Suggestion</h3>
        {scoreSource === 'provisional' && (
          <span className="sw-badge sw-badge--amber sw-badge--sm" title="Based on partially available data">
            Provisional
          </span>
        )}
      </div>

      {/* Big status badge */}
      <div className="sw-status-row">
        <span className={`sw-badge sw-badge--lg ${cc}`} id="suggestion-status-badge">
          {status}
        </span>
        {score !== null && score !== undefined && (
          <span className="sw-score-pill">
            Score: <strong>{Number(score).toFixed(1)}</strong> / 100
          </span>
        )}
      </div>

      {/* Score progress bar */}
      {score !== null && score !== undefined && (
        <div className="sw-progress-wrap" aria-label={`Reputation score: ${Number(score).toFixed(1)} out of 100`}>
          <div
            className={`sw-progress-bar ${cc}`}
            style={{ width: `${Math.min(100, Math.max(0, Number(score)))}%` }}
            role="progressbar"
            aria-valuenow={Number(score).toFixed(1)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {/* Description */}
      <p className="sw-card__desc">{description}</p>

      {/* Status scale */}
      <div className="sw-scale">
        {['Strong', 'Moderate', 'Risky', 'Weak'].map((s) => (
          <span
            key={s}
            className={`sw-scale__step ${s === status ? `sw-scale__step--active ${cc}` : ''}`}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Risk Indicator Card (M2-F4)
// ─────────────────────────────────────────────────────────────────────────────
function RiskCard({ risk }) {
  if (!risk) {
    return (
      <div className="sw-card sw-card--muted">
        <div className="sw-card__header">
          <span className="sw-card__icon">🛡️</span>
          <h3 className="sw-card__title">Risk Indicator</h3>
        </div>
        <p className="sw-card__unavailable">Risk data unavailable.</p>
      </div>
    );
  }

  const { level, levelColor, badge, description, factors } = risk;
  const cc = colorClass(levelColor);
  const icon = RISK_ICONS[level] || '⚡';

  return (
    <div className={`sw-card ${cc}`}>
      {/* Header */}
      <div className="sw-card__header">
        <span className="sw-card__icon" aria-hidden="true">{icon}</span>
        <h3 className="sw-card__title">Risk Indicator</h3>
      </div>

      {/* Big risk badge */}
      <div className="sw-status-row">
        <span className={`sw-badge sw-badge--lg ${cc}`} id="risk-level-badge">
          {level}
        </span>
        <span className="sw-score-pill">{badge}</span>
      </div>

      {/* Description */}
      <p className="sw-card__desc">{description}</p>

      {/* Factor breakdown table */}
      <div className="sw-factor-grid">
        <FactorRow
          label="Beta (Price Volatility)"
          value={factors.beta !== null ? factors.beta.toFixed(2) : 'N/A'}
          sub={factors.betaLabel}
        />
        <FactorRow
          label="Debt-to-Equity"
          value={factors.debtToEquity !== null ? factors.debtToEquity.toFixed(2) : 'N/A'}
          sub={factors.debtLabel}
        />
        <FactorRow
          label="News Sentiment"
          value={factors.sentimentScore !== null ? `${Number(factors.sentimentScore).toFixed(1)}/100` : 'N/A'}
          sub={factors.sentimentLabel}
        />
      </div>

      {/* Beta reference scale */}
      <div className="sw-beta-scale">
        <span className="sw-beta-scale__label">Low (&lt; 0.8)</span>
        <div className="sw-beta-scale__track">
          <div
            className={`sw-beta-scale__dot ${cc}`}
            style={{
              left: `${Math.min(98, Math.max(2, ((factors.beta || 1) / 3) * 100))}%`,
            }}
            title={`Beta: ${factors.beta}`}
          />
        </div>
        <span className="sw-beta-scale__label">High (&gt; 2.0)</span>
      </div>
    </div>
  );
}

function FactorRow({ label, value, sub }) {
  return (
    <div className="sw-factor-row">
      <span className="sw-factor-row__label">{label}</span>
      <div className="sw-factor-row__right">
        <span className="sw-factor-row__value">{value}</span>
        <span className="sw-factor-row__sub">{sub}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: InvestmentSuggestionPanel
// ─────────────────────────────────────────────────────────────────────────────
export default function InvestmentSuggestionPanel({ symbol }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const load = async () => {
      try {
        const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/suggestion`);
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Failed to load suggestion data.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [symbol]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sw-panel sw-panel--loading" aria-live="polite">
        <div className="sw-spinner" aria-hidden="true" />
        <span>Loading investment suggestion for {symbol}…</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="sw-panel sw-panel--error" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>Suggestion data temporarily unavailable: {error}</span>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <section className="sw-panel" aria-label="Investment Suggestion and Risk Assessment">
      {/* Section heading */}
      <div className="sw-panel__header">
        <h2 className="sw-panel__title">Investment Suggestion &amp; Risk Assessment</h2>
      </div>

      {/* Two cards grid */}
      <div className="sw-cards-grid">
        <SuggestionCard suggestion={data?.suggestion} />
        <RiskCard risk={data?.risk} />
      </div>

      {/* ── MANDATORY DISCLAIMER — must always be visible ────────────────── */}
      <div className="sw-disclaimer" role="note" aria-label="Educational disclaimer">
        <span className="sw-disclaimer__icon" aria-hidden="true">ℹ️</span>
        <p className="sw-disclaimer__text">
          <strong>Educational Purpose Only:</strong>{' '}
          {data?.disclaimer ||
            'For educational purposes only — not guaranteed financial advice.'}
          {' '}Suggestion and risk labels are computed from publicly available financial
          data and are intended solely for learning. They do not constitute
          investment advice, and no trades should be made based on this information.
        </p>
      </div>
    </section>
  );
}
