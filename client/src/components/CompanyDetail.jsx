// =========================================================================
// MEMBER 4: COMPANY PROFILE PAGE & FINANCIAL INDICATOR DISPLAY
// File: src/pages/CompanyDetail.jsx (Copy and paste directly into React frontend)
// =========================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CompanyDetail() {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  const symbol = (urlSymbol || 'AAPL').toUpperCase();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('1M');
  const [chartData, setChartData] = useState([]);
  const [watchlist, setWatchlist] = useState(['AAPL', 'NVDA']);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [shares, setShares] = useState(5);
  const [tradeMsg, setTradeMsg] = useState('');
  const [portfolio, setPortfolio] = useState({ virtualBalance: 100000.00, holdings: [] });

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/stocks/${symbol}`).then(r => r.json()),
      fetch(`/api/stocks/${symbol}/chart?timeframe=${timeframe}`).then(r => r.json()),
      fetch('/api/portfolio').then(r => r.json())
    ])
      .then(([sRes, cRes, pRes]) => {
        if (sRes.success) setStock(sRes.data);
        else setError('Stock not found');
        if (cRes.success) setChartData(cRes.data);
        if (pRes.success) setPortfolio(pRes.portfolio);
        setLoading(false);
      })
      .catch(err => {
        setError('Network error fetching company profile');
        setLoading(false);
      });
  }, [symbol, timeframe]);

  const toggleWatchlist = () => {
    fetch('/api/watchlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    })
      .then(r => r.json())
      .then(d => d.success && setWatchlist(d.watchlist));
  };

  const executeBuy = (e) => {
    e.preventDefault();
    fetch('/api/portfolio/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, shares })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTradeMsg(d.message);
          setPortfolio(d.portfolio);
          setTimeout(() => { setTradeMsg(''); setIsTradeModalOpen(false); }, 1500);
        }
      });
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Loading Details for {symbol}...</div>;
  if (error || !stock) return <div style={{ padding: '60px', textAlign: 'center', color: '#f43f5e' }}>{error || 'Stock not found'}</div>;

  const isSaved = watchlist.includes(symbol);
  const isPos = stock.change >= 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}
      >
        ← Back
      </button>

      {/* 1. Company Profile Header */}
      <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '28px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{stock.name} ({stock.symbol})</h1>
            <p style={{ color: '#94a3b8', marginTop: '4px' }}>{stock.sector} • {stock.industry} | {stock.exchange}</p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>${stock.price.toFixed(2)}</div>
            <span style={{ background: isPos ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', color: isPos ? '#10b981' : '#f43f5e', padding: '4px 12px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700 }}>
              {isPos ? '+' : ''}{stock.change.toFixed(2)} ({isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={toggleWatchlist} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}>
            {isSaved ? '✓ In Watchlist' : '+ Add to Watchlist'}
          </button>
          <button onClick={() => setIsTradeModalOpen(true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
            + Practice Investment
          </button>
        </div>
      </div>

      {/* 2. Interactive Chart */}
      <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Interactive Stock Chart</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['1D', '1W', '1M', '1Y', '5Y'].map(tf => (
              <button 
                key={tf} 
                onClick={() => setTimeframe(tf)}
                style={{ background: timeframe === tf ? '#6366f1' : 'transparent', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: '240px', background: 'rgba(15,23,42,0.5)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          Chart Stream: {chartData.length} time points loaded for {timeframe} timeframe
        </div>
      </div>

      {/* 3. Company Reputation Score & Risk Level */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
          <h3>Company Reputation Score</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', margin: '12px 0' }}>
            {stock.reputation ? stock.reputation.score : 89}/100
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Multi-factor decision score based on financials, stability, and news sentiment.</p>
        </div>

        <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
          <h3>Investment Risk Level</h3>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', margin: '12px 0' }}>
            {stock.reputation ? stock.reputation.riskLevel : 'Low Risk'}
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Beta Rating: {stock.indicators.beta} — Low historical volatility.</p>
        </div>
      </div>

      {/* 4. Financial Indicator Display Grid */}
      <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Financial Indicator Display</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <IndicatorCard title="Price-to-Earnings (P/E)" val={`${stock.indicators.peRatio}x`} desc={`Sector Avg: ${stock.indicators.sectorAvgPE}x`} />
          <IndicatorCard title="Earnings Per Share (EPS)" val={`$${stock.indicators.eps}`} desc={`YoY Growth: +${stock.indicators.epsGrowthYoY}%`} />
          <IndicatorCard title="Dividend Yield" val={`${stock.indicators.dividendYield}%`} desc={`Payout Ratio: ${stock.indicators.payoutRatio}%`} />
          <IndicatorCard title="Revenue Growth" val={`+${stock.indicators.revenueGrowth}%`} desc="Year-over-Year Sales Growth" />
          <IndicatorCard title="Debt-to-Equity" val={`${stock.indicators.debtToEquity}`} desc={`Safety: ${stock.indicators.debtSafetyRating}`} />
          <IndicatorCard title="Profit Margin" val={`${stock.indicators.profitMargin}%`} desc={`Operating Margin: ${stock.indicators.operatingMargin}%`} />
        </div>
      </div>

      {/* 5. News Feed */}
      <div style={{ background: 'rgba(18, 26, 43, 0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '16px' }}>Recent News & Market Sentiment</h3>
        {stock.news && stock.news.map(n => (
          <div key={n.id} style={{ background: 'rgba(15,23,42,0.5)', padding: '14px', borderRadius: '10px', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{n.title}</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>{n.summary}</p>
          </div>
        ))}
      </div>

      {/* Trade Modal */}
      {isTradeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#121a2b', padding: '24px', borderRadius: '16px', maxWidth: '400px', width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3>Practice Dummy Investment ({symbol})</h3>
            {tradeMsg && <p style={{ color: '#10b981', marginTop: '8px' }}>{tradeMsg}</p>}
            <form onSubmit={executeBuy} style={{ marginTop: '16px' }}>
              <input type="number" min="1" value={shares} onChange={e => setShares(parseInt(e.target.value)||1)} style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>Total Cost: ${(shares * stock.price).toFixed(2)}</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsTradeModalOpen(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '8px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Execute Buy</button>
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
    <div style={{ background: 'rgba(15,23,42,0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{title}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0' }}>{val}</div>
      <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{desc}</div>
    </div>
  );
}
