import React from 'react';
import { Bookmark, TrendingUp, TrendingDown, Building2, Globe, DollarSign, Activity, Check, Plus } from 'lucide-react';

export default function CompanyHeader({ 
  stock, 
  isSavedInWatchlist, 
  onToggleWatchlist, 
  onOpenTradeModal 
}) {
  if (!stock) return null;

  const isPositive = stock.change >= 0;

  // 52-Week Price Range bar calculation (%)
  const rangeLow = stock.fiftyTwoWeekLow;
  const rangeHigh = stock.fiftyTwoWeekHigh;
  const currentPrice = stock.price;
  const rangePercent = Math.max(0, Math.min(100, ((currentPrice - rangeLow) / (rangeHigh - rangeLow)) * 100));

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
        
        {/* Company Avatar & General Metadata */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flex: '1', minWidth: '300px' }}>
          {/* Avatar Icon */}
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            fontSize: '1.6rem',
            fontWeight: '800',
            color: '#818cf8',
            boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
            flexShrink: 0
          }}>
            {stock.symbol.slice(0, 2)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {stock.name}
              </h1>
              <span className="badge badge-indigo font-mono" style={{ fontSize: '0.9rem', padding: '4px 10px' }}>
                {stock.symbol}
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                <Activity size={12} /> Market Open
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={15} color="var(--text-dim)" /> {stock.sector} • {stock.industry}
              </span>
              <span>|</span>
              <span>{stock.exchange}</span>
              {stock.website && (
                <>
                  <span>|</span>
                  <a href={stock.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={14} /> Official Site
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Stock Price & Change Badge */}
        <div style={{ textAlign: 'right', minWidth: '220px' }}>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            ${stock.price.toFixed(2)}
          </div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span className={`badge ${isPositive ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.95rem', padding: '5px 14px' }}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Today</span>
          </div>
        </div>

      </div>

      {/* Divider */}
      <hr style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '24px 0' }} />

      {/* Metrics Row + Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'center' }}>
        
        {/* Market Cap */}
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Market Capitalization</div>
          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            ${(stock.marketCap / 1e9).toFixed(2)} Billion
          </div>
        </div>

        {/* Trading Volume */}
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Daily Trading Volume</div>
          <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
            {(stock.volume / 1e6).toFixed(2)}M shares
          </div>
        </div>

        {/* 52-Week Range Bar */}
        <div style={{ minWidth: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '6px' }}>
            <span>52W Low: ${stock.fiftyTwoWeekLow.toFixed(2)}</span>
            <span>52W High: ${stock.fiftyTwoWeekHigh.toFixed(2)}</span>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '7px', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: `${rangePercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button 
            onClick={onToggleWatchlist}
            className={`btn ${isSavedInWatchlist ? 'btn-secondary' : 'btn-secondary'}`}
            style={{
              borderColor: isSavedInWatchlist ? '#818cf8' : 'rgba(255, 255, 255, 0.12)',
              background: isSavedInWatchlist ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: isSavedInWatchlist ? '#818cf8' : 'var(--text-main)'
            }}
          >
            {isSavedInWatchlist ? <Check size={18} color="#818cf8" /> : <Bookmark size={18} />}
            <span>{isSavedInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
          </button>

          <button 
            onClick={onOpenTradeModal}
            className="btn btn-success"
          >
            <Plus size={18} />
            <span>Practice Investment</span>
          </button>
        </div>

      </div>

    </div>
  );
}
