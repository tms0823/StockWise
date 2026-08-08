import { useState, useEffect } from 'react';
import api from '../services/api';

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

function changeClass(value) {
  if (value === null || value === undefined) return '';
  return value >= 0 ? 'positive' : 'negative';
}

function formatChange(value) {
  if (value === null || value === undefined) return '';
  return `${value >= 0 ? '+' : ''}${formatNumber(value)}`;
}

function formatChangePercent(value) {
  if (value === null || value === undefined) return '';
  return `${value >= 0 ? '+' : ''}${formatNumber(value)}%`;
}

function StockTable({ title, data, columns }) {
  if (!data || data.length === 0) {
    return (
      <div className="market-section">
        <h3>{title}</h3>
        <p className="no-data">No data available.</p>
      </div>
    );
  }

  return (
    <div className="market-section">
      <h3>{title}</h3>
      <div className="market-table-wrapper">
        <table className="market-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={row.symbol || idx}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className ? col.className(row) : ''}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const stockColumns = [
  { key: 'symbol', label: 'Symbol', render: (row) => row.symbol || 'N/A' },
  { key: 'price', label: 'Price', render: (row) => `$${formatNumber(row.price)}` },
  {
    key: 'change',
    label: 'Change',
    className: (row) => changeClass(row.change),
    render: (row) => formatChange(row.change),
  },
  {
    key: 'changePercent',
    label: 'Change %',
    className: (row) => changeClass(row.changePercent),
    render: (row) => formatChangePercent(row.changePercent),
  },
  { key: 'volume', label: 'Volume', render: (row) => formatVolume(row.volume) },
];

const indexColumns = [
  { key: 'name', label: 'Index', render: (row) => row.name || row.symbol || 'N/A' },
  { key: 'price', label: 'Price', render: (row) => `$${formatNumber(row.price)}` },
  {
    key: 'change',
    label: 'Change',
    className: (row) => changeClass(row.change),
    render: (row) => formatChange(row.change),
  },
  {
    key: 'changePercent',
    label: 'Change %',
    className: (row) => changeClass(row.changePercent),
    render: (row) => formatChangePercent(row.changePercent),
  },
];

function MarketOverview() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchMarketOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/market/overview');
        if (!cancelled) {
          setMarketData(response.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          const message = err.response?.data?.message || err.message || 'Something went wrong';

          let friendlyMessage = message;
          if (status === 401) {
            friendlyMessage = 'Authentication required. Please log in again.';
          } else if (status === 429) {
            friendlyMessage = 'Market data provider rate limit reached. Please try again later.';
          } else if (status === 500 && message === 'Stock API key is not configured') {
            friendlyMessage = 'Stock API key is not configured on the server.';
          } else if (status === 502) {
            friendlyMessage = 'Market data provider error. Please try again later.';
          } else if (!err.response) {
            friendlyMessage = 'Network error — cannot reach the server.';
          }

          setError({ message: friendlyMessage, status });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMarketOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container market-overview-container">
      <h1>Market Overview Dashboard</h1>
      <h2>Module 1 — Feature 2</h2>

      {loading && <p>Loading market overview data...</p>}

      {error && (
        <div className="error-box">
          <p className="error">{error.message}</p>
        </div>
      )}

      {!loading && !error && marketData && (
        <>
          <StockTable
            title="Top Gainers"
            data={marketData.topGainers}
            columns={stockColumns}
          />

          <StockTable
            title="Top Losers"
            data={marketData.topLosers}
            columns={stockColumns}
          />

          <StockTable
            title="Most Active Stocks"
            data={marketData.mostActive}
            columns={stockColumns}
          />

          <StockTable
            title="Major Market Movement"
            data={marketData.majorMarketMovement}
            columns={indexColumns}
          />
        </>
      )}

      {!loading && !error && !marketData && (
        <p>No market overview data available.</p>
      )}
    </div>
  );
}

export default MarketOverview;