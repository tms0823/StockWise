import React from 'react';

// User-friendly names for the backend breakdown factor keys.
const FACTOR_LABELS = {
  financialPerformance: 'Financial Performance',
  priceStability: 'Price Stability',
  dividendRecord: 'Dividend Record',
  debtLevel: 'Debt Level',
  profitGrowth: 'Profit Growth',
  marketReputation: 'Market Reputation',
  newsSentiment: 'News Sentiment',
};

const formatScore = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(1);
};

// Make backend reasons readable: strip only trailing periods, capitalize the
// first letter. Non-strings or empty reasons fall back to a default message.
const readableReason = (reason) => {
  if (!reason || typeof reason !== 'string') {
    return 'Information unavailable';
  }

  const cleaned = reason.trim().replace(/\.+$/, '');
  if (!cleaned) return 'Information unavailable';

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export default function ReputationScoreCard({ reputation, loading, error }) {
  const coveragePercent = reputation?.coveragePercent;

  const renderScoreArea = () => {
    if (loading) {
      return (
        <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Loading reputation score...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ color: '#f43f5e', fontSize: '0.95rem' }}>
          Reputation data temporarily unavailable. Please try again later.
        </div>
      );
    }

    if (!reputation) {
      return null;
    }

    const { score, provisionalScore, complete } = reputation;

    // No usable score.
    if (score == null && provisionalScore == null) {
      return (
        <>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '12px 0' }}>
            Reputation score unavailable
          </div>
          {coveragePercent != null && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Data Coverage: {coveragePercent}%
            </p>
          )}
        </>
      );
    }

    // Complete score — a final score exists.
    if (complete === true) {
      return (
        <>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', margin: '12px 0' }}>
            {formatScore(score)} / 100
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Data Coverage: {coveragePercent}%
          </p>
        </>
      );
    }

    // Incomplete score — provisional only, never presented as final.
    if (provisionalScore != null) {
      return (
        <>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', margin: '12px 0' }}>
            {formatScore(provisionalScore)} / 100
          </div>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              padding: '4px 12px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            Provisional
          </span>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Data Coverage: {coveragePercent}%
          </p>
        </>
      );
    }

    return null;
  };

  const breakdown = reputation?.breakdown;
  const breakdownEntries = breakdown ? Object.entries(breakdown) : [];

  return (
    <div>
      {/* Main reputation area */}
      <div
        style={{
          background: 'rgba(18, 26, 43, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Company Reputation Score</h3>
        {renderScoreArea()}
      </div>

      {/* Reputation Score Breakdown */}
      {breakdownEntries.length > 0 && (
        <div
          style={{
            background: 'rgba(18, 26, 43, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px',
            borderRadius: '16px',
          }}
        >
          <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#f8fafc' }}>Reputation Score Breakdown</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
            }}
          >
            {breakdownEntries.map(([key, factor]) => {
              const label = FACTOR_LABELS[key] || key;
              const weight = factor?.weight;
              const score = factor?.available ? factor.score : null;

              return (
                <div
                  key={key}
                  style={{
                    background: 'rgba(15,23,42,0.6)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{label}</div>

                  {factor?.available ? (
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '6px 0' }}>
                      Score: {formatScore(score)} / 100
                    </div>
                  ) : (
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '6px 0', color: '#f43f5e' }}>
                      Unavailable
                    </div>
                  )}

                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    Weight: {weight}
                  </div>

                  {!factor?.available && (
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px' }}>
                      Reason: {readableReason(factor?.reason)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}