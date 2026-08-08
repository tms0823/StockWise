import { useState } from 'react';
import api from '../services/api';

function formatNumber(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function formatVolume(value) {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return formatNumber(value);
}

function formatMarketCap(value) {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${formatNumber(value)}`;
}

function changeClass(value) {
  if (value === null || value === undefined) return '';
  return value >= 0 ? 'positive' : 'negative';
}

function riskBadgeClass(riskLevel) {
  if (riskLevel === 'Low') return 'badge badge-risk-low';
  if (riskLevel === 'Medium') return 'badge badge-risk-medium';
  if (riskLevel === 'High') return 'badge badge-risk-high';
  return 'badge';
}

function CompanyResultsList({ results }) {
  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [liveLoadingSymbol, setLiveLoadingSymbol] = useState(null);
  const [liveErrors, setLiveErrors] = useState({});

  const handleToggle = async (symbol) => {
    if (expandedSymbol === symbol) {
      setExpandedSymbol(null);
      return;
    }

    setExpandedSymbol(symbol);

    if (liveQuotes[symbol] || liveLoadingSymbol === symbol) {
      return;
    }

    setLiveLoadingSymbol(symbol);
    setLiveErrors((prev) => ({ ...prev, [symbol]: null }));

    try {
      const res = await api.get(`/stocks/${encodeURIComponent(symbol)}`);
      setLiveQuotes((prev) => ({ ...prev, [symbol]: res.data.data }));
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to load live quote';

      let friendlyMessage = message;
      if (status === 429) {
        friendlyMessage = 'Live data provider rate limit reached. Please try again later.';
      } else if (!err.response) {
        friendlyMessage = 'Network error — cannot reach the server.';
      }

      setLiveErrors((prev) => ({ ...prev, [symbol]: friendlyMessage }));
    } finally {
      setLiveLoadingSymbol(null);
    }
  };

  if (!results || results.length === 0) {
    return <p className="no-data">No companies match your search and filters.</p>;
  }

  return (
    <div className="company-results-list">
      {results.map((company) => {
        const isExpanded = expandedSymbol === company.symbol;
        const live = liveQuotes[company.symbol];
        const liveError = liveErrors[company.symbol];
        const isLiveLoading = liveLoadingSymbol === company.symbol;

        return (
          <div key={company.symbol} className="company-card">
            <button
              type="button"
              className="company-card-header"
              onClick={() => handleToggle(company.symbol)}
            >
              <div className="company-card-title">
                <span className="company-name">{company.companyName}</span>
                <span className="company-symbol">{company.symbol}</span>
              </div>
              <div className="company-card-price">
                <span className="stock-price">${formatNumber(company.price)}</span>
                <span className={`stock-change ${changeClass(company.dailyChangePercent)}`}>
                  {company.dailyChangePercent >= 0 ? '+' : ''}
                  {formatNumber(company.dailyChangePercent)}%
                </span>
              </div>
            </button>

            <div className="company-card-meta">
              <span className="badge badge-sector">{company.sector}</span>
              <span className="badge badge-market-type">{company.marketType}</span>
              <span className="badge badge-reputation">{company.reputationStatus}</span>
              <span className={riskBadgeClass(company.riskLevel)}>{company.riskLevel} risk</span>
            </div>

            {isExpanded && (
              <div className="company-live-detail">
                {isLiveLoading && <p>Loading live quote...</p>}
                {liveError && <p className="error">{liveError}</p>}
                {live && !isLiveLoading && !liveError && (
                  <div className="stock-grid">
                    <div className="stock-stat">
                      <span className="stat-label">Live Price</span>
                      <span className="stat-value">${formatNumber(live.currentPrice)}</span>
                    </div>
                    <div className="stock-stat">
                      <span className="stat-label">Trading Volume</span>
                      <span className="stat-value">{formatVolume(live.volume)}</span>
                    </div>
                    <div className="stock-stat">
                      <span className="stat-label">Market Capitalization</span>
                      <span className="stat-value">{formatMarketCap(live.marketCap)}</span>
                    </div>
                    <div className="stock-stat">
                      <span className="stat-label">52-Week Range</span>
                      <span className="stat-value">
                        ${formatNumber(live.week52Low)} - ${formatNumber(live.week52High)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default CompanyResultsList;
