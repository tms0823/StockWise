import { useState, Fragment } from 'react';
import { getCompanyQuote } from '../services/companyService';

const REPUTATION_ICONS = {
  'Blue-chip': '💎',
  Established: '🛡️',
  Emerging: '🚀',
  'Penny Stock': '🪙',
};

const SECTOR_AVATARS = {
  Technology: { emoji: '💻', color: '#1a73e8' },
  Healthcare: { emoji: '🏥', color: '#e05353' },
  'Financial Services': { emoji: '💰', color: '#22a55a' },
  Energy: { emoji: '⚡', color: '#e2a020' },
  'Consumer Discretionary': { emoji: '🛍️', color: '#db2777' },
  'Consumer Staples': { emoji: '🛒', color: '#0891b2' },
  Industrials: { emoji: '🏭', color: '#6b7280' },
  Utilities: { emoji: '🔌', color: '#8b5cf6' },
  'Real Estate': { emoji: '🏢', color: '#b45309' },
  Materials: { emoji: '⛏️', color: '#57534e' },
  'Communication Services': { emoji: '📡', color: '#0d9488' },
};

const DEFAULT_AVATAR = { emoji: '📈', color: '#6b7280' };

const SORTABLE_COLUMNS = [
  { key: 'symbol', label: 'Ticker' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'price', label: 'Price' },
  { key: 'dailyChangePercent', label: 'Daily Change' },
];

function sectorAvatar(sector) {
  return SECTOR_AVATARS[sector] || DEFAULT_AVATAR;
}

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

function riskPillClass(riskLevel) {
  if (riskLevel === 'Low') return 'risk-pill risk-pill-low';
  if (riskLevel === 'Medium') return 'risk-pill risk-pill-medium';
  if (riskLevel === 'High') return 'risk-pill risk-pill-high';
  return 'risk-pill';
}

function SortIcon({ active, direction }) {
  return (
    <span className={`sort-icon${active ? ' active' : ''}`} aria-hidden="true">
      {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i}>
          <span className="skeleton skeleton-text" />
        </td>
      ))}
    </tr>
  );
}

function CompanyResultsTable({ results, loading, sort, onSortChange }) {
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
      const res = await getCompanyQuote(symbol);
      setLiveQuotes((prev) => ({ ...prev, [symbol]: res.data.data }));
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Failed to load quote';

      let friendlyMessage = message;
      if (!err.response) {
        friendlyMessage = 'Network error — cannot reach the server.';
      }

      setLiveErrors((prev) => ({ ...prev, [symbol]: friendlyMessage }));
    } finally {
      setLiveLoadingSymbol(null);
    }
  };

  const handleSortClick = (key) => {
    if (sort.sortBy === key) {
      onSortChange({ sortBy: key, sortOrder: sort.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ sortBy: key, sortOrder: 'asc' });
    }
  };

  return (
    <div className="catalog-table-wrapper">
      <table className="catalog-table">
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map((col) => (
              <th key={col.key}>
                <button type="button" className="sort-header-btn" onClick={() => handleSortClick(col.key)}>
                  {col.label}
                  <SortIcon active={sort.sortBy === col.key} direction={sort.sortOrder} />
                </button>
              </th>
            ))}
            <th>Sector</th>
            <th>Risk Level</th>
            <th>Reputation</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

          {!loading && (!results || results.length === 0) && (
            <tr>
              <td colSpan={7} className="empty-cell">
                <div className="empty-state">
                  <span className="empty-state-icon">🔍</span>
                  <p className="no-data">No companies match your search and filters.</p>
                  <p className="empty-state-hint">Try widening your price range or clearing a filter.</p>
                </div>
              </td>
            </tr>
          )}

          {!loading &&
            results.map((company) => {
              const isExpanded = expandedSymbol === company.symbol;
              const live = liveQuotes[company.symbol];
              const liveError = liveErrors[company.symbol];
              const isLiveLoading = liveLoadingSymbol === company.symbol;
              const avatar = sectorAvatar(company.sector);

              return (
                <Fragment key={company.symbol}>
                  <tr
                    className={`catalog-row${isExpanded ? ' expanded' : ''}`}
                    onClick={() => handleToggle(company.symbol)}
                  >
                    <td>
                      <span className="ticker-cell">
                        <span className="ticker-avatar" style={{ backgroundColor: avatar.color }}>
                          {avatar.emoji}
                        </span>
                        <span className="ticker-symbol">{company.symbol}</span>
                      </span>
                    </td>
                    <td className="company-name-cell">{company.companyName}</td>
                    <td>${formatNumber(company.price)}</td>
                    <td className={changeClass(company.dailyChangePercent)}>
                      {company.dailyChangePercent >= 0 ? '▲' : '▼'}{' '}
                      {formatNumber(Math.abs(company.dailyChangePercent))}%
                    </td>
                    <td>{company.sector}</td>
                    <td>
                      <span className={riskPillClass(company.riskLevel)}>{company.riskLevel} Risk</span>
                    </td>
                    <td>
                      <span className="reputation-cell">
                        {REPUTATION_ICONS[company.reputationStatus] || '📈'} {company.reputationStatus}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="catalog-detail-row">
                      <td colSpan={7}>
                        <div className="company-live-detail">
                          {isLiveLoading && (
                            <div className="live-loading">
                              <span className="search-spinner" aria-hidden="true" />
                              Loading live quote...
                            </div>
                          )}
                          {liveError && <p className="error">{liveError}</p>}
                          {live && !isLiveLoading && !liveError && (
                            <>
                              {live.source === 'catalog' && (
                                <p className="catalog-fallback-note">
                                  ⚠️ Live data provider rate limit reached — showing the last stored
                                  catalog price instead.
                                </p>
                              )}
                              <div className="stock-grid">
                              <div className="stock-stat">
                                <span className="stat-label">
                                  {live.source === 'catalog' ? 'Catalog Price' : 'Live Price'}
                                </span>
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default CompanyResultsTable;
