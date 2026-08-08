import { useState } from 'react';
import api from '../services/api';
import StockChartView from '../components/StockChartView';
import PriceComparison from '../components/PriceComparison';

// Time views map to existing backend history ranges.
// Daily uses 1w (5 trading days) so the chart shows a meaningful line.
const TIME_VIEWS = [
  { key: 'daily', label: 'Daily', range: '1w' },
  { key: 'weekly', label: 'Weekly', range: '1w' },
  { key: 'monthly', label: 'Monthly', range: '1m' },
  { key: 'yearly', label: 'Yearly', range: '1y' },
];

function StockChartPage() {
  const [symbol, setSymbol] = useState('');
  const [timeView, setTimeView] = useState(TIME_VIEWS[2]); // Monthly default
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = async (searchSymbol, view) => {
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
          `/stocks/${encodeURIComponent(trimmed)}/history?range=${view.range}`
        );
        setHistory(historyRes.data.data.history);
      } catch (historyError) {
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
    fetchStock(symbol, timeView);
  };

  const handleTimeViewChange = (view) => {
    setTimeView(view);
    if (stock && stock.symbol) {
      // Re-fetch history with the new range while keeping current stock data
      setHistoryLoading(true);
      setError(null);
      api
        .get(`/stocks/${encodeURIComponent(stock.symbol)}/history?range=${view.range}`)
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
      fetchStock(symbol, view);
    }
  };

  return (
    <div className="container stock-container">
      <h1>Stock Chart & Comparison</h1>
      <h2>Module 1 — Feature 2 & 3</h2>

      <form className="stock-search-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="stock-chart-symbol">Stock Symbol</label>
          <input
            id="stock-chart-symbol"
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
          <div className="stock-header">
            <h2>{stock.name || 'Unknown Company'}</h2>
            <p className="stock-symbol">{stock.symbol}</p>
          </div>

          <div className="time-view-selector">
            {TIME_VIEWS.map((view) => (
              <button
                key={view.key}
                type="button"
                className={`range-btn${timeView.key === view.key ? ' active' : ''}`}
                onClick={() => handleTimeViewChange(view)}
                disabled={historyLoading}
              >
                {view.label}
              </button>
            ))}
          </div>

          {historyLoading ? (
            <p>Loading price history...</p>
          ) : (
            <StockChartView data={history} />
          )}

          {!historyLoading && (
            <PriceComparison
              currentPrice={stock.currentPrice}
              history={history}
              rangeLabel={timeView.label}
            />
          )}
        </>
      )}

      {!loading && !stock && !error && (
        <p>Enter a stock symbol above (e.g. AAPL) and click Search to view the chart and comparison.</p>
      )}
    </div>
  );
}

export default StockChartPage;