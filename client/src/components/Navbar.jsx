import React, { useState } from 'react';
import { Search, TrendingUp, Bookmark, Wallet, ShieldCheck, Sparkles } from 'lucide-react';

export default function Navbar({ 
  currentSymbol, 
  onSelectSymbol, 
  watchlistCount, 
  onOpenWatchlist, 
  portfolioBalance,
  onOpenTradeModal 
}) {
  const [searchInput, setSearchInput] = useState('');
  const popularSymbols = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  return (
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 50, padding: '14px 28px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Brand Logo & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onSelectSymbol('AAPL')}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
            <TrendingUp size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                StockWise
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                <Sparkles size={11} /> CSE471
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Real-Time Investment Decision Support System
            </p>
          </div>
        </div>

        {/* Company Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ flex: '1', maxWidth: '420px', minWidth: '240px' }}>
          <div className="search-input-group">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search ticker symbol (e.g. AAPL, NVDA, TSLA, MSFT)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        {/* Quick Ticker Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Quick:</span>
          {popularSymbols.map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className={`badge ${currentSymbol === sym ? 'badge-indigo' : 'btn-secondary'}`}
              style={{
                border: currentSymbol === sym ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                padding: '6px 12px',
                cursor: 'pointer'
              }}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* User Account / Watchlist / Virtual Funds */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Virtual Wallet Indicator */}
          <div 
            onClick={onOpenTradeModal}
            className="glass-card" 
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.06)' }}
            title="Click to Practice Dummy Trade"
          >
            <Wallet size={18} color="var(--stock-green)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>Dummy Balance</div>
              <div className="font-mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--stock-green)' }}>
                ${portfolioBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Watchlist Drawer Button */}
          <button 
            onClick={onOpenWatchlist}
            className="btn btn-secondary"
            style={{ position: 'relative', padding: '10px 14px' }}
          >
            <Bookmark size={18} color="#818cf8" />
            <span style={{ fontSize: '0.85rem' }}>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="badge badge-indigo font-mono" style={{ padding: '2px 7px', fontSize: '0.72rem', borderRadius: '99px' }}>
                {watchlistCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
