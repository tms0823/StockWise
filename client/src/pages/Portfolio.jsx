import { useState, useEffect } from 'react';
import { getPortfolio, getTransactions } from '../services/portfolioService';

const GAIN = '#15803d';
const LOSS = '#b91c1c';
const NEUTRAL = '#334155';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';

// The API returns full-precision numbers on purpose — all rounding happens
// here at render time so summed totals never drift from their parts.
const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatSignedCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}${formatCurrency(Math.abs(num))}`;
};

const formatPercent = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}${Math.abs(num).toFixed(2)}%`;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const signColor = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return NEUTRAL;
  return num > 0 ? GAIN : LOSS;
};

const styles = {
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 16px 64px',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    color: '#0f172a',
  },
  heading: { fontSize: '28px', fontWeight: 700, margin: '0 0 4px' },
  subheading: { fontSize: '14px', color: MUTED, margin: '0 0 24px' },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  card: {
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    padding: '16px 18px',
    background: '#ffffff',
  },
  cardLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: MUTED,
    margin: '0 0 8px',
  },
  cardValue: { fontSize: '22px', fontWeight: 700, margin: 0 },
  cardSub: { fontSize: '13px', fontWeight: 600, margin: '4px 0 0' },
  section: { marginBottom: '36px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, margin: '0 0 12px' },
  tableWrap: {
    overflowX: 'auto',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    background: '#f8fafc',
    borderBottom: `1px solid ${BORDER}`,
    fontWeight: 600,
    color: MUTED,
    whiteSpace: 'nowrap',
  },
  thRight: {
    textAlign: 'right',
    padding: '12px 14px',
    background: '#f8fafc',
    borderBottom: `1px solid ${BORDER}`,
    fontWeight: 600,
    color: MUTED,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${BORDER}`,
    whiteSpace: 'nowrap',
  },
  tdRight: {
    padding: '12px 14px',
    borderBottom: `1px solid ${BORDER}`,
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  ticker: { fontWeight: 700 },
  companyName: { display: 'block', fontSize: '12px', color: MUTED, fontWeight: 400 },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.03em',
  },
  message: {
    padding: '32px 16px',
    textAlign: 'center',
    color: MUTED,
    fontSize: '14px',
  },
  errorBox: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: LOSS,
    borderRadius: '10px',
    padding: '16px 18px',
    fontSize: '14px',
  },
};

function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Guards against setting state after the page unmounts mid-request.
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [portfolioRes, transactionsRes] = await Promise.all([
          getPortfolio(),
          getTransactions(),
        ]);

        if (cancelled) return;

        setPortfolio(portfolioRes.data.data);
        setTransactions(transactionsRes.data.data || []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.message || err.message || 'Failed to load your portfolio.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.heading}>My Portfolio</h1>
        <p style={styles.message}>Loading your portfolio…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <h1 style={styles.heading}>My Portfolio</h1>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  const summary = portfolio?.summary || {};
  const holdings = portfolio?.holdings || [];
  const totalProfitLoss = Number(summary.totalProfitLoss) || 0;

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>My Portfolio</h1>
      <p style={styles.subheading}>
        Virtual holdings, performance and trade history — no real money involved.
      </p>

      {/* Summary cards */}
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <p style={styles.cardLabel}>Available Balance</p>
          <p style={styles.cardValue}>{formatCurrency(portfolio?.virtualBalance)}</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Total Invested</p>
          <p style={styles.cardValue}>{formatCurrency(summary.totalInvested)}</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Current Value</p>
          <p style={styles.cardValue}>{formatCurrency(summary.currentValue)}</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardLabel}>Profit / Loss</p>
          <p style={{ ...styles.cardValue, color: signColor(totalProfitLoss) }}>
            {formatSignedCurrency(totalProfitLoss)}
          </p>
          <p style={{ ...styles.cardSub, color: signColor(totalProfitLoss) }}>
            {formatPercent(summary.totalProfitLossPercent)}
          </p>
        </div>
      </div>

      {/* Holdings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Holdings</h2>
        {holdings.length === 0 ? (
          <div style={styles.tableWrap}>
            <p style={styles.message}>
              You do not own any stocks yet. Buy your first stock from the Dummy Investment page.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ticker</th>
                  <th style={styles.thRight}>Quantity</th>
                  <th style={styles.thRight}>Avg Buy Price</th>
                  <th style={styles.thRight}>Current Price</th>
                  <th style={styles.thRight}>Invested</th>
                  <th style={styles.thRight}>Current Value</th>
                  <th style={styles.thRight}>Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td style={styles.td}>
                      <span style={styles.ticker}>{holding.symbol}</span>
                      {holding.companyName && (
                        <span style={styles.companyName}>{holding.companyName}</span>
                      )}
                    </td>
                    <td style={styles.tdRight}>{holding.quantity}</td>
                    <td style={styles.tdRight}>{formatCurrency(holding.averageBuyPrice)}</td>
                    <td style={styles.tdRight}>{formatCurrency(holding.currentPrice)}</td>
                    <td style={styles.tdRight}>{formatCurrency(holding.invested)}</td>
                    <td style={styles.tdRight}>{formatCurrency(holding.currentValue)}</td>
                    <td style={{ ...styles.tdRight, color: signColor(holding.profitLoss) }}>
                      {formatSignedCurrency(holding.profitLoss)}
                      <span style={{ display: 'block', fontSize: '12px' }}>
                        {formatPercent(holding.profitLossPercent)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Transaction History</h2>
        {transactions.length === 0 ? (
          <div style={styles.tableWrap}>
            <p style={styles.message}>No transactions yet.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Ticker</th>
                  <th style={styles.thRight}>Quantity</th>
                  <th style={styles.thRight}>Price</th>
                  <th style={styles.thRight}>Total</th>
                  <th style={styles.thRight}>Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td style={styles.td}>{formatDate(transaction.createdAt)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          color: transaction.type === 'BUY' ? '#1d4ed8' : '#b45309',
                          background: transaction.type === 'BUY' ? '#eff6ff' : '#fffbeb',
                        }}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td style={{ ...styles.td, ...styles.ticker }}>{transaction.symbol}</td>
                    <td style={styles.tdRight}>{transaction.quantity}</td>
                    <td style={styles.tdRight}>{formatCurrency(transaction.price)}</td>
                    <td style={styles.tdRight}>{formatCurrency(transaction.total)}</td>
                    <td
                      style={{
                        ...styles.tdRight,
                        color:
                          transaction.type === 'BUY' ? MUTED : signColor(transaction.profitLoss),
                      }}
                    >
                      {/* A purchase realizes nothing — only sells carry P/L. */}
                      {transaction.type === 'BUY'
                        ? '—'
                        : formatSignedCurrency(transaction.profitLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
