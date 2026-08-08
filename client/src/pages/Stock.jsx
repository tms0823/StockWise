import { useState } from 'react';
import api from '../services/api';

const HISTORY_RANGES = ['1d', '1w', '1m', '3m', '1y'];

function formatNumber(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
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

function StockPage() {
  const [symbol, setSymbol] = useState('');
  const [range, setRange] = useState('1m');
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = async (searchSymbol, searchRange) => {
    const trimmed = searchSymbol.trim();
    if (!trimmed) {
      setError({ message: 'Please enter a stock symbol' });
      setStock(null);
      setHistory(null);
      return;
    }

    setLoading(true);
    setError(null);
    setStock(null);
    setHistory(null);

    try {
      const stockRes = await api.get(`/stocks/${encodeURIComponent(trimmed)}`);
      setStock(stockRes.data.data);

      try {
        const historyRes = await api.get(
          `/stocks/${encodeURIComponent(trimmed)}/history?range=${searchRange}`
        );
        setHistory(historyRes.data.data.history);
      } catch (historyError) {
        // History is secondary — show stock data but note the history error
        setError({
          message: historyError.response?.data?.message || 'Failed to load price history',
        });
        setHistory(null);
      }
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Something went wrong';

      let friendlyMessage = message;
      if (status === 401) {
        friendlyMessage = 'Authentication required. Please log in again.';
      } else if (status === 404) {
        friendlyMessage = 'Invalid stock symbol. Please try another symbol.';
      } else if (status === 429) {
        friendlyMessage = 'Stock data provider rate limit reached. Please try again later.';
      } else if (status === 500 && message === 'Stock API key is not configured') {
        friendlyMessage = 'Stock API key is not configured on the server.';
      } else if (status === 502) {
        friendlyMessage = 'Stock data provider error. Please try again later.';
      } else if (!err.response) {
        friendlyMessage = 'Network error — cannot reach the server.';
      }

      setError({ message: friendlyMessage, status });
      setStock(null);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStock(symbol, range);
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    if (stock && stock.symbol) {
      // Re-fetch history with the new range while keeping current stock data
      setHistoryLoading(true);
      setError(null);
      api
        .get(`/stocks/${encodeURIComponent(stock.symbol)}/history?range=${newRange}`)
        .then((res) => {
          setHistory(res.data.data.history);
          setError(null);
        })
        .catch((err) => {
          setError({
            message: err.response?.data?.message || 'Failed to load price history',
            status: err.response?.status,
          });
          setHistory(null);
        })
        .finally(() => setHistoryLoading(false));
    } else {
      fetchStock(symbol, newRange);
    }
  };

  const changeClass = (value) => {
    if (value === null || value === undefined) return '';
    return value >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="container stock-container">
      <h1>Live Stock Market Data</h1>
      <h2>Module 1 — Feature 1</h2>

      <form className="stock-search-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="stock-symbol">Stock Symbol</label>
          <input
            id="stock-symbol"
            type="text"
            placeholder="e.g. AAPL"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="error-box">
          <p className="error">{error.message}</p>
        </div>
      )}

      {loading && <p>Loading stock data...</p>}

      {!loading && stock && (
        <>
          <div className="stock-card">
            <div className="stock-header">
              <h2>{stock.name || 'Unknown Company'}</h2>
              <p className="stock-symbol">{stock.symbol}</p>
            </div>
            <div className="stock-price-row">
              <span className="stock-price">
                ${formatNumber(stock.currentPrice)}
              </span>
              <span className={`stock-change ${changeClass(stock.dailyChange)}`}>
                {stock.dailyChange === null || stock.dailyChange === undefined
                  ? ''
                  : `${stock.dailyChange >= 0 ? '+' : ''}${formatNumber(stock.dailyChange)}`}
                {stock.dailyChangePercent === null || stock.dailyChangePercent === undefined
                  ? ''
                  : ` (${stock.dailyChangePercent >= 0 ? '+' : ''}${formatNumber(stock.dailyChangePercent)}%)`}
              </span>
            </div>
            <div className="stock-grid">
              <div className="stock-stat">
                <span className="stat-label">Trading Volume</span>
                <span className="stat-value">{formatVolume(stock.volume)}</span>
              </div>
              <div className="stock-stat">
                <span className="stat-label">Market Capitalization</span>
                <span className="stat-value">{formatMarketCap(stock.marketCap)}</span>
              </div>
              <div className="stock-stat">
                <span className="stat-label">52-Week High</span>
                <span className="stat-value">${formatNumber(stock.week52High)}</span>
              </div>
              <div className="stock-stat">
                <span className="stat-label">52-Week Low</span>
                <span className="stat-value">${formatNumber(stock.week52Low)}</span>
              </div>
            </div>
          </div>

          <div className="history-section">
            <div className="history-header">
              <h3>Price History</h3>
              <div className="range-selector">
                {HISTORY_RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`range-btn${range === r ? ' active' : ''}`}
                    onClick={() => handleRangeChange(r)}
                    disabled={historyLoading}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <p>Loading price history...</p>
            ) : history && history.length > 0 ? (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Open</th>
                      <th>High</th>
                      <th>Low</th>
                      <th>Close</th>
                      <th>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history
                      .slice()
                      .reverse()
                      .map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>${formatNumber(row.open)}</td>
                          <td>${formatNumber(row.high)}</td>
                          <td>${formatNumber(row.low)}</td>
                          <td>${formatNumber(row.close)}</td>
                          <td>{formatVolume(row.volume)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !error && <p>No price history available.</p>
            )}
          </div>
        </>
      )}

      {!loading && !stock && !error && (
        <p>Enter a stock symbol above (e.g. AAPL) and click Search to load live market data.</p>
      )}
    </div>
  );
}

export default StockPage;