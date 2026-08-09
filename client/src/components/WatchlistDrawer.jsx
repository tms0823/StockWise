import React from 'react';
import { Bookmark, Trash2, ArrowUpRight, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

export default function WatchlistDrawer({ 
  isOpen, 
  onClose, 
  watchlistItems, 
  onSelectSymbol, 
  onRemoveFromWatchlist 
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 90,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        height: '100%',
        borderRadius: 0,
        borderRight: 0,
        borderTop: 0,
        borderBottom: 0,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bookmark size={22} color="#818cf8" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Your Watchlist ({watchlistItems.length})
              </h3>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '1.4rem', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          {/* Watchlist Items */}
          {watchlistItems.length === 0 ? (
            <div style={{ textTransform: 'none', textAlign: 'center', color: 'var(--text-dim)', padding: '40px 20px' }}>
              <Bookmark size={40} color="var(--text-dim)" style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No stocks bookmarked yet.</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Click "Add to Watchlist" on any company profile page.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
              {watchlistItems.map(item => {
                const isPositive = item.change >= 0;
                return (
                  <div 
                    key={item.symbol}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px 16px',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div 
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => {
                        onSelectSymbol(item.symbol);
                        onClose();
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {item.symbol}
                        </span>
                        <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                          Score {item.reputation.score}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {item.name}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          ${item.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isPositive ? 'var(--stock-green)' : 'var(--stock-red)' }}>
                          {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFromWatchlist(item.symbol)}
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', color: 'var(--stock-red)' }}
                        title="Remove from Watchlist"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer info */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          StockWise Investment Support System
        </div>

      </div>
    </div>
  );
}
