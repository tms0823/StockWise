// =========================================================================
// MEMBER 4: COMPANY PROFILE PAGE & FINANCIAL INDICATOR DISPLAY
// Uses the project's existing authenticated API client (JWT Bearer token)
// and the existing backend stock endpoints. Only fields that actually exist
// in the backend response are mapped; unavailable fields show N/A or are
// omitted rather than fabricated.
// =========================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReputationScoreCard from './ReputationScoreCard';
import InvestmentSuggestionPanel from './InvestmentSuggestionPanel';

// Map the CompanyDetail timeframe buttons to the backend history ranges.
// The backend supports 1d, 1w, 1m, 3m, 1y — 5Y falls back to 1y.
const TIMEFRAME_TO_RANGE = {
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  '1Y': '1y',
  '5Y': '1y',
};

const formatRatioPercent = (value, signed = false) => {
  if (value === null || value === undefined) return 'N/A';

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'N/A';

  const percent = numeric * 100;

  if (signed && percent > 0) {
    return `+${percent.toFixed(2)}%`;
  }

  return `${percent.toFixed(2)}%`;
};

export default function CompanyDetail() {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  const symbol = (urlSymbol || 'AAPL').toUpperCase();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [reputationLoading, setReputationLoading] = useState(false);
  const [reputationError, setReputationError] = useState(null);
  const [timeframe, setTimeframe] = useState('1M');
  const [chartData, setChartData] = useState([]);
  const [watchlist, setWatchlist] = useState(['AAPL', 'NVDA']);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [shares, setShares] = useState(5);
  const [tradeMsg, setTradeMsg] = useState('');
  const [portfolio, setPortfolio] = useState({ virtualBalance: 100000.0, holdings: [] });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const range = TIMEFRAME_TO_RANGE[timeframe] || '1m';

    const load = async () => {
      try {
        // Existing authenticated endpoints — the api client attaches the JWT.
        const stockRes = await api.get(`/stocks/${encodeURIComponent(symbol)}`);
        if (cancelled) return;

        const raw = stockRes.data.data;
        // Map only fields that actually exist in the backend response.
        setStock({
          ...raw,
          price: raw.currentPrice,
          change: raw.dailyChange,
          changePercent: raw.dailyChangePercent,
        });

        // Chart data comes from the existing history endpoint.
        try {
          const historyRes = await api.get(
            `/stocks/${encodeURIComponent(symbol)}/history?range=${range}`
          );
          if (!cancelled) {
            setChartData(historyRes.data.data.history || []);
          }
        } catch (historyErr) {
          // History is secondary — keep the profile but show no chart points.
          if (!cancelled) setChartData([]);
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          const message = err.response?.data?.message || err.message || 'Something went wrong';

          let friendlyMessage = message;
          if (status === 401) {
            friendlyMessage = 'Authentication required. Please log in again.';
          } else if (status === 404) {
            friendlyMessage = 'Invalid stock symbol. Please try another symbol.';
          } else if (status === 429) {
            friendlyMessage = 'Stock data provider rate limit reached. Please try again later.';
          } else if (!err.response) {
            friendlyMessage = 'Network error — cannot reach the server.';
          }

          setError({ message: friendlyMessage, status });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  // Independent reputation fetch — a failure here must NOT affect the rest
  // of the Company Profile (header, price, indicators, chart/history).
  useEffect(() => {
    let cancelled = false;

    setReputation(null);
    setReputationError(null);
    setReputationLoading(true);

    const loadReputation = async () => {
      try {
        const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/reputation`);
        if (!cancelled) {
          setReputation(res.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setReputationError(err);
        }
      } finally {
        if (!cancelled) {
          setReputationLoading(false);
        }
      }
    };

    loadReputation();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const toggleWatchlist = () => {
    // No backend watchlist route exists — keep it local-only.
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const executeBuy = (e) => {
    e.preventDefault();
    const totalCost = shares * (stock?.price || 0);
    if (totalCost > portfolio.virtualBalance) {
      setTradeMsg('Insufficient virtual balance.');
      return;
    }
    // Local-only practice investment — no backend portfolio route exists.
    setPortfolio((prev) => ({
      virtualBalance: prev.virtualBalance - totalCost,
      holdings: [
        ...prev.holdings,
        { symbol, shares, avgPrice: stock?.price || 0, totalCost },
      ],
    }));
    setTradeMsg(`Bought ${shares} share(s) of ${symbol} for $${totalCost.toFixed(2)}.`);
    setTimeout(() => {
      setTradeMsg('');
      setIsTradeModalOpen(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
        Loading Details for {symbol}...
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#f43f5e' }}>
        {error?.message || 'Stock not found'}
      </div>
    );
  }

  const isSaved = watchlist.includes(symbol);
  const isPos = (stock.change ?? 0) >= 0;
  const sector = stock.sector || 'N/A';
  const industry = stock.industry || 'N/A';
  const exchange = stock.exchange || 'N/A';
  const indicators = stock.indicators || null;
  const news = Array.isArray(stock.news) ? stock.news : [];

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← Back
      </button>

      {/* 1. Company Profile Header */}
      <div
        style={{
          background: 'rgba(18, 26, 43, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '28px',
          borderRadius: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {stock.name || 'Unknown Company'} ({stock.symbol})
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '4px' }}>
              {sector} • {industry} | {exchange}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>
              ${stock.price !== null && stock.price !== undefined ? stock.price.toFixed(2) : 'N/A'}
            </div>
            {stock.change !== null && stock.change !== undefined && (
              <span
                style={{
                  background: isPos ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                  color: isPos ? '#10b981' : '#f43f5e',
                  padding: '4px 12px',
                  borderRadius: '99px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
              >
                {isPos ? '+' : ''}
                {stock.change.toFixed(2)} (
                {stock.changePercent !== null && stock.changePercent !== undefined
                  ? `${isPos ? '+' : ''}${stock.changePercent.toFixed(2)}%`
                  : 'N/A'}
                )
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={toggleWatchlist}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {isSaved ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>
          <button
            onClick={() => setIsTradeModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            + Practice Investment
          </button>
        </div>
      </div>

      {/* 2. Interactive Chart (uses existing /history endpoint) */}
      <div
        style={{
          background: 'rgba(18, 26, 43, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Interactive Stock Chart</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['1D', '1W', '1M', '1Y', '5Y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? '#6366f1' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            height: '240px',
            background: 'rgba(15,23,42,0.5)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
          }}
        >
          {chartData.length > 0
            ? `Chart Stream: ${chartData.length} time points loaded for ${timeframe} timeframe`
            : 'No chart data available for this timeframe.'}
        </div>
      </div>

      {/* 3. Company Reputation Score & Breakdown */}
      <ReputationScoreCard
        reputation={reputation}
        loading={reputationLoading}
        error={reputationError}
      />

      {/* 3b. Investment Suggestion Status & Risk Indicator */}
      <InvestmentSuggestionPanel symbol={symbol} />

      {/* 4. Financial Indicator Display Grid */}
      <div
        style={{
          background: 'rgba(18, 26, 43, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Financial Indicator Display</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          <IndicatorCard
            title="Price-to-Earnings (P/E)"
            val={indicators?.peRatio != null ? `${Number(indicators.peRatio).toFixed(2)}x` : 'N/A'}
            desc={indicators?.sectorAvgPE != null ? `Sector Avg: ${indicators.sectorAvgPE}x` : 'Unavailable'}
          />
          <IndicatorCard
            title="Earnings Per Share (EPS)"
            val={indicators?.eps != null ? `$${Number(indicators.eps).toFixed(2)}` : 'N/A'}
            desc={indicators?.epsGrowthYoY != null ? `YoY Growth: ${formatRatioPercent(indicators.epsGrowthYoY, true)}` : 'Unavailable'}
          />
          <IndicatorCard
            title="Dividend Yield"
            val={formatRatioPercent(indicators?.dividendYield)}
            desc={indicators?.payoutRatio != null ? `Payout Ratio: ${indicators.payoutRatio}%` : 'Unavailable'}
          />
          <IndicatorCard
            title="Revenue Growth"
            val={formatRatioPercent(indicators?.revenueGrowth, true)}
            desc="Year-over-Year Sales Growth"
          />
          <IndicatorCard
            title="Debt-to-Equity"
            val={indicators?.debtToEquity != null ? `${indicators.debtToEquity}` : 'N/A'}
            desc={indicators?.debtSafetyRating ? `Safety: ${indicators.debtSafetyRating}` : 'Unavailable'}
          />
          <IndicatorCard
            title="Profit Margin"
            val={formatRatioPercent(indicators?.profitMargin)}
            desc={indicators?.operatingMargin != null ? `Operating Margin: ${formatRatioPercent(indicators.operatingMargin)}` : 'Unavailable'}
          />
        </div>
      </div>

      {/* 5. News Feed — omitted entirely if no news data exists */}
      {news.length > 0 && (
        <div
          style={{
            background: 'rgba(18, 26, 43, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '24px',
            borderRadius: '16px',
          }}
        >
          <h3 style={{ marginBottom: '16px' }}>Recent News & Market Sentiment</h3>
          {news.map((n) => (
            <div
              key={n.id}
              style={{
                background: 'rgba(15,23,42,0.5)',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '10px',
              }}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{n.title}</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>
                {n.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Trade Modal — local-only practice investment */}
      {isTradeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#121a2b',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3>Practice Dummy Investment ({symbol})</h3>
            {tradeMsg && <p style={{ color: '#10b981', marginTop: '8px' }}>{tradeMsg}</p>}
            <form onSubmit={executeBuy} style={{ marginTop: '16px' }}>
              <input
                type="number"
                min="1"
                value={shares}
                onChange={(e) => setShares(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                Total Cost: ${((shares * (stock.price || 0)) || 0).toFixed(2)}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsTradeModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                  }}
                >
                  Execute Buy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function IndicatorCard({ title, val, desc }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.6)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{title}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>{val}</div>
      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{desc}</div>
    </div>
  );
}