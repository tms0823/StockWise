import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function DummyInvestmentPage() {
  const [balance, setBalance] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState(null);

  const [symbol, setSymbol] = useState('');
  const [stock, setStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState(null); // { type: 'success' | 'error', text }

  const loadAccount = useCallback(async () => {
    setAccountLoading(true);
    setAccountError(null);
    try {
      const res = await api.get('/dummy-investment');
      setBalance(res.data.data.virtualBalance);
      setHoldings(res.data.data.holdings || []);
    } catch (err) {
      setAccountError(err.response?.data?.message || 'Failed to load dummy investment account.');
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleCheckStock = async (e) => {
    e.preventDefault();
    const trimmed = symbol.trim().toUpperCase();
    if (!trimmed) return;

    setStockLoading(true);
    setStockError(null);
    setStock(null);

    try {
      const res = await api.get(`/stocks/${encodeURIComponent(trimmed)}`);
      const raw = res.data.data;
      setStock({
        symbol: raw.symbol,
        name: raw.name || null,
        currentPrice: raw.currentPrice,
        dailyChange: raw.dailyChange ?? null,
        dailyChangePercent: raw.dailyChangePercent ?? null,
      });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Something went wrong';

      let friendly = message;
      if (status === 404) {
        friendly = 'Invalid stock symbol. Please try another symbol.';
      } else if (status === 429) {
        friendly = 'Stock data provider rate limit reached. Please try again later.';
      }

      setStockError(friendly);
    } finally {
      setStockLoading(false);
    }
  };

  const handleSelectHolding = (holding) => {
    setSymbol(holding.symbol);
    setStock(null);
    setStockError(null);
    setQuantity(1);
  };

  const executeTrade = async (action) => {
    if (!stock) return;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setTradeMsg({ type: 'error', text: 'Quantity must be a positive integer' });
      return;
    }

    setTradeLoading(true);
    setTradeMsg(null);

    try {
      // Backend determines the authoritative execution price — client sends
      // only symbol + quantity. No price is included in the request body.
      const res =
        action === 'buy'
          ? await api.post('/dummy-investment/buy', { symbol: stock.symbol, quantity: qty })
          : await api.post('/dummy-investment/sell', { symbol: stock.symbol, quantity: qty });

      const data = res.data.data;
      setBalance(data.virtualBalance);
      setHoldings(data.holdings || []);
      setTradeMsg({
        type: 'success',
        text: `${res.data.message} — executed at ${formatCurrency(data.executedPrice)} per share.`,
      });
      setQuantity(1);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Trade failed. Please try again.';
      setTradeMsg({ type: 'error', text: message });
    } finally {
      setTradeLoading(false);
    }
  };

  const estimatedAmount =
    stock && Number.isFinite(Number(stock.currentPrice)) && Number.isFinite(Number(quantity))
      ? Number(stock.currentPrice) * Number(quantity)
      : null;

  return (
    <div className="container dummy-investment-container">
      <h1>Dummy Stock Investment</h1>
      <h2>Practice buying and selling stocks using virtual money and live market prices.</h2>
      <p className="simulation-notice">
        ⚠️ This is a simulated trading environment only — no real money is involved.
      </p>

      {/* Virtual Balance */}
      <div className="stock-card">
        <div className="stock-grid">
          <div className="stock-stat">
            <span className="stat-label">Virtual Balance</span>
            <span className="stat-value balance-value">
              {accountLoading ? 'Loading…' : balance !== null ? formatCurrency(balance) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {accountError && (
        <div className="error-box">
          <p className="error">{accountError}</p>
        </div>
      )}

      {/* Stock Selection */}
      <div className="market-section">
        <h3>Select a Stock</h3>
        <form className="stock-search-form" onSubmit={handleCheckStock}>
          <div className="form-group">
            <label htmlFor="investment-symbol">Stock Symbol</label>
            <input
              id="investment-symbol"
              type="text"
              placeholder="e.g. AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <button type="submit" className="btn" disabled={stockLoading || tradeLoading}>
            {stockLoading ? 'Checking…' : 'Check Stock'}
          </button>
        </form>

        {stockError && (
          <div className="error-box">
            <p className="error">{stockError}</p>
          </div>
        )}

        {stock && (
          <div className="stock-card">
            <div className="stock-header">
              <h2>{stock.name || 'Unknown Company'}</h2>
              <span className="stock-symbol">{stock.symbol}</span>
            </div>
            <div className="stock-price-row">
              <span className="stock-price">{formatCurrency(stock.currentPrice)}</span>
              {stock.dailyChangePercent !== null && stock.dailyChangePercent !== undefined && (
                <span className={`stock-change ${stock.dailyChange >= 0 ? 'positive' : 'negative'}`}>
                  {stock.dailyChange >= 0 ? '+' : ''}
                  {Number(stock.dailyChangePercent).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buy / Sell Panel */}
      {stock && (
        <div className="market-section">
          <h3>Buy / Sell {stock.symbol}</h3>
          <div className="form-group">
            <label htmlFor="investment-quantity">Quantity</label>
            <input
              id="investment-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="estimate-row">
            <span className="stat-label">Estimated Cost / Proceeds</span>
            <span className="stat-value">
              {estimatedAmount !== null ? formatCurrency(estimatedAmount) : '—'}
            </span>
          </div>

          {tradeMsg && (
            <div className={tradeMsg.type === 'success' ? 'trade-msg' : 'error-box trade-msg'}>
              <p className={tradeMsg.type === 'success' ? 'success' : 'error'}>
                {tradeMsg.text}
              </p>
            </div>
          )}

          <div className="trade-actions">
            <button
              type="button"
              className="btn"
              onClick={() => executeTrade('buy')}
              disabled={tradeLoading}
            >
              {tradeLoading ? 'Processing…' : 'Buy'}
            </button>
            <button
              type="button"
              className="btn btn-sell"
              onClick={() => executeTrade('sell')}
              disabled={tradeLoading}
            >
              {tradeLoading ? 'Processing…' : 'Sell'}
            </button>
          </div>
        </div>
      )}

      {/* Current Dummy Holdings */}
      <div className="market-section">
        <h3>Current Dummy Holdings</h3>
        {accountLoading ? (
          <p className="no-data">Loading holdings…</p>
        ) : holdings.length === 0 ? (
          <p className="no-data">No dummy stocks owned yet.</p>
        ) : (
          <div className="holdings-list">
            {holdings.map((h) => (
              <button
                type="button"
                key={h.symbol}
                className="holding-row"
                onClick={() => handleSelectHolding(h)}
                disabled={tradeLoading}
                title={`Click to select ${h.symbol} for selling`}
              >
                <span className="holding-symbol">{h.symbol}</span>
                <span className="holding-detail">Quantity: {h.quantity}</span>
                <span className="holding-detail">Avg. Buy: {formatCurrency(h.averageBuyPrice)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DummyInvestmentPage;